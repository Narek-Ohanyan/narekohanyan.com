/* ═══════════════════════════════════════════════════════════════════════
   Environmental Education
   ───────────────────────────────────────────────────────────────────────
   Hero video control, nav scrim and the section rail. The photo galleries
   are the shared component in gallery.js.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── hero video ─────────────────────────────────────────────────────
     Moving content that starts on its own owes the reader a way to stop
     it. Under prefers-reduced-motion it never starts at all, and the
     button reads "Play" instead — the poster frame carries the hero on
     its own, so nothing is lost by leaving it still. */
  (function video() {
    var v = document.getElementById('edVideo');
    var btn = document.getElementById('edVidBtn');
    var lbl = document.getElementById('edVidLbl');
    var icon = btn ? btn.querySelector('use') : null;
    if (!v || !btn) return;

    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function paint(playing) {
      btn.setAttribute('aria-pressed', playing ? 'false' : 'true');
      lbl.textContent = playing ? 'Pause background video' : 'Play background video';
      if (icon) icon.setAttribute('href', playing ? '#e-pause' : '#e-resume');
    }

    if (still) {
      paint(false);
    } else {
      // play() rejects on browsers that block autoplay; the poster stays and
      // the button becomes Play, which is the correct state either way.
      var p = v.play();
      if (p && p.catch) p.catch(function () { paint(false); });
      paint(true);
    }

    btn.addEventListener('click', function () {
      if (v.paused) { v.play(); paint(true); }
      else { v.pause(); paint(false); }
    });
  }());

  /* ── nav scrim ──────────────────────────────────────────────────────
     Ships as data-scrim="on" for the video hero. It has to flip to the
     solid paper bar past the hero or the near-white text lands on the
     white sections and the navigation disappears. */
  (function scrim() {
    var nav = document.getElementById('nav');
    var hero = document.querySelector('.ed-hero');
    if (!nav || !hero) return;

    var last = 0;
    function apply() {
      nav.setAttribute('data-scrim',
        window.scrollY < (hero.offsetHeight - 80) ? 'on' : 'solid');
    }
    function queue() {
      var now = Date.now();
      if (now - last < 120) return;
      last = now;
      apply();
    }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    apply();
  }());

  /* ── section rail ───────────────────────────────────────────────── */
  (function rail() {
    var bar = document.getElementById('rail');
    var hero = document.querySelector('.ed-hero');
    if (!bar || !hero) return;

    var links = Array.prototype.slice.call(bar.querySelectorAll('a'));
    var order = [], byId = {};
    links.forEach(function (a) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (el) { order.push(el); byId[el.id] = a; }
    });
    if (!order.length) return;

    var last = 0;
    function apply() {
      bar.setAttribute('data-past-hero',
        window.scrollY >= hero.offsetHeight - 80 ? 'true' : 'false');

      var mid = window.innerHeight * 0.45, here = null;
      order.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) here = el;
      });
      links.forEach(function (a) { a.removeAttribute('aria-current'); });
      if (here && byId[here.id]) byId[here.id].setAttribute('aria-current', 'true');
      bar.setAttribute('data-on-dark',
        here && (here.classList.contains('ed-sec--dark') ||
                 here.classList.contains('onward')) ? 'true' : 'false');
    }
    function queue() {
      var now = Date.now();
      if (now - last < 120) return;
      last = now;
      apply();
    }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    apply();
  }());
}());
