/* ═══════════════════════════════════════════════════════════════════════
   Portal transition
   ───────────────────────────────────────────────────────────────────────
   The circular opening in Media/window_guy.png is transparent, so the
   video can live underneath it. Rather than scaling the video up into
   the hole (which would land on a soft, upscaled final frame), the video
   is pinned as a full-bleed layer and the *opening* is what grows:

     · the photograph scales about the centre of its own opening
     · the video is clipped to an ellipse tracking that same opening
     · once the ellipse clears the viewport the clip is dropped entirely,
       so the arrival frame is an untouched, full-resolution video

   Geometry below was measured off the alpha channel of the PNG itself,
   using the widest transparent row for the centre line and the top of
   the hole for the radius (the guy and the concrete ledge occlude the
   bottom of the circle, so a naive bounding box would sit too high).
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var GEO = {
    CX: 0.48145,   // opening centre — fraction of image width
    CY: 0.41584,   // opening centre — fraction of image height
    RX: 0.30957,   // opening radius — fraction of image width
    RY: 0.29505,   // opening radius — fraction of image height
    IW: 4096,
    IH: 4040
  };

  var stage     = document.getElementById('stage');
  var videoWrap = document.getElementById('videoWrap');
  var video     = document.getElementById('video');
  var portal    = document.getElementById('portal');
  var vignette  = document.getElementById('vignette');
  var scrim     = document.getElementById('scrim');
  var heroText  = document.getElementById('heroText');
  var arrival   = document.getElementById('arrival');
  var loader    = document.getElementById('loader');
  var loaderNum = document.getElementById('loaderNum');
  var zone      = document.getElementById('scrollZone');
  var nav       = document.getElementById('nav');
  var toggle    = document.getElementById('motionToggle');

  // ── source selection ─────────────────────────────────────────────────
  // Chosen once, before the first byte is requested, and deliberately not
  // re-evaluated on resize: swapping mid-playback would restart the cut.
  // Matches the 700px breakpoint the layout and stylesheet already use.
  (function pickSource() {
    var narrowSrc = video.getAttribute('data-src-narrow');
    var wideSrc   = video.getAttribute('data-src-wide');
    var wanted    = (window.innerWidth < 700 && narrowSrc) ? narrowSrc : wideSrc;

    // If the phone cut is missing or fails to decode, fall back once rather
    // than leaving the opening empty.
    video.addEventListener('error', function onErr() {
      if (wanted !== wideSrc) {
        video.removeEventListener('error', onErr);
        video.src = wideSrc;
        video.load();
      }
    });

    video.src = wanted;
  }());

  // ── helpers ──────────────────────────────────────────────────────────
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function smooth(a, b, v) {
    var t = clamp((b - a) === 0 ? 0 : (v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  // ── state ────────────────────────────────────────────────────────────
  var W = 0, H = 0;         // stage size
  var hx = 0, hy = 0;       // opening centre, px
  var rx0 = 0, ry0 = 0;     // opening radii at rest, px
  var sCover = 1;           // scale at which the opening clears the viewport
  var sMax = 1;             // scale we actually drive to (small safety margin)
  var runway = 1;           // scroll distance the transition occupies
  var reduced = false;
  var lastP = -1;
  var clipped = true;
  var arrivedNow = false;

  // ── layout ───────────────────────────────────────────────────────────
  function layout() {
    W = stage.clientWidth;
    H = stage.clientHeight;

    var narrow = W < 700;

    // Where the opening sits, and how large it reads at rest. The photo is
    // black to its edges, so it can be framed freely on the black stage
    // instead of being forced into an oversized `cover` crop.
    hx = W * 0.5;
    hy = H * (narrow ? 0.46 : 0.48);

    var D = narrow
      ? Math.min(H * 0.40, W * 0.82)
      : Math.min(H * 0.66, W * 0.52);

    rx0 = D / 2;

    var imgW = D / (2 * GEO.RX);
    var imgH = imgW * (GEO.IH / GEO.IW);
    ry0 = GEO.RY * imgH;

    var imgL = hx - GEO.CX * imgW;
    var imgT = hy - GEO.CY * imgH;
    var origin = (GEO.CX * 100) + '% ' + (GEO.CY * 100) + '%';

    // The vignette shares the photograph's box and transform so it can
    // blend the image edge into the stage at every scale.
    [portal, vignette].forEach(function (el) {
      el.style.width  = imgW + 'px';
      el.style.height = imgH + 'px';
      el.style.left   = imgL + 'px';
      el.style.top    = imgT + 'px';
      el.style.transformOrigin = origin;
    });

    // Scale needed for the ellipse to swallow the furthest viewport corner.
    var need = 1;
    [[0, 0], [W, 0], [0, H], [W, H]].forEach(function (c) {
      var dx = (c[0] - hx) / rx0;
      var dy = (c[1] - hy) / ry0;
      need = Math.max(need, Math.sqrt(dx * dx + dy * dy));
    });
    sCover = need;
    sMax   = need * 1.04;

    // Published so the hero title can be laid out against the opening
    // itself rather than against the viewport.
    stage.style.setProperty('--hx', hx + 'px');
    stage.style.setProperty('--hy', hy + 'px');
    stage.style.setProperty('--rx', rx0 + 'px');
    stage.style.setProperty('--ry', ry0 + 'px');

    // The portal completes at 2.7 viewports of the 4.2-viewport runway,
    // so ~1.5 screens of scrolling remain to hold the arrival state before
    // the page starts to arrive. Slower on purpose — the transition was
    // over almost as soon as it began.
    runway = Math.max(1, H * 2.7);

    // Drive the runway's height from the measured stage rather than `vh`.
    // On mobile `vh` tracks the *large* viewport while a fixed element gets
    // the small one, so the two disagree by the height of the URL bar.
    zone.style.height = (H * 4.2) + 'px';

    lastP = -1;                       // force a redraw at the new geometry
  }

  // ── the transition itself ────────────────────────────────────────────
  function render(p) {
    if (p === lastP) return;
    lastP = p;

    // Perceived zoom is multiplicative, so interpolate the scale
    // exponentially. The exponent biases the motion late: a slow, readable
    // start that accelerates into the opening.
    var e = Math.pow(p, 1.35);
    var S = Math.pow(sMax, e);

    var scale = 'scale(' + S.toFixed(4) + ')';
    portal.style.transform   = scale;
    vignette.style.transform = scale;

    // Clip the video to the opening, then drop the clip the moment the
    // ellipse clears the viewport so the final frame is untouched.
    if (S < sCover) {
      videoWrap.style.clipPath =
        'ellipse(' + (rx0 * S).toFixed(2) + 'px ' + (ry0 * S).toFixed(2) +
        'px at ' + hx.toFixed(2) + 'px ' + hy.toFixed(2) + 'px)';
      clipped = true;
    } else if (clipped) {
      videoWrap.style.clipPath = 'none';
      videoWrap.style.willChange = 'auto';
      clipped = false;
    }

    // A slight dolly resolving to 1 gives the arrival some depth without
    // ever rendering the video above its native scale.
    video.style.transform = 'scale(' + (1 + 0.12 * (1 - e)).toFixed(4) + ')';

    // Title rushes past the camera and clears early.
    var titleOut = smooth(0, 0.34, p);
    heroText.style.opacity   = String(1 - titleOut);
    heroText.style.transform = 'scale(' + (1 + 0.9 * e).toFixed(4) + ')';
    heroText.style.visibility = titleOut >= 1 ? 'hidden' : 'visible';

    // The concrete ring holds until you are essentially through it.
    portal.style.opacity   = String(1 - smooth(0.80, 0.97, p));
    vignette.style.opacity = String(1 - smooth(0.55, 0.95, p));

    // Scrim arrives with the video so the copy never sits on raw footage.
    scrim.style.opacity = String(smooth(0.62, 0.98, p));

    // Arrival copy resolves once the video owns the frame.
    var inNow = smooth(0.86, 1, p);
    arrival.style.opacity   = String(inNow);
    arrival.style.transform = 'translateY(' + ((1 - inNow) * 24).toFixed(2) + 'px)';
    arrival.setAttribute('aria-hidden', inNow < 0.5 ? 'true' : 'false');

    var arrived = p >= 0.9;
    if (arrived !== arrivedNow) {
      arrivedNow = arrived;
      stage.dataset.state = arrived ? 'arrived' : 'portal';
    }
  }

  // ── scroll plumbing ──────────────────────────────────────────────────
  var ticking = false;
  var stageHidden = false;

  function onFrame() {
    ticking = false;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;

    if (!reduced) render(clamp(y / runway, 0, 1));

    // Flip to the daylight bar only as the page actually reaches it — the
    // lead is one bar-height, so the colour transition lands just as the
    // content slides underneath rather than while it is still over video.
    var overContent = y > zone.offsetHeight - (nav.offsetHeight + 24);
    var want = overContent ? 'solid' : (y > runway * 0.88 ? 'on' : 'off');
    if (nav.dataset.scrim !== want) nav.dataset.scrim = want;

    // Stop compositing video frames once the page has covered the stage.
    var covered = y > zone.offsetHeight + H * 0.25;
    if (covered !== stageHidden) {
      stageHidden = covered;
      stage.style.visibility = covered ? 'hidden' : 'visible';
      if (covered) pauseVideo(false);
      else if (!userPaused) playVideo();
    }
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(onFrame); }
  }

  // ── video ────────────────────────────────────────────────────────────
  var userPaused = false;

  function playVideo() {
    var r = video.play();
    if (r && typeof r.catch === 'function') {
      r.catch(function () {
        // Autoplay refused — wait for the first real interaction.
        var kick = function () {
          video.play().catch(function () {});
          window.removeEventListener('pointerdown', kick);
          window.removeEventListener('keydown', kick);
        };
        window.addEventListener('pointerdown', kick, { once: true });
        window.addEventListener('keydown', kick, { once: true });
      });
    }
  }
  function pauseVideo(byUser) {
    video.pause();
    if (byUser) userPaused = true;
  }

  function syncToggle() {
    var paused = video.paused;
    toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
    toggle.querySelector('.nav__toggle-label').textContent = paused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
  }

  toggle.addEventListener('click', function () {
    if (video.paused) { userPaused = false; playVideo(); }
    else { pauseVideo(true); }
    syncToggle();
  });
  video.addEventListener('play', syncToggle);
  video.addEventListener('pause', syncToggle);

  // Buffering readout — an 85 MB source takes a visible moment, so show it.
  function updateProgress() {
    if (!video.duration || !isFinite(video.duration)) return;
    if (!video.buffered.length) return;
    var pct = Math.min(100, Math.round(video.buffered.end(video.buffered.length - 1) / video.duration * 100));
    loaderNum.textContent = String(pct);
  }
  video.addEventListener('progress', updateProgress);
  video.addEventListener('loadedmetadata', updateProgress);

  function hideLoader() {
    loader.hidden = true;
    loader.setAttribute('aria-hidden', 'true');
  }
  video.addEventListener('canplay', hideLoader, { once: true });
  video.addEventListener('error', hideLoader, { once: true });
  setTimeout(function () { if (video.readyState >= 2) hideLoader(); }, 8000);

  // ── reduced motion ───────────────────────────────────────────────────
  function applyMotionPref(mq) {
    reduced = mq.matches;
    document.body.dataset.motion = reduced ? 'reduced' : 'full';

    if (reduced) {
      // Deliver the destination directly: full-bleed video, no scrub,
      // and the video held still until it is explicitly asked for.
      videoWrap.style.clipPath = 'none';
      videoWrap.style.willChange = 'auto';
      video.style.transform = 'none';
      portal.style.transform = 'none';
      scrim.style.opacity = '1';
      arrival.style.opacity = '1';
      arrival.style.transform = 'none';
      arrival.setAttribute('aria-hidden', 'false');
      stage.dataset.state = 'arrived';
      nav.dataset.scrim = 'on';
      zone.style.height = stage.clientHeight + 'px';   // one screen, no scrub
      userPaused = true;
      video.removeAttribute('autoplay');
      video.pause();
      syncToggle();
    } else {
      layout();
      onFrame();
      if (!userPaused) playVideo();
    }
  }

  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(
    function (e) { applyMotionPref(e); }
  );

  // ── content reveals ──────────────────────────────────────────────────
  function setupReveals() {
    var targets = document.querySelectorAll(
      '.trust__head, .metric, .quote, .journey__media, .journey__body > *, ' +
      '.pillars__head, .leaf-card, .book__cover, .book__body > *, .cta__inner > *'
    );
    if (!('IntersectionObserver' in window) || mq.matches) return;

    Array.prototype.forEach.call(targets, function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = ((i % 6) * 55) + 'ms';
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }

  // ── trust marquee ────────────────────────────────────────────────────
  // Two identical rows in one track, each translated by a full row width.
  // When row 1 has travelled its own width, row 2 sits exactly where row 1
  // began, so the loop closes with no visible seam.
  var marquee = document.getElementById('marquee');
  if (marquee) {
    var row = marquee.querySelector('.marquee__row');
    if (row) {
      var track = document.createElement('div');
      track.className = 'marquee__track';
      marquee.appendChild(track);
      track.appendChild(row);
      var twin = row.cloneNode(true);
      twin.setAttribute('aria-hidden', 'true');
      track.appendChild(twin);
    }

    // The rail sits several screens below the fold. Left running from page
    // load it would be most of the way through its cycle before anyone got
    // here, so the first logo — the one deliberately placed first — would
    // never be seen. It waits at position zero until it is actually on
    // screen, and stops again once it is not.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          marquee.setAttribute('data-paused', en.isIntersecting ? 'false' : 'true');
        });
      }, { threshold: 0.12 }).observe(marquee);
    } else {
      marquee.setAttribute('data-paused', 'false');
    }
  }

  // ── counters ─────────────────────────────────────────────────────────
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count-to')) || 0;
    var dur = 1700;
    var t0 = 0;
    var done = false;

    function finish() {
      if (done) return;
      done = true;
      el.textContent = target.toLocaleString();
    }
    function step(now) {
      if (done) return;
      if (!t0) t0 = now;
      var t = clamp((now - t0) / dur, 0, 1);
      var e = 1 - Math.pow(1 - t, 3);                 // easeOutCubic
      if (t < 1) {
        el.textContent = Math.round(target * e).toLocaleString();
        requestAnimationFrame(step);
      } else finish();
    }
    requestAnimationFrame(step);

    // These are factual figures, not decoration. rAF is suspended whenever
    // the tab is not painting, which would strand the number at whatever it
    // had reached — so a timer guarantees the true value always lands.
    setTimeout(finish, dur + 150);
  }

  function setupCounters() {
    var nums = document.querySelectorAll('[data-count-to]');
    if (!nums.length) return;

    // With motion reduced, or without an observer, just state the figure.
    if (reduced || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(nums, function (el) {
        el.textContent = (parseFloat(el.getAttribute('data-count-to')) || 0).toLocaleString();
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        countUp(en.target);
      });
    }, { threshold: 0.4 });

    Array.prototype.forEach.call(nums, function (el) { io.observe(el); });
  }

  // ── opening sequence ─────────────────────────────────────────────────
  // Held until the display face is resolved, so the title rises already
  // set in Playfair instead of reflowing mid-animation.
  // Added directly rather than inside rAF: the resting state comes from the
  // stylesheet and is already computed by the time this runs, and rAF is
  // suspended in a background tab — which would strand the title unrevealed.
  function startIntro() { heroText.classList.add('is-ready'); }

  if (document.fonts && document.fonts.ready) {
    var settled = false;
    var go = function () { if (!settled) { settled = true; startIntro(); } };
    document.fonts.ready.then(go);
    setTimeout(go, 1500);          // never let a slow font block the reveal
  } else {
    startIntro();
  }

  // ── boot ─────────────────────────────────────────────────────────────
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  layout();
  applyMotionPref(mq);
  setupReveals();
  setupCounters();
  syncToggle();

  window.addEventListener('scroll', onScroll, { passive: true });

  var rt;
  function relayout(delay) {
    clearTimeout(rt);
    rt = setTimeout(function () { if (!reduced) { layout(); onFrame(); } }, delay);
  }

  // Observing the stage catches every case that changes its box — window
  // resize, mobile URL-bar collapse, zoom — including the ones that never
  // fire a window resize event.
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function () { relayout(80); });
    ro.observe(stage);
  }
  window.addEventListener('resize', function () { relayout(120); }, { passive: true });

  window.addEventListener('orientationchange', function () {
    setTimeout(function () { if (!reduced) { layout(); onFrame(); } }, 220);
  });

  window.addEventListener('load', function () {
    if (!reduced) { window.scrollTo(0, 0); layout(); }
    onFrame();
  });

  // Smooth in-page nav without hijacking the browser's own behaviour.
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;

      if (id === '#top') {
        ev.preventDefault();
        window.scrollTo({ top: 0, behavior: mq.matches ? 'auto' : 'smooth' });
        return;
      }

      var t = document.querySelector(id);
      if (!t) return;
      ev.preventDefault();
      t.scrollIntoView({ behavior: mq.matches ? 'auto' : 'smooth', block: 'start' });
    });
  });
})();
