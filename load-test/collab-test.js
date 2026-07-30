/**
 * Canvas collab WebSocket load test.
 * Room model: 5 clients/room × 10 rooms = 50 VU peak (stress).
 *
 *   npm run test:collab
 *   npm run test:collab:smoke
 */
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { envInt, envStr, profileName, stripSlash } from './helpers.js';

const WS_URL = stripSlash(
  envStr('WS_URL', 'ws://host.docker.internal:8000')
);
const ROOM_PREFIX = envStr('ROOM_PREFIX', 'k6-collab');
const ROOM_COUNT = envInt('ROOM_COUNT', 10);
const COLLAB_TOKEN = envStr('COLLAB_TOKEN', 'local-dev');
const PROFILE = profileName();

const SMOKE = {
  stages: [
    { duration: '15s', target: 5 },
    { duration: '30s', target: 10 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    checks: ['rate>0.95'],
    ws_connecting: ['p(95)<2000'],
  },
  holdMs: 3000,
};

const STRESS = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '40s', target: 10 },
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    checks: ['rate>0.90'],
    ws_connecting: ['p(95)<3000'],
  },
  holdMs: 8000,
};

const profile = PROFILE === 'smoke' ? SMOKE : STRESS;

export const options = {
  stages: profile.stages,
  thresholds: profile.thresholds,
  tags: { suite: 'collab' },
};

function roomIdForVu(vu) {
  return `${ROOM_PREFIX}-${(vu - 1) % ROOM_COUNT}`;
}

export default function () {
  const roomId = roomIdForVu(__VU);
  const url = `${WS_URL}/ws/canvas/${encodeURIComponent(roomId)}`;
  const selfKey = `k6-${__VU}-${__ITER}-${Date.now()}`;
  const holdMs = profile.holdMs;

  let gotReady = false;
  let gotPong = false;
  let roomFull = false;
  let cursorTicks = 0;
  let pingTicks = 0;

  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      socket.send(
        JSON.stringify({
          type: 'auth',
          token: COLLAB_TOKEN,
          selfKey,
          user: `k6-vu-${__VU}`,
          color: '#22c55e',
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
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'ready') {
        gotReady = true;
      } else if (msg.type === 'pong') {
        gotPong = true;
      } else if (msg.type === 'error' && msg.reason === 'room_full') {
        roomFull = true;
        socket.close();
      }
    });

    socket.setInterval(() => {
      if (!gotReady) return;
      cursorTicks += 1;
      socket.send(
        JSON.stringify({
          type: 'cursor',
          cursor: {
            x: (__VU * 17 + cursorTicks * 3) % 2000,
            y: (__VU * 13 + cursorTicks * 5) % 1200,
          },
        })
      );
      if (cursorTicks % 10 === 0) {
        pingTicks += 1;
        socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 100);

    socket.setTimeout(() => {
      socket.close();
    }, holdMs);
  });

  check(res, {
    'ws status 101': (r) => r && r.status === 101,
  });
  check(null, {
    'received ready': () => gotReady,
    'received pong': () => gotPong || pingTicks === 0,
    'not room_full': () => !roomFull,
  });

  sleep(0.2);
}
