/* ═══════════════════════════════════════════════════════════════════════
   Event Check-In — admin dashboard
   ───────────────────────────────────────────────────────────────────────
   Real password auth, unlike every other function-gated table on this
   site: this one holds 290 real people's names and live location status,
   not an ephemeral party game, and the user explicitly asked for a
   password gate here. checkin_admin_login() verifies against a pgcrypto
   hash and hands back a session token; that token, kept in sessionStorage
   (not localStorage, so it does not outlive the tab), is what every other
   admin call requires. See supabase-client.js and the event_checkin_schema
   migration for exactly what each function checks.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var POLL_MS = 7000;
  var CONFIRM_MS = 4000;
  var TOKEN_KEY = 'no.checkin.adminToken';

  var els = {
    login: document.getElementById('ciaLogin'),
    dash: document.getElementById('ciaDash'),
    password: document.getElementById('ciaPassword'),
    loginErr: document.getElementById('ciaLoginErr'),
    loginBtn: document.getElementById('ciaLoginBtn'),
    total: document.getElementById('ciaTotal'),
    inCount: document.getElementById('ciaInCount'),
    outCount: document.getElementById('ciaOutCount'),
    filter: document.getElementById('ciaFilter'),
    openCheckoutBtn: document.getElementById('ciaOpenCheckoutBtn'),
    openCheckoutLbl: document.getElementById('ciaOpenCheckoutLbl'),
    tbody: document.getElementById('ciaTbody'),
    offline: document.getElementById('ciaOffline')
  };

  function db() { return (window.NO && window.NO.db && window.NO.db.available()) ? window.NO.db : null; }

  function token() { try { return sessionStorage.getItem(TOKEN_KEY); } catch (e) { return null; } }
  function setToken(t) { try { sessionStorage.setItem(TOKEN_KEY, t); } catch (e) {} }
  function clearToken() { try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {} }

  var currentRows = [];
  var pollTimer = null;

  function showLogin() {
    stopPolling();
    els.dash.hidden = true;
    els.login.hidden = false;
  }
  function showDash() {
    els.login.hidden = true;
    els.dash.hidden = false;
  }

  /* ── login ────────────────────────────────────────────────────────── */
  function attemptLogin(password) {
    var d = db();
    if (!d) { els.offline.hidden = false; return; }
    els.loginBtn.disabled = true;
    d.checkinAdminLogin(password).then(function (res) {
      els.loginBtn.disabled = false;
      if (res.ok && res.data && res.data.ok) {
        setToken(res.data.token);
        els.loginErr.hidden = true;
        els.password.value = '';
        showDash();
        loadList();
        startPolling();
      } else {
        els.loginErr.hidden = false;
      }
    });
  }

  els.loginBtn.addEventListener('click', function () { attemptLogin(els.password.value); });
  els.password.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') attemptLogin(els.password.value);
  });

  /* ── list + render ────────────────────────────────────────────────── */
  function fmtTime(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleTimeString('hy-AM', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Yerevan'
      });
    } catch (e) { return iso; }
  }

  function loadList() {
    var t = token();
    var d = db();
    if (!d || !t) return;
    d.checkinAdminList(t).then(function (res) {
      if (!res.ok) {
        // A stale or expired token: fall back to the login screen rather
        // than leave the dashboard silently frozen.
        clearToken();
        showLogin();
        return;
      }
      els.offline.hidden = true;
      currentRows = res.data || [];
      renderStats();
      renderTable();
    });
  }

  function renderStats() {
    els.total.textContent = currentRows.length;
    els.inCount.textContent = currentRows.filter(function (r) { return !!r.checked_in_at; }).length;
    els.outCount.textContent = currentRows.filter(function (r) { return !!r.checked_out_at; }).length;
  }

  function renderTable() {
    var q = els.filter.value.trim().toLowerCase();
    var rows = !q ? currentRows : currentRows.filter(function (r) {
      return (r.first_name + ' ' + r.last_name + ' ' + r.father_name + ' ' + r.university)
        .toLowerCase().indexOf(q) !== -1;
    });

    els.tbody.innerHTML = '';
    var frag = document.createDocumentFragment();
    rows.forEach(function (r) {
      var tr = document.createElement('tr');
      if (r.is_test) tr.className = 'cia-row--test';

      [r.first_name, r.last_name, r.father_name, r.university].forEach(function (v) {
        var td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });

      var inTd = document.createElement('td');
      inTd.className = r.checked_in_at ? 'cia-cell--yes' : 'cia-cell--no';
      inTd.textContent = fmtTime(r.checked_in_at);
      tr.appendChild(inTd);

      var outTd = document.createElement('td');
      outTd.className = r.checked_out_at ? 'cia-cell--yes' : 'cia-cell--no';
      outTd.textContent = fmtTime(r.checked_out_at);
      tr.appendChild(outTd);

      var actionTd = document.createElement('td');
      if (r.checked_in_at || r.checked_out_at) {
        var resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'cia-reset-btn';
        resetBtn.textContent = 'Զրոյացնել';
        // Two-step confirm, same idiom as the "open check-out now" button
        // below -- not window.confirm(), which does not fire reliably in
        // every mobile browser this could be run from at the door.
        var rowArmed = false, rowArmTimer = null;
        resetBtn.addEventListener('click', function () {
          if (!rowArmed) {
            rowArmed = true;
            resetBtn.textContent = 'Հաստատե՞լ';
            resetBtn.classList.add('is-armed');
            rowArmTimer = setTimeout(function () {
              rowArmed = false;
              resetBtn.textContent = 'Զրոյացնել';
              resetBtn.classList.remove('is-armed');
            }, CONFIRM_MS);
            return;
          }
          clearTimeout(rowArmTimer);
          resetAttendee(r.id);
        });
        actionTd.appendChild(resetBtn);
      }
      tr.appendChild(actionTd);

      frag.appendChild(tr);
    });
    els.tbody.appendChild(frag);
  }

  els.filter.addEventListener('input', renderTable);

  function resetAttendee(id) {
    var t = token();
    var d = db();
    if (!d || !t) return;
    d.checkinAdminReset(t, id).then(function (res) {
      if (res.ok) {
        currentRows = res.data || [];
        renderStats();
        renderTable();
      }
    });
  }

  function poll() { loadList(); }
  function startPolling() {
    stopPolling();
    pollTimer = setInterval(poll, POLL_MS);
  }
  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  /* ── manual "open check-out now" override, two-step confirm ─────────
     Same idiom as Human Bingo's Reset button: a single accidental tap
     shouldn't pull the check-out window open early for everyone. */
  var armed = false, armTimer = null;

  function disarm() {
    armed = false;
    clearTimeout(armTimer);
    els.openCheckoutLbl.innerHTML = 'Բացել Ելքը հիմա <span class="ci-en">(Open check-out now)</span>';
    els.openCheckoutBtn.classList.remove('is-armed');
  }

  els.openCheckoutBtn.addEventListener('click', function () {
    if (!armed) {
      armed = true;
      els.openCheckoutLbl.innerHTML = 'Վստա՞հ ես: Սեղմիր կրկին <span class="ci-en">(Sure? Click again)</span>';
      els.openCheckoutBtn.classList.add('is-armed');
      armTimer = setTimeout(disarm, CONFIRM_MS);
      return;
    }
    disarm();
    var t = token();
    var d = db();
    if (!d || !t) return;
    d.checkinAdminOpenCheckoutNow(t).then(function () { loadList(); });
  });

  /* ── boot ─────────────────────────────────────────────────────────── */
  if (token()) {
    showDash();
    loadList();
    startPolling();
  } else {
    showLogin();
  }
}());
