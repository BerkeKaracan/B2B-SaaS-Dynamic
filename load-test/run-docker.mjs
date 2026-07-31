/**
 * Cross-platform Docker runner for k6 scripts (no local k6).
 *
 *   npm run test:load | test:load:smoke     marketing multi-page
 *   npm run test:api | test:api:smoke       backend public/edge API
 *   npm run test:collab | test:collab:smoke canvas WS (5×10 rooms)
 *   npm run test:suite | test:suite:smoke   mixed parallel scenarios
 *   npm run test:public-ai                  limiter check (1 VU)
 *   npm run test:load:all                   smoke landing+api+collab+suite
 *
 * Env: BASE_URL, API_URL, WS_URL, PROFILE, ROOM_COUNT, ROOM_PREFIX,
 *      COLLAB_TOKEN, AUTH_TOKEN, TARGET_PATH (legacy single-path override unused)
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const scriptArg = process.argv.find((a) => a.startsWith('--script='));
const scriptName = (
  scriptArg?.slice('--script='.length) ||
  process.env.K6_SCRIPT ||
  'load'
).toLowerCase();

const profileArg = process.argv.find((a) => a.startsWith('--profile='));
const profile = (
  profileArg?.slice('--profile='.length) ||
  process.env.PROFILE ||
  'stress'
).toLowerCase();

const SCRIPT_MAP = {
  load: 'load-test.js',
  landing: 'load-test.js',
  api: 'api-test.js',
  collab: 'collab-test.js',
  'collab-test': 'collab-test.js',
  suite: 'suite-test.js',
  'public-ai': 'public-ai-limit-test.js',
  'public-ai-limit': 'public-ai-limit-test.js',
  all: null,
};

if (!(scriptName in SCRIPT_MAP)) {
  console.error(
    `Unknown script "${scriptName}". Use: load|api|collab|suite|public-ai|all`
  );
  process.exit(1);
}

const dockerCheck = spawnSync('docker', ['version'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

if (dockerCheck.status !== 0) {
  console.error(
    'Docker is required to run the load test (grafana/k6). Install Docker Desktop and ensure `docker` is on PATH.'
  );
  if (dockerCheck.stderr) {
    console.error(dockerCheck.stderr.trim());
  }
  process.exit(1);
}

function pushEnv(args, key, value) {
  if (value === undefined || value === null || value === '') return;
  args.push('-e', `${key}=${value}`);
}

function runOne(k6Script, runProfile) {
  const args = [
    'run',
    '--rm',
    '-i',
    '--add-host=host.docker.internal:host-gateway',
  ];

  const baseUrl =
    process.env.BASE_URL || 'http://host.docker.internal:3000';
  const apiUrl =
    process.env.API_URL || 'http://host.docker.internal:8000';
  const wsUrl =
    process.env.WS_URL || 'ws://host.docker.internal:8000';

  pushEnv(args, 'PROFILE', runProfile);
  pushEnv(args, 'BASE_URL', baseUrl);
  pushEnv(args, 'API_URL', apiUrl);
  pushEnv(args, 'WS_URL', wsUrl);
  pushEnv(args, 'ROOM_COUNT', process.env.ROOM_COUNT || '10');
  pushEnv(args, 'ROOM_PREFIX', process.env.ROOM_PREFIX || 'k6-collab');
  pushEnv(args, 'COLLAB_TOKEN', process.env.COLLAB_TOKEN || 'local-dev');
  pushEnv(args, 'AUTH_TOKEN', process.env.AUTH_TOKEN || '');
  pushEnv(args, 'TARGET_PATH', process.env.TARGET_PATH || '/en');
  pushEnv(
    args,
    'PUBLIC_AI_MAX_ATTEMPTS',
    process.env.PUBLIC_AI_MAX_ATTEMPTS || '12'
  );

  args.push(
    '-v',
    `${scriptDir}:/scripts:ro`,
    'grafana/k6:latest',
    'run',
    `/scripts/${k6Script}`
  );

  console.log(
    `k6 script=${k6Script} profile=${runProfile} base=${baseUrl} api=${apiUrl} ws=${wsUrl}`
  );
  console.log(`docker ${args.join(' ')}`);

  const result = spawnSync('docker', args, {
    stdio: 'inherit',
    env: process.env,
  });
  return result.status === null ? 1 : result.status;
}

if (scriptName === 'all') {
  const pack = [
    ['load-test.js', 'smoke'],
    ['api-test.js', 'smoke'],
    ['collab-test.js', 'smoke'],
    ['suite-test.js', 'smoke'],
  ];
  let code = 0;
  for (const [file, p] of pack) {
    console.log(`\n=== pack: ${file} (${p}) ===\n`);
    const status = runOne(file, p);
    if (status !== 0) {
      code = status;
      break;
    }
  }
  process.exit(code);
}

process.exit(runOne(SCRIPT_MAP[scriptName], profile));
