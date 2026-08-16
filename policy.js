/* ═══════════════════════════════════════════════════════════════════════
   Policy & Leadership
   ───────────────────────────────────────────────────────────────────────
   Nav scrim and section rail. The photo galleries are shared with the
   education page and live in gallery.js.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── nav scrim ──────────────────────────────────────────────────────
     The bar ships as data-scrim="on" for the forest hero: a soft dark
     gradient and near-white text. That has to flip to the solid paper bar
     the moment the hero is behind you, or the near-white text sits on the
     white sections and the navigation disappears.

     A throttled scroll handler rather than an observer, for the same reason
     as the research page: if this never runs, the control vanishes. One
     attribute write every 120ms is a cheap insurance premium. */
  (function scrim() {
    var nav = document.getElementById('nav');
    var hero = document.querySelector('.pl-hero');
    if (!nav || !hero) return;

    var last = 0;

    function apply() {
      var overHero = window.scrollY < (hero.offsetHeight - 80);
      nav.setAttribute('data-scrim', overHero ? 'on' : 'solid');
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
    var hero = document.querySelector('.pl-hero');
    if (!bar || !hero) return;

    var links = Array.prototype.slice.call(bar.querySelectorAll('a'));
    var order = [], byId = {};
    links.forEach(function (a) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (el) { order.push(el); byId[el.id] = a; }
    });
    if (!order.length) return;

    // Scroll-driven rather than observer-driven, for the same reason the
    // research page is: if this never runs the rail simply never appears,
    // which is harmless, whereas a stalled observer would leave it stuck
    // over the hero where it reads as specks on the artwork.
    var last = 0;
    function apply() {
      var pastHero = window.scrollY >= hero.offsetHeight - 80;
      bar.setAttribute('data-past-hero', pastHero ? 'true' : 'false');

      var mid = window.innerHeight * 0.45, here = null;
      order.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) here = el;
      });
      links.forEach(function (a) { a.removeAttribute('aria-current'); });
      if (here && byId[here.id]) byId[here.id].setAttribute('aria-current', 'true');
      bar.setAttribute('data-on-dark',
        here && here.classList.contains('pl-sec--dark') ? 'true' : 'false');
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
