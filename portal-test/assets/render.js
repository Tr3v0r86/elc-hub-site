/* ELC Portal: renders the volatile islands from window.PORTAL (assets/data.js).
   Shared by every page; each renderer runs only if its mount point exists.
   Data is our own static file, so no HTML escaping. */
(function () {
  var P = window.PORTAL;
  if (!P) return;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // Per-event add-to-calendar (.ics), issue 0027. All-day VEVENT: events are
  // date-only, so no time and no Bangkok-offset bug. RFC 5545 escaping on
  // SUMMARY is mandatory (titles contain commas).
  function icsEsc(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n');
  }
  function icsDates(ev) {
    var dt = ev.date.replace(/-/g, '');                              // YYYYMMDD
    var end = new Date(ev.date + 'T00:00:00Z'); end.setUTCDate(end.getUTCDate() + 1);
    return { start: dt, end: end.toISOString().slice(0, 10).replace(/-/g, '') }; // all-day DTEND is exclusive (next day)
  }
  function icsVevent(ev) {
    var d = icsDates(ev);
    var summary = icsEsc(ev.title + (ev.sub ? ', ' + ev.sub : ''));
    var slug = ev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    // ponytail: no RFC-5545 75-octet line folding; every current SUMMARY is under
    // the limit. Add a fold here if a longer event title ever lands.
    return [
      'BEGIN:VEVENT', 'UID:' + d.start + '-' + slug + '@portal.elc.ac.th',
      'DTSTAMP:' + d.start + 'T000000Z', 'DTSTART;VALUE=DATE:' + d.start, 'DTEND;VALUE=DATE:' + d.end,
      'SUMMARY:' + summary, 'END:VEVENT'
    ];
  }
  function icsWrap(lines) {
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ELC Portal//Calendar//EN', 'CALSCALE:GREGORIAN']
      .concat(lines, ['END:VCALENDAR']).join('\r\n');
  }
  function toICS(ev) { return icsWrap(icsVevent(ev)); }
  function toICSAll(evs) {
    return icsWrap(evs.reduce(function (acc, ev) { return acc.concat(icsVevent(ev)); }, []));
  }
  var FN_MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function icsFilename(ev) {
    var d = new Date(ev.date + 'T00:00:00Z');
    var clean = ev.title.replace(/[\/\\:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
    return 'ELC - ' + clean + ' - ' + d.getUTCDate() + ' ' + FN_MONS[d.getUTCMonth()] + ' ' + d.getUTCFullYear() + '.ics';
  }
  function icsDownload(text, filename) {
    var blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }
  function gcalUrl(ev) {
    var d = icsDates(ev);
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' +
      encodeURIComponent(ev.title + (ev.sub ? ', ' + ev.sub : '')) + '&dates=' + d.start + '/' + d.end;
  }

  // Platform add buttons (issue 0032): Google opens a pre-filled event in a new
  // tab (no file), Apple downloads a named .ics. Monochrome marks, tokens-coloured;
  // Claude Design may restyle (rule 7). Shared by the calendar agenda + windows strips.
  var G_MARK = '<svg viewBox="0 0 488 512" aria-hidden="true"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/></svg>';
  var A_MARK = '<svg viewBox="0 0 384 512" aria-hidden="true"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>';
  function addBtns(date, title, sub) {
    var ev = { date: date, title: title, sub: sub || '' };
    var esc = function (s) { return String(s).replace(/"/g, '&quot;'); };
    return '<span class="cal-add">' +
      '<a class="add-btn" target="_blank" rel="noopener" href="' + gcalUrl(ev) + '"' +
      ' title="Add to Google Calendar" aria-label="Add ' + esc(title) + ' to Google Calendar">' + G_MARK + '</a>' +
      '<button type="button" class="add-btn ics-btn" data-date="' + date + '" data-title="' + esc(title) + '" data-sub="' + esc(sub || '') + '"' +
      ' title="Add to Apple Calendar (.ics file)" aria-label="Add ' + esc(title) + ' to Apple Calendar">' + A_MARK + '</button></span>';
  }
  window.elcAddBtns = addBtns; // consumed by the calendar page's agenda renderer
  // Self-check (silent on pass): comma escaping, all-day start/end, multi-event, filename.
  console.assert(toICS({ date: '2026-08-03', title: 'Fest, Session 2', sub: 'to 7 Aug' }).indexOf('SUMMARY:Fest\\, Session 2\\, to 7 Aug') > -1, 'toICS: comma escape');
  console.assert(toICS({ date: '2026-08-03', title: 'x', sub: '' }).indexOf('DTSTART;VALUE=DATE:20260803') > -1, 'toICS: all-day start');
  console.assert(toICS({ date: '2026-08-03', title: 'x', sub: '' }).indexOf('DTEND;VALUE=DATE:20260804') > -1, 'toICS: all-day end');
  console.assert(toICSAll([{ date: '2026-08-03', title: 'a', sub: '' }, { date: '2026-08-04', title: 'b', sub: '' }]).split('BEGIN:VEVENT').length === 3, 'toICSAll: two events, one calendar');
  console.assert(icsFilename({ date: '2026-08-14', title: 'New Family Orientation' }) === 'ELC - New Family Orientation - 14 Aug 2026.ics', 'icsFilename: readable name');

  // Delegated: any .ics-btn downloads its event, named after it (issue 0032).
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.ics-btn') : null;
    if (!btn) return;
    e.preventDefault();
    var date = btn.getAttribute('data-date'), title = btn.getAttribute('data-title');
    if (!date || !title) return;
    var ev = { date: date, title: title, sub: btn.getAttribute('data-sub') || '' };
    icsDownload(toICS(ev), icsFilename(ev));
  });

  // Whole-year download (calendar page, issue 0032): every event, one named file.
  var icsAll = document.getElementById('ics-all');
  if (icsAll && P.calendarEvents) {
    icsAll.addEventListener('click', function () {
      icsDownload(toICSAll(P.calendarEvents), 'ELC calendar 2026-27.ics');
    });
  }

  var bkkToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());

  // School status banner (issue 0031): injected under the header on every page
  // when PORTAL.status is set and not expired. Dismiss lasts the browser session.
  if (P.status && P.status.expires >= bkkToday && !sessionStorage.getItem('elc-status-seen-' + P.status.expires)) {
    var banner = document.createElement('div');
    banner.className = 'status-banner ' + (P.status.level === 'alert' ? 'alert' : 'notice');
    banner.innerHTML = '<div class="sb-inner"><strong>' + P.status.title + '</strong><span>' + P.status.body + '</span>' +
      '<button type="button" class="sb-x" aria-label="Dismiss">&times;</button></div>';
    var hdr = document.querySelector('header');
    if (hdr) hdr.parentNode.insertBefore(banner, hdr.nextSibling);
    banner.querySelector('.sb-x').onclick = function () {
      sessionStorage.setItem('elc-status-seen-' + P.status.expires, '1');
      banner.remove();
    };
  }

  // Status page body (#status-now): current state in full, or the calm default.
  var statusNow = document.getElementById('status-now');
  if (statusNow) {
    if (P.status && P.status.expires >= bkkToday) {
      statusNow.innerHTML = '<div class="doc-row"><span class="ic">' + (P.status.level === 'alert' ? 'ALERT' : 'NOTE') + '</span>' +
        '<div class="meta"><div class="nm">' + P.status.title + '</div><div class="sub">' + P.status.body + '</div></div></div>';
    } else {
      statusNow.innerHTML = '<div class="doc-row"><span class="ic">OK</span>' +
        '<div class="meta"><div class="nm">Everything is running as normal.</div>' +
        '<div class="sub">All campuses are open on their usual hours today.</div></div></div>';
    }
  }

  // Registration windows strip (issue 0031): rows with live day countdowns,
  // rendered wherever #reg-windows exists. Past rows drop off.
  var winMount = document.getElementById('reg-windows');
  if (winMount && P.regWindows) {
    var upcoming = P.regWindows.filter(function (w) { return w.date >= bkkToday; });
    if (!upcoming.length) { winMount.remove(); }
    else {
      var MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      winMount.innerHTML = upcoming.map(function (w) {
        var d = new Date(w.date + 'T00:00:00Z');
        var days = Math.round((d - new Date(bkkToday + 'T00:00:00Z')) / 86400000);
        var when = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : 'In ' + days + ' days';
        return '<div class="win-row"><span class="win-date num">' + d.getUTCDate() + ' ' + MONS[d.getUTCMonth()] + '</span>' +
          '<div class="win-main"><div class="wt">' + w.label + '</div><div class="ws">' + w.sub + '</div></div>' +
          '<span class="win-count">' + when + '</span>' + addBtns(w.date, w.label, w.sub) + '</div>';
      }).join('');
    }
  }

  // Contact chips: any [data-contact="office|activities"] gets the live email
  // (and phone when it exists) from PORTAL.contacts, one edit point site-wide.
  var chips = document.querySelectorAll('[data-contact]');
  if (chips.length && P.contacts) {
    chips.forEach(function (el) {
      var c = P.contacts[el.getAttribute('data-contact')];
      if (!c) return;
      var phone = c.phone
        ? ' &middot; <a href="tel:' + c.phone.replace(/[^+0-9]/g, '') + '">' + c.phone + '</a>'
        : ' &middot; <span class="status soon">Phone coming</span>';
      el.innerHTML = '<a href="mailto:' + c.email + '">' + c.email + '</a>' + phone;
    });
  }

  // Safeguarding lead cards (#dsl-cards): one per PORTAL.safeguarding entry;
  // stays empty (generic route only) until real names are confirmed.
  var dsl = document.getElementById('dsl-cards');
  if (dsl && !(P.safeguarding && P.safeguarding.length)) dsl.remove();
  else if (dsl) {
    dsl.innerHTML = P.safeguarding.map(function (s) {
      return '<div class="doc-row"><span class="ic">DSL</span>' +
        '<div class="meta"><div class="nm">' + s.name + ' &middot; ' + s.campus + '</div>' +
        '<div class="sub">' + s.role + '</div></div>' +
        '<div class="rt"><a class="tag" href="mailto:' + s.email + '">Email</a></div></div>';
    }).join('');
    var intro = document.getElementById('dsl-pending');
    if (intro) intro.remove();
  }

  // Greet eyebrow: live date, Asia/Bangkok, "Tuesday 7 July 2026 · Term 1".
  var greet = document.getElementById('greet-date');
  if (greet) {
    var p = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Bangkok', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).formatToParts(new Date()).reduce(function (o, x) { o[x.type] = x.value; return o; }, {});
    greet.textContent = p.weekday + ' ' + p.day + ' ' + p.month + ' ' + p.year + ' · ' + P.term;
  }

  // Leadership note rotation: latest note whose `from` <= today, Bangkok civil date.
  var noteTitle = document.getElementById('note-title');
  if (noteTitle && P.notes && P.notes.length) {
    var todayISO = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
    var current = null;
    P.notes.forEach(function (n) { if (n.from <= todayISO) current = n; });
    if (current) {
      document.getElementById('note-eyebrow').textContent = current.eyebrow;
      document.getElementById('note-when').textContent = current.when;
      noteTitle.textContent = current.title;
      document.getElementById('note-body').textContent = current.body;
      document.getElementById('note-sig').textContent = current.sig;
    }
  }

  // This-week agenda rows (home feature tile), derived from calendarEvents:
  // this week's events (Mon to Sun, Bangkok), else the next 3 upcoming.
  var agenda = document.getElementById('agenda');
  if (agenda && P.calendarEvents) {
    var iso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
    var t = new Date(iso + 'T00:00:00Z');
    var mon = new Date(t); mon.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
    var sun = new Date(mon); sun.setUTCDate(mon.getUTCDate() + 6);
    var monISO = mon.toISOString().slice(0, 10), sunISO = sun.toISOString().slice(0, 10);
    var rows = P.calendarEvents.filter(function (e) { return e.date >= monISO && e.date <= sunISO; });
    if (!rows.length) rows = P.calendarEvents.filter(function (e) { return e.date > iso; }).slice(0, 3);
    var DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    agenda.innerHTML = rows.slice(0, 5).map(function (e) {
      var d = new Date(e.date + 'T00:00:00Z');
      var isToday = e.date === iso;
      return '<div class="agenda-row">' +
        '<span class="d num' + (isToday ? ' today' : '') + '">' + DOW[d.getUTCDay()] + ' ' + pad(d.getUTCDate()) + '</span>' +
        '<span class="t">' + e.title + (e.sub ? ', ' + e.sub : '') + '</span>' +
        (isToday ? '<span class="live"><span class="dot"></span>Today</span>' : '') +
        '</div>';
    }).join('');
  }

  // Sport rows + status pills (home sport tile).
  var grid = document.getElementById('sport-grid');
  if (grid && P.sports) {
    grid.innerHTML = P.sports.map(function (s) {
      return '<div class="sport-row"><span class="n">' + s.name + '</span>' +
        '<span class="status ' + s.status + '">' + s.label + '</span></div>';
    }).join('');
  }
  var note = document.getElementById('sport-note');
  if (note && P.sportNote) note.textContent = P.sportNote;

  // Policy doc groups (policies page). href:null = no real document yet
  // (issue 0016): unlinked row, "Coming" status, no download arrow. A due
  // badge renders only when data.js marks the doc with `due`.
  var groups = document.getElementById('doc-groups');
  if (groups && P.docs) {
    var order = [], byGroup = {};
    P.docs.forEach(function (d) {
      if (!byGroup[d.group]) { byGroup[d.group] = []; order.push(d.group); }
      byGroup[d.group].push(d);
    });
    var ARW = '<svg class="dl" viewBox="0 0 24 24"><path d="M12 3v12M7 11l5 5 5-5M5 20h14"/></svg>';
    groups.innerHTML = order.map(function (g) {
      var rows = byGroup[g].map(function (d) {
        var inner = '<span class="ic">' + d.kind + '</span>' +
          '<div class="meta"><div class="nm">' + d.name + '</div><div class="sub">' + d.sub + '</div></div>' +
          '<div class="rt">' +
            (d.due ? '<span class="live"><span class="dot"></span>' + d.due + '</span>' : '') +
            (d.href ? '<span class="tag">' + d.tag + '</span>' + ARW
                    : '<span class="status soon">Coming</span>') +
          '</div>';
        return d.href
          ? '<a class="doc-row" href="' + d.href + '">' + inner + '</a>'
          : '<div class="doc-row">' + inner + '</div>';
      }).join('');
      return '<div class="section">' +
        '<div class="sec-eyebrow"><span class="eyebrow">' + g + '</span><span class="ln"></span></div>' +
        '<div class="doc-list">' + rows + '</div></div>';
    }).join('');
  }
})();
