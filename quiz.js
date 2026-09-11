/* ═══════════════════════════════════════════════════════════════════════
   Ambassador Quizz — player page
   ───────────────────────────────────────────────────────────────────────
   No accounts: a player is identified by client_key, an unguessable uuid
   the database hands back on join and this page keeps in localStorage
   (same pattern as Human Bingo). Every read and write is a checked RPC —
   see window.NO.db.quiz* in supabase-client.js. Critically, this page
   never knows a question's correct answer itself: quiz_state only
   includes it once the server's own clock says time is up, so there is
   nothing here for a curious player to read out of the page source.

   Timing model: quiz_state hands back an absolute question_ends_at
   timestamp. The on-screen countdown is computed locally against that
   timestamp on a fast local interval, so it ticks smoothly regardless of
   the (slower) network poll interval — the poll's job is only to notice
   phase changes (new question, reveal, game over), not to drive the
   timer number itself.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var KEY_STORE = 'no.quiz.clientKey';
  var POLL_MS = 1000;
  var TICK_MS = 200;

  var SHAPES = ['tri', 'dia', 'cir', 'sqr'];
  var BOOL_SHAPES = ['check', 'cross'];

  var els = {
    join: document.getElementById('qzJoin'),
    firstName: document.getElementById('qzFirstName'),
    lastName: document.getElementById('qzLastName'),
    langBtns: Array.prototype.slice.call(document.querySelectorAll('.qz-lang-btn')),
    joinErr: document.getElementById('qzJoinErr'),
    joinBtn: document.getElementById('qzJoinBtn'),

    lobby: document.getElementById('qzLobby'),
    lobbyName: document.getElementById('qzLobbyName'),

    question: document.getElementById('qzQuestion'),
    qNum: document.getElementById('qzQNum'),
    timerNum: document.getElementById('qzTimerNum'),
    liveScore: document.getElementById('qzLiveScore'),
    qText: document.getElementById('qzQText'),
    options: document.getElementById('qzOptions'),
    submitMulti: document.getElementById('qzSubmitMulti'),

    waiting: document.getElementById('qzWaiting'),

    reveal: document.getElementById('qzReveal'),
    revealIcon: document.getElementById('qzRevealIcon'),
    revealTitle: document.getElementById('qzRevealTitle'),
    revealScore: document.getElementById('qzRevealScore'),
    revealNote: document.getElementById('qzRevealNote'),

    podium: document.getElementById('qzPodium'),
    podiumBlocks: document.getElementById('qzPodiumBlocks'),
    myRank: document.getElementById('qzMyRank'),

    offline: document.getElementById('qzOffline')
  };

  var panels = {
    join: els.join, lobby: els.lobby, question: els.question,
    waiting: els.waiting, reveal: els.reveal, podium: els.podium
  };

  function showOnly(name) {
    Object.keys(panels).forEach(function (k) { panels[k].hidden = (k !== name); });
  }

  function db() { return (window.NO && window.NO.db && window.NO.db.available()) ? window.NO.db : null; }

  function storedKey() { try { return localStorage.getItem(KEY_STORE) || null; } catch (e) { return null; } }
  function storeKey(k) { try { localStorage.setItem(KEY_STORE, k); } catch (e) {} }
  function clearKey() { try { localStorage.removeItem(KEY_STORE); } catch (e) {} }

  var clientKey = storedKey();
  var pollTimer = null, tickTimer = null;
  var selectedLang = null;
  var lastRenderedIndex = -1;
  var lastPanel = null;
  var localSelection = []; // for multi-select, before submit
  var questionEndsAtMs = null;

  /* ── join ─────────────────────────────────────────────────────────── */
  els.langBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectedLang = btn.getAttribute('data-lang');
      els.langBtns.forEach(function (b) { b.classList.toggle('is-selected', b === btn); });
    });
  });

  function doJoin() {
    var fn = els.firstName.value.trim();
    var ln = els.lastName.value.trim();
    if (!fn || !ln) {
      els.joinErr.textContent = 'Գրիր անուն և ազգանուն։ (Enter first and last name.)';
      els.joinErr.hidden = false;
      return;
    }
    if (!selectedLang) {
      els.joinErr.textContent = 'Ընտրիր լեզուն։ (Choose a language.)';
      els.joinErr.hidden = false;
      return;
    }
    var d = db();
    if (!d) { els.offline.hidden = false; return; }
    els.joinBtn.disabled = true;
    d.quizJoin(fn, ln, selectedLang).then(function (res) {
      els.joinBtn.disabled = false;
      if (!res.ok || !res.data || !res.data.access_key) {
        els.joinErr.textContent = 'Չհաջողվեց միանալ։ Փորձիր կրկին։ (Could not join. Try again.)';
        els.joinErr.hidden = false;
        return;
      }
      clientKey = res.data.access_key;
      storeKey(clientKey);
      els.joinErr.hidden = true;
      els.lobbyName.textContent = fn;
      startPolling();
    });
  }
  els.joinBtn.addEventListener('click', doJoin);

  /* ── shape rendering ─────────────────────────────────────────────── */
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

  /* ── question rendering ──────────────────────────────────────────── */
  function renderQuestion(q, total) {
    els.qNum.textContent = (q.index + 1) + ' / ' + total;
    els.qText.textContent = q.text;
    els.options.innerHTML = '';
    els.options.className = 'qz-options' + (q.type === 'boolean' ? ' qz-options--bool' : '');
    localSelection = [];

    var shapes = q.type === 'boolean' ? BOOL_SHAPES : SHAPES;
    var frag = document.createDocumentFragment();
    q.options.forEach(function (text, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'qz-opt qz-opt--' + shapes[i];
      btn.setAttribute('data-i', i);
      btn.innerHTML =
        '<span class="qz-opt__shape">' + shapeSvg(shapes[i]) + '</span>' +
        '<span class="qz-opt__text">' + text + '</span>';
      btn.addEventListener('click', function () { onOptionClick(q, i, btn); });
      frag.appendChild(btn);
    });
    els.options.appendChild(frag);
    els.submitMulti.hidden = (q.type !== 'multi');
  }

  function onOptionClick(q, i, btn) {
    if (q.type === 'multi') {
      var idx = localSelection.indexOf(i);
      if (idx === -1) { localSelection.push(i); btn.classList.add('is-picked'); }
      else { localSelection.splice(idx, 1); btn.classList.remove('is-picked'); }
      return;
    }
    submitAnswer(q.index, [i]);
  }

  els.submitMulti.addEventListener('click', function () {
    if (!localSelection.length) return;
    submitAnswer(lastRenderedIndex, localSelection.slice());
  });

  function submitAnswer(index, indices) {
    var d = db();
    if (!d || !clientKey) return;
    d.quizSubmitAnswer(clientKey, index, indices).then(function (res) {
      if (res.ok) applyState(res.data);
    });
  }

  /* ── timer ────────────────────────────────────────────────────────── */
  function startTick() {
    stopTick();
    tickTimer = setInterval(function () {
      if (questionEndsAtMs == null) return;
      var secs = Math.max(0, Math.ceil((questionEndsAtMs - Date.now()) / 1000));
      els.timerNum.textContent = secs;
    }, TICK_MS);
  }
  function stopTick() { if (tickTimer) { clearInterval(tickTimer); tickTimer = null; } }

  /* ── podium ───────────────────────────────────────────────────────── */
  var podiumRendered = false;
  function renderPodium(myName) {
    var d = db();
    if (!d) return;
    d.quizLeaderboard().then(function (res) {
      if (!res.ok) return;
      var list = res.data || [];
      els.podiumBlocks.innerHTML = '';
      var order = [1, 0, 2]; // silver, gold, bronze left-to-right
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

      var myRank = -1;
      for (var i = 0; i < list.length; i++) {
        if (list[i].first_name + ' ' + list[i].last_name === myName) { myRank = i + 1; break; }
      }
      els.myRank.textContent = myRank > 0
        ? ('Քո տեղը` ' + myRank + '-րդ (Your rank: #' + myRank + ')')
        : '';
    });
  }

  /* ── state application ───────────────────────────────────────────── */
  function applyState(s) {
    if (!s || !s.exists) {
      // A stale client_key from a previous round -- the game was reset
      // server-side (quiz_admin_reset wipes every player) since this
      // browser last joined, so the id it's holding no longer matches
      // anyone. Without this, the page would sit frozen on whatever panel
      // was last visible forever, since every poll keeps coming back
      // "doesn't exist" and there would be nothing here to recover from
      // it -- back to the join form so they can enter their name again.
      clearKey();
      clientKey = null;
      stopPolling();
      stopTick();
      lastPanel = null;
      showOnly('join');
      return;
    }

    els.offline.hidden = true;
    var myFullName = s.player.first_name + ' ' + s.player.last_name;
    els.lobbyName.textContent = s.player.first_name;
    els.liveScore.textContent = s.player.score + ' pts';

    if (s.config.status === 'finished') {
      stopTick();
      if (lastPanel !== 'podium') {
        showOnly('podium');
        lastPanel = 'podium';
        podiumRendered = false;
      }
      if (!podiumRendered) { renderPodium(myFullName); podiumRendered = true; }
      return;
    }

    if (s.config.status === 'idle' || !s.question) {
      stopTick();
      if (lastPanel !== 'lobby') { showOnly('lobby'); lastPanel = 'lobby'; }
      return;
    }

    var q = s.question;
    questionEndsAtMs = new Date(s.config.question_ends_at).getTime();

    if (!q.revealed) {
      if (q.already_answered) {
        if (lastPanel !== 'waiting') { showOnly('waiting'); lastPanel = 'waiting'; stopTick(); }
      } else {
        if (lastPanel !== 'question' || lastRenderedIndex !== q.index) {
          renderQuestion(q, s.config.total_questions);
          lastRenderedIndex = q.index;
          showOnly('question');
          lastPanel = 'question';
          startTick();
        }
      }
    } else {
      if (lastPanel !== 'reveal' || lastRenderedIndex !== q.index + 1000) {
        stopTick();
        var correct = !!q.my_answer_correct;
        els.revealIcon.textContent = correct ? '✅' : (q.my_answer ? '❌' : '⏱️');
        els.revealTitle.textContent = correct
          ? 'Ճիշտ է! (Correct!)'
          : (q.my_answer ? 'Սխալ է։ (Incorrect.)' : 'Չպատասխանեցիր։ (No answer.)');
        els.revealScore.textContent = 'Միավորներ` ' + s.player.score + ' (Score: ' + s.player.score + ')';
        els.revealNote.textContent = '';
        showOnly('reveal');
        lastPanel = 'reveal';
        lastRenderedIndex = q.index + 1000; // distinct marker so a later new question re-renders correctly
      }
    }
  }

  function poll() {
    if (!clientKey) return;
    var d = db();
    if (!d) { els.offline.hidden = false; return; }
    d.quizState(clientKey).then(function (res) {
      if (res.ok) applyState(res.data);
      else els.offline.hidden = false;
    });
  }

  function startPolling() {
    stopPolling();
    showOnly('lobby');
    lastPanel = 'lobby';
    poll();
    pollTimer = setInterval(poll, POLL_MS);
  }
  function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  /* ── boot ─────────────────────────────────────────────────────────── */
  if (clientKey) {
    startPolling();
  } else {
    showOnly('join');
  }
}());
