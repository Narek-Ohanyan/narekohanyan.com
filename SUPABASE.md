# Backend (Supabase)

Project `rdxuhluxhiiuibvkbdxk` · Postgres 17 · region ap-south-1

The site is static, so everything below is reached straight from the browser
with the **publishable** key in `supabase-config.js`. That key is public by
design and grants nothing on its own — every rule that matters is enforced in
the database.

## Tables

| table | who writes | who reads |
|---|---|---|
| `newsletter_subscribers` | anyone (INSERT) | nobody through the API |
| `contact_messages` | anyone (INSERT) | nobody through the API |
| `booking_requests` | anyone (INSERT) | nobody through the API |
| `profiles` | the owner | the owner |
| `course_progress` | the owner | the owner |

**Submissions can be written but never read back.** Table grants are revoked
and no SELECT policy exists, so both the privilege layer and RLS refuse a
read. Verified by querying as `anon`: `permission denied`.

Read your submissions in the Supabase dashboard (Table Editor), or with the
service-role key from a server — never from the browser.

## Auth

Supabase Auth, email + password. Passwords are hashed and stored by Supabase;
this site never sees, hashes or stores one. A row in `profiles` is created
automatically by the `on_auth_user_created` trigger.

Ownership is `auth.uid()`. Every policy pairs `TO authenticated` with an
ownership test — `TO authenticated` alone would let any signed-in user read
every row. UPDATE policies carry both `USING` and `WITH CHECK`, so a row
cannot be reassigned to someone else. `auth.uid()` is wrapped in a scalar
sub-select so it is evaluated once per query, not once per row.

Tested: a second user sees 0 of the first user's rows, overwrites 0 of them,
and an INSERT claiming another user's id is rejected by RLS.

## Client

    vendor/supabase.js      supabase-js v2.112.3, vendored from node_modules
    supabase-config.js      url + publishable key (safe to commit)
    supabase-client.js      window.NO.db — the only place queries are written
    academy.js              window.Academy — accounts and progress

`npm install` is only needed to refresh the vendored bundle:

    npm install && cp node_modules/@supabase/supabase-js/dist/umd/supabase.js vendor/supabase.js

`@supabase/ssr` is installed but unused — it exists for server-rendered
frameworks and this site has no server rendering.

## Two settings to turn on in the dashboard

1. **Leaked password protection** — Authentication → Policies. Checks new
   passwords against HaveIBeenPwned.
2. **Email confirmation** — Authentication → Providers → Email. If it is on,
   sign-up returns `{ pending: true }` and the UI tells the learner to check
   their inbox; if off, they are signed in immediately. Both paths work.

Note the built-in email service is rate limited and meant for testing. Wire
up a real SMTP provider before launch or confirmation emails will not arrive
reliably.
