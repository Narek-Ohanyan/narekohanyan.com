/* ═══════════════════════════════════════════════════════════════════════
   Supabase — shared browser client
   ───────────────────────────────────────────────────────────────────────
   One client for the whole site, plus the small set of writes the pages
   actually make. Everything here is written for a visitor who is never
   signed in: the public role may insert into the three intake tables, and
   may reach academy data only through the checked database functions.

   Load order on any page that needs this:
       <script src="vendor/supabase.js"></script>
       <script src="supabase-config.js"></script>
       <script src="supabase-client.js"></script>

   Every call resolves to { ok: true } or { ok: false, error, offline }
   rather than throwing, because a form that loses someone's message when
   the network hiccups is worse than one that says "saved locally".
   ═══════════════════════════════════════════════════════════════════════ */

window.NO = window.NO || {};

window.NO.db = (function () {
  'use strict';

  var client = null;
  var ready = false;

  function init() {
    if (ready) return client;
    ready = true;
    try {
      var cfg = window.SUPABASE_CONFIG;
      if (!cfg || !cfg.url || !cfg.publishableKey) return (client = null);
      if (!window.supabase || !window.supabase.createClient) return (client = null);
      client = window.supabase.createClient(cfg.url, cfg.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        global: { headers: { 'x-client-info': 'narekohanyan-site' } }
      });
    } catch (e) { client = null; }
    return client;
  }

  function available() { return !!init(); }

  /** Never throw at the call site — callers decide what to do with ok:false. */
  function wrap(promise) {
    return promise.then(function (res) {
      if (res && res.error) return { ok: false, error: res.error, offline: false };
      return { ok: true, data: res ? res.data : null };
    }).catch(function (err) {
      return { ok: false, error: err, offline: true };
    });
  }

  function nn(v, max) {
    v = (v === null || v === undefined) ? '' : String(v).trim();
    if (!v) return null;
    return max ? v.slice(0, max) : v;
  }

  /* ── newsletter ───────────────────────────────────────────────────── */
  function subscribe(email, name, source) {
    var c = init();
    if (!c) return Promise.resolve({ ok: false, offline: true, error: new Error('no client') });
    return wrap(c.from('newsletter_subscribers').insert({
      email: String(email).trim().toLowerCase(),
      name: nn(name, 200),
      source: nn(source, 60) || 'website'
    })).then(function (r) {
      // 23505 = already on the list. That is a success from the reader's
      // point of view, not an error to show them.
      if (!r.ok && r.error && (r.error.code === '23505' ||
          /duplicate key/i.test(r.error.message || ''))) {
        return { ok: true, duplicate: true };
      }
      return r;
    });
  }

  /* ── contact form ─────────────────────────────────────────────────── */
  function sendMessage(p) {
    var c = init();
    if (!c) return Promise.resolve({ ok: false, offline: true, error: new Error('no client') });
    return wrap(c.from('contact_messages').insert({
      name: nn(p.name, 200),
      email: String(p.email || '').trim().toLowerCase(),
      organisation: nn(p.organisation, 200),
      enquiry: nn(p.enquiry, 100),
      budget: nn(p.budget, 100),
      subject: nn(p.subject, 300) || 'Website enquiry',
      message: nn(p.message, 10000) || '(no message)'
    }));
  }

  /* ── booking / calendar form ──────────────────────────────────────── */
  function requestBooking(p) {
    var c = init();
    if (!c) return Promise.resolve({ ok: false, offline: true, error: new Error('no client') });
    var dates = Array.isArray(p.dates) ? p.dates.slice(0, 60) : [];
    return wrap(c.from('booking_requests').insert({
      name: nn(p.name, 200),
      email: String(p.email || '').trim().toLowerCase(),
      organisation: nn(p.organisation, 200),
      session_type: nn(p.sessionType, 100),
      format: nn(p.format, 100),
      audience_size: nn(p.audienceSize, 60),
      budget: nn(p.budget, 100),
      location: nn(p.location, 300),
      notes: nn(p.notes, 10000) || '(no notes)',
      dates: dates,
      day_count: Math.min(Number(p.dayCount) || dates.length, 60),
      time_window: nn(p.window, 120),
      timezone: nn(p.timezone, 60),
      summary: nn(p.summary, 500)
    }));
  }

  /* ── Green Academy: authentication ────────────────────────────────────
     Passwords go straight to Supabase Auth and are never held, hashed or
     logged by this site. The session lives in localStorage under Supabase's
     own key and is refreshed automatically. */
  function signUp(email, password, meta) {
    var c = init();
    if (!c) return Promise.resolve({ ok: false, offline: true });
    return c.auth.signUp({
      email: email, password: password,
      options: { data: meta || {}, emailRedirectTo: window.location.origin + '/academy.html' }
    }).then(function (r) {
      if (r.error) return { ok: false, error: r.error };
      // No session means the project requires email confirmation.
      if (!r.data.session) return { ok: true, pending: true, user: r.data.user };
      return { ok: true, session: r.data.session, user: r.data.user };
    }, function (e) { return { ok: false, error: e, offline: true }; });
  }

  function signIn(email, password) {
    var c = init();
    if (!c) return Promise.resolve({ ok: false, offline: true });
    return c.auth.signInWithPassword({ email: email, password: password })
      .then(function (r) {
        if (r.error) return { ok: false, error: r.error };
        return { ok: true, session: r.data.session, user: r.data.user };
      }, function (e) { return { ok: false, error: e, offline: true }; });
  }

  function signOut() {
    var c = init();
    if (!c) return Promise.resolve({ ok: true });
    return c.auth.signOut().then(function () { return { ok: true }; },
                                function () { return { ok: true }; });
  }

  function getSession() {
    var c = init();
    if (!c) return Promise.resolve(null);
    return c.auth.getSession().then(function (r) {
      return (r && r.data) ? r.data.session : null;
    }, function () { return null; });
  }

  function onAuthChange(fn) {
    var c = init();
    if (!c) return function () {};
    var sub = c.auth.onAuthStateChange(function (_evt, session) { fn(session); });
    return function () { try { sub.data.subscription.unsubscribe(); } catch (e) {} };
  }

  function resetPassword(email) {
    var c = init();
    if (!c) return Promise.resolve({ ok: false, offline: true });
    return wrap(c.auth.resetPasswordForEmail(String(email).trim(), {
      redirectTo: window.location.origin + '/academy.html'
    }));
  }

  /* ── Green Academy: progress ──────────────────────────────────────────
     RLS scopes every row to the signed-in user, so these queries carry no
     user_id filter of their own for reads — the database applies it. On
     write the id is set explicitly because the INSERT policy checks it. */
  function fetchProgress() {
    var c = init();
    if (!c) return Promise.resolve({ ok: false, offline: true });
    return c.from('course_progress')
      .select('course_id, enrolled, started_at, claimed_at, done, scores')
      .then(function (r) {
        if (r.error) return { ok: false, error: r.error };
        var out = {};
        (r.data || []).forEach(function (row) {
          out[row.course_id] = {
            enrolled: !!row.enrolled,
            started: row.started_at,
            claimed: row.claimed_at || false,
            done: row.done || {},
            scores: row.scores || {}
          };
        });
        return { ok: true, data: out };
      }, function (e) { return { ok: false, error: e, offline: true }; });
  }

  function saveProgress(courseId, s) {
    var c = init();
    if (!c) return Promise.resolve({ ok: false, offline: true });
    return c.auth.getUser().then(function (u) {
      var id = u && u.data && u.data.user ? u.data.user.id : null;
      if (!id) return { ok: false, error: new Error('not signed in') };
      return wrap(c.from('course_progress').upsert({
        user_id: id,
        course_id: String(courseId).slice(0, 100),
        enrolled: !!s.enrolled,
        started_at: s.started || null,
        claimed_at: (s.claimed && s.claimed !== true) ? s.claimed : null,
        done: s.done || {},
        scores: s.scores || {}
      }, { onConflict: 'user_id,course_id' }));
    }, function (e) { return { ok: false, error: e, offline: true }; });
  }

  return {
    available: available,
    subscribe: subscribe,
    sendMessage: sendMessage,
    requestBooking: requestBooking,
    signUp: signUp, signIn: signIn, signOut: signOut,
    getSession: getSession, onAuthChange: onAuthChange,
    resetPassword: resetPassword,
    fetchProgress: fetchProgress,
    saveProgress: saveProgress
  };
}());
