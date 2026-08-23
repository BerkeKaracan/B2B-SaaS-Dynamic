/**
 * Marketing / landing multi-page HTTP load test.
 *
 *   npm run test:load
 *   npm run test:load:smoke
 *   BASE_URL=http://host.docker.internal:3000 npm run test:load:smoke
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import {
  DEFAULT_UA,
  LANDING_PATHS,
  httpLoadProfile,
  pickWeightedPath,
  profileName,
  stripSlash,
  envStr,
} from './helpers.js';

const BASE_URL = stripSlash(
  envStr('BASE_URL', 'http://host.docker.internal:3000')
);
const PROFILE = profileName();
const profile = httpLoadProfile('landing');

export const options = {
  stages: profile.stages,
  thresholds: profile.thresholds,
  tags: { suite: 'landing' },
};

export default function landingLoadTest() {
  const path = pickWeightedPath(LANDING_PATHS);
  const url = `${BASE_URL}${path}`;
  const res = http.get(url, {
    tags: { name: 'landing_page', path, profile: PROFILE },
    timeout: '30s',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': DEFAULT_UA,
    },
  });

  const limitMs = profile.durationLimitMs;
  check(res, {
    'status is 200': (r) => r.status === 200,
    [`duration < ${limitMs}ms`]: (r) => r.timings.duration < limitMs,
  });

  sleep(PROFILE === 'smoke' ? 0.5 : 1);
}
