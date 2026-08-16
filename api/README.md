# Gemini proxy

The essay platform (`/Essay`) uses Gemini to mark essays and to run the study
assistant. The API key must stay on the server: anything in the page itself is
readable by every visitor through View Source, and a leaked key can be used to
spend the account's quota.

## How it works

    browser  →  POST /api/gemini  →  this function (adds the key)  →  Google

The function forwards Google's response unchanged, so the page parses it
exactly as it did when it called Google directly.

## Setup

1. **Rotate the old key.** The previous key was embedded in the page, so treat
   it as public. Delete it at <https://aistudio.google.com/apikey> and issue a
   new one. Do this even if the page was never deployed.

2. **Set the environment variable** on the host — never in a file in this repo:

   | host | where |
   |------|-------|
   | Vercel | Project → Settings → Environment Variables |
   | Netlify | Site configuration → Environment variables |
   | Cloudflare Pages | Settings → Environment variables (encrypt it) |

   ```
   GEMINI_API_KEY = <the new key>
   ```

   Optional:
   - `GEMINI_MODEL` — defaults to `gemini-3-flash-preview`
   - `ALLOWED_ORIGINS` — comma separated; defaults to narekohanyan.com,
     www.narekohanyan.com and http://localhost:4173

3. **Deploy.** Vercel picks up `api/gemini.js` automatically. Netlify uses
   `netlify.toml`, which maps `/api/gemini` to the function.

## Why there is more than a key swap in here

A proxy that only adds the key is an open relay — anyone who finds the URL can
burn the quota just as easily as if the key were public. So the function also:

- **checks the origin** against an allowlist, rejecting requests from other sites
- **caps the payload** at 32 KB
- **rate limits** to 12 requests per minute per IP (best effort — serverless
  instances are recycled, so this stops a burst, not a determined attacker)
- **forwards only** `contents`, `generationConfig` and `systemInstruction`, so a
  crafted request cannot reach other parts of the API
- **never logs or returns** the key

For a hard quota ceiling, also set spending limits in Google AI Studio. Origin
headers can be forged by a non-browser client; the allowlist stops casual
misuse from other websites, not a scripted attacker.

## Local development

`python3 -m http.server` cannot run functions, so the AI features return an
error locally. Everything else on the page works. To exercise them, run
`netlify dev` or `vercel dev` with `GEMINI_API_KEY` set in your shell.
