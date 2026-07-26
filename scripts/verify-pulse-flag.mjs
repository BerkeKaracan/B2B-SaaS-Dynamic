/**
 * SaaS ↔ Pulse delivery smoke (no secret values printed).
 *
 * Env:
 *   FEATURE_FLAGS_URL
 *   FEATURE_FLAGS_API_KEY   (Pulse project delivery key)
 *   FLAG_KEY                default ai.canvas_generator
 *   TENANT_ID               default nil UUID
 *
 * After Pulse "Ensure paid tiers" on the SaaS project:
 *   basic → false, advanced → true, pro → true
 */
const base = (process.env.FEATURE_FLAGS_URL || '').replace(/\/$/, '');
const key = (process.env.FEATURE_FLAGS_API_KEY || '').trim();
const flagKey = (process.env.FLAG_KEY || 'ai.canvas_generator').trim();
const tenantId =
  process.env.TENANT_ID || '00000000-0000-4000-8000-000000000001';

if (!base || !key) {
  console.error('FEATURE_FLAGS_URL and FEATURE_FLAGS_API_KEY are required');
  process.exit(1);
}

console.log('pulse_host', new URL(base).host);
// Never log the delivery key or any substring (CodeQL clear-text logging).
console.log('delivery_key_present', true);
console.log('flag', flagKey);

async function evaluate(tier) {
  const params = new URLSearchParams({
    key: flagKey,
    tenant_id: tenantId,
    tier,
  });
  const res = await fetch(`${base}/evaluate?${params}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${key}`,
      'User-Agent': 'saas-engine-verify-pulse',
    },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 120) };
  }
  return { status: res.status, body };
}

const health = await fetch(`${base}/health`);
console.log('health', health.status);

const expectations = [
  ['basic', false],
  ['advanced', true],
  ['pro', true],
];

let failed = 0;
for (const [tier, want] of expectations) {
  const { status, body } = await evaluate(tier);
  const got = body?.enabled;
  const ok = status === 200 && got === want;
  console.log(
    `tier=${tier} http=${status} enabled=${got} want=${want} ${ok ? 'OK' : 'FAIL'}`
  );
  if (!ok) failed += 1;
}

process.exit(failed ? 1 : 0);
