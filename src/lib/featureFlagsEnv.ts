/**
 * Resolve Pulse Flag delivery base URL from env.
 * Accepts common aliases so a misnamed Vercel variable still works.
 */
export function resolveFeatureFlagsUrl(): {
  url: string;
  from: string | null;
  present: Record<string, boolean>;
} {
  const present = {
    FEATURE_FLAGS_URL: Boolean(process.env.FEATURE_FLAGS_URL?.trim()),
    FEATURE_FLAGS_BASE_URL: Boolean(process.env.FEATURE_FLAGS_BASE_URL?.trim()),
    FEATURE_FLAGS_API_URL: Boolean(process.env.FEATURE_FLAGS_API_URL?.trim()),
  };

  const candidates: Array<[string, string | undefined]> = [
    ['FEATURE_FLAGS_URL', process.env.FEATURE_FLAGS_URL],
    ['FEATURE_FLAGS_BASE_URL', process.env.FEATURE_FLAGS_BASE_URL],
    // Same name as Pulse admin BFF — sometimes pasted onto SaaS by mistake.
    ['FEATURE_FLAGS_API_URL', process.env.FEATURE_FLAGS_API_URL],
  ];

  for (const [name, raw] of candidates) {
    const url = (raw || '').trim().replace(/\/$/, '');
    if (url) return { url, from: name, present };
  }

  return { url: '', from: null, present };
}

export function resolveFeatureFlagsApiKey(): string {
  return (process.env.FEATURE_FLAGS_API_KEY || '').trim();
}
