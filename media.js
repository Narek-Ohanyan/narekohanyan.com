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
