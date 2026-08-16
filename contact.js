/* ═══════════════════════════════════════════════════════════════════════
   Contact — clock, availability picker, booking sheet, form, FAQ
   ───────────────────────────────────────────────────────────────────────
   Both the message form and the booking sheet submit through one path:
   submitRequest(). It POSTs JSON, which is what every form-to-email
   service accepts, so enquiries land in an inbox with no backend to run.

   ── To receive these as email ──────────────────────────────────────────
   Pick one and fill in the constants below. Both are free and take about
   two minutes; neither needs a server.

   Web3Forms — https://web3forms.com
     Enter nar.ohanyan.eco@gmail.com, confirm the address, copy the key:
       ENDPOINT   = 'https://api.web3forms.com/submit'
       ACCESS_KEY = '<the key they email you>'

   Formspree — https://formspree.io
     Create a form, then:
       ENDPOINT   = 'https://formspree.io/f/<your-form-id>'
       ACCESS_KEY = ''            // not used

   Later, when the database is ready, point ENDPOINT at your own API
   instead. The payload shape stays identical.

   Anything submitted before an endpoint exists is queued locally:
       JSON.parse(localStorage.getItem('no.requests') || '[]')
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── where availability comes from ───────────────────────────────────
     'file'   — read availability.json (default). Edit that file to change
                open hours, blackout days and busy blocks; no code needed.
     'google' — additionally read a PUBLIC Google Calendar and treat its
                events as busy. Requires GCAL below. See the note at the
                bottom of this block before switching it on. */
  var AVAIL_SOURCE = 'file';

  var GCAL = {
    calendarId: '',                  // e.g. 'nar.ohanyan.eco@gmail.com'
    apiKey: ''                       // restrict it to this site's domain
  };
  /* Reading a Google Calendar straight from the browser only works if that
     calendar is PUBLIC — anonymous requests cannot see a private one, and an
     API key in page source is readable by anyone. So this route publishes
     your event times to whoever looks. If that is not acceptable, keep
     AVAIL_SOURCE on 'file', or put a small server between the two. */

  var ENDPOINT   = '';               // see the note above
  var ACCESS_KEY = '';               // Web3Forms only
  var INBOX      = 'nar.ohanyan.eco@gmail.com';
  var QUEUE_KEY  = 'no.requests';

  function queue(payload) {
    try {
      var all = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      all.push(payload);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(all));
      return true;
    } catch (e) { return false; }
  }

  // A bot that fills the hidden field is discarded silently — it costs
  // nothing and stops the bulk of automated spam before it reaches an inbox.
  function trapped(form) {
    var t = form && form.querySelector('input[name="_gotcha"]');
    return !!(t && t.value);
  }

  function submitRequest(payload) {
    payload.sentAt = new Date().toISOString();

    /* Supabase is the primary destination. It is tried first, and only if
       it is unreachable do we fall back — to a mail relay if one is
       configured, and to this device otherwise. A visitor's message is
       never dropped because the network blinked. */
    if (window.NO && window.NO.db && window.NO.db.available()) {
      var send = payload.type === 'booking'
        ? window.NO.db.requestBooking(payload)
        : window.NO.db.sendMessage(payload);

      return send.then(function (res) {
        if (res.ok) return { stored: false, db: true };
        // Held locally so it survives, and reported honestly to the reader.
        queue(payload);
        throw new Error(res.error && res.error.message
          ? res.error.message
          : 'the database could not be reached');
      });
    }

    if (ENDPOINT) {
      var body = {};
      Object.keys(payload).forEach(function (k) {
        // Arrays arrive in the email as "[object Object]" unless flattened.
        body[k] = Array.isArray(payload[k]) ? payload[k].join(', ') : payload[k];
      });

      // Fields these services look for by name.
      if (ACCESS_KEY) body.access_key = ACCESS_KEY;
      body.subject = payload.emailSubject || 'New website enquiry';
      body.from_name = payload.name || 'Website';
      body.replyto = payload.email || '';
      body._replyto = payload.email || '';        // Formspree's spelling
      delete body.emailSubject;

      return fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Without this, Formspree redirects instead of answering in JSON.
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      }).then(function (r) {
        if (!r.ok) throw new Error('the service responded ' + r.status);
        return { stored: false };
      });
    }

    // No endpoint yet: hold the request locally so it survives the wait,
    // with a small delay so the pending state is actually perceptible.
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        queue(payload) ? resolve({ stored: true }) : reject(new Error('Could not save locally'));
      }, 600);
    });
  }


  // "Not sure yet" and the like carry no figure, so appending a currency to
  // them would read as nonsense in the inbox.
  function money(bandId, currId) {
    var band = document.getElementById(bandId);
    var curr = document.getElementById(currId);
    if (!band) return '';
    var v = band.value;
    return /\d/.test(v) ? v + ' ' + (curr ? curr.value : '') : v;
  }

  /* ── availability ────────────────────────────────────────────────────
     Everything the calendar offers comes from here, so the rules live in
     one place rather than being scattered through the drawing code. */
  var AVAIL = {
    hours: { 1: [9, 18], 2: [9, 18], 3: [9, 18], 4: [9, 18],
             5: [9, 18], 6: [9, 18], 0: [9, 18] },
    minNoticeDays: 1,
    maxAheadDays: 365,
    blackout: [],
    busy: [],
    utcOffset: 4,
    loaded: false
  };

  function loadAvailability() {
    return fetch('availability.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function (j) {
        if (j.hours) AVAIL.hours = j.hours;
        if (typeof j.minNoticeDays === 'number') AVAIL.minNoticeDays = j.minNoticeDays;
        if (typeof j.maxAheadDays === 'number') AVAIL.maxAheadDays = j.maxAheadDays;
        if (typeof j.utcOffset === 'number') AVAIL.utcOffset = j.utcOffset;
        AVAIL.blackout = j.blackout || [];
        AVAIL.busy = sane(j.busy || []);
        if (AVAIL_SOURCE === 'google') return addGoogleBusy();
      })
      .catch(function () {
        // A missing or malformed file must not take the booking form down —
        // the built-in defaults simply stand in.
      })
      .then(function () { AVAIL.loaded = true; });
  }

  /* A busy block whose end precedes its start silently blocks nothing — the
     overlap test simply never matches — so the day looks free when it is
     not. That is the worst kind of failure here, so bad entries are dropped
     loudly rather than quietly ignored. */
  function sane(blocks) {
    var ok = [], bad = [];
    blocks.forEach(function (b, i) {
      var s = Date.parse(b.start), e = Date.parse(b.end);
      if (isNaN(s) || isNaN(e)) bad.push('#' + i + ' unreadable date');
      else if (e <= s) bad.push('#' + i + ' ends before it starts (' + b.start + ' → ' + b.end + ')');
      else ok.push(b);
    });
    if (bad.length && window.console) {
      console.warn('availability.json — ' + bad.length + ' busy block(s) ignored:\n  '
                   + bad.join('\n  ') + '\nThose hours are being offered as free.');
    }
    return ok;
  }

  function addGoogleBusy() {
    if (!GCAL.calendarId || !GCAL.apiKey) return;
    var now = new Date();
    var end = new Date(now.getTime() + AVAIL.maxAheadDays * 864e5);
    var url = 'https://www.googleapis.com/calendar/v3/calendars/'
            + encodeURIComponent(GCAL.calendarId) + '/events'
            + '?key=' + encodeURIComponent(GCAL.apiKey)
            + '&singleEvents=true&orderBy=startTime&maxResults=2500'
            + '&timeMin=' + now.toISOString()
            + '&timeMax=' + end.toISOString();

    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('calendar responded ' + r.status);
      return r.json();
    }).then(function (j) {
      (j.items || []).forEach(function (ev) {
        if (ev.transparency === 'transparent') return;      // "free" events
        var st = ev.start && (ev.start.dateTime || ev.start.date);
        var en = ev.end && (ev.end.dateTime || ev.end.date);
        if (st && en) AVAIL.busy.push({ start: st, end: en, allDay: !ev.start.dateTime });
      });
    }).catch(function (e) {
      // Availability degrades to the file's rules rather than to nothing.
      if (window.console) console.warn('Calendar unavailable:', e.message);
    });
  }

  function busy(btn, on, label) {
    btn.disabled = on;
    btn.classList.toggle('is-busy', on);
    if (on) {
      btn.dataset.was = btn.innerHTML;
      btn.innerHTML = '<span class="spin" aria-hidden="true"></span>' + (label || 'Sending…');
    } else if (btn.dataset.was) {
      btn.innerHTML = btn.dataset.was;
    }
  }

  /* ── live clock ──────────────────────────────────────────────────────
     Yerevan is UTC+4 year-round, so the offset can be applied directly. */
  var clockTime = document.getElementById('clockTime');
  var clockNote = document.getElementById('clockNote');

  function tick() {
    if (!clockTime) return;
    var now = new Date();
    var ye = new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60000);
    var h = ye.getHours(), m = ye.getMinutes();
    clockTime.textContent = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    if (clockNote) {
      var d = ye.getDay();
      clockNote.textContent = (d >= 1 && d <= 5 && h >= 9 && h < 18)
        ? 'Usually at my desk' : 'Likely to reply tomorrow';
    }
  }
  tick();
  setInterval(tick, 30000);

  /* ── copy to clipboard ───────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy]');
    if (!btn) return;
    var label = btn.querySelector('.copy__label');
    var done = function () {
      btn.classList.add('is-done');
      if (label) label.textContent = 'Copied';
      setTimeout(function () {
        btn.classList.remove('is-done');
        if (label) label.textContent = 'Copy';
      }, 1800);
    };
    var text = btn.getAttribute('data-copy');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (err) {}
      ta.remove();
      done();
    }
  });

  /* ── shared field validation ─────────────────────────────────────── */
  function checker(spec) {
    function mark(f, msg) {
      var input = document.getElementById(f.id);
      var slot = document.getElementById(f.err);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      input.classList.toggle('is-bad', !!msg);
      slot.textContent = msg;
      slot.hidden = !msg;
      return msg;
    }
    // Checked on blur rather than each keystroke, so nobody is told their
    // half-typed address is wrong.
    spec.forEach(function (f) {
      var input = document.getElementById(f.id);
      if (!input) return;
      input.addEventListener('blur', function () { mark(f, f.bad(input.value)); });
      input.addEventListener('input', function () {
        if (input.classList.contains('is-bad')) mark(f, f.bad(input.value));
      });
    });
    return function run(box, list) {
      var bad = [];
      spec.forEach(function (f) {
        var el = document.getElementById(f.id);
        if (!el) return;
        var msg = mark(f, f.bad(el.value));
        if (msg) bad.push({ f: f, msg: msg });
      });
      if (!bad.length) { box.hidden = true; return true; }

      list.innerHTML = '';
      bad.forEach(function (b) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + b.f.id;
        a.textContent = b.msg;
        a.addEventListener('click', function (ev) {
          ev.preventDefault();
          document.getElementById(b.f.id).focus();
        });
        li.appendChild(a);
        list.appendChild(li);
      });
      box.hidden = false;
      box.focus();
      return false;
    };
  }

  var need = function (what) {
    return function (v) { return v.trim() ? '' : 'Enter ' + what + '.'; };
  };
  var mailOK = function (v) {
    if (!v.trim()) return 'Enter your email address.';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
      ? '' : 'That email address is missing something — check for a typo.';
  };

  /* ── availability picker ─────────────────────────────────────────── */
  var cal = document.getElementById('cal');
  var sheet = document.getElementById('bookSheet');

  if (cal) {
    var monthEl = document.getElementById('calMonth');
    var daysEl  = document.getElementById('calDays');
    var sEmpty  = document.getElementById('slotsEmpty');
    var sBody   = document.getElementById('slotsBody');
    var sDay    = document.getElementById('slotsDay');
    var sRow    = document.getElementById('slotsRow');
    var sClear  = document.getElementById('slotsClear');
    var goBtn   = document.getElementById('bookGo');
    var hint    = document.getElementById('bookHint');

    var MONTHS = ['January','February','March','April','May','June','July',
                  'August','September','October','November','December'];

    // Bookable hours, 09:00 through 20:00. These are selected as a range so
    // a three-hour webinar is one gesture rather than three separate picks —
    // the same first-click/second-click model as the days above.
    var pad = function (h) { return (h < 10 ? '0' : '') + h + ':00'; };

    var today = new Date(); today.setHours(0, 0, 0, 0);
    var view = new Date(today.getFullYear(), today.getMonth(), 1);
    var from = null, to = null;
    var hFrom = null, hTo = null, allDay = false;

    function winLabelAllDay() {
      var h = spanWindow();
      return h ? 'Full day (' + pad(h[0]) + ' – ' + pad(h[1]) + ')' : 'Full day';
    }

    // The chosen block, written the way it will read in the inbox.
    function winLabel() {
      if (allDay) return winLabelAllDay();
      if (hFrom === null) return null;
      var a = Math.min(hFrom, hTo === null ? hFrom : hTo);
      var b = Math.max(hFrom, hTo === null ? hFrom : hTo) + 1;
      var span = b - a;
      return pad(a) + ' – ' + pad(b) + ' · ' + span + (span === 1 ? ' hour' : ' hours');
    }

    var iso = function (d) {
      return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) +
             '-' + ('0' + d.getDate()).slice(-2);
    };
    var same = function (a, b) { return a && b && iso(a) === iso(b); };
    function openHours(d) {
      var h = AVAIL.hours[String(d.getDay())];
      return (h && h.length === 2) ? h : null;
    }

    // A day is offered only if it is inside the notice window, not blacked
    // out, has open hours, and is not already fully taken.
    function bookable(d) {
      var first = new Date(today.getTime() + AVAIL.minNoticeDays * 864e5);
      var last  = new Date(today.getTime() + AVAIL.maxAheadDays * 864e5);
      if (d < first || d > last) return false;
      if (AVAIL.blackout.indexOf(iso(d)) > -1) return false;
      var h = openHours(d);
      if (!h) return false;
      return hoursFor(d).some(function (x) { return !x.taken; });
    }

    // Busy blocks are compared in the calendar's own timezone so an event
    // at 14:00 Yerevan blocks 14:00 here, whatever the visitor's clock says.
    function localHour(stamp) {
      var d = new Date(stamp);
      return new Date(d.getTime() + (d.getTimezoneOffset() + AVAIL.utcOffset * 60) * 60000);
    }

    // Across a run of days only the hours open on EVERY day can be offered,
    // and an hour taken on any one of them is taken for the whole block —
    // otherwise a Mon–Sat workshop could request 09:00 on a Saturday that
    // does not open until 11:00.
    function hoursForSpan() {
      var days = span();
      if (!days.length) return [];
      if (days.length === 1) return hoursFor(days[0]);

      var sets = days.map(hoursFor);
      var has = function (set, h) {
        for (var i = 0; i < set.length; i++) if (set[i].hour === h) return set[i];
        return null;
      };
      return sets[0].filter(function (s0) {
        return sets.every(function (set) { return !!has(set, s0.hour); });
      }).map(function (s0) {
        return {
          hour: s0.hour,
          taken: sets.some(function (set) {
            var m = has(set, s0.hour);
            return m && m.taken;
          })
        };
      });
    }

    function spanWindow() {
      var hs = hoursForSpan();
      if (!hs.length) return null;
      return [hs[0].hour, hs[hs.length - 1].hour + 1];
    }

    function hoursFor(d) {
      var h = openHours(d);
      if (!h) return [];
      var out = [];
      for (var x = h[0]; x < h[1]; x++) {
        var slotStart = new Date(d); slotStart.setHours(x, 0, 0, 0);
        var slotEnd   = new Date(d); slotEnd.setHours(x + 1, 0, 0, 0);

        var taken = AVAIL.busy.some(function (b) {
          if (b.allDay) {
            return iso(localHour(b.start)) <= iso(d) && iso(d) < iso(localHour(b.end));
          }
          var bs = localHour(b.start), be = localHour(b.end);
          return bs < slotEnd && be > slotStart;
        });
        out.push({ hour: x, taken: taken });
      }
      return out;
    }

    function span() {
      if (!from) return [];
      var out = [], cur = new Date(from);
      var end = to || from;
      while (cur <= end) { out.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
      return out;
    }

    function drawMonth() {
      monthEl.textContent = MONTHS[view.getMonth()] + ' ' + view.getFullYear();
      daysEl.innerHTML = '';

      var first = new Date(view.getFullYear(), view.getMonth(), 1);
      var lead = (first.getDay() + 6) % 7;                     // weeks start Monday
      var total = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

      for (var i = 0; i < lead; i++) {
        var pad = document.createElement('span');
        pad.className = 'cal__pad';
        daysEl.appendChild(pad);
      }

      for (var d = 1; d <= total; d++) {
        var date = new Date(view.getFullYear(), view.getMonth(), d);
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'cal__day';
        b.textContent = d;

        if (!bookable(date)) {
          b.disabled = true;
          b.className += ' is-off';
        } else {
          b.setAttribute('data-iso', iso(date));
          var end = to || from;
          if (from && date >= from && date <= end) {
            b.className += ' is-picked';
            if (same(date, from)) b.className += ' is-first';
            if (same(date, end))  b.className += ' is-last';
            if (!same(date, from) && !same(date, end)) b.className += ' is-mid';
            b.setAttribute('aria-current', 'date');
          }
        }
        if (same(date, today)) b.className += ' is-today';
        daysEl.appendChild(b);
      }
    }

    function label() {
      var days = span();
      var fmt = { weekday: 'short', day: 'numeric', month: 'long' };
      if (days.length === 1) return from.toLocaleDateString(undefined,
        { weekday: 'long', day: 'numeric', month: 'long' });
      return days[0].toLocaleDateString(undefined, fmt) + ' → ' +
             days[days.length - 1].toLocaleDateString(undefined, fmt) +
             '  ·  ' + days.length + ' days';
    }

    function drawSlots() {
      if (!from) {
        sBody.hidden = true;
        sEmpty.hidden = false;
        return;
      }
      sEmpty.hidden = true;
      sBody.hidden = false;
      sDay.textContent = label();

      sRow.innerHTML = '';

      var all = document.createElement('button');
      all.type = 'button';
      all.className = 'slot slot--all' + (allDay ? ' is-on' : '');
      all.textContent = winLabelAllDay();
      all.setAttribute('data-all', '1');
      all.setAttribute('aria-pressed', String(allDay));
      sRow.appendChild(all);

      var lo = hFrom === null ? null : Math.min(hFrom, hTo === null ? hFrom : hTo);
      var hi = hFrom === null ? null : Math.max(hFrom, hTo === null ? hFrom : hTo);

      hoursForSpan().forEach(function (slot, i) {
        var h = slot.hour;
        var b = document.createElement('button');
        b.type = 'button';
        var on = !allDay && lo !== null && h >= lo && h <= hi;
        if (slot.taken) {
          b.disabled = true;
          b.className = 'slot is-taken';
          b.textContent = pad(h) + ' – ' + pad(h + 1);
          b.title = 'Already booked';
          b.style.animationDelay = Math.min(i * 28, 260) + 'ms';
          sRow.appendChild(b);
          return;
        }
        b.className = 'slot' + (on ? ' is-on' : '')
                    + (on && h === lo ? ' is-first' : '')
                    + (on && h === hi ? ' is-last' : '')
                    + (on && h !== lo && h !== hi ? ' is-mid' : '');
        b.textContent = pad(h) + ' – ' + pad(h + 1);
        b.setAttribute('data-hour', h);
        b.setAttribute('aria-pressed', String(on));
        b.style.animationDelay = Math.min(i * 28, 260) + 'ms';
        sRow.appendChild(b);
      });

      var openAny = hoursForSpan().some(function (s) { return !s.taken; });
      if (!openAny) {
        goBtn.disabled = true;
        hint.textContent = span().length > 1
          ? 'These days share no open hours. Try a shorter run.'
          : 'Nothing free on this day.';
        return;
      }

      var win = winLabel();
      goBtn.disabled = !win;
      hint.textContent = !win
        ? 'Pick a window — click a second hour for a longer block.'
        : (allDay || hTo !== null
             ? (span().length > 1 ? 'This block applies to each day in the range.'
                                  : 'Nothing is confirmed yet — the next step collects the details.')
             : 'Click a later hour to extend, or continue for a single hour.');
    }

    cal.addEventListener('click', function (e) {
      var mv = e.target.closest('[data-mv]');
      if (mv) {
        view = new Date(view.getFullYear(), view.getMonth() + Number(mv.getAttribute('data-mv')), 1);
        drawMonth();
        return;
      }
      var cell = e.target.closest('[data-iso]');
      if (!cell) return;

      var picked = new Date(cell.getAttribute('data-iso') + 'T00:00:00');

      // First click sets the start. A later date extends the range; an
      // earlier one (or the same date) starts over.
      if (!from || to || picked <= from) { from = picked; to = null; }
      else { to = picked; }

      drawMonth();
      drawSlots();
    });

    sRow.addEventListener('click', function (e) {
      if (e.target.closest('[data-all]')) {
        allDay = !allDay;
        if (allDay) { hFrom = hTo = null; }
        drawSlots();
        return;
      }
      var cell = e.target.closest('[data-hour]');
      if (!cell) return;

      var h = Number(cell.getAttribute('data-hour'));
      allDay = false;

      // First click sets the start; a later hour extends the block. Clicking
      // the same hour again clears it, and an earlier one starts over.
      if (hFrom === null || hTo !== null || h < hFrom) { hFrom = h; hTo = null; }
      else if (h === hFrom) { hFrom = hTo = null; }
      else {
        // Extending across a booked hour would quietly request time that is
        // already gone, so the block stops at the obstruction.
        var blocked = hoursForSpan().some(function (s) {
          return s.taken && s.hour > hFrom && s.hour <= h;
        });
        if (blocked) { hFrom = h; hTo = null; }
        else { hTo = h; }
      }

      drawSlots();
    });

    sClear.addEventListener('click', function () {
      from = to = null;
      hFrom = hTo = null;
      allDay = false;
      drawMonth();
      drawSlots();
    });

    /* ── the booking sheet ─────────────────────────────────────────── */
    if (sheet) {
      var sheetSlot = document.getElementById('sheetSlot');
      var sheetBox  = document.getElementById('sheetErrors');
      var sheetList = document.getElementById('sheetErrorList');
      var sheetGo   = document.getElementById('sheetGo');
      var bookForm  = document.getElementById('bookForm');

      var checkSheet = checker([
        { id: 'bName',  err: 'ebName',  bad: need('your name') },
        { id: 'bMail',  err: 'ebMail',  bad: mailOK },
        { id: 'bNotes', err: 'ebNotes', bad: function (v) {
            if (!v.trim()) return 'Add a few details.';
            return v.trim().length < 20 ? 'A little more detail helps me answer properly.' : '';
          } }
      ]);

      function openSheet() {
        var days = span();
        sheetSlot.textContent = label() + '  ·  ' + winLabel() + '  (Yerevan, UTC+4)';
        sheetSlot.setAttribute('data-days', days.length);
        sheet.showModal();
      }
      function closeSheet() { sheet.close(); }

      goBtn.addEventListener('click', function () { if (winLabel() && from) openSheet(); });
      document.getElementById('sheetX').addEventListener('click', closeSheet);
      document.getElementById('sheetCancel').addEventListener('click', closeSheet);

      // Clicking the backdrop dismisses, matching every other sheet on the web.
      sheet.addEventListener('click', function (e) {
        if (e.target === sheet) closeSheet();
      });

      bookForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (trapped(bookForm)) { closeSheet(); return; }
        if (!checkSheet(sheetBox, sheetList)) return;

        var days = span();
        var v = function (id) { return document.getElementById(id).value.trim(); };

        busy(sheetGo, true);
        submitRequest({
          type: 'booking',
          emailSubject: 'Booking request — ' + document.getElementById('bKind').value +
                        ' — ' + label(),
          summary: label() + ' · ' + winLabel() + ' (Yerevan, UTC+4)',
          dates: days.map(iso),
          dayCount: days.length,
          window: winLabel(),
          timezone: 'Asia/Yerevan (UTC+4)',
          sessionType: document.getElementById('bKind').value,
          format: document.getElementById('bFormat').value,
          audienceSize: v('bSize'),
          budget: money('bBudget', 'bCurr'),
          location: v('bWhere'),
          name: v('bName'),
          email: v('bMail'),
          organisation: v('bOrg'),
          notes: v('bNotes')
        }).then(function (res) {
          closeSheet();
          from = to = null;
          hFrom = hTo = null;
          allDay = false;
          drawMonth();
          drawSlots();
          bookForm.reset();
          say(document.getElementById('bookHint'),
              'Request received. ' + (res.stored
                ? 'It is held on this device until the booking database is connected.'
                : 'I will confirm or propose an alternative by email.'));
        }).catch(function (err) {
          say(sheetSlot, 'Could not send: ' + err.message + '. Please try again.');
        }).then(function () { busy(sheetGo, false); });
      });
    }

    function refresh() {
      return loadAvailability().then(function () {
        drawMonth();
        drawSlots();
      });
    }
    refresh();

    // A page left open all afternoon would otherwise keep offering the
    // availability it loaded hours ago. Re-read when the tab is looked at
    // again, and periodically while it is in view.
    var REFRESH_MS = 10 * 60 * 1000;
    var poll = setInterval(function () {
      if (!document.hidden) refresh();
    }, REFRESH_MS);

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) refresh();
    });

    window.addEventListener('pagehide', function () { clearInterval(poll); });
  }

  function say(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-good');
    setTimeout(function () { el.classList.remove('is-good'); }, 6000);
  }

  /* ── contact form ────────────────────────────────────────────────── */
  var form = document.getElementById('contactForm');
  if (form) {
    var box  = document.getElementById('formErrors');
    var list = document.getElementById('formErrorList');
    var done = document.getElementById('formDone');
    var go   = document.getElementById('formGo');

    var checkForm = checker([
      { id: 'fName', err: 'eName', bad: need('your name') },
      { id: 'fMail', err: 'eMail', bad: mailOK },
      { id: 'fSubj', err: 'eSubj', bad: function (v) {
          return v.trim() ? '' : 'Add a subject so I can triage it.'; } },
      { id: 'fMsg',  err: 'eMsg',  bad: function (v) {
          if (!v.trim()) return 'Add a message.';
          return v.trim().length < 20 ? 'A little more detail helps me answer properly.' : '';
        } }
    ]);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (trapped(form)) return;
      if (!checkForm(box, list)) return;

      var v = function (id) { return document.getElementById(id).value.trim(); };
      busy(go, true);

      submitRequest({
        type: 'message',
        emailSubject: '[' + document.getElementById('fKind').value + '] ' + v('fSubj'),
        name: v('fName'),
        email: v('fMail'),
        organisation: v('fOrg'),
        enquiry: document.getElementById('fKind').value,
        budget: money('fBudget', 'fCurr'),
        subject: v('fSubj'),
        message: v('fMsg')
      }).then(function (res) {
        form.reset();
        done.hidden = false;
        done.classList.remove('is-bad');
        done.textContent = 'Thank you — your message has been received. ' + (res.stored
          ? 'It is held on this device until the database is connected, so nothing is lost.'
          : 'I reply within 48 to 72 business hours.');
        done.focus && done.focus();
      }).catch(function (err) {
        done.hidden = false;
        done.classList.add('is-bad');
        done.textContent = 'Could not send: ' + err.message +
          '. Please try again, or email nar.ohanyan.eco@gmail.com directly.';
      }).then(function () { busy(go, false); });
    });
  }

  /* ── press kit ───────────────────────────────────────────────────────
     Rather than a second half-form, this hands the visitor to the real one
     with the subject already set — one submission path, one place to
     maintain, and I get their details rather than a bare "send me this". */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-ask]');
    if (!btn) return;

    var what = btn.getAttribute('data-ask');
    var kind = document.getElementById('fKind');
    var subj = document.getElementById('fSubj');
    var msg  = document.getElementById('fMsg');
    if (!subj) return;

    if (kind) kind.value = 'Media or press';
    subj.value = what + ' request';
    if (msg && !msg.value.trim()) {
      msg.value = 'Please send over your ' + what + '.\n\nOutlet / organisation:\n' +
                  'What it is for:\nDeadline:';
    }

    var form = document.getElementById('contactForm');
    if (form) form.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(function () {
      var name = document.getElementById('fName');
      (name && !name.value ? name : msg).focus();
    }, 380);
  });

  /* ── FAQ ─────────────────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.qa__btn');
    if (!btn) return;
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    panel.hidden = open;
  });
}());
