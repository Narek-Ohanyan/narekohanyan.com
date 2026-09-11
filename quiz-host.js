/* ═══════════════════════════════════════════════════════════════════════
   Ambassador Quizz — host / projector screen
   ───────────────────────────────────────────────────────────────────────
   Real password auth, same pattern as Check-In's admin: this drives a
   live event, not an ephemeral solo game. quiz_admin_state always
   includes the correct answer (the host needs it regardless of reveal
   timing) plus per-option vote counts for the reveal bar chart.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var POLL_MS = 1000;
  var TICK_MS = 200;
  var CONFIRM_MS = 4000;
  var TOKEN_KEY = 'no.quiz.adminToken';

  var SHAPES = ['tri', 'dia', 'cir', 'sqr'];
  var BOOL_SHAPES = ['check', 'cross'];

  var els = {
    login: document.getElementById('qhLogin'),
    password: document.getElementById('qhPassword'),
    loginErr: document.getElementById('qhLoginErr'),
    loginBtn: document.getElementById('qhLoginBtn'),

    lobby: document.getElementById('qhLobby'),
    lobbyCount: document.getElementById('qhLobbyCount'),
    playerNames: document.getElementById('qhPlayerNames'),
    startBtn: document.getElementById('qhStartBtn'),

    question: document.getElementById('qhQuestion'),
    qNum: document.getElementById('qhQNum'),
    timerNum: document.getElementById('qhTimerNum'),
    answeredCount: document.getElementById('qhAnsweredCount'),
    qTextHy: document.getElementById('qhQTextHy'),
    qTextEn: document.getElementById('qhQTextEn'),
    options: document.getElementById('qhOptions'),

    reveal: document.getElementById('qhReveal'),
    revealQNum: document.getElementById('qhRevealQNum'),
    revealAnsweredCount: document.getElementById('qhRevealAnsweredCount'),
    revealQTextHy: document.getElementById('qhRevealQTextHy'),
    revealOptions: document.getElementById('qhRevealOptions'),
    nextBtn: document.getElementById('qhNextBtn'),

    podium: document.getElementById('qhPodium'),
    podiumBlocks: document.getElementById('qhPodiumBlocks'),
    resetBtn: document.getElementById('qhResetBtn'),
    resetLbl: document.getElementById('qhResetLbl'),

    offline: document.getElementById('qhOffline')
  };

  var panels = {
    login: els.login, lobby: els.lobby, question: els.question,
    reveal: els.reveal, podium: els.podium
  };
  function showOnly(name) {
    Object.keys(panels).forEach(function (k) { panels[k].hidden = (k !== name); });
  }

  function db() { return (window.NO && window.NO.db && window.NO.db.available()) ? window.NO.db : null; }
  function token() { try { return sessionStorage.getItem(TOKEN_KEY); } catch (e) { return null; } }
  function setToken(t) { try { sessionStorage.setItem(TOKEN_KEY, t); } catch (e) {} }
  function clearToken() { try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {} }

  var pollTimer = null, tickTimer = null;
  var lastPanel = null, lastRenderedIndex = -1, lastRevealIndex = -1;
  var questionEndsAtMs = null;
  var podiumRendered = false;

  /* ── login ────────────────────────────────────────────────────────── */
  function attemptLogin(password) {
    var d = db();
    if (!d) { els.offline.hidden = false; return; }
    els.loginBtn.disabled = true;
    d.quizAdminLogin(password).then(function (res) {
      els.loginBtn.disabled = false;
      if (res.ok && res.data && res.data.ok) {
        setToken(res.data.token);
        els.loginErr.hidden = true;
        els.password.value = '';
        startPolling();
      } else {
        els.loginErr.hidden = false;
      }
    });
  }
  els.loginBtn.addEventListener('click', function () { attemptLogin(els.password.value); });
  els.password.addEventListener('keydown', function (e) { if (e.key === 'Enter') attemptLogin(els.password.value); });

  /* ── shapes ───────────────────────────────────────────────────────── */
  function shapeSvg(kind) {
    switch (kind) {
      case 'tri': return '<svg viewBox="0 0 24 24"><path d="M12 3 22 20H2Z"/></svg>';
      case 'dia': return '<svg viewBox="0 0 24 24"><path d="M12 2 22 12 12 22 2 12Z"/></svg>';
      case 'cir': return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>';
      case 'sqr': return '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>';
      case 'check': return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6"/></svg>';
      case 'cross': return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M5 5 19 19M19 5 5 19"/></svg>';
    }
    return '';
  }

  /* ── list + render ────────────────────────────────────────────────── */
  function loadState() {
    var t = token();
    var d = db();
    if (!d || !t) return;
    d.quizAdminState(t).then(function (res) {
      if (!res.ok) { clearToken(); showOnly('login'); stopPolling(); return; }
      els.offline.hidden = true;
      applyState(res.data);
    });
  }

  function renderLobby(s) {
    els.lobbyCount.innerHTML = '<b>' + s.player_count + '</b> խաղացող միացել է <span class="qz-en">(players joined)</span>';
    els.playerNames.innerHTML = '';
    var frag = document.createDocumentFragment();
    (s.recent_players || []).forEach(function (p) {
      var chip = document.createElement('span');
      chip.className = 'qz-chip';
      chip.textContent = p.first_name + ' ' + p.last_name;
      frag.appendChild(chip);
    });
    els.playerNames.appendChild(frag);
  }

  function renderQuestionOptions(container, q, showCorrect, counts) {
    container.innerHTML = '';
    var shapes = q.type === 'boolean' ? BOOL_SHAPES : SHAPES;
    var frag = document.createDocumentFragment();
    q.options_hy.forEach(function (textHy, i) {
      var btn = document.createElement('div');
      var cls = 'qz-opt qz-opt--' + shapes[i];
      if (showCorrect) cls += (q.correct.indexOf(i) !== -1) ? ' is-correct' : ' is-wrong';
      btn.className = cls;
      var count = counts ? (counts[String(i)] || 0) : null;
      btn.innerHTML =
        '<span class="qz-opt__shape">' + shapeSvg(shapes[i]) + '</span>' +
        '<span class="qz-opt__text">' + textHy + ' <span class="qz-en">(' + q.options_en[i] + ')</span></span>' +
        (count !== null ? '<span class="qz-opt__count">' + count + '</span>' : '');
      frag.appendChild(btn);
    });
    container.appendChild(frag);
  }

  function startTick() {
    stopTick();
    tickTimer = setInterval(function () {
      if (questionEndsAtMs == null) return;
      var secs = Math.max(0, Math.ceil((questionEndsAtMs - Date.now()) / 1000));
      els.timerNum.textContent = secs;
    }, TICK_MS);
  }
  function stopTick() { if (tickTimer) { clearInterval(tickTimer); tickTimer = null; } }

  function renderPodium() {
    var d = db();
    if (!d) return;
    d.quizLeaderboard().then(function (res) {
      if (!res.ok) return;
      var list = res.data || [];
      els.podiumBlocks.innerHTML = '';
      var order = [1, 0, 2];
      var frag = document.createDocumentFragment();
      order.forEach(function (rank) {
        var p = list[rank];
        var block = document.createElement('div');
        block.className = 'qz-podium__block qz-podium__block--' + (rank + 1);
        if (p) {
          block.innerHTML =
            '<p class="qz-podium__medal">' + (rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉') + '</p>' +
            '<p class="qz-podium__name">' + p.first_name + ' ' + p.last_name + '</p>' +
            '<p class="qz-podium__score">' + p.score + '</p>';
        }
        frag.appendChild(block);
      });
      els.podiumBlocks.appendChild(frag);
    });
  }

  function applyState(s) {
    if (s.config.status === 'idle') {
      stopTick();
      if (lastPanel !== 'lobby') { showOnly('lobby'); lastPanel = 'lobby'; }
      renderLobby(s);
      return;
    }

    if (s.config.status === 'finished') {
      stopTick();
      if (lastPanel !== 'podium') {
        showOnly('podium'); lastPanel = 'podium'; podiumRendered = false;
      }
      if (!podiumRendered) { renderPodium(); podiumRendered = true; }
      return;
    }

    var q = s.question;
    questionEndsAtMs = new Date(s.config.question_ends_at).getTime();

    if (!q.revealed) {
      if (lastPanel !== 'question' || lastRenderedIndex !== q.index) {
        els.qNum.textContent = (q.index + 1) + ' / ' + s.config.total_questions;
        els.qTextHy.textContent = q.text_hy;
        els.qTextEn.textContent = q.text_en;
        renderQuestionOptions(els.options, q, false, null);
        showOnly('question');
        lastPanel = 'question';
        lastRenderedIndex = q.index;
        startTick();
      }
      els.answeredCount.textContent = s.answered_count + ' / ' + s.player_count + ' պատասխանեց (answered)';
    } else {
      if (lastPanel !== 'reveal' || lastRevealIndex !== q.index) {
        stopTick();
        els.revealQNum.textContent = (q.index + 1) + ' / ' + s.config.total_questions;
        els.revealQTextHy.textContent = q.text_hy;
        renderQuestionOptions(els.revealOptions, q, true, s.option_counts);
        showOnly('reveal');
        lastPanel = 'reveal';
        lastRevealIndex = q.index;
      }
      els.revealAnsweredCount.textContent = s.answered_count + ' / ' + s.player_count + ' պատասխանեց (answered)';
    }
  }

  function poll() { loadState(); }
  function startPolling() {
    stopPolling();
    poll();
    pollTimer = setInterval(poll, POLL_MS);
  }
  function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  /* ── controls ─────────────────────────────────────────────────────── */
  function setBusy(btn, busy) { btn.disabled = busy; btn.setAttribute('aria-busy', busy ? 'true' : 'false'); }

  els.startBtn.addEventListener('click', function () {
    var t = token(); var d = db();
    if (!d || !t) return;
    setBusy(els.startBtn, true);
    d.quizAdminStart(t).then(function (res) {
      setBusy(els.startBtn, false);
      if (res.ok) applyState(res.data);
    });
  });

  els.nextBtn.addEventListener('click', function () {
    var t = token(); var d = db();
    if (!d || !t) return;
    setBusy(els.nextBtn, true);
    d.quizAdminNext(t).then(function (res) {
      setBusy(els.nextBtn, false);
      if (res.ok) applyState(res.data);
    });
  });

  var armed = false, armTimer = null;
  function disarm() {
    armed = false;
    clearTimeout(armTimer);
    els.resetLbl.innerHTML = 'Զրոյացնել խաղը <span class="qz-en">(Reset Game)</span>';
    els.resetBtn.classList.remove('is-armed');
  }
  els.resetBtn.addEventListener('click', function () {
    if (!armed) {
      armed = true;
      els.resetLbl.innerHTML = 'Վստա՞հ ես: Սեղմիր կրկին <span class="qz-en">(Sure? Click again)</span>';
      els.resetBtn.classList.add('is-armed');
      armTimer = setTimeout(disarm, CONFIRM_MS);
      return;
    }
    disarm();
    var t = token(); var d = db();
    if (!d || !t) return;
    d.quizAdminReset(t).then(function (res) {
      if (res.ok) {
        lastPanel = null; lastRenderedIndex = -1; lastRevealIndex = -1; podiumRendered = false;
        applyState(res.data);
      }
    });
  });

  /* ── boot ─────────────────────────────────────────────────────────── */
  if (token()) {
    startPolling();
  } else {
    showOnly('login');
  }
}());
