/* ELC Portal: renders the volatile islands from window.PORTAL (assets/data.js).
   Shared by every page; each renderer runs only if its mount point exists.
   Data is our own static file, so no HTML escaping. */
(function () {
  var P = window.PORTAL;
  if (!P) return;

  // Shared clock + name tables (sprint-2 H5): one Bangkok-today computation,
  // one week-start helper, one set of day/month names. Every renderer below
  // reuses these; nothing recomputes its own.
  var bkkToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date()); // YYYY-MM-DD
  var FN_MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function escAttr(s) { return String(s).replace(/"/g, '&quot;'); }

  // Event-link seam (plan 2026-07-16, slice 1). Data hrefs are SITE-ROOT-relative
  // ('hopes-and-wishes/'); ROOT is this page's prefix back to the site root, read
  // from the search input's data-root (every page carries one at correct depth,
  // same convention the search widget below already resolves links with).
  // The grammar guard mirrors tools/check-data-hrefs.mjs: bare directory path
  // only: no scheme, no leading slash, no dot-segments. The deploy gate is the
  // real enforcement; this keeps a hand-edit between deploys from rendering a
  // broken or unsafe anchor. Falsy/invalid href = plain text (today's behavior).
  var qRoot = document.getElementById('q');
  var ROOT = (qRoot && qRoot.getAttribute('data-root')) || '';
  var HREF_RE = /^[a-z0-9-]+(\/[a-z0-9-]+)*\/$/;
  function evHref(h) { return (typeof h === 'string' && HREF_RE.test(h)) ? ROOT + h : null; }
  // Absolute form for share targets: the LINE fallback embeds the URL verbatim,
  // so a relative path there would be a dead share (plan 1.3).
  function absHref(h) { var r = evHref(h); return r ? new URL(r, location.href).href : null; }

  // Booking window state (plan 1.4). Pure + assertable. Inclusive from..until;
  // rows missing from/until are never booking rows (the legacy regWindows shape).
  function bookingState(w, todayISO) {
    if (!w || !w.from || !w.until) return { show: false };
    if (todayISO < w.from || todayISO > w.until) return { show: false };
    var days = Math.round((new Date(w.until + 'T00:00:00Z') - new Date(todayISO + 'T00:00:00Z')) / 86400000);
    return { show: true, days: days, closes: days === 0 ? 'Closes today' : days === 1 ? 'Closes tomorrow' : days + ' days left' };
  }
  // Monday (UTC midnight) of the week containing the given ISO date.
  function weekStart(iso) {
    var d = new Date(iso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d;
  }
  // Agenda bucket for an event date against today: 0 this week, 1 next week, 2 later.
  function agendaBucket(dateISO, todayISO) {
    var mon = weekStart(todayISO);
    var endThis = new Date(mon); endThis.setUTCDate(mon.getUTCDate() + 6);
    var endNext = new Date(mon); endNext.setUTCDate(mon.getUTCDate() + 13);
    var d = new Date(dateISO + 'T00:00:00Z');
    return d <= endThis ? 0 : d <= endNext ? 1 : 2;
  }
  // Monday-to-Sunday bounds (ISO) of the week containing todayISO. Pure + assertable.
  function weekBounds(todayISO) {
    var mon = weekStart(todayISO);
    var sun = new Date(mon); sun.setUTCDate(mon.getUTCDate() + 6);
    return { start: mon.toISOString().slice(0, 10), end: sun.toISOString().slice(0, 10) };
  }
  // Fridge-print "term" end: the next key date titled like a term close (else 120
  // days out). evs must be sorted ascending. Pure + assertable.
  function termEnd(evs, todayISO) {
    var re = /Last day of Term|Holiday: Christmas/;
    for (var i = 0; i < evs.length; i++) {
      if (evs[i].date >= todayISO && re.test(evs[i].title)) return evs[i].date;
    }
    var d = new Date(todayISO + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 120);
    return d.toISOString().slice(0, 10);
  }
  // type:'gold' = key date / milestone; drives the key-dates .ics feed (issue 0032 F3).
  function goldOnly(evs) { return evs.filter(function (e) { return e.type === 'gold'; }); }
  function fmtDMY(iso) {
    var d = new Date(iso + 'T00:00:00Z');
    return d.getUTCDate() + ' ' + FN_MONS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }
  function fmtReviewed(ym) {                                    // 'YYYY-MM' -> 'Reviewed May 2026'
    var p = String(ym).split('-');
    return 'Reviewed ' + (FN_MONS[parseInt(p[1], 10) - 1] || '') + ' ' + p[0];
  }
  // Draft-chip membership (sprint 3 D5). Pure + assertable.
  function isDraftPage(key, list) { return !!key && !!list && list.indexOf(key) > -1; }
  // Shared strip (sprint 3 D3): a doc-list of {nm, sub} rows under one mono icon.
  // Used by the office-hours strip, the air tile and the refund ladder.
  function stripRows(items, iconText) {
    return '<div class="doc-list">' + items.map(function (it) {
      return '<div class="doc-row"><span class="ic">' + iconText + '</span>' +
        '<div class="meta"><div class="nm">' + it.nm + '</div>' +
        (it.sub ? '<div class="sub">' + it.sub + '</div>' : '') + '</div></div>';
    }).join('') + '</div>';
  }

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
  // Share mark (issue 0032 F10): native share where available, LINE fallback.
  var S_MARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 12v8h16v-8M12 3v13M8 7l4-4 4 4"/></svg>';
  function shareBtn(url, title) {
    var esc = function (s) { return String(s).replace(/"/g, '&quot;'); };
    return '<button type="button" class="add-btn share-btn" data-url="' + esc(url) + '" data-title="' + esc(title) + '"' +
      ' title="Share" aria-label="Share ' + esc(title) + '">' + S_MARK + '</button>';
  }
  // Self-check (silent on pass): comma escaping, all-day start/end, multi-event, filename.
  console.assert(toICS({ date: '2026-08-03', title: 'Fest, Session 2', sub: 'to 7 Aug' }).indexOf('SUMMARY:Fest\\, Session 2\\, to 7 Aug') > -1, 'toICS: comma escape');
  console.assert(toICS({ date: '2026-08-03', title: 'x', sub: '' }).indexOf('DTSTART;VALUE=DATE:20260803') > -1, 'toICS: all-day start');
  console.assert(toICS({ date: '2026-08-03', title: 'x', sub: '' }).indexOf('DTEND;VALUE=DATE:20260804') > -1, 'toICS: all-day end');
  console.assert(toICSAll([{ date: '2026-08-03', title: 'a', sub: '' }, { date: '2026-08-04', title: 'b', sub: '' }]).split('BEGIN:VEVENT').length === 3, 'toICSAll: two events, one calendar');
  console.assert(icsFilename({ date: '2026-08-14', title: 'New Family Orientation' }) === 'ELC - New Family Orientation - 14 Aug 2026.ics', 'icsFilename: readable name');
  console.assert(weekStart('2026-10-08').toISOString().slice(0, 10) === '2026-10-05' && weekStart('2026-10-11').toISOString().slice(0, 10) === '2026-10-05', 'weekStart: Monday for a Thursday + the Sunday edge');
  console.assert(agendaBucket('2026-10-02', '2026-10-02') === 0 && agendaBucket('2026-10-05', '2026-10-02') === 1 && agendaBucket('2026-10-12', '2026-10-02') === 2, 'agendaBucket: This/Next/Later around 2026-10-02');
  console.assert(goldOnly([{ type: 'gold' }, { type: 'purple' }, { type: 'gold' }]).length === 2, 'goldOnly: gold events only');
  console.assert(weekBounds('2026-10-08').start === '2026-10-05' && weekBounds('2026-10-08').end === '2026-10-11', 'weekBounds: Monday to Sunday');
  console.assert(termEnd([{ date: '2026-12-18', title: 'Last day of Term 1' }], '2026-07-11') === '2026-12-18', 'termEnd: next term close');
  console.assert(termEnd([{ date: '2026-08-01', title: 'x' }], '2026-01-01') === '2026-05-01', 'termEnd: 120-day fallback');
  console.assert(isDraftPage('glossary', ['glossary', 'refunds']) && !isDraftPage('calendar-print', ['glossary']), 'isDraftPage: membership');
  // Booking window lifecycle (plan 1.4, F5): from-1d / from / mid / until / until+1d,
  // plus the legacy-shaped-row trap (no from/until must never render as booking).
  console.assert(!bookingState({ from: '2026-08-10', until: '2026-08-19' }, '2026-08-09').show, 'bookingState: hidden the day before from');
  console.assert(bookingState({ from: '2026-08-10', until: '2026-08-19' }, '2026-08-10').days === 9, 'bookingState: opens on from with 9 days left');
  console.assert(bookingState({ from: '2026-08-10', until: '2026-08-19' }, '2026-08-15').closes === '4 days left', 'bookingState: mid-window copy');
  console.assert(bookingState({ from: '2026-08-10', until: '2026-08-19' }, '2026-08-19').closes === 'Closes today', 'bookingState: closes-today on until');
  console.assert(!bookingState({ from: '2026-08-10', until: '2026-08-19' }, '2026-08-20').show, 'bookingState: gone after until');
  console.assert(!bookingState({ date: '2026-08-19', label: 'x' }, '2026-08-15').show, 'bookingState: legacy regWindows shape never books');
  // href grammar (plan 1.2/1.8): bare site-relative directory paths only.
  console.assert(HREF_RE.test('hopes-and-wishes/') && HREF_RE.test('events/sports-day/'), 'href grammar: accepts dir paths');
  console.assert(!HREF_RE.test('/abs/') && !HREF_RE.test('../up/') && !HREF_RE.test('https://x.test/') && !HREF_RE.test('no-slash'), 'href grammar: rejects abs, dot-segments, schemes, non-dir');

  // Delegated: any .ics-btn downloads its event, named after it (issue 0032).
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.ics-btn');
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

  // Key-dates .ics (calendar page, issue 0032 F3): gold events only, one named file.
  var icsKey = document.getElementById('ics-key');
  if (icsKey && P.calendarEvents) {
    icsKey.addEventListener('click', function () {
      icsDownload(toICSAll(goldOnly(P.calendarEvents)), 'ELC key dates 2026-27.ics');
    });
  }

  // Share buttons (issue 0032 F10): delegated. Native share, else LINE share URL.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.share-btn');
    if (!btn) return;
    e.preventDefault();
    var url = btn.getAttribute('data-url') || location.href;
    var title = btn.getAttribute('data-title') || document.title;
    if (navigator.share) { navigator.share({ title: title, url: url }).catch(function () {}); }
    else { window.open('https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(url), '_blank', 'noopener'); }
  });

  // Draft chip (sprint 3 D5): a page still being finalised gets a visible marker at
  // the top of <main>. Reuses the .status.soon pill look; no new CSS (rule 7).
  var draftMain = document.querySelector('main[data-page]');
  if (draftMain && isDraftPage(draftMain.dataset.page, P.draftPages)) {
    var chip = document.createElement('div');
    chip.className = 'status soon draft-chip';
    chip.textContent = 'We are finalising this page. Details may change.';
    draftMain.insertBefore(chip, draftMain.firstChild);
  }

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

  // Registration windows strip (issue 0031) + booking windows (plan 1.4): rendered
  // wherever #reg-windows exists. Booking rows (hand-kept PORTAL.bookingWindows,
  // bounded from..until, whole row = one anchor, no add-to-calendar) render FIRST,
  // then the legacy countdown rows. Branch on the island: a booking row must never
  // reach the legacy filter (`undefined >= ISO` is silently false). Past rows drop off.
  var winMount = document.getElementById('reg-windows');
  if (winMount) {
    var bookRows = (P.bookingWindows || []).map(function (w) {
      var st = bookingState(w, bkkToday);
      var bHref = st.show && w.label ? evHref(w.href) : null;
      if (!bHref) return '';
      var u = new Date(w.until + 'T00:00:00Z');
      return '<a class="win-row book-row" href="' + bHref + '" aria-label="' + escAttr(w.label) + ' · booking page">' +
        '<span class="win-date num">to ' + u.getUTCDate() + ' ' + FN_MONS[u.getUTCMonth()] + '</span>' +
        '<div class="win-main"><div class="wt">' + w.label + '</div>' +
        (w.sub ? '<div class="ws">' + w.sub + '</div>' : '') + '</div>' +
        '<span class="win-count">' + st.closes + '</span></a>';
    }).join('');
    var upcoming = (P.regWindows || []).filter(function (w) { return w.date >= bkkToday; });
    var regRows = upcoming.map(function (w) {
      var d = new Date(w.date + 'T00:00:00Z');
      var days = Math.round((d - new Date(bkkToday + 'T00:00:00Z')) / 86400000);
      var when = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : 'In ' + days + ' days';
      return '<div class="win-row"><span class="win-date num">' + d.getUTCDate() + ' ' + FN_MONS[d.getUTCMonth()] + '</span>' +
        '<div class="win-main"><div class="wt">' + w.label + '</div><div class="ws">' + w.sub + '</div></div>' +
        '<span class="win-count">' + when + '</span>' + addBtns(w.date, w.label, w.sub) + '</div>';
    }).join('');
    if (!bookRows && !regRows) { winMount.remove(); }
    else { winMount.innerHTML = bookRows + regRows; }
  }

  // La Comunità seams (sprint 4, issue 0039). #community-events (community/) lists
  // upcoming community-tagged calendarEvents rows; #giving-next (community/giving/)
  // shows the next community-tagged fundraising entry. Both self-remove when nothing
  // is upcoming (air-tile pattern): the pages hardcode no claim either way.
  var commEvents = document.getElementById('community-events');
  if (commEvents && P.calendarEvents) {
    var commRows = P.calendarEvents
      .filter(function (e) { return e.community && e.date >= bkkToday; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; })
      .slice(0, 6);
    if (!commRows.length) commEvents.remove();
    else {
      commEvents.hidden = false;
      commEvents.className = 'section';
      commEvents.innerHTML =
        '<div class="sec-eyebrow"><span class="eyebrow">Coming up</span><span class="ln"></span></div>' +
        commRows.map(function (e) {
          var d = new Date(e.date + 'T00:00:00Z');
          var mHref = evHref(e.href);   // plan 1.2: same linked-title rule as the agendas
          var mInner = '<div class="et">' + e.title + '</div>' +
            (e.sub ? '<div class="es">' + e.sub + '</div>' : '');
          return '<div class="ev-row"><span class="dte">' + DOW[d.getUTCDay()] + ' ' + pad(d.getUTCDate()) + ' ' + FN_MONS[d.getUTCMonth()] + '</span>' +
            '<div class="ev-main">' + (mHref ? '<a class="ev-link" href="' + mHref + '" aria-label="' + escAttr(e.title) + ' · event page">' + mInner + '</a>' : mInner) + '</div>' +
            addBtns(e.date, e.title, e.sub) + '</div>';
        }).join('');
    }
  }
  var givingNext = document.getElementById('giving-next');
  if (givingNext && P.calendarEvents) {
    var drive = P.calendarEvents
      .filter(function (e) { return e.community && e.date >= bkkToday && /fundrais/i.test(e.title); })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; })[0];
    if (!drive) givingNext.remove();
    else {
      givingNext.hidden = false;
      givingNext.className = 'section';
      givingNext.innerHTML =
        '<div class="sec-eyebrow"><span class="eyebrow">The next drive</span><span class="ln"></span></div>' +
        '<div class="doc-list"><a class="doc-row" href="../../calendar/">' +
        '<span class="ic">CAL</span><div class="meta"><div class="nm">' + drive.title + '</div>' +
        '<div class="sub">' + fmtDMY(drive.date) + (drive.sub ? ' · ' + drive.sub : '') + '</div></div>' +
        '<div class="rt"><span class="tag">View calendar</span></div></a></div>';
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

  // Office-hours strip (sprint 3 P7): any [data-strip="office"]. null renders one
  // honest "coming" row (shared stripRows helper, D3).
  var offStrips = document.querySelectorAll('[data-strip="office"]');
  if (offStrips.length) {
    var offRows = (P.officeHours && P.officeHours.length)
      ? P.officeHours.map(function (o) { return { nm: o.campus, sub: [o.hours, o.note].filter(Boolean).join(' · ') }; })
      : [{ nm: 'Office hours coming', sub: '' }];
    var offHtml = stripRows(offRows, 'HRS');
    offStrips.forEach(function (el) { el.innerHTML = offHtml; });
  }

  // Outdoor-air tile (sprint 3 F4): #air-tile. null = removed (no tile). Otherwise
  // one row: today's outdoor-play decision, the note, and when it was updated.
  var airTile = document.getElementById('air-tile');
  if (airTile && !P.air) { airTile.remove(); }
  else if (airTile) {
    var AIR_MSG = { good: 'Outdoor play is on today', caution: 'Outdoor time is shortened today', indoor: 'We are indoors today' };
    var airSub = [P.air.note, P.air.updated ? 'Updated ' + P.air.updated : ''].filter(Boolean).join(' · ');
    airTile.innerHTML = stripRows([{ nm: AIR_MSG[P.air.level] || 'Outdoor play update', sub: airSub }], 'AIR');
  }

  // Rail reachability (status page, sprint 3 W1/D4): #rails-health. Any failure =
  // the block is removed silently. Never "healthy/down": a 200 proves reachable only.
  var railsMount = document.getElementById('rails-health');
  if (railsMount) {
    // Remove the whole section (eyebrow included), not just the inner list, so a
    // down worker leaves no orphan heading. Falls back to the mount if unwrapped.
    var railsKill = function () { (railsMount.closest('.section') || railsMount).remove(); };
    try {
      fetch('https://elc-ops.elcportal.workers.dev/api/rails', { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (data) {
          var rails = Array.isArray(data) ? data : (data && data.rails) || [];
          if (!rails.length) throw 0;
          railsMount.innerHTML = rails.map(function (rl) {
            var ok = rl.ok || rl.reachable;
            return '<div class="doc-row"><span class="ic">' + (ok ? 'OK' : '...') + '</span>' +
              '<div class="meta"><div class="nm">' + rl.name + '</div>' +
              '<div class="sub">' + (ok ? 'Reachable, checked just now' : 'Could not reach just now. We are re-checking.') + '</div></div></div>';
          }).join('');
        })
        .catch(railsKill);
    } catch (e) { railsKill(); }
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
    greet.textContent = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Bangkok', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date()).replace(',', '') + ' · ' + P.term;
  }

  // Leadership note rotation: latest note whose `from` <= today, Bangkok civil date.
  var noteTitle = document.getElementById('note-title');
  if (noteTitle && P.notes && P.notes.length) {
    var current = null;
    P.notes.forEach(function (n) { if (n.from <= bkkToday) current = n; });
    if (current) {
      document.getElementById('note-eyebrow').textContent = current.eyebrow;
      document.getElementById('note-when').textContent = current.when;
      noteTitle.textContent = current.title;
      document.getElementById('note-body').textContent = current.body;
      document.getElementById('note-sig').textContent = current.sig;
      // Note CTA (plan 1.5): optional expiring link after the body. createElement +
      // textContent only: the note is this file's textContent surface, and stays so.
      // Renders only with BOTH href and label, and only until `until` (inclusive).
      var noteBody = document.getElementById('note-body');
      var ctaHref = current.cta && current.cta.label && (!current.cta.until || current.cta.until >= bkkToday)
        ? evHref(current.cta.href) : null;
      if (ctaHref && noteBody) {
        var ctaA = document.createElement('a');
        ctaA.className = 'note-cta';
        ctaA.href = ctaHref;
        ctaA.textContent = current.cta.label;
        noteBody.parentNode.insertBefore(ctaA, noteBody.nextSibling);
      }
    }
  }

  // This-week agenda rows (home feature tile), derived from calendarEvents:
  // this week's events (Mon to Sun, Bangkok), else the next 3 upcoming.
  var agenda = document.getElementById('agenda');
  if (agenda && P.calendarEvents) {
    var mon = weekStart(bkkToday);
    var sun = new Date(mon); sun.setUTCDate(mon.getUTCDate() + 6);
    var monISO = mon.toISOString().slice(0, 10), sunISO = sun.toISOString().slice(0, 10);
    var rows = P.calendarEvents.filter(function (e) { return e.date >= monISO && e.date <= sunISO; });
    if (!rows.length) rows = P.calendarEvents.filter(function (e) { return e.date > bkkToday; }).slice(0, 3);
    agenda.innerHTML = rows.slice(0, 5).map(function (e) {
      var d = new Date(e.date + 'T00:00:00Z');
      var isToday = e.date === bkkToday;
      var aHref = evHref(e.href);   // plan 1.2: linked title when the event has a page
      var text = e.title + (e.sub ? ', ' + e.sub : '');
      return '<div class="agenda-row">' +
        '<span class="d num' + (isToday ? ' today' : '') + '">' + DOW[d.getUTCDay()] + ' ' + pad(d.getUTCDate()) + '</span>' +
        (aHref ? '<a class="t ev-link" href="' + aHref + '" aria-label="' + escAttr(e.title) + ' · event page">' + text + '</a>'
               : '<span class="t">' + text + '</span>') +
        (isToday ? '<span class="live"><span class="dot"></span>Today</span>' : '') +
        '</div>';
    }).join('');
  }

  // Calendar page agenda (#cal-agenda): This week / Next week / Later this term,
  // today onward, add-to-calendar buttons per row (folded from calendar/index.html,
  // sprint-2 H5). The month grid stays page-local on that page by design.
  var calAgenda = document.getElementById('cal-agenda');
  if (calAgenda && P.calendarEvents) {
    var shareUrl = location.origin + location.pathname;   // the calendar page itself (F10)
    var evs = P.calendarEvents.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var today0 = new Date(bkkToday + 'T00:00:00Z');
    var buckets = [
      { h: 'This week', cls: 'wk', rows: [] },
      { h: 'Next week', cls: 'wk next', rows: [] },
      { h: 'Later this term', cls: 'wk next', rows: [] }
    ];
    evs.forEach(function (e) {
      var d = new Date(e.date + 'T00:00:00Z');
      if (d < today0) return; /* past events drop off the agenda */
      var cHref = evHref(e.href);   // plan 1.2/1.3: linked title + the event page becomes the share target
      var inner = '<div class="et">' + e.title + '</div><div class="es">' + e.sub + '</div>';
      buckets[agendaBucket(e.date, bkkToday)].rows.push(
        '<div class="ev-row"><span class="dte' + (e.date === bkkToday ? ' today' : '') + '">' +
        DOW[d.getUTCDay()] + ' ' + pad(d.getUTCDate()) + '</span>' +
        '<div class="ev-main">' + (cHref ? '<a class="ev-link" href="' + cHref + '" aria-label="' + escAttr(e.title) + ' · event page">' + inner + '</a>' : inner) + '</div>' +
        addBtns(e.date, e.title, e.sub) + shareBtn(cHref ? absHref(e.href) : shareUrl, e.title) + '</div>'
      );
    });
    /* Keep the agenda column readable: cap Later this term at 12 rows; the grid holds the year. */
    var laterTotal = buckets[2].rows.length;
    if (laterTotal > 12) {
      buckets[2].rows = buckets[2].rows.slice(0, 12);
      buckets[2].rows.push('<div class="cal-note mono">And ' + (laterTotal - 12) + ' more across the year: use the month grid above.</div>');
    }
    calAgenda.innerHTML = buckets.filter(function (g) { return g.rows.length; })
      .map(function (g) { return '<div class="' + g.cls + '">' + g.h + '</div>' + g.rows.join(''); }).join('');
  }

  // Fridge print (calendar/print/, sprint 3 F2): #print-list. ?range=week|term
  // (default week). week = this Bangkok Mon-Sun; term = today through the next term
  // close (else 120 days). Dense date rows; an empty range says so plainly.
  var printList = document.getElementById('print-list');
  if (printList && P.calendarEvents) {
    var pRange = new URLSearchParams(location.search).get('range') === 'term' ? 'term' : 'week';
    var pAsc = P.calendarEvents.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var pw = weekBounds(bkkToday);
    var pBounds = pRange === 'term'
      ? { start: bkkToday, end: termEnd(pAsc, bkkToday), label: 'This term' }
      : { start: pw.start, end: pw.end, label: 'This week' };
    var pRows = pAsc.filter(function (e) { return e.date >= pBounds.start && e.date <= pBounds.end; });
    printList.innerHTML = pRows.length
      ? pRows.map(function (e) {
          var d = new Date(e.date + 'T00:00:00Z');
          return '<div class="ev-row"><span class="dte' + (e.date === bkkToday ? ' today' : '') + '">' +
            DOW[d.getUTCDay()] + ' ' + pad(d.getUTCDate()) + ' ' + FN_MONS[d.getUTCMonth()] + '</span>' +
            '<div class="ev-main"><div class="et">' + e.title + '</div>' +
            (e.sub ? '<div class="es">' + e.sub + '</div>' : '') + '</div></div>';
        }).join('')
      : '<div class="ev-row"><div class="ev-main"><div class="et">No dated events in this range.</div></div></div>';
    var pLabel = document.getElementById('print-range-label');
    if (pLabel) pLabel.textContent = pBounds.label + ' · printed ' + fmtDMY(bkkToday);
  }

  // Sport rows + status pills (home sport tile). status vocab: open | soon |
  // waitlist | full (sprint 3 F5). Each value maps straight to a .status.<value>
  // class + its label, so waitlist/full need no code branch here.
  // NOTE for integrator (Lane D): app.css defines only .status.open and .status.soon.
  // .status.waitlist and .status.full render unstyled until Lane D adds their rules.
  var grid = document.getElementById('sport-grid');
  if (grid && P.sports) {
    grid.innerHTML = P.sports.map(function (s) {
      return '<div class="sport-row"><span class="n">' + s.name + '</span>' +
        '<span class="status ' + s.status + '">' + s.label + '</span></div>';
    }).join('');
  }
  var note = document.getElementById('sport-note');
  if (note && P.sportNote) note.textContent = P.sportNote;

  // Sport open count (activities page foot): folded from activities/index.html
  // under the mount-gate contract (sprint-2 H5).
  var openCount = document.getElementById('sport-open-count');
  if (openCount && P.sports) {
    var openN = P.sports.filter(function (s) { return s.status === 'open'; }).length;
    var NUM_WORDS = ['None', 'One', 'Two', 'Three', 'Four', 'Five'];
    openCount.textContent = (NUM_WORDS[openN] || openN) + ' open now';
  }

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
        // Freshness stamp (F6) rides the sub line; the operative rule (F7) is a
        // second sub line. Both are honest-only and set from real registry truth.
        var reviewed = d.reviewed ? ' <span class="mono">' + fmtReviewed(d.reviewed) + '</span>' : '';
        var inner = '<span class="ic">' + d.kind + '</span>' +
          '<div class="meta"><div class="nm">' + d.name + '</div>' +
            '<div class="sub">' + d.sub + reviewed + '</div>' +
            (d.rule ? '<div class="sub">In short: ' + d.rule + '</div>' : '') +
          '</div>' +
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

  // Hopes and Wishes / PTC booking cards (issue 0043, plan 2026-07-16). Mount-gated
  // on #team-cards (year sections) + #team-jump (anchor strip). Class-keyed and
  // null-degrading (rule 6): no bookingUrl -> "Booking link coming" (never href="#"),
  // no photo -> initials placeholder, no bio -> "coming" line. Booking is LINK-OUT
  // only (rule 1); no embed. Open/dormant derives from ptc.dates, no manual flag.
  var teamMount = document.getElementById('team-cards');
  if (teamMount && P.ptc && P.classes) {
    var YEAR_ORDER = ['demo', 'K1', 'K2', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6'];
    var YEAR_LABEL = { demo: 'See how it works', K1: 'Kindergarten 1', K2: 'Kindergarten 2',
      Y1: 'Year 1', Y2: 'Year 2', Y3: 'Year 3', Y4: 'Year 4', Y5: 'Year 5', Y6: 'Year 6' };
    // Booking open while today <= the last PTC date; dormant after. Pure + assertable.
    function ptcOpen(dates, todayISO) {
      if (!dates || !dates.length) return false;
      return todayISO <= dates.map(function (d) { return d.date; }).sort().pop();
    }
    // live = open + a real link; coming = open + no link yet; closed = window past.
    function cardState(cls, open) { return !open ? 'closed' : (cls.bookingUrl ? 'live' : 'coming'); }
    function initials(name) {
      var w = String(name || '').trim().split(/\s+/);
      return (((w[0] || '?')[0]) + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase();
    }
    console.assert(ptcOpen([{ date: '2026-08-17' }, { date: '2026-08-19' }, { date: '2026-08-18' }], '2026-08-15'), 'ptcOpen: open on the last day and before');
    console.assert(!ptcOpen([{ date: '2026-08-19' }], '2026-08-20'), 'ptcOpen: dormant after the last date');
    console.assert(cardState({ bookingUrl: 'x' }, true) === 'live' && cardState({}, true) === 'coming' && cardState({ bookingUrl: 'x' }, false) === 'closed', 'cardState: live / coming / closed');
    console.assert(initials('Kobus Roux') === 'KR' && initials('Athena') === 'A', 'initials: two names, then one');

    var ptcIsOpen = ptcOpen(P.ptc.dates, bkkToday);
    var byYear = {};
    P.classes.forEach(function (c) { (byYear[c.year] = byYear[c.year] || []).push(c); });
    var years = YEAR_ORDER.filter(function (y) { return byYear[y]; });

    var jump = document.getElementById('team-jump');
    if (jump) {
      jump.innerHTML = years.map(function (y) {
        return '<a class="f" href="#y-' + y + '">' + (y === 'demo' ? 'Demo' : y) + '</a>';
      }).join('');
    }
    // Honest closed line when the window has passed (cards stay; Book turns off).
    var ptcStatus = document.getElementById('ptc-status');
    if (ptcStatus && !ptcIsOpen) {
      ptcStatus.textContent = 'Bookings are closed. The next conferences are in October.';
    }

    function avatar(t) {
      return t.photo
        ? '<img class="headshot" src="' + ROOT + escAttr(t.photo) + '" alt="" width="48" height="48" loading="lazy">'
        : '<span class="hs-ph" aria-hidden="true">' + initials(t.name) + '</span>';
    }
    function teacherLine(t) {
      return '<div class="tname">' + t.name +
        (t.role ? ' <span class="role">' + t.role + '</span>' : '') +
        (t.flag ? ' <span class="chip">' + t.flag + '</span>' : '') + '</div>' +
        (t.bio ? '<p class="tbio">' + t.bio + '</p>' : '<p class="tbio none">A short introduction is on the way.</p>');
    }
    function bookCell(cls, state) {
      if (state === 'live') return '<a class="btn sm" target="_blank" rel="noopener" href="' + escAttr(cls.bookingUrl) + '" aria-label="Book a time with ' + escAttr(cls.class) + ', opens in a new tab">Book a time</a>';
      return '<span class="status soon">' + (state === 'closed' ? 'Bookings closed' : 'Booking link coming') + '</span>';
    }
    teamMount.innerHTML = years.map(function (y) {
      var cards = byYear[y].map(function (c) {
        var state = cardState(c, ptcIsOpen);
        var chips = (c.teachers.length > 1 ? '<span class="chip">Two teachers</span>' : '') +
          (c.campus ? '<span class="chip">' + c.campus + '</span>' : '') +
          (c.flag ? '<span class="chip">' + c.flag + '</span>' : '');
        return '<div class="doc-row team-card">' +
          '<span class="tc-faces">' + c.teachers.map(avatar).join('') + '</span>' +
          '<div class="meta"><div class="nm">' + c.class + (chips ? ' ' + chips : '') + '</div>' +
          c.teachers.map(teacherLine).join('') + '</div>' +
          '<div class="rt">' + bookCell(c, state) + '</div></div>';
      }).join('');
      return '<div class="section" id="y-' + y + '">' +
        '<div class="sec-eyebrow"><span class="eyebrow">' + (YEAR_LABEL[y] || y) + '</span><span class="ln"></span></div>' +
        '<div class="doc-list">' + cards + '</div></div>';
    }).join('');
  }

  // Page-open beacon (issue 0028 / W1): one anonymous datapoint per view, to the
  // ops worker. DNT '1' opts out. Fire-and-forget: no cookies, no IP/UA stored, and
  // it never blocks or errors the page (wrapped, sendBeacon returns immediately).
  try {
    if (!navigator.doNotTrack || navigator.doNotTrack !== '1') {
      navigator.sendBeacon && navigator.sendBeacon(
        'https://elc-ops.elcportal.workers.dev/hit',
        JSON.stringify({ path: location.pathname.replace(/^.*portal-test/, '') || location.pathname })
      );
    }
  } catch (e) {}
})();

/* Portal-wide search (sprint 3 F1). Self-contained, appended after the main
   render IIFE (lane A owns that one). The index (assets/search-index.json) is
   built at deploy by tools/build-search.py; if it is absent the fetch fails and
   search silently stays inert (no console error). Every page's search input
   carries data-root = its rel prefix, so result links resolve from any depth. */
(function () {
  var input = document.getElementById('q');
  var box = document.getElementById('q-results');
  if (!input || !box) return;
  var root = input.getAttribute('data-root') || '';
  var index = null, loading = false;

  // A field may be a string or (defensively) an array; fold to one lowercased string.
  function field(v) { return (Array.isArray(v) ? v.join(' ') : (v == null ? '' : v)).toLowerCase(); }
  // Rank: a title hit (3) beats a heading hit (2) beats a body hit (1); 0 = no hit.
  function score(e, q) {
    if (field(e.t).indexOf(q) > -1) return 3;
    if (field(e.h).indexOf(q) > -1) return 2;
    if (field(e.b).indexOf(q) > -1) return 1;
    return 0;
  }
  console.assert(
    score({ t: 'Swimming', h: '', b: 'pool' }, 'swim') > score({ t: '', h: '', b: 'swimming club' }, 'swim'),
    'search: a title hit outranks a body hit');

  function hide() { box.hidden = true; box.textContent = ''; }

  function run() {
    var q = input.value.trim().toLowerCase();
    if (q.length < 2) { hide(); return; }
    if (!index) return;                       // not loaded yet; focus handler will re-run
    var hits = index.map(function (e) { return { e: e, s: score(e, q) }; })
                    .filter(function (r) { return r.s > 0; })
                    .sort(function (a, b) { return b.s - a.s; })
                    .slice(0, 6);
    box.textContent = '';
    if (!hits.length) {
      var none = document.createElement('div');
      none.className = 'q-none';
      none.textContent = 'No pages match';
      box.appendChild(none);
    } else {
      hits.forEach(function (r) {
        var a = document.createElement('a');
        // u is site-root-relative (home is "/"); data-root is the prefix back to
        // root, so strip u's leading slash before joining. Empty (home from home)
        // falls back to "./".
        a.href = (root + String(r.e.u).replace(/^\//, '')) || './';
        a.textContent = r.e.t;
        box.appendChild(a);
      });
    }
    box.hidden = false;
  }

  function load() {
    if (index) { run(); return; }
    if (loading) return;
    loading = true;
    fetch(root + 'assets/search-index.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { index = Array.isArray(j) ? j : (j && j.pages) || []; run(); })
      .catch(function () { loading = false; });   // silent: leave search inert
  }

  input.addEventListener('focus', load);
  input.addEventListener('input', run);
  input.addEventListener('blur', function () { setTimeout(hide, 150); });  // let a result click land first
  input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { hide(); input.blur(); } });
})();
