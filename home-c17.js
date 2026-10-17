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
