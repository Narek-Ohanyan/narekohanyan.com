/* ═══════════════════════════════════════════════════════════════════════
   Research page
   ───────────────────────────────────────────────────────────────────────
   Three small behaviours, each of which degrades to a readable static
   page if it never runs:

     · the nav flips from a gradient over the photograph to the solid
       paper bar once the hero is behind you
     · the section rail marks where you are
     · the application screenshot settles from a slight recline to flat

   Nothing here hides content. Every element is visible in the markup
   before this file executes.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ── nav scrim ──────────────────────────────────────────────────────
     Deliberately a throttled scroll handler rather than an observer. The
     stakes are asymmetric: if this never runs the bar stays in its
     over-photograph state — white text and a white mark — and once the
     page scrolls onto the white sections the navigation disappears
     entirely. One attribute write every 120ms is a cheap price for a
     control that cannot silently vanish. */
  (function scrim() {
    var nav  = document.getElementById('nav');
    var hero = document.querySelector('.rhero');
    var rail = document.getElementById('rail');
    if (!nav || !hero) return;

    var last = 0;

    function apply() {
      var overPhoto = window.scrollY < (hero.offsetHeight - 80);
      nav.setAttribute('data-scrim', overPhoto ? 'on' : 'solid');
      // The section rail belongs to the sections, not to the photograph.
      if (rail) rail.setAttribute('data-past-hero', overPhoto ? 'false' : 'true');
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

  /* ── section rail ───────────────────────────────────────────────────
     aria-current marks the section, and the rail's ink flips on the two
     dark grounds so the dots never vanish into them. */
  (function rail() {
    var bar = document.getElementById('rail');
    if (!bar || !hasIO) return;

    var links = Array.prototype.slice.call(bar.querySelectorAll('a'));
    var byId  = {};
    var order = [];

    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if (!el) return;
      byId[id] = a;
      order.push(el);
    });
    if (!order.length) return;

    var visible = {};

    function mark() {
      // The topmost section currently on screen wins, so scrolling up and
      // down give the same answer at the same position.
      var current = null;
      for (var i = 0; i < order.length; i++) {
        if (visible[order[i].id]) { current = order[i]; break; }
      }
      links.forEach(function (a) { a.removeAttribute('aria-current'); });
      if (!current) return;

      if (byId[current.id]) byId[current.id].setAttribute('aria-current', 'true');
      var dark = (current.id === 'arpf' || current.id === 'goals');
      bar.setAttribute('data-on-dark', dark ? 'true' : 'false');
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      mark();
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    order.forEach(function (el) { io.observe(el); });
  }());

  /* ── screenshot settle ──────────────────────────────────────────────
     The recline is added only when the figure is still below the fold,
     then removed as it arrives. If this never runs the frame is already
     flat, which is the state we want anyway. */
  (function tilt() {
    var shot = document.querySelector('.shot');
    if (!shot || still || !hasIO) return;

    var box = shot.getBoundingClientRect();
    if (box.top < window.innerHeight * 0.85) return;   // already in view

    shot.setAttribute('data-tilt', 'on');

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        shot.setAttribute('data-tilt', 'off');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0.1 });

    io.observe(shot);
  }());
}());
