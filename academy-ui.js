/* ═══════════════════════════════════════════════════════════════════════
   Academy — welcome gate, auth forms, dashboard
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var A = window.Academy;
  var gate = document.getElementById('gate');
  var dash = document.getElementById('dash');
  if (!A || !gate || !dash) return;

  var PER_PAGE = 6;
  var page = 1, query = '';

  /* ── catalogue source ──────────────────────────────────────────────
     One course today. Kept as a list so adding a second is data, not
     a rewrite. */
  var COURSES = window.COURSE ? [window.COURSE] : [];

  /* ── shell ─────────────────────────────────────────────────────── */
  function unitTotal(c) {
    var n = 2;                                   // course intro + outro
    c.modules.forEach(function (m) { n += m.units.length; });
    return n + 1;                                // + final exam
  }

  function completed(c) {
    var s = A.state(c.id);
    if (!s) return 0;
    return Object.keys(s.done).filter(function (k) { return s.done[k]; }).length;
  }

  function pct(c) {
    var t = unitTotal(c);
    return t ? Math.min(100, Math.round(completed(c) / t * 100)) : 0;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function cardHTML(c, enrolled) {
    var p = enrolled ? pct(c) : 0;
    return '' +
      '<article class="ccard">' +
        '<a class="ccard__shot" href="course.html" aria-label="' + esc(c.title) + '">' +
          '<img src="' + c.cover + '" alt="' + esc(c.coverAlt) + '" width="1200" height="675" loading="lazy" decoding="async">' +
          '<span class="ccard__price">' + esc(c.price) + '</span>' +
        '</a>' +
        '<div class="ccard__body">' +
          '<p class="ccard__meta">' + esc(c.level) + ' <span aria-hidden="true">·</span> ' + esc(c.format) + '</p>' +
          '<h3 class="ccard__title"><a href="course.html">' + esc(c.title) + '</a></h3>' +
          '<p class="ccard__text">' + esc(c.tagline) + '</p>' +
          '<ul class="ccard__tags" role="list">' +
            '<li>Sign language</li><li>HY &amp; EN subtitles</li><li>Certificate</li>' +
          '</ul>' +
          (enrolled
            ? '<div class="ccard__prog"><div class="bar"><span style="width:' + p + '%"></span></div>' +
              '<p class="bar__label">' + p + '% complete</p></div>' +
              '<a class="btn btn--leaf ccard__cta" href="course.html">' +
              (p > 0 ? 'Continue' : 'Start course') +
              ' <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#a-arrow"/></svg></a>'
            : '<button class="btn btn--leaf ccard__cta" type="button" data-enrol="' + c.id + '">Enrol &mdash; free' +
              ' <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#a-arrow"/></svg></button>') +
        '</div>' +
      '</article>';
  }

  /* ── dashboard render ──────────────────────────────────────────── */
  function renderDash() {
    var u = A.current();
    if (!u) return;

    document.getElementById('whoName').textContent = u.name;
    document.getElementById('whoEmail').textContent = u.email;
    document.getElementById('whoInitials').textContent =
      u.name.split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join('');

    var mine = COURSES.filter(function (c) { return A.isEnrolled(c.id); });
    var mineBox = document.getElementById('mine');
    mineBox.innerHTML = mine.map(function (c) { return cardHTML(c, true); }).join('');
    document.getElementById('mineEmpty').hidden = mine.length > 0;

    // catalogue: search + page
    var q = query.trim().toLowerCase();
    var found = COURSES.filter(function (c) {
      if (!q) return true;
      return (c.title + ' ' + c.tagline + ' ' + c.blurb + ' ' + c.level).toLowerCase().indexOf(q) > -1;
    });

    var pages = Math.max(1, Math.ceil(found.length / PER_PAGE));
    if (page > pages) page = pages;
    var slice = found.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    var cat = document.getElementById('catalogue');
    cat.innerHTML = slice.map(function (c) { return cardHTML(c, A.isEnrolled(c.id)); }).join('');

    var empty = document.getElementById('catEmpty');
    empty.hidden = found.length > 0;
    if (!found.length) empty.textContent = 'No course matches “' + query + '”.';

    var pager = document.getElementById('pager');
    pager.hidden = pages < 2;
    document.getElementById('pageAt').textContent = 'Page ' + page + ' of ' + pages;
    document.getElementById('prev').disabled = page === 1;
    document.getElementById('next').disabled = page === pages;

    document.getElementById('catStatus').textContent =
      found.length + (found.length === 1 ? ' course' : ' courses') +
      (q ? ' matching “' + query + '”' : ' available') + '.';
  }

  function show() {
    var u = A.current();
    gate.hidden = !!u;
    dash.hidden = !u;
    if (u) renderDash();
  }

  /* ── auth tabs ─────────────────────────────────────────────────── */
  var tabLogin  = document.getElementById('tabLogin');
  var tabSignup = document.getElementById('tabSignup');
  var paneLogin  = document.getElementById('paneLogin');
  var paneSignup = document.getElementById('paneSignup');

  function pickTab(login) {
    tabLogin.classList.toggle('is-on', login);
    tabSignup.classList.toggle('is-on', !login);
    tabLogin.setAttribute('aria-selected', login ? 'true' : 'false');
    tabSignup.setAttribute('aria-selected', login ? 'false' : 'true');
    paneLogin.hidden = !login;
    paneSignup.hidden = login;
  }
  tabLogin.addEventListener('click', function () { pickTab(true); });
  tabSignup.addEventListener('click', function () { pickTab(false); });

  // show/hide password
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-peek]') : null;
    if (!b) return;
    var input = document.getElementById(b.getAttribute('data-peek'));
    var showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    b.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    b.querySelector('use').setAttribute('href', showing ? '#a-eye' : '#a-eye-off');
  });

  /* ── validation ────────────────────────────────────────────────── */
  function setErr(id, msg) {
    var el = document.getElementById(id + '-err');
    var input = document.getElementById(id);
    if (!el) return;
    el.textContent = msg || '';
    el.hidden = !msg;
    if (input) {
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) input.setAttribute('aria-describedby', id + '-err');
      else input.removeAttribute('aria-describedby');
    }
  }

  /** Errors stay inline on the field AND are summarised at the top, with
      the summary taking focus so a screen reader hears the whole list. */
  function summarise(boxId, items) {
    var box = document.getElementById(boxId);
    if (!items.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.innerHTML = '<p class="form__errors-h">Please fix the following:</p><ul>' +
      items.map(function (i) {
        return '<li><a href="#' + i.id + '">' + esc(i.msg) + '</a></li>';
      }).join('') + '</ul>';
    box.hidden = false;
    box.focus();
  }

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  paneLogin.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('li-email').value.trim();
    var pw    = document.getElementById('li-pw').value;
    var bad = [];
    setErr('li-email', ''); setErr('li-pw', '');

    if (!EMAIL.test(email)) { setErr('li-email', 'Enter a valid email address.'); bad.push({ id: 'li-email', msg: 'Enter a valid email address.' }); }
    if (!pw) { setErr('li-pw', 'Enter your password.'); bad.push({ id: 'li-pw', msg: 'Enter your password.' }); }
    if (bad.length) return summarise('loginErrors', bad);

    A.logIn(email, pw).then(show).catch(function (err) {
      summarise('loginErrors', [{ id: 'li-email', msg: err.message }]);
    });
  });

  paneSignup.addEventListener('submit', function (e) {
    e.preventDefault();
    var name  = document.getElementById('su-name').value.trim();
    var email = document.getElementById('su-email').value.trim();
    var pw    = document.getElementById('su-pw').value;
    var pw2   = document.getElementById('su-pw2').value;
    var news  = document.getElementById('su-news').checked;
    var bad = [];
    ['su-name', 'su-email', 'su-pw', 'su-pw2'].forEach(function (i) { setErr(i, ''); });

    function fail(id, msg) { setErr(id, msg); bad.push({ id: id, msg: msg }); }

    if (name.length < 2) fail('su-name', 'Enter your full name — it goes on your certificate.');
    if (!EMAIL.test(email)) fail('su-email', 'Enter a valid email address.');
    if (pw.length < 8) fail('su-pw', 'Use at least 8 characters.');
    if (pw !== pw2) fail('su-pw2', 'The two passwords do not match.');
    if (bad.length) return summarise('signupErrors', bad);

    A.signUp(name, email, pw, news).then(function (res) {
      if (res && res.pending) {
        // The project requires confirmation: the account exists but there
        // is no session, so say so rather than dropping them at a gate
        // that looks like the sign-up simply failed.
        var note = document.getElementById('authNote');
        note.textContent = 'Almost there — check ' + res.email + ' for a confirmation link, ' +
                           'then come back and sign in.';
        note.hidden = false;
        paneSignup.reset();
        tabLogin.click();
        return;
      }
      show();
    }).catch(function (err) {
      summarise('signupErrors', [{ id: 'su-email', msg: err.message }]);
    });
  });

  /* ── dashboard events ──────────────────────────────────────────── */
  document.getElementById('logout').addEventListener('click', function () {
    Promise.resolve(A.logOut()).then(function () {
      page = 1; query = ''; document.getElementById('q').value = ''; show();
    });
  });

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-enrol]') : null;
    if (!b) return;
    A.enrol(b.getAttribute('data-enrol'));
    renderDash();
  });

  var qBox = document.getElementById('q');
  var t = 0;
  qBox.addEventListener('input', function () {
    clearTimeout(t);
    t = setTimeout(function () { query = qBox.value; page = 1; renderDash(); }, 200);
  });

  document.getElementById('prev').addEventListener('click', function () { if (page > 1) { page--; renderDash(); } });
  document.getElementById('next').addEventListener('click', function () { page++; renderDash(); });

  /* ── storage warning ───────────────────────────────────────────── */
  if (!A.available) {
    var note = document.getElementById('authNote');
    note.textContent = 'This browser is blocking local storage, so an account cannot be saved here. ' +
                       'Private or incognito windows usually cause this.';
    note.hidden = false;
  }

  /* Render only once any stored session has been restored — otherwise a
     returning learner sees the signed-out gate flash before their
     dashboard replaces it. */
  if (A.ready) {
    A.ready().then(show, show);
  } else {
    show();
  }
}());
