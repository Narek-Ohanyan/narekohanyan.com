/* ═══════════════════════════════════════════════════════════════════════
   Weekly newsletter sign-up
   ───────────────────────────────────────────────────────────────────────
   Uses the same delivery path as the contact form, so both land in the
   same inbox once a service is wired up.

   ⚠ ENDPOINT and ACCESS_KEY must match the values at the top of
   contact.js. While they are blank, a sign-up is held in this browser
   under the shared queue key rather than sent anywhere — see the note
   the reader is shown on success. Filling in one file and not the other
   is the easy mistake here.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var ENDPOINT   = '';                        // keep in step with contact.js
  var ACCESS_KEY = '';                        // Web3Forms only
  var INBOX      = 'nar.ohanyan.eco@gmail.com';
  var QUEUE_KEY  = 'no.requests';             // same queue as the contact form

  var openBtn = document.getElementById('subOpen');
  var dlg     = document.getElementById('subDialog');
  if (!openBtn || !dlg) return;

  var form    = document.getElementById('subForm');
  var done    = document.getElementById('subDone');
  var result  = document.getElementById('subResult');
  var goBtn   = document.getElementById('subGo');
  var emailIn = document.getElementById('sub-email');
  var returnTo = null;

  /* ── open / close ───────────────────────────────────────────────── */
  function open() {
    returnTo = document.activeElement;
    form.hidden = false;
    done.hidden = true;
    result.textContent = '';
    result.className = 'subd__result';
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
    setTimeout(function () { emailIn.focus(); }, 40);
  }

  function close() {
    if (typeof dlg.close === 'function') dlg.close();
    else dlg.removeAttribute('open');
    // Focus goes back where it came from, not to the top of the page.
    if (returnTo && returnTo.focus) returnTo.focus();
  }

  openBtn.addEventListener('click', open);
  document.getElementById('subClose').addEventListener('click', close);
  document.getElementById('subDoneClose').addEventListener('click', close);
  dlg.addEventListener('cancel', function () { setTimeout(function () {
    if (returnTo && returnTo.focus) returnTo.focus();
  }, 0); });

  // Clicking the backdrop closes it; clicking inside must not.
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });

  /* ── validation ─────────────────────────────────────────────────── */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setErr(msg) {
    var el = document.getElementById('sub-email-err');
    el.textContent = msg || '';
    el.hidden = !msg;
    emailIn.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) emailIn.setAttribute('aria-describedby', 'sub-email-err');
    else emailIn.removeAttribute('aria-describedby');
  }

  function summarise(items) {
    var box = document.getElementById('subErrors');
    if (!items.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.innerHTML = '<p class="form__errors-h">Please fix the following:</p><ul>' +
      items.map(function (i) {
        return '<li><a href="#' + i.id + '">' + i.msg + '</a></li>';
      }).join('') + '</ul>';
    box.hidden = false;
    box.focus();
  }

  /* ── delivery ───────────────────────────────────────────────────── */
  function queue(payload) {
    try {
      var all = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      all.push(payload);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(all));
      return true;
    } catch (e) { return false; }
  }

  function send(payload) {
    payload.sentAt = new Date().toISOString();

    if (ENDPOINT) {
      var body = {
        kind: payload.kind,
        name: payload.name,
        email: payload.email,
        sentAt: payload.sentAt,
        subject: 'Newsletter sign-up — ' + (payload.name || payload.email),
        from_name: payload.name || 'Newsletter sign-up',
        replyto: payload.email,
        _replyto: payload.email
      };
      if (ACCESS_KEY) body.access_key = ACCESS_KEY;

      return fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body)
      }).then(function (r) {
        if (!r.ok) throw new Error('the service responded ' + r.status);
        return { stored: false };
      });
    }

    // No service configured yet: hold it locally rather than pretend.
    return Promise.resolve({ stored: true, ok: queue(payload) });
  }

  /* ── submit ─────────────────────────────────────────────────────── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // A bot that fills the hidden field gets a success screen and nothing else.
    var trap = document.getElementById('sub-gotcha');
    if (trap && trap.value) { showDone(''); return; }

    var name  = document.getElementById('sub-name').value.trim();
    var email = emailIn.value.trim();

    setErr('');
    if (!EMAIL.test(email)) {
      var msg = email ? 'That does not look like an email address.'
                      : 'Enter your email address so I know where to send it.';
      setErr(msg);
      return summarise([{ id: 'sub-email', msg: msg }]);
    }
    summarise([]);

    goBtn.disabled = true;
    goBtn.textContent = 'Subscribing…';
    result.className = 'subd__result';
    result.textContent = '';

    send({ kind: 'newsletter', name: name, email: email, inbox: INBOX })
      .then(function (r) {
        showDone(r.stored
          ? 'Your sign-up is saved in this browser. The newsletter service is not connected yet, ' +
            'so nothing has been emailed — I will add you as soon as it is live.'
          : 'A confirmation is on its way to ' + email + '.');
      })
      .catch(function (err) {
        var held = queue({ kind: 'newsletter', name: name, email: email, inbox: INBOX });
        result.className = 'subd__result is-warn';
        result.textContent = held
          ? 'Sending failed (' + err.message + '), so your sign-up is held in this browser. Try again later.'
          : 'Sending failed (' + err.message + '). Please email ' + INBOX + ' instead.';
      })
      .then(function () {
        goBtn.disabled = false;
        goBtn.innerHTML = 'Subscribe <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' +
                          '<use href="#n-arrow"/></svg>';
      });
  });

  function showDone(text) {
    document.getElementById('subDoneText').textContent = text;
    form.hidden = true;
    done.hidden = false;
    document.getElementById('subDoneClose').focus();
  }
}());
