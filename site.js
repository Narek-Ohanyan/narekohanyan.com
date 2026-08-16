/* ═══════════════════════════════════════════════════════════════════════
   Shared chrome — primary navigation
   ───────────────────────────────────────────────────────────────────────
   Loaded by every page. Owns the Portfolio dropdown and the mobile
   drawer; the homepage's portal logic lives separately in main.js.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var nav = document.getElementById('nav');
  if (!nav) return;

  // ── portfolio dropdown ───────────────────────────────────────────────
  var subBtn = document.getElementById('portfolioBtn');
  var subMenu = document.getElementById('portfolioMenu');
  var subGroup = subBtn ? subBtn.parentNode : null;

  function setSub(open) {
    if (!subBtn) return;
    subBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    subMenu.hidden = !open;
  }

  if (subBtn) {
    var subTimer = null;
    var subPinned = false;          // opened by click — stays until dismissed

    function cancelClose() { clearTimeout(subTimer); subTimer = null; }
    function closeSoon() {
      cancelClose();
      // A grace period, so brushing outside the menu on the way to an item
      // does not snatch it away mid-reach.
      subTimer = setTimeout(function () { if (!subPinned) setSub(false); }, 420);
    }

    subBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      cancelClose();
      var open = subBtn.getAttribute('aria-expanded') !== 'true';
      subPinned = open;
      setSub(open);
    });

    // Pointer users get hover on the wide layout; touch and keyboard use
    // the button, which is why the control is a real button either way.
    var hoverOK = window.matchMedia('(hover: hover) and (min-width: 1081px)');
    subGroup.addEventListener('mouseenter', function () {
      if (!hoverOK.matches) return;
      cancelClose();
      setSub(true);
    });
    subGroup.addEventListener('mouseleave', function () {
      if (hoverOK.matches) closeSoon();
    });

    // Keyboard users must be able to tab through the items without the
    // menu closing behind them.
    subGroup.addEventListener('focusin', cancelClose);
    subGroup.addEventListener('focusout', function (e) {
      if (!subGroup.contains(e.relatedTarget)) { subPinned = false; setSub(false); }
    });

    document.addEventListener('click', function (e) {
      if (subGroup && !subGroup.contains(e.target)) { subPinned = false; setSub(false); }
    });
  }

  // ── mobile drawer ────────────────────────────────────────────────────
  var menuBtn  = document.getElementById('menuBtn');
  var navLinks = document.getElementById('navLinks');
  var navScrim = document.getElementById('navScrim');
  var menuOpen = false;

  function setMenu(open) {
    if (!menuBtn) return;
    menuOpen = open;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    navLinks.setAttribute('data-open', open ? 'true' : 'false');
    navScrim.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      var first = navLinks.querySelector('a, button');
      if (first) first.focus();
    }
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(!menuOpen); });
    navScrim.addEventListener('click', function () { setMenu(false); });

    // Following a link should not leave the drawer open behind the page.
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    // Leaving the narrow layout with the drawer open would strand the
    // scroll lock, so unwind it on the way out.
    var wide = window.matchMedia('(min-width: 1081px)');
    var onWide = function (e) { if (e.matches && menuOpen) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (menuOpen) { setMenu(false); menuBtn.focus(); }
    else if (subBtn && subBtn.getAttribute('aria-expanded') === 'true') {
      setSub(false); subBtn.focus();
    }
  });


  // ── scroll reveals ───────────────────────────────────────────────────
  // Opt-in via [data-reveal], so pages that never asked for it are
  // untouched. Elements are visible by default and only hidden once the
  // observer is confirmed available — a failure here can never leave
  // content permanently invisible.
  (function reveals() {
    var targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || !('IntersectionObserver' in window)) return;

    Array.prototype.forEach.call(targets, function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = ((i % 5) * 60) + 'ms';
    });

    var pending = Array.prototype.slice.call(targets);

    function reveal(el) {
      el.classList.add('is-in');
      var i = pending.indexOf(el);
      if (i > -1) pending.splice(i, 1);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        reveal(en.target);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });

    // Safety net. That IntersectionObserver *exists* is not the same as it
    // delivering: a suspended rendering lifecycle can report for what was on
    // screen at load and then go quiet, which strands everything below the
    // fold at opacity 0 — the whole body, on a page that opens with a
    // full-height hero. So sweep for targets that are inside the viewport
    // but still hidden and reveal those. It never reveals off-screen content
    // early, so the intended animation is untouched when the observer is
    // healthy; it simply finds nothing to do.
    function sweep() {
      if (!pending.length) return;
      var h = window.innerHeight;
      pending.slice().forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < h && r.bottom > 0) { reveal(el); io.unobserve(el); }
      });
      if (!pending.length) {
        window.removeEventListener('scroll', queue);
        window.removeEventListener('resize', queue);
      }
    }

    // Throttled on a timestamp rather than requestAnimationFrame: rAF is part
    // of the same rendering lifecycle that may have stalled, and a safety net
    // must not depend on the mechanism it exists to cover for.
    var last = 0;
    function queue() {
      var now = Date.now();
      if (now - last < 120) return;
      last = now;
      sweep();
    }

    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    setTimeout(sweep, 1600);
  }());

  // ── navigation that outgrew its bar ──────────────────────────────────
  // The horizontal nav is sized for English. Translated labels are longer —
  // the Armenian bar overflows a 1440px viewport and pushes the language
  // switcher off screen. Rather than guess a breakpoint per language, measure
  // whether the links actually fit and hand over to the drawer when they do
  // not. Measured with the drawer styles suspended, otherwise the collapsed
  // width would read as fitting and it would oscillate.
  (function cramped() {
    var links = document.getElementById('navLinks');
    var mark  = nav.querySelector('.nav__mark');
    var tools = nav.querySelector('.nav__tools');
    if (!links || !mark || !tools) return;

    function fits() {
      var was = nav.getAttribute('data-cramped');
      nav.removeAttribute('data-cramped');
      var need = mark.getBoundingClientRect().width +
                 links.scrollWidth +
                 tools.getBoundingClientRect().width;
      var have = nav.clientWidth - 32;          // breathing room either side
      if (was) nav.setAttribute('data-cramped', was);
      return need <= have;
    }

    function apply() {
      // Below the CSS breakpoint the drawer is already in charge.
      if (window.innerWidth <= 1080) { nav.removeAttribute('data-cramped'); return; }
      if (fits()) nav.removeAttribute('data-cramped');
      else nav.setAttribute('data-cramped', 'true');
    }

    var t = 0;
    window.addEventListener('resize', function () {
      var n = Date.now();
      if (n - t < 150) return;
      t = n;
      apply();
    });

    apply();
    // Re-measure once webfonts land: label widths change under them.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
  }());

  // Any page can mark its own location; the stylesheet does the rest.
  var here = document.body.getAttribute('data-page');
  if (here) {
    // Scoped to the link list: the wordmark also points home, and would
    // otherwise be marked as the current page instead of the Home item.
    var link = nav.querySelector('.nav__links a[href="' + here + '"]');
    if (link) {
      link.setAttribute('aria-current', 'page');
      // A current page inside the dropdown should also mark its parent.
      var group = link.closest('.nav__group');
      if (group) group.querySelector('.nav__group-btn').classList.add('is-current');
    }
  }
}());
