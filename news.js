/* ═══════════════════════════════════════════════════════════════════════
   Newsroom entry — image carousel
   ───────────────────────────────────────────────────────────────────────
   Auto-advances, but every part of that is under the reader's control:
   previous/next, a play–pause toggle, dots, arrow keys, and swipe. It
   stops on hover and on focus, and never starts at all when the reader has
   asked for reduced motion.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var root   = document.getElementById('shots');
  var track  = document.getElementById('shotsTrack');
  if (!root || !track) return;

  var slides = Array.prototype.slice.call(track.children);
  var dots   = Array.prototype.slice.call(root.querySelectorAll('[data-go]'));
  var cap    = document.getElementById('shotsCap');
  var toggle = document.getElementById('shotsToggle');
  var label  = toggle ? toggle.querySelector('.shots__toggle-label') : null;

  var count = slides.length;
  var at    = 0;
  var timer = null;
  var HOLD  = 5200;

  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function stilled() {
    return mq.matches || document.body.getAttribute('data-motion') === 'reduced';
  }

  // ── render ───────────────────────────────────────────────────────────
  function show(i) {
    at = (i + count) % count;
    track.style.transform = 'translate3d(' + (-at * 100) + '%,0,0)';

    slides.forEach(function (s, n) {
      // Off-screen slides are hidden from assistive tech and from tab order,
      // so the carousel reads as one item rather than six stacked ones.
      s.setAttribute('aria-hidden', n === at ? 'false' : 'true');
      s.classList.toggle('is-at', n === at);
    });
    dots.forEach(function (d, n) {
      if (n === at) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });

    var img = slides[at].querySelector('img');
    if (cap && img) cap.textContent = img.getAttribute('alt') || '';
  }

  function step(n) { show(at + n); }

  // ── auto-advance ─────────────────────────────────────────────────────
  function tick() { show(at + 1); }

  function play() {
    stop();
    if (stilled()) return;                 // never auto-run against the request
    timer = setInterval(tick, HOLD);
    root.setAttribute('data-playing', 'true');
    if (toggle) {
      toggle.setAttribute('aria-pressed', 'true');
      toggle.setAttribute('aria-label', 'Pause the slideshow');
      if (label) label.textContent = 'Pause';
    }
  }
  function stop() {
    clearInterval(timer);
    timer = null;
  }
  function pause() {
    stop();
    root.setAttribute('data-playing', 'false');
    if (toggle) {
      toggle.setAttribute('aria-pressed', 'false');
      toggle.setAttribute('aria-label', 'Play the slideshow');
      if (label) label.textContent = 'Play';
    }
  }
  var wanted = function () { return root.getAttribute('data-playing') === 'true'; };

  // Hovering or tabbing in suspends the timer without changing the reader's
  // play/pause choice — it resumes only if they had it playing.
  function suspend() { stop(); }
  function resume()  { if (wanted() && !stilled()) play(); }

  root.addEventListener('mouseenter', suspend);
  root.addEventListener('mouseleave', resume);
  root.addEventListener('focusin',  suspend);
  root.addEventListener('focusout', function (e) {
    if (!root.contains(e.relatedTarget)) resume();
  });

  // ── controls ─────────────────────────────────────────────────────────
  root.addEventListener('click', function (e) {
    var nav = e.target.closest('[data-step]');
    if (nav) { step(parseInt(nav.getAttribute('data-step'), 10)); pause(); return; }

    var dot = e.target.closest('[data-go]');
    if (dot) { show(parseInt(dot.getAttribute('data-go'), 10)); pause(); }
  });

  if (toggle) {
    toggle.addEventListener('click', function () {
      if (timer) pause(); else { root.setAttribute('data-playing', 'true'); play(); }
    });
  }

  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  { step(-1); pause(); }
    if (e.key === 'ArrowRight') { step(1);  pause(); }
  });

  // ── swipe ────────────────────────────────────────────────────────────
  // A threshold keeps a vertical scroll from being read as a swipe.
  var x0 = null, y0 = null;
  track.addEventListener('touchstart', function (e) {
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  track.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    var dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { step(dx < 0 ? 1 : -1); pause(); }
    x0 = y0 = null;
  }, { passive: true });

  // ── boot ─────────────────────────────────────────────────────────────
  show(0);
  if (stilled()) pause(); else play();

  var onPref = function () { if (stilled()) pause(); else resume(); };
  if (mq.addEventListener) mq.addEventListener('change', onPref);
  else if (mq.addListener) mq.addListener(onPref);

  // Nothing should keep ticking in a tab nobody is looking at.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else resume();
  });
}());
