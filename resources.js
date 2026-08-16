/* ═══════════════════════════════════════════════════════════════════════
   Resource hub — type filter
   ───────────────────────────────────────────────────────────────────────
   Two of the five shelves are deliberately empty for now, so the filter
   has to say so rather than show a blank grid.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var grid = document.getElementById('rhGrid');
  var bar  = document.querySelector('.rh-filter');
  if (!grid || !bar) return;

  var cards  = Array.prototype.slice.call(grid.querySelectorAll('.res'));
  var chips  = Array.prototype.slice.call(bar.querySelectorAll('.chip-btn'));
  var status = document.getElementById('rhStatus');
  var empty  = document.getElementById('rhEmpty');
  var eTitle = document.getElementById('rhEmptyTitle');
  var eText  = document.getElementById('rhEmptyText');

  var EMPTY = {
    slides: ['No slide decks published yet',
             'Teaching decks from the trainings are being cleared for release. If you need a specific one now, ask and I will send it.'],
    links:  ['The link list is still being built',
             'Rather than dump a hundred bookmarks, this shelf will hold a short, checked set worth your time.']
  };

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

    var blank = EMPTY[want];
    if (shown === 0 && blank) {
      eTitle.textContent = blank[0];
      eText.textContent  = blank[1];
      empty.hidden = false;
      grid.hidden = true;
    } else {
      empty.hidden = true;
      grid.hidden = false;
    }

    if (status) {
      status.textContent = shown
        ? 'Showing ' + shown + ' of ' + cards.length + ' resources in ' + label + '.'
        : 'No resources in ' + label + ' yet.';
    }
  }

  bar.addEventListener('click', function (e) {
    var chip = e.target.closest ? e.target.closest('.chip-btn') : null;
    if (!chip || !bar.contains(chip)) return;
    var n = chip.querySelector('.chip-btn__n');
    var label = (n ? chip.textContent.replace(n.textContent, '') : chip.textContent).trim();
    apply(chip.getAttribute('data-filter'), label);
  });
}());
