/* ═══════════════════════════════════════════════════════════════════════
   Online Green Academy — accounts and progress
   ───────────────────────────────────────────────────────────────────────
   Accounts are real now. Sign-up, sign-in and sessions are handled by
   Supabase Auth: passwords are hashed and stored by Supabase, never by
   this site, and never in localStorage. Progress lives in Postgres, owned
   by the signed-in user and fenced off by row level security — one learner
   cannot read or write another's rows even with a crafted request.

   The interface below is deliberately unchanged from the localStorage
   version — signUp / logIn / logOut / current / state / enrol / markDone /
   setScore / claim — so the pages that call it did not have to be rewritten
   around a new shape. Two things did change and callers must honour them:

     · ready() resolves once the stored session has been restored. Render
       after it, or a returning learner flashes the signed-out view.
     · signUp() may resolve with { pending: true } when the project
       requires email confirmation, meaning the account exists but there is
       no session yet.

   A local mirror of progress is kept so the course still renders if the
   network drops mid-lesson; the database remains the source of truth and
   wins on reload.
   ═══════════════════════════════════════════════════════════════════════ */

window.Academy = (function () {
  'use strict';

  var MIRROR = 'no.academy.mirror.v2';
  var COURSE_DEFAULT = { enrolled: false, done: {}, scores: {}, claimed: false, started: null };

  var user = null;        // { id, name, email }
  var progress = {};      // { courseId: state }
  var readyPromise = null;

  function db() {
    return (window.NO && window.NO.db && window.NO.db.available()) ? window.NO.db : null;
  }

  /* ── local mirror (offline resilience only) ─────────────────────── */
  function readMirror() {
    try { return JSON.parse(localStorage.getItem(MIRROR)) || {}; } catch (e) { return {}; }
  }
  function writeMirror() {
    try {
      var all = readMirror();
      if (user) all[user.id] = progress;
      localStorage.setItem(MIRROR, JSON.stringify(all));
    } catch (e) { /* private browsing — the database still has it */ }
  }
  function loadMirror() {
    if (!user) return;
    var all = readMirror();
    progress = all[user.id] || {};
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function ensure(courseId) {
    if (!user) return null;
    if (!progress[courseId]) progress[courseId] = clone(COURSE_DEFAULT);
    return progress[courseId];
  }

  /* ── session ────────────────────────────────────────────────────── */
  function adopt(session) {
    if (!session || !session.user) { user = null; progress = {}; return null; }
    var m = session.user.user_metadata || {};
    user = {
      id: session.user.id,
      email: session.user.email,
      name: m.full_name || (session.user.email || '').split('@')[0],
      newsletter: !!m.newsletter
    };
    return user;
  }

  /** Resolves once any stored session is restored and progress pulled. */
  function ready() {
    if (readyPromise) return readyPromise;
    var d = db();
    if (!d) { readyPromise = Promise.resolve(null); return readyPromise; }

    readyPromise = d.getSession().then(function (session) {
      adopt(session);
      if (!user) return null;
      loadMirror();
      return refresh().then(function () { return user; });
    }).catch(function () { return null; });

    // Keep this module in step with sign-in/out that happens elsewhere,
    // including in another tab.
    d.onAuthChange(function (session) {
      var before = user && user.id;
      adopt(session);
      if (!user) { progress = {}; return; }
      if (user.id !== before) { loadMirror(); refresh(); }
    });

    return readyPromise;
  }

  /** Pulls the authoritative progress for the signed-in user. */
  function refresh() {
    var d = db();
    if (!d || !user) return Promise.resolve(false);
    return d.fetchProgress().then(function (res) {
      if (!res.ok || !res.data) return false;
      progress = res.data;
      writeMirror();
      return true;
    }, function () { return false; });
  }

  function push(courseId) {
    var d = db(), s = progress[courseId];
    if (!d || !user || !s) return Promise.resolve(false);
    writeMirror();
    return d.saveProgress(courseId, s).then(function (r) { return !!r.ok; },
                                            function () { return false; });
  }

  /* ── accounts ───────────────────────────────────────────────────── */
  function signUp(name, email, pw, newsletter) {
    var d = db();
    if (!d) return Promise.reject(new Error('The academy cannot reach its database right now. Please try again in a moment.'));
    return d.signUp(String(email).trim(), pw, {
      full_name: String(name || '').trim(),
      newsletter: !!newsletter
    }).then(function (res) {
      if (!res.ok) throw new Error(friendly(res.error));
      if (res.pending) return { pending: true, email: String(email).trim() };
      adopt(res.session);
      progress = {};
      // A sign-up that ticked the newsletter box should actually subscribe.
      if (newsletter) d.subscribe(email, name, 'academy');
      return user;
    });
  }

  function logIn(email, pw) {
    var d = db();
    if (!d) return Promise.reject(new Error('The academy cannot reach its database right now. Please try again in a moment.'));
    return d.signIn(String(email).trim(), pw).then(function (res) {
      if (!res.ok) throw new Error(friendly(res.error));
      adopt(res.session);
      loadMirror();
      return refresh().then(function () { return user; });
    });
  }

  function logOut() {
    var d = db();
    user = null; progress = {}; readyPromise = null;
    return d ? d.signOut() : Promise.resolve();
  }

  function current() { return user; }

  /** Supabase's messages are accurate but terse; these are for readers. */
  function friendly(err) {
    var m = (err && (err.message || err.msg)) ? String(err.message || err.msg) : '';
    if (/already registered|already been registered|User already/i.test(m))
      return 'An account already exists for that email address. Try signing in instead.';
    if (/Invalid login credentials/i.test(m))
      return 'That email and password combination does not match an account.';
    if (/Email not confirmed/i.test(m))
      return 'Please confirm your email address first — check your inbox for the link.';
    if (/Password should be at least/i.test(m))
      return 'That password is too short. Use at least 8 characters.';
    if (/rate limit|too many/i.test(m))
      return 'Too many attempts just now. Please wait a minute and try again.';
    if (/fetch|network|Failed to/i.test(m))
      return 'Could not reach the academy. Check your connection and try again.';
    return m || 'Something went wrong. Please try again.';
  }

  /* ── progress ───────────────────────────────────────────────────── */
  function state(courseId) { return user ? (progress[courseId] || null) : null; }

  function enrol(courseId) {
    var s = ensure(courseId);
    if (!s) return false;
    s.enrolled = true;
    s.started = s.started || new Date().toISOString();
    push(courseId);
    return true;
  }

  function markDone(courseId, unitId) {
    var s = ensure(courseId);
    if (!s) return false;
    s.done[unitId] = true;
    push(courseId);
    return true;
  }

  /** Keeps the best score only — a retake can raise a mark, never lower it. */
  function setScore(courseId, quizId, pct) {
    var s = ensure(courseId);
    if (!s) return false;
    var prev = s.scores[quizId];
    if (typeof prev !== 'number' || pct > prev) s.scores[quizId] = pct;
    if (pct >= 80) s.done[quizId] = true;
    push(courseId);
    return true;
  }

  function claim(courseId) {
    var s = ensure(courseId);
    if (!s) return false;
    s.claimed = new Date().toISOString();
    push(courseId);
    return true;
  }

  function isEnrolled(courseId) {
    var s = state(courseId);
    return !!(s && s.enrolled);
  }

  return {
    ready: ready, refresh: refresh,
    signUp: signUp, logIn: logIn, logOut: logOut, current: current,
    state: state, enrol: enrol, isEnrolled: isEnrolled,
    markDone: markDone, setScore: setScore, claim: claim,

    // Kept as a boolean because the UI tests it as one. It reports whether
    // this browser allows local storage, which is what the on-screen
    // warning is about; online() is the separate question of reachability.
    available: (function () {
      try { localStorage.setItem('no.t', '1'); localStorage.removeItem('no.t'); return true; }
      catch (e) { return false; }
    }()),
    online: function () { return !!db(); }
  };
}());
