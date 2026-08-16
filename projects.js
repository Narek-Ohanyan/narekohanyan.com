/* ═══════════════════════════════════════════════════════════════════════
   Project Leadership
   ───────────────────────────────────────────────────────────────────────
   Nav scrim and the section rail. The one photo gallery is the shared
   component in gallery.js.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var nav = document.getElementById('nav');
  var hero = document.querySelector('.pj-hero');
  var bar = document.getElementById('rail');
  if (!nav || !hero) return;

  var links = bar ? Array.prototype.slice.call(bar.querySelectorAll('a')) : [];
  var order = [], byId = {};
  links.forEach(function (a) {
    var el = document.getElementById(a.getAttribute('href').slice(1));
    if (el) { order.push(el); byId[el.id] = a; }
  });

  /* Scroll-driven rather than observer-driven. The scrim is the important
     half: the bar ships transparent with near-white text for the dark hero,
     and if it never flipped the navigation would vanish against the white
     tiers. One attribute write every 120ms is cheap insurance. */
  var last = 0;

  function apply() {
    var pastHero = window.scrollY >= hero.offsetHeight - 80;
    nav.setAttribute('data-scrim', pastHero ? 'solid' : 'on');
    if (!bar) return;

    bar.setAttribute('data-past-hero', pastHero ? 'true' : 'false');

    var mid = window.innerHeight * 0.45, here = null;
    order.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) here = el;
    });
    links.forEach(function (a) { a.removeAttribute('aria-current'); });
    if (here && byId[here.id]) byId[here.id].setAttribute('aria-current', 'true');
    bar.setAttribute('data-on-dark',
      here && here.classList.contains('pj-tier--dark') ? 'true' : 'false');
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
