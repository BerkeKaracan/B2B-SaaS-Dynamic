#!/usr/bin/env node
/**
 * Manual / CI probe for Pulse Flag evaluate.
 *
 * Usage:
 *   node scripts/test-feature-flag.mjs
 *   FEATURE_FLAGS_URL=https://... FEATURE_FLAGS_API_KEY=pf_... \
 *     TENANT_ID=... TIER=basic KEY=ai.canvas_generator \
 *     node scripts/test-feature-flag.mjs
 *
 * Exit 0 only when remote returns HTTP 200 and enabled === true.
 */

const base = (process.env.FEATURE_FLAGS_URL || '').replace(/\/$/, '');
const apiKey = process.env.FEATURE_FLAGS_API_KEY || '';
const tenantId = process.env.TENANT_ID || '';
const tier = (process.env.TIER || 'basic').toLowerCase();
const key = process.env.KEY || 'ai.canvas_generator';

function fail(msg, extra) {
  console.error('FAIL:', msg);
  if (extra) console.error(extra);
  process.exit(1);
}

if (!base) fail('FEATURE_FLAGS_URL is empty');
if (!apiKey) fail('FEATURE_FLAGS_API_KEY is empty');
if (!tenantId) fail('TENANT_ID is empty');

const qs = new URLSearchParams({ key, tenant_id: tenantId, tier });
const url = `${base}/evaluate?${qs}`;

console.log('GET', url);
console.log('Authorization: Bearer', `${apiKey.slice(0, 6)}…`);

const started = Date.now();
let res;
try {
  res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': 'saas-engine-ff-test',
    },
    signal: AbortSignal.timeout(5000),
  });
} catch (err) {
  fail('network error (Pulse unreachable from this machine)', String(err));
}

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  fail(`non-JSON body (HTTP ${res.status})`, text.slice(0, 300));
}

console.log('HTTP', res.status, `${Date.now() - started}ms`);
console.log('body', json);

if (!res.ok) fail(`HTTP ${res.status}`, json);
if (typeof json.enabled !== 'boolean') fail('missing enabled boolean', json);

if (json.enabled === true) {
  console.log('PASS: enabled=true');
  process.exit(0);
}

console.log('RESULT: enabled=false (connection OK, rule/targeting did not match)');
process.exit(2);
