/* ═══════════════════════════════════════════════════════════════════════
   Gemini proxy — shared core
   ───────────────────────────────────────────────────────────────────────
   The browser must never see the API key. The page posts the same payload
   it used to send to Google; this adds the key server-side and forwards.

   The key is read from the GEMINI_API_KEY environment variable. It is never
   returned to the client, and never logged.

   A bare proxy is still an open relay — anyone who finds the URL can spend
   the quota. So requests are checked against an origin allowlist, capped in
   size, and rate limited per IP.
   ═══════════════════════════════════════════════════════════════════════ */

const MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

// Requests must come from one of these. Set ALLOWED_ORIGINS in the host's
// environment (comma separated) to change it without editing code.
const ALLOWED = (process.env.ALLOWED_ORIGINS ||
  'https://narekohanyan.com,https://www.narekohanyan.com,http://localhost:4173')
  .split(',').map(s => s.trim()).filter(Boolean);

const MAX_BYTES = 32 * 1024;   // a prompt this size is already generous
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 12;

// Best effort only: serverless instances come and go, so this throttles a
// burst from one client rather than enforcing a global quota.
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const fresh = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  fresh.push(now);
  hits.set(ip, fresh);
  if (hits.size > 5000) hits.clear();        // crude guard against growth
  return fresh.length > MAX_PER_WINDOW;
}

function originOK(origin, referer) {
  if (!origin && !referer) return false;
  const val = origin || referer;
  return ALLOWED.some(a => val === a || val.startsWith(a + '/'));
}

/** Returns { status, body } — transport-agnostic so both adapters share it. */
async function handle({ method, headers, rawBody, ip }) {
  if (method === 'OPTIONS') return { status: 204, body: null };
  if (method !== 'POST') return { status: 405, body: { error: 'Method not allowed' } };

  if (!originOK(headers.origin, headers.referer))
    return { status: 403, body: { error: 'Forbidden' } };

  if (!process.env.GEMINI_API_KEY)
    return { status: 500, body: { error: 'Server is missing GEMINI_API_KEY' } };

  if (rawBody && rawBody.length > MAX_BYTES)
    return { status: 413, body: { error: 'Payload too large' } };

  if (rateLimited(ip || 'unknown'))
    return { status: 429, body: { error: 'Too many requests — try again shortly' } };

  let payload;
  try { payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody; }
  catch { return { status: 400, body: { error: 'Malformed JSON' } }; }

  // Forward only the fields the page is allowed to set, so a crafted request
  // cannot reach other parts of the API.
  const safe = {};
  if (payload && payload.contents) safe.contents = payload.contents;
  if (payload && payload.generationConfig) safe.generationConfig = payload.generationConfig;
  if (payload && payload.systemInstruction) safe.systemInstruction = payload.systemInstruction;
  if (!safe.contents) return { status: 400, body: { error: 'Missing contents' } };

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
              encodeURIComponent(MODEL) + ':generateContent';

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
                 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify(safe)
    });
    const data = await r.json();
    // Pass Google's shape straight through: the page already parses it.
    return { status: r.ok ? 200 : r.status, body: data };
  } catch (e) {
    return { status: 502, body: { error: 'Upstream request failed' } };
  }
}

module.exports = { handle, ALLOWED };
