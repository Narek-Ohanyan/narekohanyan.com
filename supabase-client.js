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

  var LEARNER_KEY = 'no.academy.learnerKey';
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
        auth: { persistSession: false, autoRefreshToken: false },
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

  /* ── Green Academy ────────────────────────────────────────────────────
     The learner key is a capability: whoever holds it can see that
     learner's progress and nobody else can. It lives in localStorage and
     is minted on first use. No password ever leaves the browser. */
  function learnerKey() {
    try { return localStorage.getItem(LEARNER_KEY) || null; } catch (e) { return null; }
  }
  function setLearnerKey(k) {
    try { localStorage.setItem(LEARNER_KEY, k); return true; } catch (e) { return false; }
  }

  function register(name, email, newsletter) {
    var c = init();
    if (!c) return Promise.resolve({ ok: false, offline: true });
    return wrap(c.rpc('academy_register', {
      p_name: nn(name, 200), p_email: nn(email, 320), p_newsletter: !!newsletter
    })).then(function (r) {
      if (r.ok && r.data) setLearnerKey(r.data);
      return r;
    });
  }

  /** Ensures a key exists, registering one if this browser has none. */
  function ensureLearner(name, email, newsletter) {
    var k = learnerKey();
    if (k) return Promise.resolve({ ok: true, data: k });
    return register(name, email, newsletter);
  }

  function fetchProgress() {
    var c = init(), k = learnerKey();
    if (!c || !k) return Promise.resolve({ ok: false, offline: !c });
    return wrap(c.rpc('academy_fetch', { p_key: k }));
  }

  function saveProgress(courseId, state) {
    var c = init(), k = learnerKey();
    if (!c || !k) return Promise.resolve({ ok: false, offline: !c });
    return wrap(c.rpc('academy_save', {
      p_key: k, p_course: String(courseId), p_state: state || {}
    }));
  }

  return {
    available: available,
    subscribe: subscribe,
    sendMessage: sendMessage,
    requestBooking: requestBooking,
    learnerKey: learnerKey,
    setLearnerKey: setLearnerKey,
    register: register,
    ensureLearner: ensureLearner,
    fetchProgress: fetchProgress,
    saveProgress: saveProgress
  };
}());
