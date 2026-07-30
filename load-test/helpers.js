/**
 * Shared k6 helpers for WORKSPACE OS load tests.
 * Imported by landing / api / collab / suite scripts (Docker mount: /scripts).
 */

export function envStr(name, fallback) {
  const v = __ENV[name];
  if (v === undefined || v === null || String(v).trim() === '') return fallback;
  return String(v).trim();
}

export function envInt(name, fallback) {
  const n = Number(envStr(name, String(fallback)));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function stripSlash(url) {
  return String(url || '').replace(/\/$/, '');
}

export function profileName() {
  return envStr('PROFILE', 'stress').toLowerCase();
}

/** Ramping stages + HTTP thresholds for landing / API scripts. */
export function httpLoadProfile(kind) {
  const p = profileName();
  if (p === 'smoke') {
    return {
      stages: [
        { duration: '15s', target: 5 },
        { duration: '30s', target: 10 },
        { duration: '15s', target: 0 },
      ],
      thresholds: {
        http_req_failed: ['rate<0.08'],
        http_req_duration: ['p(95)<3000'],
        checks: ['rate>0.92'],
      },
      durationLimitMs: kind === 'api' ? 1500 : 2500,
    };
  }
  // stress — capped at 50 VU (Hobby / local Docker realism)
  return {
    stages: [
      { duration: '20s', target: 10 },
      { duration: '40s', target: 10 },
      { duration: '30s', target: 50 },
      { duration: '1m', target: 50 },
      { duration: '20s', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.10'],
      http_req_duration: ['p(95)<8000'],
      checks: ['rate>0.80'],
    },
    durationLimitMs: kind === 'api' ? 2500 : 5000,
  };
}

export const LANDING_PATHS = [
  { path: '/en', weight: 30 },
  { path: '/en/pricing', weight: 12 },
  { path: '/en/templates', weight: 12 },
  { path: '/en/features', weight: 8 },
  { path: '/en/docs', weight: 8 },
  { path: '/en/community', weight: 6 },
  { path: '/en/demo', weight: 5 },
  { path: '/en/about', weight: 4 },
  { path: '/en/login', weight: 5 },
  { path: '/tr', weight: 10 },
];

export function pickWeightedPath(paths) {
  let total = 0;
  for (const p of paths) total += p.weight;
  let r = Math.random() * total;
  for (const p of paths) {
    r -= p.weight;
    if (r <= 0) return p.path;
  }
  return paths[0].path;
}

export const DEFAULT_UA = 'k6-workspace-os-load-test/2.0';
