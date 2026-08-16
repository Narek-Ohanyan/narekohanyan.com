/* ═══════════════════════════════════════════════════════════════════════
   Supabase connection details
   ───────────────────────────────────────────────────────────────────────
   These two values are committed deliberately. The site is static — there
   is no build step to inline anything from .env, and the browser cannot
   read .env — so the values have to live in a file the page can load.

   That is safe here, and only here, because a `sb_publishable_` key is
   designed to sit in public page source. It grants nothing on its own:
   every table has row level security on, the public role may INSERT into
   the three intake tables and nothing more, and the academy tables have no
   policies at all so they can only be reached through the three checked
   functions. Read access to submissions is not granted to anyone.

   The Gemini key in api/ is the opposite case and must never appear here.
   ═══════════════════════════════════════════════════════════════════════ */

window.SUPABASE_CONFIG = {
  url: 'https://rdxuhluxhiiuibvkbdxk.supabase.co',
  publishableKey: 'sb_publishable_Ro-m_4pB6UhU1EsYIoCxoQ_XO0-Rdpi'
};
