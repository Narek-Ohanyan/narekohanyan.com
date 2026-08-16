/* Stashed while the language feature is on hold.
   Re-append to site.js when localisation resumes. */
/* ── language switcher ─────────────────────────────────────────────────
   Present only on pages the localisation build has produced. Same grace
   behaviour as the Portfolio menu so the two feel like one control set. */
(function language() {
  'use strict';

  var btn  = document.getElementById('langBtn');
  var menu = document.getElementById('langMenu');
  if (!btn || !menu) return;

  function set(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.hidden = !open;
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    set(btn.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target) && e.target !== btn) set(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
      set(false); btn.focus();
    }
  });
}());
