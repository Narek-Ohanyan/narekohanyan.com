/* ═══════════════════════════════════════════════════════════════════════
   Human Bingo — host / display screen
   ───────────────────────────────────────────────────────────────────────
   Deliberately unauthenticated, matching this project's "no auth for now"
   posture everywhere else: whoever has this link runs the room. It shows
   nothing sensitive — aggregate counts always, and once the round is
   finished, the winner's own name and their 16 answers, so the host can
   read the card out. Never any OTHER player's answers.

   A short poll (2s) is what makes the BINGO screen appear on its own the
   moment someone finishes, with no refresh, which is the whole point of
   using this as a live projector screen.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var POLL_MS = 2000;
  var RESET_CONFIRM_MS = 4000;

  // Same 16 prompts and colour coding as the player card in human-bingo.js
  // — static per-event content, not shared state, so it lives with each
  // page that displays it rather than round-tripping through the database.
  var PROMPTS = [
    { t: 'սիրում է արշավների գնալ',                             c: 'p' },
    { t: 'ձախլիկ է',                                            c: 'r' },
    { t: 'երբևէ ինքնաթիռով չի թռչել',                            c: 't' },
    { t: 'ընտանի կենդանի ունի',                                  c: 'g' },
    { t: 'տիրապետում է 3-ից ավելի լեզուների',                    c: 'c' },
    { t: 'թեյ է սիրում',                                        c: 't' },
    { t: 'կարող է հայկական ազգային ուտեստ պատրաստել',           c: 'p' },
    { t: '«բու» է (ուշ է քնում)',                               c: 'r' },
    { t: 'այս տարի 5-ից ավելի գիրք է կարդացել',                  c: 'r' },
    { t: 'երաժշտական գործիք է նվագում',                          c: 'g' },
    { t: 'ում սիրելի գույնը համընկնում է քոնին',                 c: 'c' },
    { t: 'աշխատում կամ սովորում է ՏՏ ոլորտում',                  c: 't' },
    { t: 'ծնվել է քեզ հետ նույն ամսին',                          c: 't' },
    { t: 'ճամփորդել է Հայաստանից դուրս',                         c: 'p' },
    { t: 'հանդիպել է հայտնի մարդու',                             c: 'g' },
    { t: 'ապրել է այլ երկրում',                                  c: 'r' }
  ];

  var states = {
    idle:     document.getElementById('hbaIdle'),
    active:   document.getElementById('hbaActive'),
    finished: document.getElementById('hbaFinished')
  };
  var offlineNote = document.getElementById('hbaOffline');
  var startBtn = document.getElementById('hbaStartBtn');
  var resetBtn = document.getElementById('hbaResetBtn');
  var resetLbl = document.getElementById('hbaResetLbl');
  var winnerAnswers = document.getElementById('hbaWinnerAnswers');
  var renderedWinnerFor = null; // avoids rebuilding the list every 2s poll

  function db() { return (window.NO && window.NO.db && window.NO.db.available()) ? window.NO.db : null; }

  function showOnly(name) {
    Object.keys(states).forEach(function (k) {
      if (states[k]) states[k].hidden = (k !== name);
    });
  }

  var lastStatus = null;

  function render(state) {
    if (!state) return;
    offlineNote.hidden = true;

    // Armenian keeps the noun singular after any numeral ("1 խաղացող",
    // "3 խաղացող"), so there is no count-dependent wording to branch on here.
    var count = state.player_count || 0;
    document.getElementById('hbaIdleCount').textContent = count > 0
      ? (count + ' խաղացող արդեն միացել է')
      : 'Սպասում ենք խաղացողների…';
    document.getElementById('hbaPlayerCount').textContent = count;
    document.getElementById('hbaCompletedCount').textContent = state.completed_count || 0;

    if (state.status === 'finished' && state.winner_name) {
      document.getElementById('hbaWinnerName').textContent = state.winner_name;
      // Rebuilding a 16-item list on every 2s poll tick would be wasteful
      // and could flicker; a round has exactly one winner, so once this
      // screen has been built for them there is nothing left to update.
      if (renderedWinnerFor !== state.winner_name) {
        renderWinnerAnswers(state.winner_answers || {});
        renderedWinnerFor = state.winner_name;
      }
      showOnly('finished');
    } else if (state.status === 'active') {
      showOnly('active');
    } else {
      showOnly('idle');
    }

    // A fresh finish deserves a moment of full attention rather than being
    // one more silent poll tick — a brief flash on the state that just
    // became true, respecting reduced motion.
    if (state.status === 'finished' && lastStatus !== 'finished') {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduce) {
        states.finished.classList.remove('hba-flash');
        // Force reflow so the animation can restart if it somehow fires twice.
        void states.finished.offsetWidth;
        states.finished.classList.add('hba-flash');
      }
    }
    lastStatus = state.status;
  }

  /** Builds the "prompt → what they wrote" list for the winner's card. */
  function renderWinnerAnswers(answers) {
    winnerAnswers.innerHTML = '';
    var frag = document.createDocumentFragment();
    PROMPTS.forEach(function (p, i) {
      var value = answers[String(i)];
      if (!value || !String(value).trim()) return; // defensive: a winner has all 16, but never render a blank
      var li = document.createElement('li');
      li.className = 'hba-answer hba-a-' + p.c;
      var prompt = document.createElement('p');
      prompt.className = 'hba-answer__prompt';
      prompt.textContent = p.t;
      var name = document.createElement('p');
      name.className = 'hba-answer__name';
      name.textContent = value;
      li.appendChild(prompt);
      li.appendChild(name);
      frag.appendChild(li);
    });
    winnerAnswers.appendChild(frag);
  }

  function poll() {
    var d = db();
    if (!d) { offlineNote.hidden = false; return; }
    d.bingoAdminState().then(function (res) {
      if (res.ok) render(res.data);
      else offlineNote.hidden = false;
    });
  }

  setInterval(poll, POLL_MS);
  poll();

  /* ── controls ─────────────────────────────────────────────────────── */
  function setBusy(btn, busy) {
    btn.disabled = busy;
    btn.setAttribute('aria-busy', busy ? 'true' : 'false');
  }

  startBtn.addEventListener('click', function () {
    var d = db();
    if (!d) return;
    setBusy(startBtn, true);
    d.bingoAdminStart().then(function (res) {
      setBusy(startBtn, false);
      if (res.ok) render(res.data);
    });
  });

  // Two-step confirm rather than a native confirm() dialog: click once to
  // arm it, click again within a few seconds to actually wipe every
  // player's card, or let it quietly revert if the host changes their mind.
  var armed = false, armTimer = null;

  function disarm() {
    armed = false;
    clearTimeout(armTimer);
    resetLbl.textContent = 'Զրոյացնել խաղը';
    resetBtn.classList.remove('is-armed');
  }

  resetBtn.addEventListener('click', function () {
    if (!armed) {
      armed = true;
      resetLbl.textContent = 'Վստա՞հ ես: Սեղմիր կրկին';
      resetBtn.classList.add('is-armed');
      armTimer = setTimeout(disarm, RESET_CONFIRM_MS);
      return;
    }

    disarm();
    var d = db();
    if (!d) return;
    setBusy(resetBtn, true);
    d.bingoAdminReset().then(function (res) {
      setBusy(resetBtn, false);
      if (res.ok) {
        // Without this, the same person winning two rounds in a row would
        // find renderedWinnerFor already equal to their name and skip
        // rebuilding — silently leaving the PREVIOUS round's answers on
        // screen for the new one.
        lastStatus = null;
        renderedWinnerFor = null;
        winnerAnswers.innerHTML = '';
        render(res.data);
      }
    });
  });
}());
