/* ═══════════════════════════════════════════════════════════════════════
   About — the spiral descent
   ───────────────────────────────────────────────────────────────────────
   Two things are driven by scroll:

     · the axis fill, a real progress bar down the middle of the list
     · each era, which swings around that axis as it passes the viewport
       centre — rising blurred from below, locking into focus, then
       rotating up and away

   Each era's transform is a pure function of its distance from the
   viewport centre, so the state is always correct no matter how the user
   arrives at a scroll position (jump, restore, resize, reverse).
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var axisFill = document.getElementById('axisFill');
  var list     = document.getElementById('eras');
  if (!list) return;

  var eras = Array.prototype.slice.call(list.querySelectorAll('.era'));
  var mq   = window.matchMedia('(prefers-reduced-motion: reduce)');
  var flat = window.matchMedia('(max-width: 960px)');

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  // How far past the centre an era travels before it is fully gone. Larger
  // values hold cards in focus longer.
  var REACH = 0.78;

  var ticking = false;
  var liveIdx = -1;

  function frame() {
    ticking = false;

    var vh = window.innerHeight;
    var mid = vh / 2;

    // ── axis fill ──────────────────────────────────────────────────────
    // Measured against the list rather than the page, so the bar reads
    // 0% at the first era and 100% at the last.
    var lr = list.getBoundingClientRect();
    var travelled = clamp((mid - lr.top) / lr.height, 0, 1);
    axisFill.style.height = (travelled * 100).toFixed(2) + '%';

    var still = mq.matches || document.body.getAttribute('data-motion') === 'reduced';
    var plain = still || flat.matches;

    // ── each era ───────────────────────────────────────────────────────
    var bestIdx = -1;
    var bestDist = Infinity;

    for (var i = 0; i < eras.length; i++) {
      var era = eras[i];
      var r = era.getBoundingClientRect();
      var centre = r.top + r.height / 2;
      var d = (centre - mid) / (vh * REACH);        // −1 below … 0 … +1 above
      var t = clamp(d, -1, 1);
      var a = Math.abs(t);

      var dist = Math.abs(centre - mid);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }

      if (plain) continue;

      var stage = era.firstElementChild.nextElementSibling;   // .era__stage

      // Ease the falloff so the middle stays sharp and the extremes drop
      // away quickly — without it every card reads as half-focused.
      var f = a * a;

      var rotY   = t * 46;            // swing around the central axis
      var rotX   = -t * 10;           // the stairwell tilt
      var depth  = -f * 620;          // recede into the distance
      var lift   = -t * 40;
      var scale  = 1 - f * 0.22;
      var fade   = clamp(1 - f * 1.35, 0, 1);
      var soften = f * 7;

      stage.style.transform =
        'translate3d(0,' + lift.toFixed(1) + 'px,' + depth.toFixed(1) + 'px)' +
        ' rotateY(' + rotY.toFixed(2) + 'deg)' +
        ' rotateX(' + rotX.toFixed(2) + 'deg)' +
        ' scale(' + scale.toFixed(4) + ')';
      stage.style.opacity = fade.toFixed(3);
      // Blur is the expensive part, so it is skipped entirely near focus.
      stage.style.filter = soften > 0.35 ? 'blur(' + soften.toFixed(2) + 'px)' : 'none';
    }

    // ── the live node ──────────────────────────────────────────────────
    // Only the era nearest the centre is lit, and only once it is actually
    // close, so nothing is marked "reached" while still far below.
    var reached = bestDist < vh * 0.34 ? bestIdx : -1;
    if (reached !== liveIdx) {
      if (liveIdx > -1) eras[liveIdx].classList.remove('is-live');
      if (reached > -1) eras[reached].classList.add('is-live');
      liveIdx = reached;
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(onScroll).observe(list);

  // Images settle the layout late; recompute as each one lands.
  Array.prototype.forEach.call(list.querySelectorAll('img'), function (img) {
    if (!img.complete) img.addEventListener('load', onScroll, { once: true });
  });

  frame();

  // ── portfolio menu ───────────────────────────────────────────────────
  // Same bridged gap and grace period as the header dropdown: without them
  // the pointer leaves the group on its way down and the menu vanishes.
  var btn  = document.getElementById('folioBtn');
  var menu = document.getElementById('folioMenu');

  if (btn && menu) {
    var group = btn.parentNode;
    var timer = null;
    var pinned = false;

    function set(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.hidden = !open;
    }
    function hold() { clearTimeout(timer); timer = null; }
    function release() {
      hold();
      timer = setTimeout(function () { if (!pinned) set(false); }, 420);
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      hold();
      var open = btn.getAttribute('aria-expanded') !== 'true';
      pinned = open;
      set(open);
    });

    var hoverOK = window.matchMedia('(hover: hover)');
    group.addEventListener('mouseenter', function () { if (hoverOK.matches) { hold(); set(true); } });
    group.addEventListener('mouseleave', function () { if (hoverOK.matches) release(); });
    group.addEventListener('focusin', hold);
    group.addEventListener('focusout', function (e) {
      if (!group.contains(e.relatedTarget)) { pinned = false; set(false); }
    });

    document.addEventListener('click', function (e) {
      if (!group.contains(e.target)) { pinned = false; set(false); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        pinned = false; set(false); btn.focus();
      }
    });
  }
}());


/* ═══════════════════════════════════════════════════════════════════════
   Certification filter
   ───────────────────────────────────────────────────────────────────────
   Eighteen certificates are too many to read as one block, so the field
   chips act as the progressive disclosure: nothing is removed from the
   page, but a reader can narrow to the strand they came for.

   Every card is present in the markup and visible before this runs, so a
   JS failure leaves the full list readable rather than an empty grid.
   ═══════════════════════════════════════════════════════════════════════ */

(function certFilter() {
  'use strict';

  var grid = document.getElementById('certsGrid');
  var bar  = document.querySelector('.certs__filter');
  if (!grid || !bar) return;

  var cards  = Array.prototype.slice.call(grid.querySelectorAll('.cert'));
  var chips  = Array.prototype.slice.call(bar.querySelectorAll('.chip-btn'));
  var status = document.getElementById('certsStatus');
  var total  = cards.length;

  function apply(want, label) {
    var shown = 0;

    cards.forEach(function (card) {
      var keep = (want === 'all') || card.getAttribute('data-cat') === want;
      card.classList.toggle('is-out', !keep);
      if (keep) shown++;
    });

    chips.forEach(function (chip) {
      var on = chip.getAttribute('data-filter') === want;
      chip.classList.toggle('is-on', on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    // Announced as a whole sentence, and without moving focus — the
    // reader stays on the chip they just pressed.
    if (status) {
      status.textContent = (want === 'all')
        ? 'Showing all ' + total + ' certifications.'
        : 'Showing ' + shown + ' of ' + total +
          ' certifications in ' + label + '.';
    }
  }

  bar.addEventListener('click', function (e) {
    var chip = e.target.closest ? e.target.closest('.chip-btn') : null;
    if (!chip || !bar.contains(chip)) return;

    // The count badge is decoration; the field name is the label.
    var n     = chip.querySelector('.chip-btn__n');
    var label = (n ? chip.textContent.replace(n.textContent, '') : chip.textContent).trim();

    apply(chip.getAttribute('data-filter'), label);
  });
}());
