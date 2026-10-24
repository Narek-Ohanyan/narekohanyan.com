/* ═══════════════════════════════════════════════════════════════════════
   Homepage invitation to my COP17 schedule page
   ───────────────────────────────────────────────────────────────────────
   Shown ONLY on the homepage, from 17 October 2026 until the last day of
   the conference (30 October, Yerevan time). From 31 October it is off on
   every page. Once per visitor per day, after the visitor has scrolled
   through the opening and the hero is fully open. Dates are read in Yerevan
   time, so it switches on and off at local midnight whatever the visitor's
   own clock says.

   Change SHOW_FROM / SHOW_UNTIL to move the window. It builds its own
   markup, so the only edit a page needs is loading this script.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var SHOW_FROM  = '2026-10-17';
  var SHOW_UNTIL = '2026-10-30';   // last conference day; off from 31 Oct
  var STORE      = 'no.c17pop.day';
  var TARGET     = 'cop17/';

  var T = {
    en: {
      eyebrow: 'UN Biodiversity Conference · Yerevan',
      when: '19–30 October 2026',
      h: 'COP17 is in Yerevan. Come and find me.',
      p: 'See where I’ll be each day, read the daily recaps, and book me to speak. It is all on one page.',
      go: 'See my COP17 schedule',
      note: 'My personal page, not the official COP17 website.',
      later: 'Maybe later',
      close: 'Close',
      alt: 'Narek Ohanyan, his portrait cut into the COP17 butterfly shape'
    },
    hy: {
      eyebrow: 'ՄԱԿ Կենսաբազմազանության համաժողով · Երևան',
      when: '2026 թ. հոկտեմբերի 19–30',
      h: 'COP17-ը Երևանում է։ Գտեք ինձ։',
      p: 'Տեսեք, թե որ օրը որտեղ եմ, կարդացեք օրվա ամփոփումները և հրավիրեք ինձ ելույթի։ Ամեն ինչ՝ մեկ էջում։',
      go: 'Տեսնել իմ COP17 ժամանակացույցը',
      note: 'Սա իմ անձնական էջն է, ոչ թե COP17-ի պաշտոնական կայքը։',
      later: 'Հետո',
      close: 'Փակել',
      alt: 'Նարեկ Օհանյանի դիմանկարը՝ COP17-ի թիթեռի տեսքով'
    }
  };

  function yerevanDay() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Yerevan' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }

  // homepage only, even if this script is ever included elsewhere
  if (!/^\/(index\.html)?$/.test(location.pathname)) return;

  var today = yerevanDay();
  if (today < SHOW_FROM || today > SHOW_UNTIL) return;
  if (typeof HTMLDialogElement === 'undefined') return;

  try { if (localStorage.getItem(STORE) === today) return; } catch (e) { /* private mode: show it */ }

  var lang = 'en';
  try {
    var saved = localStorage.getItem('c17.lang');
    lang = saved === 'hy' || saved === 'en' ? saved
         : /^hy\b/i.test(navigator.language || '') ? 'hy' : 'en';
  } catch (e) {}
  var s = T[lang];

  function remember() { try { localStorage.setItem(STORE, today); } catch (e) {} }

  var d = document.createElement('dialog');
  d.className = 'c17-pop';
  d.setAttribute('aria-labelledby', 'c17PopH');
  d.setAttribute('lang', lang);
  d.innerHTML =
    '<button class="c17-pop__x" type="button" aria-label="' + s.close + '" data-pop-close>' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
    '<div class="c17-pop__art" aria-hidden="true"><span class="c17-pop__halo"></span>' +
      '<img src="Media/web/cop17/narek-butterfly.webp" alt="" width="1000" height="1442" decoding="async"></div>' +
    '<div class="c17-pop__body">' +
      '<p class="c17-pop__eyebrow">' + s.eyebrow + '<br><b>' + s.when + '</b></p>' +
      '<h2 class="c17-pop__h" id="c17PopH">' + s.h + '</h2>' +
      '<p class="c17-pop__p">' + s.p + '</p>' +
      '<div class="c17-pop__btns">' +
        '<a class="btn btn--leaf" href="' + TARGET + (lang === 'hy' ? '?lang=hy' : '') + '" data-pop-go>' + s.go +
          ' <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15"/><path d="m13 6 6 6-6 6"/></svg></a>' +
        '<button class="btn btn--wire" type="button" data-pop-close>' + s.later + '</button>' +
      '</div>' +
      '<p class="c17-pop__note">' + s.note + '</p>' +
    '</div>';

  function open() {
    document.body.appendChild(d);
    d.showModal();
    document.documentElement.classList.add('c17-pop-lock');
    var go = d.querySelector('[data-pop-go]');
    if (go) go.focus({ preventScroll: true });
  }

  d.addEventListener('click', function (e) {
    if (e.target === d || e.target.closest('[data-pop-close]')) d.close();
    if (e.target.closest('[data-pop-go]')) remember();
  });
  d.addEventListener('close', function () {
    remember();
    document.documentElement.classList.remove('c17-pop-lock');
    d.remove();
  });

  // Wait until the visitor has scrolled through the opening and the hero is fully open
  // (main.js marks the stage data-state="arrived"). Visitors who prefer reduced motion
  // get a single static screen, so they see it after a short pause instead.
  var stage = document.getElementById('stage');
  var shown = false;
  function arm(delay) {
    if (shown) return;
    shown = true;
    if (observer) observer.disconnect();
    window.setTimeout(open, delay);
  }
  var observer = null;

  if (!stage) {
    arm(2500);
  } else if (document.body.getAttribute('data-motion') === 'reduced') {
    arm(3000);
  } else if (stage.getAttribute('data-state') === 'arrived') {
    arm(1200);
  } else if ('MutationObserver' in window) {
    observer = new MutationObserver(function () {
      if (stage.getAttribute('data-state') === 'arrived') arm(900);
    });
    observer.observe(stage, { attributes: true, attributeFilter: ['data-state'] });
  } else {
    arm(6000);
  }
}());
