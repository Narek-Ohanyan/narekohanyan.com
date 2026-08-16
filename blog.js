/* ═══════════════════════════════════════════════════════════════════════
   Blog — filtering, paging, reading progress
   ───────────────────────────────────────────────────────────────────────
   Loaded by the index and by each post. Every part is written so the page
   is complete without it: the full post list is the markup's default
   state, and the progress bar is decorative.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── artwork that has not landed yet ─────────────────────────────────
     Covers and figures are referenced at their real paths. Until the files
     exist the extension is unknown, so a few are tried in turn; if none
     resolve the frame states plainly what belongs there rather than
     collapsing or showing a broken icon. */
  Array.prototype.forEach.call(document.querySelectorAll('img[data-try]'), function (img) {
    var exts = ['jpg', 'jpeg', 'png', 'webp'];
    var base = img.getAttribute('data-try');
    var i = 0;

    img.addEventListener('error', function next() {
      i += 1;
      if (i < exts.length) { img.src = base + '.' + exts[i]; return; }

      var slot = img.closest('.fig, .art__cover, .post-card__shot');
      if (!slot) return;
      slot.classList.add('is-pending');
      slot.style.setProperty('--pending', '"' + base.split('/').pop() + '"');
      img.remove();
    });
  });

  /* ── reading progress ────────────────────────────────────────────── */
  var bar = document.getElementById('readBar');
  var art = document.querySelector('.art');

  if (bar && art) {
    var ticking = false;

    function draw() {
      ticking = false;
      var box = art.getBoundingClientRect();
      var run = box.height - window.innerHeight;
      // Short pieces never scroll past a full screen; showing 0% forever
      // would read as broken, so they simply sit at complete.
      var p = run <= 0 ? 1 : Math.min(Math.max(-box.top / run, 0), 1);
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(draw);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    draw();
  }

  /* ── index: tags + paging ────────────────────────────────────────── */
  var grid = document.getElementById('postGrid');
  if (!grid) return;

  var cards  = Array.prototype.slice.call(grid.children);
  var chips  = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var count  = document.getElementById('filterCount');
  var empty  = document.getElementById('postEmpty');
  var pager  = document.getElementById('pager');
  var pagerAt = document.getElementById('pagerAt');

  var PER_PAGE = 9;          // the archive splits once it outgrows one page
  var tag = '';
  var page = 0;

  function matching() {
    if (!tag) return cards;
    return cards.filter(function (c) {
      return (c.getAttribute('data-tags') || '').split('|').indexOf(tag) > -1;
    });
  }

  function render() {
    var list = matching();
    var pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (page > pages - 1) page = pages - 1;

    var from = page * PER_PAGE;
    var shown = list.slice(from, from + PER_PAGE);

    cards.forEach(function (c) {
      var on = shown.indexOf(c) > -1;
      c.hidden = !on;
      // Re-run the entrance so filtered-in cards animate rather than
      // appearing abruptly mid-list.
      if (on && c.classList.contains('reveal')) c.classList.add('is-in');
    });

    if (empty) empty.hidden = list.length !== 0;

    if (count) {
      count.textContent = list.length
        ? list.length + (list.length === 1 ? ' post' : ' posts')
            + (tag ? ' tagged ' + tag : '')
        : '';
    }

    if (pager) {
      pager.hidden = pages < 2;
      if (pagerAt) pagerAt.textContent = 'Page ' + (page + 1) + ' of ' + pages;
      var prev = pager.querySelector('[data-page="prev"]');
      var next = pager.querySelector('[data-page="next"]');
      if (prev) prev.disabled = page === 0;
      if (next) next.disabled = page >= pages - 1;
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var want = chip.getAttribute('data-tag') || '';
      tag = (tag === want) ? '' : want;      // pressing the active tag clears it
      page = 0;

      chips.forEach(function (c) {
        var on = (c.getAttribute('data-tag') || '') === tag;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render();
    });
  });

  if (pager) {
    pager.addEventListener('click', function (e) {
      var b = e.target.closest('[data-page]');
      if (!b || b.disabled) return;
      page += (b.getAttribute('data-page') === 'next') ? 1 : -1;
      render();
      grid.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }

  render();
}());
