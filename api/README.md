# Gemini proxy

The essay platform (`/Essay`) uses Gemini to mark essays and to run the study
assistant. The API key must stay on the server: anything in the page itself is
readable by every visitor through View Source, and a leaked key can be used to
spend the account's quota.

## How it works

    browser  →  POST /api/gemini  →  the proxy (adds the key)  →  Google

Whichever backend answers, it forwards Google's response unchanged, so the
page parses it exactly as it did when it called Google directly — the front
end (`Essay/index.html`) never needed to change between hosts.

**Two implementations exist, because this site has been deployed to two kinds
of host that can't run the same code:**

| host | file that runs | how the URL is routed |
|---|---|---|
| Hostinger (production) | `api/gemini.php` | `.htaccess`: `^api/gemini/?$ → api/gemini.php` |
| Netlify | `netlify/functions/gemini.js` | `netlify.toml` |
| Vercel | `api/gemini.js` | picked up automatically |

Hostinger's shared hosting serves static files and PHP; it cannot run a Node
function, which is why the Node adapter alone 404'd there in production even
though it worked on localhost. Both implementations share the same security
properties (below) — `api/_gemini-core.php` and `api/_gemini-core.js` are the
two copies of that logic, one per language, kept deliberately parallel.

## Setup — Hostinger (the live site)

1. **Rotate the key if it hasn't been already.** Delete the old one at
   <https://aistudio.google.com/apikey> and issue a new one. Treat any key
   that has ever been in a committed file, in a page's source, or pasted into
   a chat as public.

2. **Give the key to the server.** Checked in this order by
   `_gemini-core.php`, so either works and nothing else needs to change if
   the plan is upgraded later:

   - **If Hostinger's hPanel exposes PHP environment variables** for this
     plan (Advanced → look for an Environment Variables section — this
     varies by plan and isn't on every shared-hosting tier), set
     `GEMINI_API_KEY` there. Nothing else to do.
   - **Otherwise — the usual case on shared hosting** — copy
     `api/secrets.example.php` to `api/secrets.php` and fill in the real
     key, then upload just that one file via hPanel's **File Manager**
     (or FTP) into the `api/` folder on the server.

     `api/secrets.php` is gitignored on purpose: a `git`-triggered deploy
     that only updates tracked files won't touch or remove it, so this is a
     **one-time** upload that survives future pushes. `.htaccess` also
     blocks the file from ever being served directly, as a second layer in
     case PHP execution itself is ever misconfigured.

3. **Verify.** From any machine:

   ```bash
   curl -s -X POST https://narekohanyan.com/api/gemini \
     -H "Content-Type: application/json" \
     -H "Origin: https://narekohanyan.com" \
     -d '{"contents":[{"parts":[{"text":"Reply with one word: working"}]}]}'
   ```

   A reply containing `"text": "working"` means it's live. `{"error":
   "Server is missing GEMINI_API_KEY"}` means step 2 hasn't landed yet —
   re-check the upload, or that the environment variable actually saved.

## Setup — Netlify or Vercel (if this site is ever deployed there too)

1. **Set the environment variable** on the host, never in a file in this
   repo:

   | host | where |
   |------|-------|
   | Vercel | Project → Settings → Environment Variables |
   | Netlify | Site configuration → Environment variables |
   | Cloudflare Pages | Settings → Environment variables (encrypt it) |

   ```
   GEMINI_API_KEY = <the key>
   ```

2. **Deploy.** Vercel picks up `api/gemini.js` automatically. Netlify uses
   `netlify.toml`, which maps `/api/gemini` to the function.

## Optional, either host

- `GEMINI_MODEL` — defaults to `gemini-3-flash-preview`
- `ALLOWED_ORIGINS` — comma separated; defaults to narekohanyan.com,
  www.narekohanyan.com and http://localhost:4173

## Why there is more than a key swap in here

A proxy that only adds the key is an open relay — anyone who finds the URL can
burn the quota just as easily as if the key were public. So both
implementations also:

- **check the origin** against an allowlist, rejecting requests from other sites
- **cap the payload** at 32 KB
- **rate limit** to 12 requests per minute per IP (best effort on both hosts —
  Node's is an in-memory counter that resets when the instance recycles;
  PHP's is a small file per IP under the system temp directory, since PHP-FPM
  workers don't share memory the way one long-lived Node process does. Either
  stops a casual burst, not a determined attacker spreading requests across
  workers)
- **forward only** `contents`, `generationConfig` and `systemInstruction`, so a
  crafted request cannot reach other parts of the API
- **never log or return** the key

For a hard quota ceiling, also set spending limits in Google Cloud Console —
origin headers can be forged by a non-browser client, so the allowlist stops
casual misuse from other websites, not a scripted attacker.

## Local development

`python3 -m http.server` cannot run functions, so the AI features return an
error under it. `node dev-server.js` runs the Node proxy locally (the same
`api/_gemini-core.js` Netlify and Vercel use) with `GEMINI_API_KEY` read from
`.env` — see the repo root README for that setup. There is no local PHP dev
path; the PHP implementation is exercised on Hostinger itself.
