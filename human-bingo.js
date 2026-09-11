/* ═══════════════════════════════════════════════════════════════════════
   Human Bingo — player page
   ───────────────────────────────────────────────────────────────────────
   No accounts: a player is identified by client_key, an unguessable uuid
   the database hands back on join and this page keeps in localStorage.
   Every read and write goes through a checked Supabase RPC function — see
   window.NO.db.bingo* in supabase-client.js and the human_bingo migration
   for what each one actually allows.

   State machine, driven by round_status from the server plus whether this
   browser has completed its own card:
     join        no client_key yet, or the server no longer recognises one
                 (an admin reset wiped it) → show the name form
     wait        joined, round_status is 'idle'                → waiting room
     grid        joined, round_status is 'active', not completed → the card
     won         completed, and this player is the round's winner
     lost        completed, but someone else already won
   A short poll (not push) keeps this in step with the admin's Start/Reset —
   simple, robust, and a 2.5s worst-case delay is invisible at a live event.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var KEY_STORE = 'no.bingo.clientKey';
  var POLL_MS = 2500;

  var PROMPTS = [
    { t: 'սիրում է արշավների գնալ (likes hiking)',                                    c: 'p' },
    { t: 'ձախլիկ է (is left-handed)',                                                 c: 'r' },
    { t: 'երբևէ ինքնաթիռով չի թռչել (has never flown)',                               c: 't' },
    { t: 'ընտանի կենդանի ունի (has a pet)',                                           c: 'g' },
    { t: 'տիրապետում է 3-ից ավելի լեզուների (speaks 3+ languages)',                    c: 'c' },
    { t: 'թեյ է սիրում (likes tea)',                                                   c: 't' },
    { t: 'կարող է հայկական ազգային ուտեստ պատրաստել (can cook an Armenian dish)',      c: 'p' },
    { t: '«բու» է (ուշ է քնում) (is a night owl)',                                     c: 'r' },
    { t: 'այս տարի 5-ից ավելի գիրք է կարդացել (read 5+ books this year)',              c: 'r' },
    { t: 'երաժշտական գործիք է նվագում (plays an instrument)',                          c: 'g' },
    { t: 'ում սիրելի գույնը համընկնում է քոնին (favorite color matches yours)',        c: 'c' },
    { t: 'աշխատում կամ սովորում է ՏՏ ոլորտում (works/studies in IT)',                  c: 't' },
    { t: 'ծնվել է քեզ հետ նույն ամսին (born in your birth month)',                      c: 't' },
    { t: 'ճամփորդել է Հայաստանից դուրս (traveled abroad)',                             c: 'p' },
    { t: 'հանդիպել է հայտնի մարդու (met a celebrity)',                                 c: 'g' },
    { t: 'ապրել է այլ երկրում (lived in another country)',                             c: 'r' }
  ];

  var panels = {
    join: document.getElementById('hbJoin'),
    wait: document.getElementById('hbWait'),
    gone: document.getElementById('hbGone'),
    lost: document.getElementById('hbLost'),
    won:  document.getElementById('hbWon'),
    grid: document.getElementById('hbGrid')
  };

  function db() { return (window.NO && window.NO.db && window.NO.db.available()) ? window.NO.db : null; }

  function storedKey() {
    try { return localStorage.getItem(KEY_STORE) || null; } catch (e) { return null; }
  }
  function storeKey(k) {
    try { localStorage.setItem(KEY_STORE, k); } catch (e) { /* private browsing — still works this tab */ }
  }
  function clearKey() {
    try { localStorage.removeItem(KEY_STORE); } catch (e) {}
  }

  var clientKey = storedKey();
  var lastAnswers = {};
  var pollTimer = null;
  var cellsBuilt = false;

  function showOnly(name) {
    Object.keys(panels).forEach(function (k) {
      if (panels[k]) panels[k].hidden = (k !== name);
    });
  }

  /* ── the card ─────────────────────────────────────────────────────── */
  function buildCells() {
    var ul = document.getElementById('hbCells');
    var frag = document.createDocumentFragment();
    PROMPTS.forEach(function (p, i) {
      var li = document.createElement('li');
      li.className = 'hb-cell hb-c-' + p.c + '-card';
      li.setAttribute('data-i', i);

      var field = document.createElement('p');
      field.className = 'hb-cell__text';
      field.textContent = p.t;
      li.appendChild(field);

      var wrap = document.createElement('div');
      wrap.className = 'hb-cell__inputwrap';

      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'hb-cell__input';
      input.maxLength = 100;
      input.autocomplete = 'off';
      input.setAttribute('aria-label', p.t);
      input.setAttribute('data-i', i);
      wrap.appendChild(input);

      var check = document.createElement('svg');
      check.setAttribute('class', 'hb-cell__check');
      check.setAttribute('viewBox', '0 0 24 24');
      check.setAttribute('aria-hidden', 'true');
      check.innerHTML = '<use href="#hb-check"></use>';
      wrap.appendChild(check);

      li.appendChild(wrap);
      frag.appendChild(li);
    });
    ul.appendChild(frag);
    cellsBuilt = true;

    var saveTimers = {};
    ul.addEventListener('input', function (e) {
      var input = e.target.closest('.hb-cell__input');
      if (!input) return;
      var i = input.getAttribute('data-i');
      var li = input.closest('.hb-cell');
      li.classList.toggle('is-filled', input.value.trim().length > 0);

      clearTimeout(saveTimers[i]);
      saveTimers[i] = setTimeout(function () { saveCell(Number(i), input.value); }, 500);
    });
    ul.addEventListener('blur', function (e) {
      var input = e.target.closest('.hb-cell__input');
      if (!input) return;
      var i = input.getAttribute('data-i');
      clearTimeout(saveTimers[i]);
      saveCell(Number(i), input.value);
    }, true);
  }

  function fillCellsFrom(answers) {
    lastAnswers = answers || {};
    var inputs = document.querySelectorAll('.hb-cell__input');
    var filled = 0;
    inputs.forEach(function (input) {
      var v = lastAnswers[input.getAttribute('data-i')] || '';
      if (document.activeElement !== input) input.value = v;
      var has = v.trim().length > 0;
      input.closest('.hb-cell').classList.toggle('is-filled', has);
      if (has) filled++;
    });
    document.getElementById('hbFilledN').textContent = filled;
    document.getElementById('hbProgressFill').style.width = (filled / 16 * 100) + '%';
  }

  function saveCell(index, value) {
    var d = db();
    if (!d || !clientKey) return;
    d.bingoSaveSquare(clientKey, index, value).then(function (res) {
      if (!res.ok || !res.data) return;
      applyState(res.data);
    });
  }

  /* ── state application ───────────────────────────────────────────── */
  function applyState(state) {
    if (!state || state.exists === false) {
      clearKey();
      clientKey = null;
      stopPolling();
      showOnly('gone');
      return;
    }

    document.getElementById('hbPlayerName').textContent = state.name || '';
    document.getElementById('hbWaitName').textContent = state.name || '';

    if (state.completed) {
      if (state.is_winner) {
        showOnly('won');
      } else {
        document.getElementById('hbWinnerName').textContent = state.winner_name || 'Ինչ-որ մեկը';
        showOnly('lost');
      }
      return;
    }

    // 'finished' still shows the grid: someone else winning the race
    // doesn't stop everyone else from finishing their own card, and the
    // completed-check above already sent this player to won/lost the
    // moment their OWN card is done. Only 'idle' is the waiting room.
    if (state.round_status === 'active' || state.round_status === 'finished') {
      if (!cellsBuilt) buildCells();
      fillCellsFrom(state.answers || {});
      showOnly('grid');
    } else {
      showOnly('wait');
    }
  }

  function poll() {
    var d = db();
    if (!d || !clientKey) return;
    d.bingoPlayerState(clientKey).then(function (res) {
      if (res.ok) applyState(res.data);
    });
  }

  function startPolling() {
    stopPolling();
    poll();
    pollTimer = setInterval(poll, POLL_MS);
  }
  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  /* ── join ─────────────────────────────────────────────────────────── */
  var joinForm = document.getElementById('hbJoinForm');
  var nameInput = document.getElementById('hbName');
  var nameErr = document.getElementById('hbNameErr');
  var joinGo = document.getElementById('hbJoinGo');

  function setJoinBusy(busy) {
    joinGo.disabled = busy;
    joinGo.setAttribute('aria-busy', busy ? 'true' : 'false');
  }

  function doJoin(name) {
    var d = db();
    if (!d) { nameErr.textContent = 'Հասանելի չէ խաղի հետ կապ հաստատելը. թարմացրու էջը։'; nameErr.hidden = false; return; }
    setJoinBusy(true);
    d.bingoJoin(name).then(function (res) {
      setJoinBusy(false);
      if (!res.ok || !res.data || !res.data.client_key) {
        nameErr.textContent = 'Չհաջողվեց միանալ։ Փորձիր կրկին։';
        nameErr.hidden = false;
        return;
      }
      clientKey = res.data.client_key;
      storeKey(clientKey);
      nameErr.hidden = true;
      applyState(res.data);
      startPolling();
    });
  }

  joinForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = nameInput.value.trim();
    if (!name) {
      nameErr.textContent = 'Մուտքագրիր քո անունը։';
      nameErr.hidden = false;
      nameInput.focus();
      return;
    }
    doJoin(name);
  });

  document.getElementById('hbGoneRejoin').addEventListener('click', function () {
    showOnly('join');
    nameInput.value = '';
    nameInput.focus();
  });

  /* ── boot ─────────────────────────────────────────────────────────── */
  if (clientKey) {
    showOnly('wait');
    startPolling();
  } else {
    showOnly('join');
  }
}());
