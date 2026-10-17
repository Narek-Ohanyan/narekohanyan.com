/* ═══════════════════════════════════════════════════════════════════════
   Homepage COP17 section — pointer parallax and click-to-release butterflies
   Same behaviour as the /cop17/ hero, scoped to #homeC17. Both are skipped
   for visitors who prefer reduced motion or have no hover-capable pointer.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var sec = document.getElementById('homeC17');
  if (!sec) return;

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (still) return;

  if (fine) {
    var raf = 0, tx = 0, ty = 0;
    sec.addEventListener('pointermove', function (e) {
      var r = sec.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        sec.style.setProperty('--px', tx.toFixed(3));
        sec.style.setProperty('--py', ty.toFixed(3));
      });
    });
    sec.addEventListener('pointerleave', function () {
      sec.style.setProperty('--px', 0); sec.style.setProperty('--py', 0);
    });
  }

  // Also release butterflies on their own, while the section is on screen.
  if ('IntersectionObserver' in window) {
    var inView = false;
    new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: 0.25 }).observe(sec);
    var one = function () {
      if (!inView || document.visibilityState !== 'visible') return;
      if (sec.querySelectorAll('.c17-spawn').length >= 18) return;
      var r = sec.getBoundingClientRect();
      var b = document.createElement('img');
      b.src = 'Media/web/cop17/butterfly.png'; b.alt = ''; b.className = 'c17-spawn'; b.setAttribute('aria-hidden', 'true');
      b.style.left = (r.width * (0.05 + Math.random() * 0.9)).toFixed(0) + 'px';
      b.style.top  = (r.height * (0.5 + Math.random() * 0.42)).toFixed(0) + 'px';
      b.style.width = (1.6 + Math.random() * 1.6).toFixed(2) + 'rem';
      b.style.setProperty('--dx', (Math.random() * 220 - 80).toFixed(0) + 'px');
      b.style.setProperty('--rot', (Math.random() * 60 - 30).toFixed(0) + 'deg');
      sec.appendChild(b);
      b.addEventListener('animationend', function () { b.remove(); });
    };
    var auto = function () {
      window.setTimeout(auto, 1500 + Math.random() * 1500);
      var n = 4 + Math.floor(Math.random() * 5);
      for (var i = 0; i < n; i++) window.setTimeout(one, i * (90 + Math.random() * 200));
    };
    window.setTimeout(auto, 1200);
  }

  sec.addEventListener('click', function (e) {
    if (e.target.closest('a, button')) return;
    var r = sec.getBoundingClientRect();
    var b = document.createElement('img');
    b.src = 'Media/web/cop17/butterfly.png'; b.alt = ''; b.className = 'c17-spawn'; b.setAttribute('aria-hidden', 'true');
    b.style.left = (e.clientX - r.left) + 'px'; b.style.top = (e.clientY - r.top) + 'px';
    b.style.setProperty('--dx', (Math.random() * 160 - 40).toFixed(0) + 'px');
    b.style.setProperty('--rot', (Math.random() * 50 - 25).toFixed(0) + 'deg');
    sec.appendChild(b);
    b.addEventListener('animationend', function () { b.remove(); });
  });
}());
