/**
 * Mixed realistic suite: landing + public API + canvas collab in parallel.
 * Mimics concurrent marketing traffic, API probes, and LIVE rooms.
 *
 *   npm run test:suite
 *   npm run test:suite:smoke
 */
import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import {
  DEFAULT_UA,
  LANDING_PATHS,
  envInt,
  envStr,
  pickWeightedPath,
  profileName,
  stripSlash,
} from './helpers.js';

const BASE_URL = stripSlash(
  envStr('BASE_URL', 'http://host.docker.internal:3000')
);
const API_URL = stripSlash(
  envStr('API_URL', 'http://host.docker.internal:8000')
);
const WS_URL = stripSlash(
  envStr('WS_URL', 'ws://host.docker.internal:8000')
);
const ROOM_PREFIX = envStr('ROOM_PREFIX', 'k6-suite');
const ROOM_COUNT = envInt('ROOM_COUNT', 10);
const COLLAB_TOKEN = envStr('COLLAB_TOKEN', 'local-dev');
const PROFILE = profileName();
const isSmoke = PROFILE === 'smoke';

// Include 307/308 — Next.js locale middleware often redirects with these.
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
    403
  )
);

export const options = {
  scenarios: {
    landing: {
      executor: 'ramping-vus',
      exec: 'landingTraffic',
      startVUs: 0,
      stages: isSmoke
        ? [
            { duration: '15s', target: 5 },
            { duration: '30s', target: 8 },
            { duration: '15s', target: 0 },
          ]
        : [
            { duration: '20s', target: 8 },
            { duration: '40s', target: 15 },
            { duration: '1m', target: 25 },
            { duration: '20s', target: 0 },
          ],
      gracefulRampDown: '10s',
      tags: { scenario: 'landing' },
    },
    api: {
      executor: 'ramping-vus',
      exec: 'apiTraffic',
      startVUs: 0,
      stages: isSmoke
        ? [
            { duration: '15s', target: 3 },
            { duration: '30s', target: 6 },
            { duration: '15s', target: 0 },
          ]
        : [
            { duration: '20s', target: 5 },
            { duration: '40s', target: 10 },
            { duration: '1m', target: 15 },
            { duration: '20s', target: 0 },
          ],
      gracefulRampDown: '10s',
      tags: { scenario: 'api' },
    },
    collab: {
      executor: 'ramping-vus',
      exec: 'collabTraffic',
      startVUs: 0,
      // Keep ≤5/room with ROOM_COUNT=10 → max 50; suite uses lighter peak
      stages: isSmoke
        ? [
            { duration: '15s', target: 5 },
            { duration: '30s', target: 10 },
            { duration: '15s', target: 0 },
          ]
        : [
            { duration: '20s', target: 10 },
            { duration: '40s', target: 20 },
            { duration: '1m', target: 40 },
            { duration: '20s', target: 0 },
          ],
      gracefulRampDown: '10s',
      tags: { scenario: 'collab' },
    },
  },
  thresholds: {
    checks: ['rate>0.85'],
    'http_req_failed{scenario:landing}': ['rate<0.12'],
    'http_req_failed{scenario:api}': ['rate<0.10'],
    'http_req_duration{name:health}': ['p(95)<1000'],
    ws_connecting: ['p(95)<3000'],
  },
};

export function landingTraffic() {
  const path = pickWeightedPath(LANDING_PATHS);
  const res = http.get(`${BASE_URL}${path}`, {
    tags: { name: 'landing_page', path },
    timeout: '30s',
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': DEFAULT_UA,
    },
  });
  check(res, {
    'landing 200': (r) => r.status === 200,
  });
  sleep(isSmoke ? 0.5 : 1);
}

export function apiTraffic() {
  const health = http.get(`${API_URL}/api/health`, {
    tags: { name: 'health' },
    timeout: '10s',
    headers: { Accept: 'application/json', 'User-Agent': DEFAULT_UA },
  });
  check(health, { 'health 200': (r) => r.status === 200 });

  const pub = http.get(`${API_URL}/api/public/records?limit=8`, {
    tags: { name: 'public_records' },
    timeout: '15s',
    headers: { Accept: 'application/json', 'User-Agent': DEFAULT_UA },
  });
  check(pub, { 'public 200': (r) => r.status === 200 });

  const me = http.get(`${API_URL}/api/auth/me`, {
    tags: { name: 'auth_me_unauth' },
    timeout: '10s',
    headers: { Accept: 'application/json', 'User-Agent': DEFAULT_UA },
  });
  check(me, {
    'auth gate': (r) => r.status === 401 || r.status === 403,
  });

  sleep(isSmoke ? 0.3 : 0.6);
}

export function collabTraffic() {
  const roomId = `${ROOM_PREFIX}-${(__VU - 1) % ROOM_COUNT}`;
  const url = `${WS_URL}/ws/canvas/${encodeURIComponent(roomId)}`;
  const selfKey = `suite-${__VU}-${__ITER}-${Date.now()}`;
  const holdMs = isSmoke ? 2500 : 6000;

  let gotReady = false;
  let roomFull = false;

  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      socket.send(
        JSON.stringify({
          type: 'auth',
          token: COLLAB_TOKEN,
          selfKey,
          user: `suite-${__VU}`,
          color: '#3b82f6',
        })
      );
    });
    socket.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch (_e) {
        return;
      }
      if (msg.type === 'ready') gotReady = true;
      if (msg.type === 'error' && msg.reason === 'room_full') {
        roomFull = true;
        socket.close();
      }
    });
    let ticks = 0;
    socket.setInterval(() => {
      if (!gotReady) return;
      ticks += 1;
      socket.send(
        JSON.stringify({
          type: 'cursor',
          cursor: { x: ticks % 800, y: (__VU * 9) % 600 },
        })
      );
      if (ticks % 8 === 0) socket.send(JSON.stringify({ type: 'ping' }));
    }, 120);
    socket.setTimeout(() => socket.close(), holdMs);
  });

  check(res, { 'ws 101': (r) => r && r.status === 101 });
  check(null, {
    'ws ready': () => gotReady,
    'ws not full': () => !roomFull,
  });
  sleep(0.2);
}
