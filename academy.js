/* ═══════════════════════════════════════════════════════════════════════
   Online Green Academy — accounts and progress
   ───────────────────────────────────────────────────────────────────────
   ⚠ READ THIS BEFORE RELYING ON IT.

   This site is static: there is no server, no database, no session. Every
   account and every score below lives in localStorage, in one browser, on
   one device. That means:

     · a learner who switches browser or clears data loses their progress
     · nothing is shared between devices
     · anyone can open devtools and mark themselves complete

   Passwords are salted and hashed with SHA-256 rather than stored in the
   clear, but that is damage limitation, not security — the check happens
   on the same machine as the data. Treat this as a working prototype of
   the flow, not as real authentication. Wiring it to a backend (or to a
   hosted LMS) is what makes it real; the shape of the data here is
   deliberately close to what such a backend would store.
   ═══════════════════════════════════════════════════════════════════════ */

window.Academy = (function () {
  'use strict';

  var KEY = 'no.academy.v1';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function save(db) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
    catch (e) { return false; }          // private mode, or quota
  }
  function db() {
    var d = load();
    d.users = d.users || {};
    d.progress = d.progress || {};
    return d;
  }

  // ── password hashing ────────────────────────────────────────────────
  function randomSalt() {
    var a = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('');
  }

  function hash(pw, salt) {
    var enc = new TextEncoder().encode(salt + '::' + pw);
    return crypto.subtle.digest('SHA-256', enc).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
    });
  }

  // ── accounts ────────────────────────────────────────────────────────
  function normalise(email) { return String(email || '').trim().toLowerCase(); }

  function signUp(name, email, pw, newsletter) {
    var d = db();
    var id = normalise(email);
    if (d.users[id]) return Promise.reject(new Error('An account already exists for that email address.'));
    var salt = randomSalt();
    return hash(pw, salt).then(function (h) {
      d.users[id] = {
        name: String(name).trim(),
        email: id,
        salt: salt,
        hash: h,
        newsletter: !!newsletter,
        joined: new Date().toISOString()
      };
      d.session = id;
      if (!save(d)) throw new Error('Your browser is blocking local storage, so the account could not be saved. Private browsing usually causes this.');
      return d.users[id];
    });
  }

  function logIn(email, pw) {
    var d = db();
    var u = d.users[normalise(email)];
    // Same message either way: not saying which half was wrong.
    var wrong = new Error('That email and password combination does not match an account.');
    if (!u) return Promise.reject(wrong);
    return hash(pw, u.salt).then(function (h) {
      if (h !== u.hash) throw wrong;
      d.session = u.email;
      save(d);
      return u;
    });
  }

  function logOut() { var d = db(); delete d.session; save(d); }

  function current() {
    var d = db();
    return d.session ? d.users[d.session] || null : null;
  }

  // ── progress ────────────────────────────────────────────────────────
  function record(courseId) {
    var d = db(), u = d.session;
    if (!u) return null;
    d.progress[u] = d.progress[u] || {};
    d.progress[u][courseId] = d.progress[u][courseId] ||
      { enrolled: false, done: {}, scores: {}, claimed: false, started: null };
    return d;
  }

  function state(courseId) {
    var d = record(courseId);
    if (!d) return null;
    return d.progress[d.session][courseId];
  }

  function enrol(courseId) {
    var d = record(courseId);
    if (!d) return false;
    var s = d.progress[d.session][courseId];
    s.enrolled = true;
    s.started = s.started || new Date().toISOString();
    return save(d);
  }

  function markDone(courseId, unitId) {
    var d = record(courseId);
    if (!d) return false;
    d.progress[d.session][courseId].done[unitId] = true;
    return save(d);
  }

  /** Keeps the best score only — a retake can raise a mark, never lower it. */
  function setScore(courseId, quizId, pct) {
    var d = record(courseId);
    if (!d) return false;
    var s = d.progress[d.session][courseId];
    var prev = s.scores[quizId];
    if (typeof prev !== 'number' || pct > prev) s.scores[quizId] = pct;
    if (pct >= 80) s.done[quizId] = true;
    return save(d);
  }

  function claim(courseId) {
    var d = record(courseId);
    if (!d) return false;
    d.progress[d.session][courseId].claimed = new Date().toISOString();
    return save(d);
  }

  function isEnrolled(courseId) {
    var s = state(courseId);
    return !!(s && s.enrolled);
  }

  return {
    signUp: signUp, logIn: logIn, logOut: logOut, current: current,
    state: state, enrol: enrol, isEnrolled: isEnrolled,
    markDone: markDone, setScore: setScore, claim: claim,
    available: (function () {
      try { localStorage.setItem('no.t', '1'); localStorage.removeItem('no.t'); return true; }
      catch (e) { return false; }
    }())
  };
}());
