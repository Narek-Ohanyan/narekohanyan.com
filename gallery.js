/* ═══════════════════════════════════════════════════════════════════════
   Photo gallery
   ───────────────────────────────────────────────────────────────────────
   Shared by the policy and education pages.

   Manual by design. Anything that rotates on its own owes the reader a
   pause control, has to stop on focus, and has to stand still under
   prefers-reduced-motion — three obligations a gallery the reader drives
   simply does not incur. Position is read back from the scroll container
   rather than tracked in a variable, so a touch swipe, a button press and
   a dot all agree without any one of them being the source of truth.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── carousels ──────────────────────────────────────────────────── */
  Array.prototype.forEach.call(document.querySelectorAll('.gal'), function (car) {
    var track = car.querySelector('.gal__track');
    var slides = Array.prototype.slice.call(car.querySelectorAll('.gal__slide'));
    var dots = Array.prototype.slice.call(car.querySelectorAll('.gal__dot'));
    var prev = car.querySelector('[data-dir="-1"]');
    var next = car.querySelector('[data-dir="1"]');
    var say = car.querySelector('[role="status"]');
    if (!track || slides.length < 2) {
      if (car.querySelector('.gal__bar')) car.querySelector('.gal__bar').hidden = slides.length < 2;
      return;
    }

    var at = 0;

    /* Positions are measured against the track's own box, never via
       offsetLeft. offsetLeft is relative to the nearest *positioned*
       ancestor, and the track is static — so once a gallery sits in a
       grid column the offsets carry the column's inset (806px in the
       education layout) and every jump lands on the wrong slide. */
    function offsetOf(s) {
      return s.getBoundingClientRect().left
           - track.getBoundingClientRect().left
           + track.scrollLeft;
    }

    // Which slide is nearest the centre of the visible box. Read from the
    // DOM so swipe, buttons and dots cannot disagree.
    function current() {
      var tr = track.getBoundingClientRect();
      var mid = tr.left + tr.width / 2;
      var best = 0, bestD = Infinity;
      slides.forEach(function (s, i) {
        var r = s.getBoundingClientRect();
        var d = Math.abs((r.left + r.width / 2) - mid);
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    }

    function paint(i, announce) {
      at = i;
      dots.forEach(function (d, k) {
        var on = k === i;
        d.classList.toggle('is-on', on);
        if (on) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
      // Announced as a whole phrase, and only when the reader moved the
      // gallery themselves — not on every scroll frame.
      if (announce && say) say.textContent = 'Photograph ' + (i + 1) + ' of ' + slides.length + '.';
    }

    function go(i, announce) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: offsetOf(slides[i]), behavior: still ? 'auto' : 'smooth' });
      paint(i, announce);
    }

    if (prev) prev.addEventListener('click', function () { go(at - 1, true); });
    if (next) next.addEventListener('click', function () { go(at + 1, true); });
    dots.forEach(function (d) {
      d.addEventListener('click', function () { go(+d.getAttribute('data-go'), true); });
    });

    // Arrow keys work once the gallery has focus, without hijacking the
    // page's own scrolling.
    car.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(at - 1, true); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(at + 1, true); }
    });

    // Swipe and trackpad scroll settle the state without announcing, so a
    // screen reader is not narrating every intermediate frame.
    var t = 0;
    track.addEventListener('scroll', function () {
      clearTimeout(t);
      t = setTimeout(function () { paint(current(), false); }, 90);
    }, { passive: true });

    paint(0, false);
  });
}());
