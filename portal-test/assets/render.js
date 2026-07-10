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
  function toICS(ev) {
    var dt = ev.date.replace(/-/g, '');                              // YYYYMMDD
    var end = new Date(ev.date + 'T00:00:00Z'); end.setUTCDate(end.getUTCDate() + 1);
    var dtEnd = end.toISOString().slice(0, 10).replace(/-/g, '');    // all-day DTEND is exclusive (next day)
    var summary = icsEsc(ev.title + (ev.sub ? ', ' + ev.sub : ''));
    var slug = ev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    // ponytail: no RFC-5545 75-octet line folding; every current SUMMARY is under
    // the limit. Add a fold here if a longer event title ever lands.
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ELC Portal//Calendar//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', 'UID:' + dt + '-' + slug + '@portal.elc.ac.th',
      'DTSTAMP:' + dt + 'T000000Z', 'DTSTART;VALUE=DATE:' + dt, 'DTEND;VALUE=DATE:' + dtEnd,
      'SUMMARY:' + summary, 'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
  }
  // Self-check (silent on pass): comma escaping + all-day start/end.
  console.assert(toICS({ date: '2026-08-03', title: 'Fest, Session 2', sub: 'to 7 Aug' }).indexOf('SUMMARY:Fest\\, Session 2\\, to 7 Aug') > -1, 'toICS: comma escape');
  console.assert(toICS({ date: '2026-08-03', title: 'x', sub: '' }).indexOf('DTSTART;VALUE=DATE:20260803') > -1, 'toICS: all-day start');
  console.assert(toICS({ date: '2026-08-03', title: 'x', sub: '' }).indexOf('DTEND;VALUE=DATE:20260804') > -1, 'toICS: all-day end');

  // Delegated: any .ics-btn downloads its event from data-date/title/sub.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.ics-btn') : null;
    if (!btn) return;
    e.preventDefault();
    var date = btn.getAttribute('data-date'), title = btn.getAttribute('data-title');
    if (!date || !title) return;
    var blob = new Blob([toICS({ date: date, title: title, sub: btn.getAttribute('data-sub') || '' })], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'elc-' + date + '.ics';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  });

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
