/**
 * Backend public / edge API load test (no Groq burn, no write mutations).
 *
 * Covers: health probes, public share list, FX rates, auth gate (401),
 * optional authenticated smoke when AUTH_TOKEN is set.
 *
 *   npm run test:api
 *   npm run test:api:smoke
 *   API_URL=http://host.docker.internal:8000 npm run test:api:smoke
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import {
  DEFAULT_UA,
  envStr,
  httpLoadProfile,
  profileName,
  stripSlash,
} from './helpers.js';

const API_URL = stripSlash(
  envStr('API_URL', 'http://host.docker.internal:8000')
);
const AUTH_TOKEN = envStr('AUTH_TOKEN', '');
const PROFILE = profileName();
const profile = httpLoadProfile('api');

// Auth-gate 401/403/422 are expected; include 307/308 for any proxy redirects.
http.setResponseCallback(
  http.expectedStatuses(
    200,
    201,
    204,
    301,
    302,
    303,
    304,
    307,
    308,
    401,
    403,
    422
  )
);

export const options = {
  stages: profile.stages,
  thresholds: {
    ...profile.thresholds,
    // Health must stay fast under load (LB / compose probes)
    'http_req_duration{name:health}': ['p(95)<800'],
  },
  tags: { suite: 'api' },
};

function headers(extra) {
  return Object.assign(
    {
      Accept: 'application/json',
      'User-Agent': DEFAULT_UA,
    },
    extra || {}
  );
}

export default function apiTest() {
  group('health', () => {
    const health = http.get(`${API_URL}/health`, {
      tags: { name: 'health' },
      timeout: '10s',
      headers: headers(),
    });
    check(health, {
      'health 200': (r) => r.status === 200,
    });

    const apiHealth = http.get(`${API_URL}/api/health`, {
      tags: { name: 'health' },
      timeout: '10s',
      headers: headers(),
    });
    check(apiHealth, {
      'api health 200': (r) => r.status === 200,
    });
  });

  group('public_share', () => {
    const list = http.get(`${API_URL}/api/public/records?limit=8`, {
      tags: { name: 'public_records' },
      timeout: '15s',
      headers: headers(),
    });
    check(list, {
      'public records 200': (r) => r.status === 200,
      'public records is array': (r) => {
        try {
          return Array.isArray(r.json());
        } catch (_e) {
          return false;
        }
      },
    });
  });

  group('fx', () => {
    const fx = http.get(`${API_URL}/api/fx/rates?base=USD&symbols=EUR,TRY`, {
      tags: { name: 'fx_rates' },
      timeout: '15s',
      headers: headers(),
    });
    check(fx, {
      'fx 200': (r) => r.status === 200,
      'fx has rates': (r) => {
        try {
          const body = r.json();
          return body && typeof body.rates === 'object';
        } catch (_e) {
          return false;
        }
      },
    });
  });

  group('auth_gate', () => {
    const me = http.get(`${API_URL}/api/auth/me`, {
      tags: { name: 'auth_me_unauth' },
      timeout: '10s',
      headers: headers(),
    });
    check(me, {
      'auth me rejects unauth': (r) => r.status === 401 || r.status === 403,
    });

    const records = http.get(
      `${API_URL}/api/records/?tenant_id=00000000-0000-0000-0000-000000000000`,
      {
        tags: { name: 'records_unauth' },
        timeout: '10s',
        headers: headers(),
      }
    );
    check(records, {
      'records rejects unauth': (r) =>
        r.status === 401 || r.status === 403 || r.status === 422,
    });
  });

  if (AUTH_TOKEN) {
    group('auth_optional', () => {
      const me = http.get(`${API_URL}/api/auth/me`, {
        tags: { name: 'auth_me' },
        timeout: '10s',
        headers: headers({ Authorization: `Bearer ${AUTH_TOKEN}` }),
      });
      check(me, {
        'auth me 200 with token': (r) => r.status === 200,
      });
    });
  }

  sleep(PROFILE === 'smoke' ? 0.3 : 0.8);
}
