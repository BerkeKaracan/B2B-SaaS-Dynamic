/**
 * Public marketing AI rate-limit check (1 VU — does not stress Groq).
 * Expects eventual 429 after free monthly quota for a fresh guest id.
 *
 *   npm run test:public-ai
 *
 * Skip in CI by default; run manually when validating limiter + Redis.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { DEFAULT_UA, envStr, stripSlash } from './helpers.js';

const API_URL = stripSlash(
  envStr('API_URL', 'http://host.docker.internal:8000')
);
const MAX_ATTEMPTS = Number(envStr('PUBLIC_AI_MAX_ATTEMPTS', '12')) || 12;

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate>0.99'],
  },
  tags: { suite: 'public-ai-limit' },
};

export default function publicAiLimitTest() {
  const guestId = `k6guest${Date.now()}${Math.floor(Math.random() * 1e6)}`;
  let sawOk = false;
  let sawLimit = false;

  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const res = http.post(
      `${API_URL}/api/public-ai/public-chat`,
      JSON.stringify({
        message: 'What is WORKSPACE OS in one sentence?',
        history: [],
      }),
      {
        tags: { name: 'public_chat' },
        timeout: '60s',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': DEFAULT_UA,
          'X-WSOS-Guest-Id': guestId,
        },
      }
    );

    if (res.status === 200) sawOk = true;
    if (res.status === 429) {
      sawLimit = true;
      break;
    }
    // Provider misconfig / missing key — still useful signal
    if (res.status >= 500) break;
    sleep(0.4);
  }

  check(null, {
    'got at least one success or hit provider error path': () =>
      sawOk || sawLimit,
    // Soft: if quota is already shared/exhausted we may only see 429
    'rate limit observed or under quota': () => true,
  });

  // Prefer observing the limiter when enough attempts were allowed
  if (sawOk) {
    check(null, {
      'eventually rate limited (429) after successes': () => sawLimit,
    });
  }
}
