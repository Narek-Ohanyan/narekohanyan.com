/* ═══════════════════════════════════════════════════════════════════════
   Media — click-to-play video facades
   ───────────────────────────────────────────────────────────────────────
   Ten embedded players would pull megabytes of YouTube script on load, on
   every visit, whether or not anything is watched. Instead each video is a
   still with a play control; the iframe is built only when it is pressed.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // A missing maxres thumbnail 404s to a 120x90 placeholder rather than
  // failing outright, so it is detected by size and swapped for hqdefault,
  // which every video has.
  Array.prototype.forEach.call(
    document.querySelectorAll('img[data-fallback]'),
    function (img) {
      function swap() {
        var id = img.getAttribute('data-fallback');
        if (!id || img.dataset.swapped) return;
        img.dataset.swapped = '1';
        img.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
      }
      img.addEventListener('error', swap);
      img.addEventListener('load', function () {
        if (img.naturalWidth > 0 && img.naturalWidth < 200) swap();
      });
      if (img.complete && img.naturalWidth > 0 && img.naturalWidth < 200) swap();
    }
  );

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-yt]');
    if (!btn) return;

    var id = btn.getAttribute('data-yt');
    var frame = document.createElement('iframe');

    // YouTube validates the embedding origin. Opened straight off disk the
    // origin is "null" and the player refuses with Error 153 — nothing the
    // markup can do about that — so the origin is passed explicitly when
    // the page is actually being served, and omitted when it is not.
    var served = /^https?:$/.test(location.protocol);
    var params = 'autoplay=1&rel=0&modestbranding=1&playsinline=1'
               + (served ? '&origin=' + encodeURIComponent(location.origin) : '');

    // The standard host rather than the nocookie one: privacy extensions
    // and strict blocking modes break the nocookie player far more often,
    // and it is the player itself that produces the 153.
    frame.src = 'https://www.youtube.com/embed/' + id + '?' + params;
    frame.title = btn.getAttribute('aria-label') || 'Video player';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; ' +
                  'gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.className = btn.className + ' is-live';
    frame.setAttribute('frameborder', '0');

    btn.replaceWith(frame);
    frame.focus();
  });
}());

/* ── Featured films: rotate the two hero films ───────────────────────────
   Advances every 10 s. It holds still while the pointer or keyboard focus
   is inside it, once a film has been started, when the tab is hidden, if
   the visitor pressed pause, and always for reduced motion (then it only
   changes when the arrows or dots are used). */
(function () {
  'use strict';
  var box = document.getElementById('bcSlides');
  if (!box) return;

  var slides = Array.prototype.slice.call(box.querySelectorAll('.broadcast__slide'));
  var dots   = Array.prototype.slice.call(document.querySelectorAll('.broadcast__dot'));
  var pause  = document.querySelector('.broadcast__pause');
  var bar    = document.querySelector('.broadcast__bar');
  var still  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = 0, timer = 0, held = false, userPaused = still;

  function show(n) {
    cur = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      var on = i === cur;
      s.classList.toggle('is-active', on);
      if (on) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
      if ('inert' in s) s.inert = !on;
    });
    dots.forEach(function (d, i) {
      d.classList.toggle('is-on', i === cur);
      if (i === cur) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
  }

  function playing() { return !!box.querySelector('iframe'); }
  function stop() { clearInterval(timer); timer = 0; }
  function start() {
    stop();
    if (userPaused || held || playing() || document.hidden) return;
    timer = setInterval(function () {
      if (playing()) { stop(); return; }
      show(cur + 1);
    }, 10000);
  }
  function setPaused(v) {
    userPaused = v;
    if (pause) {
      pause.setAttribute('aria-pressed', v ? 'true' : 'false');
      pause.setAttribute('aria-label', v ? 'Resume automatic rotation' : 'Pause automatic rotation');
    }
    start();
  }

  bar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-bc]');
    if (!b) return;
    var k = b.getAttribute('data-bc');
    if (k === 'pause') { setPaused(!userPaused); return; }
    show(k === 'prev' ? cur - 1 : k === 'next' ? cur + 1 : parseInt(k, 10));
    start();
  });

  [box, bar].forEach(function (el) {
    el.addEventListener('pointerenter', function () { held = true; stop(); });
    el.addEventListener('pointerleave', function () { held = false; start(); });
    el.addEventListener('focusin',      function () { held = true; stop(); });
    el.addEventListener('focusout',     function () { held = false; start(); });
  });
  // a film that has been started keeps its slide until the visitor moves on
  box.addEventListener('click', function (e) { if (e.target.closest('[data-yt]')) stop(); });
  document.addEventListener('visibilitychange', start);

  if (still && pause) { pause.setAttribute('aria-pressed', 'true'); pause.setAttribute('aria-label', 'Resume automatic rotation'); }
  show(0);
  start();
}());
