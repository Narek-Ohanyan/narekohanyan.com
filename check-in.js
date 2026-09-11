/* ═══════════════════════════════════════════════════════════════════════
   Event Check-In — guest-facing page
   ───────────────────────────────────────────────────────────────────────
   No accounts: a guest finds themself by typing their own name (a "did you
   mean" search over the confirmed Sept 12 attendee list) and gets back an
   access_key uuid for whichever row they pick — that key, not a bare row
   id, is what the check-in/out calls actually require. See
   window.NO.db.checkin* in supabase-client.js and the event_checkin_schema
   migration for what each one allows.

   Deliberately does NOT persist the selected person across a page reload:
   this can be a shared device at the door with many different guests using
   it in sequence, so every fresh load starts back at the search screen
   rather than assuming whoever last used this browser is still here.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var POLL_MS = 15000;
  var DEBOUNCE_MS = 300;
  var MIN_QUERY_LEN = 2;

  var els = {
    search: document.getElementById('ciSearch'),
    confirm: document.getElementById('ciConfirm'),
    input: document.getElementById('ciNameInput'),
    hint: document.getElementById('ciHint'),
    results: document.getElementById('ciResults'),
    backBtn: document.getElementById('ciBackBtn'),
    firstName: document.getElementById('ciFirstName'),
    lastName: document.getElementById('ciLastName'),
    fatherName: document.getElementById('ciFatherName'),
    university: document.getElementById('ciUniversity'),
    checkInBtn: document.getElementById('ciCheckInBtn'),
    waitNote: document.getElementById('ciWaitNote'),
    checkOutBtn: document.getElementById('ciCheckOutBtn'),
    doneNote: document.getElementById('ciDoneNote'),
    offline: document.getElementById('ciOffline')
  };

  function db() { return (window.NO && window.NO.db && window.NO.db.available()) ? window.NO.db : null; }

  var selectedKey = null;
  var pollTimer = null;
  var searchTimer = null;

  function showSearch() {
    stopPolling();
    selectedKey = null;
    els.confirm.hidden = true;
    els.search.hidden = false;
    els.input.value = '';
    els.results.innerHTML = '';
    els.hint.hidden = false;
    els.input.focus();
  }

  function showConfirm() {
    els.search.hidden = true;
    els.confirm.hidden = false;
  }

  /* ── search ───────────────────────────────────────────────────────── */
  els.input.addEventListener('input', function () {
    clearTimeout(searchTimer);
    var q = els.input.value.trim();
    if (q.length < MIN_QUERY_LEN) {
      els.results.innerHTML = '';
      els.hint.hidden = false;
      return;
    }
    els.hint.hidden = true;
    searchTimer = setTimeout(function () { runSearch(q); }, DEBOUNCE_MS);
  });

  function runSearch(q) {
    var d = db();
    if (!d) { els.offline.hidden = false; return; }
    els.offline.hidden = true;
    d.checkinSearch(q).then(function (res) {
      if (!res.ok) { els.offline.hidden = false; return; }
      renderResults(res.data || []);
    });
  }

  function renderResults(list) {
    els.results.innerHTML = '';
    if (!list.length) {
      var li = document.createElement('li');
      li.className = 'ci-noresult';
      li.textContent = 'Ոչինչ չգտնվեց։ Փորձիր գրել քո ազգանունը։ (No matches. Try your surname.)';
      els.results.appendChild(li);
      return;
    }
    var frag = document.createDocumentFragment();
    list.forEach(function (p) {
      var li = document.createElement('li');
      li.className = 'ci-result';

      var name = document.createElement('p');
      name.className = 'ci-result__name';
      name.textContent = p.first_name + ' ' + p.last_name + ' ' + p.father_name;

      var uni = document.createElement('p');
      uni.className = 'ci-result__uni';
      uni.textContent = p.university;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ci-btn ci-btn--sm';
      btn.innerHTML = 'Սա ես եմ <span class="ci-en">(This is me)</span>';
      btn.addEventListener('click', function () { selectPerson(p); });

      li.appendChild(name);
      li.appendChild(uni);
      li.appendChild(btn);
      frag.appendChild(li);
    });
    els.results.appendChild(frag);
  }

  function selectPerson(p) {
    selectedKey = p.access_key;
    // Fill what search already told us immediately, so the confirm screen
    // never shows a blank flash while the first status poll is in flight.
    els.firstName.textContent = p.first_name;
    els.lastName.textContent = p.last_name;
    els.fatherName.textContent = p.father_name;
    els.university.textContent = p.university;
    showConfirm();
    refreshStatus();
    startPolling();
  }

  els.backBtn.addEventListener('click', showSearch);

  /* ── state application ───────────────────────────────────────────── */
  function applyState(s) {
    els.firstName.textContent = s.first_name;
    els.lastName.textContent = s.last_name;
    els.fatherName.textContent = s.father_name;
    els.university.textContent = s.university;

    var checkedIn = !!s.checked_in;
    var checkedOut = !!s.checked_out;
    var checkoutOpen = !!s.checkout_open;

    els.checkInBtn.hidden = checkedIn;
    els.waitNote.hidden = !(checkedIn && !checkedOut && !checkoutOpen);
    els.checkOutBtn.hidden = !(checkedIn && !checkedOut && checkoutOpen);
    els.doneNote.hidden = !checkedOut;
  }

  function refreshStatus() {
    if (!selectedKey) return;
    var d = db();
    if (!d) { els.offline.hidden = false; return; }
    d.checkinStatus(selectedKey).then(function (res) {
      if (res.ok && res.data && res.data.exists) {
        els.offline.hidden = true;
        applyState(res.data);
      } else if (!res.ok) {
        els.offline.hidden = false;
      }
    });
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(refreshStatus, POLL_MS);
  }
  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  function setBusy(btn, busy) {
    btn.disabled = busy;
    btn.setAttribute('aria-busy', busy ? 'true' : 'false');
  }

  els.checkInBtn.addEventListener('click', function () {
    var d = db();
    if (!d || !selectedKey) return;
    setBusy(els.checkInBtn, true);
    d.checkinMarkIn(selectedKey).then(function (res) {
      setBusy(els.checkInBtn, false);
      if (res.ok) applyState(res.data);
      else els.offline.hidden = false;
    });
  });

  els.checkOutBtn.addEventListener('click', function () {
    var d = db();
    if (!d || !selectedKey) return;
    setBusy(els.checkOutBtn, true);
    d.checkinMarkOut(selectedKey).then(function (res) {
      setBusy(els.checkOutBtn, false);
      if (res.ok) applyState(res.data);
      else els.offline.hidden = false;
    });
  });

  /* ── boot ─────────────────────────────────────────────────────────── */
  showSearch();
}());
