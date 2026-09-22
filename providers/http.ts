export class ProviderError extends Error {
  constructor(
    public code: string,
    public retryAfter = 0,
  ) {
    super(code);
  }
}
const tokens = new Map<string, { value: string; expires: number }>();
export async function request(url: string, init: RequestInit = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let r: Response;
    try {
      r = await fetch(url, { ...init, signal: AbortSignal.timeout(12000) });
    } catch {
      if (attempt === 2) throw new ProviderError("network");
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      continue;
    }
    if (r.ok) return r;
    if (r.status === 429) {
      const raw = r.headers.get("retry-after");
      const delay = raw
        ? Number(raw) || Math.max(0, (Date.parse(raw) - Date.now()) / 1000)
        : 60;
      throw new ProviderError(
        "rate-limited",
        Number.isFinite(delay) ? Math.max(60, delay) : 60,
      );
    }
    if (r.status >= 500 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      continue;
    }
    throw new ProviderError(`http-${r.status}`);
  }
  throw new ProviderError("unavailable");
}
export async function token(url: string, id?: string, secret?: string) {
  if (!id || !secret) throw new ProviderError("credentials-missing");
  const key = url + id;
  const old = tokens.get(key);
  if (old && old.expires > Date.now() + 60000) return old.value;
  const r = await request(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const d = (await r.json()) as { access_token?: string; expires_in?: number };
  if (!d.access_token) throw new ProviderError("invalid-token");
  tokens.set(key, {
    value: d.access_token,
    expires: Date.now() + (d.expires_in ?? 3600) * 1000,
  });
  return d.access_token;
}
