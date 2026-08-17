/* ═══════════════════════════════════════════════════════════════════════
   Course player
   ───────────────────────────────────────────────────────────────────────
   Coursera-shaped: contents on the left, the unit in the middle, progress
   toward the certificate on the right. Gating rule: a module opens only
   once every quiz in the module before it has been passed at the course
   pass mark (80%).

   Progress lives in Academy (localStorage) — see the warning at the top
   of academy.js about what that does and does not guarantee.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var C = window.COURSE, A = window.Academy;
  if (!C || !A) return;

  var PASS = C.passMark || 80;

  /* ── flatten into a walkable sequence ───────────────────────────── */
  var seq = [];
  seq.push({ mod: null, unit: C.intro });
  C.modules.forEach(function (m) {
    m.units.forEach(function (u) { seq.push({ mod: m, unit: u }); });
  });
  seq.push({ mod: null, unit: C.outro });
  seq.push({ mod: null, unit: C.exam });

  var at = 0;

  /* ── quiz inventory, for gating and counting ────────────────────── */
  function quizzesOf(m) {
    var out = [];
    m.units.forEach(function (u) {
      if (u.kind === 'quiz') out.push({ id: u.id, q: u.q });
      else if (u.quiz) out.push({ id: u.id + '-q', q: u.quiz.q });
    });
    return out;
  }

  var allQuizzes = [];
  C.modules.forEach(function (m) { allQuizzes = allQuizzes.concat(quizzesOf(m)); });
  allQuizzes.push({ id: C.exam.id, q: C.exam.q });

  function S() { return A.state(C.id) || { done: {}, scores: {}, claimed: false }; }

  function passed(quizId) { return (S().scores[quizId] || 0) >= PASS; }

  /** A module is open when every quiz in every earlier module is passed. */
  function moduleOpen(idx) {
    for (var i = 0; i < idx; i++) {
      var qs = quizzesOf(C.modules[i]);
      for (var j = 0; j < qs.length; j++) if (!passed(qs[j].id)) return false;
    }
    return true;
  }

  function modIndex(m) { return C.modules.indexOf(m); }

  function unitOpen(i) {
    var e = seq[i];
    if (!e.mod) {
      // The final exam waits for every module; intro and outro are always open.
      if (e.unit.id === C.exam.id) return moduleOpen(C.modules.length);
      return true;
    }
    return moduleOpen(modIndex(e.mod));
  }

  function allDone() {
    return allQuizzes.every(function (q) { return passed(q.id); });
  }

  /* ── counting ───────────────────────────────────────────────────── */
  function stepsTotal() { return seq.length; }
  function stepsDone() {
    var s = S(), n = 0;
    seq.forEach(function (e) {
      var id = e.unit.id;
      if (e.unit.kind === 'quiz') { if (passed(id)) n++; }
      else if (s.done[id]) n++;
    });
    return n;
  }
  function quizzesPassed() {
    return allQuizzes.filter(function (q) { return passed(q.id); }).length;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ── rail ───────────────────────────────────────────────────────── */
  var railList = document.getElementById('railList');

  function railHTML() {
    var s = S(), html = '';

    function row(i, label, kind, open, done) {
      var icon = !open ? 'c-lock' : (done ? 'c-check' : (kind === 'quiz' ? 'c-quiz' : 'c-play'));
      return '<li><button class="cru' +
        (i === at ? ' is-at' : '') + (done ? ' is-done' : '') + (open ? '' : ' is-locked') +
        '" type="button" data-go="' + i + '"' + (open ? '' : ' aria-disabled="true"') + '>' +
        '<svg class="ico cru__i" viewBox="0 0 24 24" aria-hidden="true"><use href="#' + icon + '"/></svg>' +
        '<span class="cru__t">' + esc(label) + '</span>' +
        (done ? '<span class="visually-hidden">completed</span>' : '') +
        (open ? '' : '<span class="visually-hidden">locked</span>') +
        '</button></li>';
    }

    // intro
    html += '<li class="crg"><p class="crg__h">Start here</p><ol role="list">' +
            row(0, C.intro.title, 'video', true, !!s.done[C.intro.id]) + '</ol></li>';

    // modules
    C.modules.forEach(function (m, mi) {
      var open = moduleOpen(mi);
      var qs = quizzesOf(m);
      var pass = qs.filter(function (q) { return passed(q.id); }).length;
      html += '<li class="crg' + (open ? '' : ' crg--locked') + '">' +
        '<p class="crg__h">Module ' + m.n +
          (open ? '' : ' <svg class="ico crg__lock" viewBox="0 0 24 24" aria-hidden="true"><use href="#c-lock"/></svg>') +
        '</p>' +
        '<p class="crg__t">' + esc(m.title) + '</p>' +
        '<p class="crg__q">' + pass + '/' + qs.length + ' quizzes passed</p>' +
        (open ? '' : '<p class="crg__why">Finish every quiz in Module ' + (m.n - 1) + ' to open this.</p>') +
        '<ol role="list">';
      m.units.forEach(function (u) {
        var i = seq.findIndex(function (e) { return e.unit === u; });
        var done = u.kind === 'quiz' ? passed(u.id) : !!s.done[u.id];
        html += row(i, u.title, u.kind, open, done);
      });
      html += '</ol></li>';
    });

    // finish
    var examOpen = moduleOpen(C.modules.length);
    var oi = seq.findIndex(function (e) { return e.unit === C.outro; });
    var ei = seq.findIndex(function (e) { return e.unit === C.exam; });
    html += '<li class="crg' + (examOpen ? '' : ' crg--locked') + '"><p class="crg__h">Finish</p><ol role="list">' +
      row(oi, C.outro.title, 'video', true, !!s.done[C.outro.id]) +
      row(ei, C.exam.title, 'quiz', examOpen, passed(C.exam.id)) + '</ol></li>';

    return html;
  }

  /* ── unit body ──────────────────────────────────────────────────── */
  var unitBody = document.getElementById('unitBody');

  function videoHTML(e) {
    var u = e.unit, s = S();
    var done = !!s.done[u.id];
    return '' +
      (e.mod ? '<p class="cu__mod">Module ' + e.mod.n + ' <span aria-hidden="true">·</span> ' + esc(e.mod.title) + '</p>' : '') +
      '<h1 class="cu__h">' + esc(u.title) + '</h1>' +
      '<div class="cu__video">' +
        '<iframe src="https://www.youtube.com/embed/' + u.yt + '?rel=0&origin=' +
          encodeURIComponent(location.origin) + '" title="' + esc(u.title) +
          '" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture; web-share"' +
          ' referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>' +
      '</div>' +
      '<p class="cu__yt">Trouble playing it here? ' +
        '<a href="https://youtu.be/' + u.yt + '" target="_blank" rel="noopener noreferrer">Watch on YouTube</a>.</p>' +
      '<button class="btn ' + (done ? 'btn--ghost-ink' : 'btn--leaf') + ' cu__mark" type="button" data-mark="' + u.id + '">' +
        (done ? 'Marked as watched' : 'Mark as watched') +
        '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#c-check"/></svg></button>' +
      (u.quiz ? quizHTML(u.id + '-q', u.quiz.title || 'Check what you learned', u.quiz.q, false) : '');
  }

  function quizHTML(qid, title, qs, standalone) {
    var score = S().scores[qid];
    var has = typeof score === 'number';
    return '' +
      '<section class="quiz" data-quiz="' + qid + '"' + (standalone ? ' data-standalone="1"' : '') + '>' +
        '<div class="quiz__head">' +
          '<svg class="ico ico--lg" viewBox="0 0 24 24" aria-hidden="true"><use href="#c-quiz"/></svg>' +
          '<div><h2 class="quiz__h">' + esc(title) + '</h2>' +
          '<p class="quiz__sub">' + qs.length + ' question' + (qs.length > 1 ? 's' : '') +
            ' <span aria-hidden="true">·</span> ' + PASS + '% to pass' +
            (has ? ' <span aria-hidden="true">·</span> best so far ' + score + '%' : '') + '</p></div>' +
        '</div>' +
        '<ol class="quiz__list" role="list">' +
          qs.map(function (q, i) {
            return '<li class="qq" data-q="' + i + '">' +
              '<fieldset><legend class="qq__q"><span class="qq__n">' + (i + 1) + '</span> ' + esc(q.q) + '</legend>' +
              '<div class="qq__opts">' +
                q.a.map(function (a, j) {
                  var name = qid + '-' + i;
                  return '<label class="qo"><input type="radio" name="' + name + '" value="' + j + '">' +
                         '<span class="qo__key">' + 'ABCD'.charAt(j) + '</span>' +
                         '<span class="qo__t">' + esc(a) + '</span></label>';
                }).join('') +
              '</div>' +
              '<p class="qq__why" hidden></p></fieldset></li>';
          }).join('') +
        '</ol>' +
        '<div class="quiz__foot">' +
          '<button class="btn btn--leaf" type="button" data-submit="' + qid + '">Submit answers</button>' +
          '<p class="quiz__result" role="status" aria-live="polite"></p>' +
        '</div>' +
      '</section>';
  }

  function render() {
    var e = seq[at];

    if (!unitOpen(at)) {
      unitBody.innerHTML = '<div class="cu__locked">' +
        '<svg class="ico ico--xl" viewBox="0 0 24 24" aria-hidden="true"><use href="#c-lock"/></svg>' +
        '<h1 class="cu__h">This part is locked</h1>' +
        '<p>Pass every quiz in the earlier modules at ' + PASS + '% or above to open it. ' +
        'You can retake a quiz as many times as you like — only your best score is kept.</p></div>';
    } else if (e.unit.kind === 'quiz') {
      unitBody.innerHTML =
        (e.mod ? '<p class="cu__mod">Module ' + e.mod.n + ' <span aria-hidden="true">·</span> ' + esc(e.mod.title) + '</p>' : '') +
        (e.unit.blurb ? '<p class="cu__blurb">' + esc(e.unit.blurb) + '</p>' : '') +
        quizHTML(e.unit.id, e.unit.title, e.unit.q, true);
    } else {
      unitBody.innerHTML = videoHTML(e);
    }

    railList.innerHTML = railHTML();
    document.getElementById('prevUnit').disabled = at === 0;
    document.getElementById('nextUnit').disabled = at === seq.length - 1;
    paint();
    document.getElementById('unit').focus();
  }

  /* ── progress panel ─────────────────────────────────────────────── */
  function paint() {
    var done = stepsDone(), all = stepsTotal();
    var p = all ? Math.round(done / all * 100) : 0;

    document.getElementById('statDone').textContent = done;
    document.getElementById('statAll').textContent = all;
    document.getElementById('statQuiz').textContent = quizzesPassed();
    document.getElementById('statQuizAll').textContent = allQuizzes.length;
    document.getElementById('ringNum').textContent = p + '%';
    document.getElementById('ringLabel').textContent =
      p + '% of the course complete: ' + done + ' of ' + all + ' steps, ' +
      quizzesPassed() + ' of ' + allQuizzes.length + ' quizzes passed.';

    var circ = 2 * Math.PI * 52;
    var fill = document.getElementById('ringFill');
    fill.style.strokeDasharray = circ;
    fill.style.strokeDashoffset = circ * (1 - p / 100);

    document.getElementById('railMeta').textContent =
      C.modules.length + ' modules · ' + all + ' steps · ' + p + '% complete';

    var ready = allDone();
    var btn = document.getElementById('claimBtn');
    btn.disabled = !ready;
    document.getElementById('certHint').textContent = ready
      ? 'Everything is complete. Your certificate is ready.'
      : 'Pass all ' + allQuizzes.length + ' quizzes at ' + PASS + '% to unlock. ' +
        quizzesPassed() + ' done.';
  }

  /* ── events ─────────────────────────────────────────────────────── */
  document.addEventListener('click', function (ev) {
    var t = ev.target;

    var go = t.closest ? t.closest('[data-go]') : null;
    if (go) {
      var i = +go.getAttribute('data-go');
      if (!unitOpen(i)) return;
      at = i; closeRail(); render(); return;
    }

    var mark = t.closest ? t.closest('[data-mark]') : null;
    if (mark) { A.markDone(C.id, mark.getAttribute('data-mark')); render(); return; }

    var sub = t.closest ? t.closest('[data-submit]') : null;
    if (sub) { grade(sub.getAttribute('data-submit')); return; }
  });

  document.getElementById('prevUnit').addEventListener('click', function () {
    if (at > 0) { at--; render(); }
  });
  document.getElementById('nextUnit').addEventListener('click', function () {
    if (at < seq.length - 1) { at++; render(); }
  });

  /* ── grading ────────────────────────────────────────────────────── */
  function questionsFor(qid) {
    if (qid === C.exam.id) return C.exam.q;
    var found = null;
    C.modules.forEach(function (m) {
      m.units.forEach(function (u) {
        if (u.id === qid && u.kind === 'quiz') found = u.q;
        if (u.id + '-q' === qid && u.quiz) found = u.quiz.q;
      });
    });
    return found;
  }

  function grade(qid) {
    var qs = questionsFor(qid);
    var box = document.querySelector('[data-quiz="' + qid + '"]');
    if (!qs || !box) return;

    var right = 0, missing = 0;
    qs.forEach(function (q, i) {
      var li = box.querySelector('.qq[data-q="' + i + '"]');
      var picked = box.querySelector('input[name="' + qid + '-' + i + '"]:checked');
      li.classList.remove('is-right', 'is-wrong', 'is-missing');

      if (!picked) { missing++; li.classList.add('is-missing'); }
      else if (+picked.value === q.correct) { right++; li.classList.add('is-right'); }
      else { li.classList.add('is-wrong'); }

      var why = li.querySelector('.qq__why');
      if (picked) {
        var ok = +picked.value === q.correct;
        why.innerHTML = '<strong>' + (ok ? 'Correct.' : 'Not quite.') + '</strong> ' +
          (ok ? '' : 'The answer is <strong>' + 'ABCD'.charAt(q.correct) + '</strong>. ') +
          (q.why ? esc(q.why) : '');
        why.hidden = false;
      } else { why.hidden = true; }
    });

    var pct = Math.round(right / qs.length * 100);
    var out = box.querySelector('.quiz__result');

    if (missing) {
      out.className = 'quiz__result is-warn';
      out.textContent = 'Answer all ' + qs.length + ' questions before submitting — ' +
                        missing + ' still blank.';
      return;
    }

    A.setScore(C.id, qid, pct);
    var pass = pct >= PASS;
    out.className = 'quiz__result ' + (pass ? 'is-pass' : 'is-fail');
    out.textContent = pass
      ? 'Passed with ' + pct + '% (' + right + ' of ' + qs.length + ' correct).'
      : 'Scored ' + pct + '% (' + right + ' of ' + qs.length + '). You need ' + PASS +
        '% — review the explanations and try again.';

    railList.innerHTML = railHTML();
    paint();
  }

  /* ── contents drawer, narrow screens ────────────────────────────── */
  var rail = document.getElementById('rail');
  var scrim = document.getElementById('railScrim');
  var tocBtn = document.getElementById('tocBtn');

  function openRail(open) {
    rail.setAttribute('data-open', open ? 'true' : 'false');
    scrim.hidden = !open;
    tocBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closeRail() { if (window.innerWidth <= 1080) openRail(false); }

  tocBtn.addEventListener('click', function () {
    openRail(rail.getAttribute('data-open') !== 'true');
  });
  scrim.addEventListener('click', function () { openRail(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && rail.getAttribute('data-open') === 'true') { openRail(false); tocBtn.focus(); }
  });

  /* ── certificate ────────────────────────────────────────────────── */
  var dlg = document.getElementById('certDialog');

  /* The certificate is rasterised through a canvas for download, and an
     <image> pointing at a file URL taints that canvas — toBlob would throw a
     SecurityError. Inlining the signature as a data URI keeps one piece of
     markup working for both the on-screen render and the PNG. */
  var sigData = null;
  function loadSignature() {
    if (sigData !== null) return Promise.resolve(sigData);
    return fetch('Media/web/resources/signature.png')
      .then(function (r) { if (!r.ok) throw new Error('signature ' + r.status); return r.blob(); })
      .then(function (b) {
        return new Promise(function (res, rej) {
          var fr = new FileReader();
          fr.onload = function () { sigData = fr.result; res(sigData); };
          fr.onerror = rej;
          fr.readAsDataURL(b);
        });
      })
      .catch(function () { sigData = ''; return ''; });   // fall back to the ruled line alone
  }


  /* Signature placement.
     The PNG carries a lot of transparent margin, so positioning it by its own
     box would float the ink somewhere above the rule. These numbers are the
     measured alpha bounding box of the artwork — ink occupies x 77..454,
     y 68..260 inside the 520x390 file — which lets the ink itself be centred
     on the signature line rather than the file it happens to sit in. */
  var SIG = { fw: 520, fh: 390, ix: 77, iy: 68, iw: 377, ih: 192 };

  function sigImage(href) {
    var wantW = 250;                       // ink width on the certificate
    var baseline = 1016;                   // ink sits just above the rule at 1026
    var centre = 300;                      // centre of the signature column
    var k = wantW / SIG.iw;

    var w = SIG.fw * k, h = SIG.fh * k;
    var x = (centre - wantW / 2) - SIG.ix * k;
    var y = baseline - (SIG.iy + SIG.ih) * k;

    return '<image x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
           '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) +
           '" href="' + href + '" preserveAspectRatio="xMidYMid meet"/>';
  }

  function certSVG(name, dateStr, sig) {
    var W = 1600, H = 1130;
    return '' +
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' +
  '<rect width="' + W + '" height="' + H + '" fill="#FBFBFB"/>' +
  '<rect x="26" y="26" width="' + (W - 52) + '" height="' + (H - 52) + '" fill="none" stroke="#1B3E26" stroke-width="3"/>' +
  '<rect x="44" y="44" width="' + (W - 88) + '" height="' + (H - 88) + '" fill="none" stroke="#1B3E26" stroke-width="1" opacity=".45"/>' +
  '<path d="M44 44 L300 44 L44 300 Z" fill="#F5EC9A" opacity=".55"/>' +
  '<path d="M' + (W - 44) + ' ' + (H - 44) + ' L' + (W - 300) + ' ' + (H - 44) + ' L' + (W - 44) + ' ' + (H - 300) + ' Z" fill="#F5EC9A" opacity=".55"/>' +
  '<text x="' + W / 2 + '" y="196" text-anchor="middle" font-family="Inter,Helvetica,Arial,sans-serif" font-size="26" letter-spacing="7" fill="#1B3E26">ONLINE GREEN ACADEMY</text>' +
  '<text x="' + W / 2 + '" y="308" text-anchor="middle" font-family="Georgia,\'Playfair Display\',serif" font-size="82" font-weight="700" fill="#1A1D20">Certificate of Completion</text>' +
  '<line x1="' + (W / 2 - 90) + '" y1="356" x2="' + (W / 2 + 90) + '" y2="356" stroke="#F5EC9A" stroke-width="6"/>' +
  '<text x="' + W / 2 + '" y="440" text-anchor="middle" font-family="Inter,Helvetica,Arial,sans-serif" font-size="27" fill="#4A5057">This is to certify that</text>' +
  '<text x="' + W / 2 + '" y="556" text-anchor="middle" font-family="Georgia,\'Playfair Display\',serif" font-size="76" font-style="italic" fill="#1B3E26">' + esc(name) + '</text>' +
  '<line x1="' + (W / 2 - 400) + '" y1="596" x2="' + (W / 2 + 400) + '" y2="596" stroke="#1A1D20" stroke-width="1" opacity=".25"/>' +
  '<text x="' + W / 2 + '" y="668" text-anchor="middle" font-family="Inter,Helvetica,Arial,sans-serif" font-size="27" fill="#4A5057">has successfully completed the course</text>' +
  '<text x="' + W / 2 + '" y="742" text-anchor="middle" font-family="Georgia,\'Playfair Display\',serif" font-size="44" font-weight="700" fill="#1A1D20">Introduction to Sustainability,</text>' +
  '<text x="' + W / 2 + '" y="800" text-anchor="middle" font-family="Georgia,\'Playfair Display\',serif" font-size="44" font-weight="700" fill="#1A1D20">Environment &amp; Climate</text>' +
  '<text x="' + W / 2 + '" y="862" text-anchor="middle" font-family="Inter,Helvetica,Arial,sans-serif" font-size="22" fill="#6B7178">15-part video training series &#183; passing every assessment at ' + PASS + '% or above</text>' +
  (sig ? sigImage(sig) : '<text x="300" y="1004" text-anchor="middle" font-family="Georgia,serif" font-size="34" font-style="italic" fill="#1A1D20">Narek Ohanyan</text>') +
  '<line x1="140" y1="1026" x2="460" y2="1026" stroke="#1A1D20" stroke-width="1" opacity=".4"/>' +
  '<text x="300" y="1058" text-anchor="middle" font-family="Inter,Helvetica,Arial,sans-serif" font-size="20" fill="#1A1D20">Narek Ohanyan</text>' +
  '<text x="300" y="1084" text-anchor="middle" font-family="Inter,Helvetica,Arial,sans-serif" font-size="16" letter-spacing="2" fill="#6B7178">AUTHOR &amp; TRAINER</text>' +
  '<text x="' + (W - 300) + '" y="1004" text-anchor="middle" font-family="Inter,Helvetica,Arial,sans-serif" font-size="30" fill="#1A1D20">' + esc(dateStr) + '</text>' +
  '<line x1="' + (W - 460) + '" y1="1026" x2="' + (W - 140) + '" y2="1026" stroke="#1A1D20" stroke-width="1" opacity=".4"/>' +
  '<text x="' + (W - 300) + '" y="1058" text-anchor="middle" font-family="Inter,Helvetica,Arial,sans-serif" font-size="16" letter-spacing="2" fill="#6B7178">DATE OF ISSUE</text>' +
'</svg>';
  }

  function openCert() {
    var u = A.current();
    if (!u) return;
    A.claim(C.id);

    var when = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    loadSignature().then(function (sig) {
      var svg = certSVG(u.name, when, sig);
      document.getElementById('certSheet').innerHTML = svg;
      document.getElementById('certNote').textContent = 'Issued to ' + u.name + ' on ' + when + '.';

      if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); }
      else dlg.setAttribute('open', '');

      document.getElementById('certDl').onclick = function () { download(svg, u.name); };
    });
  }

  function download(svg, name) {
    var img = new Image();
    var blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);

    img.onload = function () {
      var c = document.createElement('canvas');
      c.width = 1600; c.height = 1130;
      var x = c.getContext('2d');
      x.fillStyle = '#FBFBFB'; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      c.toBlob(function (png) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(png);
        a.download = 'Certificate — ' + name.replace(/[^\w\s-]/g, '') + '.png';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      }, 'image/png');
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      document.getElementById('certNote').textContent =
        'The image could not be prepared for download. You can still screenshot the certificate above.';
    };
    img.src = url;
  }

  document.getElementById('claimBtn').addEventListener('click', openCert);
  document.getElementById('certClose').addEventListener('click', function () {
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
  });

  /* ── boot ───────────────────────────────────────────────────────────
     The session is restored asynchronously — it is read from storage and
     the progress is fetched over the network — so nothing may be decided
     until ready() resolves. Asking A.current() before that always answers
     null, which would show the signed-out gate to someone who is in fact
     signed in. */
  function boot() {
    var user = A.current();
    var gate = document.getElementById('cgate');
    var shell = document.getElementById('courseShell');

    gate.hidden = true;
    shell.hidden = true;

    if (!user) {
      gate.hidden = false;
    } else if (!A.isEnrolled(C.id)) {
      gate.hidden = false;
      document.getElementById('cgateTitle').textContent = 'Enrol to open this course';
      document.getElementById('cgateText').textContent =
        'You are signed in as ' + user.name + ', but not enrolled in this course yet. It is free.';
    } else {
      shell.hidden = false;
      document.getElementById('cbarWho').textContent = user.name;

      // Resume where they stopped: first step not yet complete.
      var s = S();
      var resume = seq.findIndex(function (e) {
        var id = e.unit.id;
        return e.unit.kind === 'quiz' ? !passed(id) : !s.done[id];
      });
      at = resume > -1 && unitOpen(resume) ? resume : 0;
      render();
    }
  }

  if (A.ready) { A.ready().then(boot, boot); } else { boot(); }
}());
