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
  var CAL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
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
  // Escape hatch for events that live on the main school site (e.g. summer school):
  // a validated https URL on e.ext, opened in a new tab. evHref stays internal-only
  // (its grammar rejects schemes), so this is the only path to an off-portal link.
  var EXT_RE = /^https:\/\/[a-z0-9.-]+(\/[^\s"'<>]*)?$/i;
  function extUrl(e) { return (e && typeof e.ext === 'string' && EXT_RE.test(e.ext)) ? e.ext : null; }
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
  // Sunday (UTC midnight) of the week containing the given ISO date. Weeks start on
  // Sunday portal-wide (relay #16, Trevor 2026-07-27): a family checking on Sunday
  // sees the week ahead, not the week that just ended. The month grid and the print
  // sheet share the convention.
  function weekStart(iso) {
    var d = new Date(iso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    return d;
  }
  // ISO date + n days (UTC-midnight anchored). The one add-days idiom (0050 sweep;
  // was coined three times: here, the Coming-up window, the coffee slides due date).
  function isoPlusDays(iso, n) {
    var d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  // Agenda bucket (P4 pass A): 0 = on this calendar month (today onward), 1 = later
  // this term. The calendar agenda defaults to the month, not the week (Trevor 2026-07-19).
  function monthEndISO(todayISO) {
    var t = new Date(todayISO + 'T00:00:00Z');
    return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  }
  function agendaBucket(dateISO, todayISO) {
    return dateISO <= monthEndISO(todayISO) ? 0 : 1;
  }
  // Fridge-print "term" end: the next key date titled like a term close (else 120
  // days out). evs must be sorted ascending. Pure + assertable.
  function termEnd(evs, todayISO) {
    var re = /Last day of Term|Last day of the school year|Holiday: Christmas/;
    for (var i = 0; i < evs.length; i++) {
      if (evs[i].date >= todayISO && re.test(evs[i].title)) return evs[i].date;
    }
    return isoPlusDays(todayISO, 120);
  }
  // type:'gold' = key date / milestone; drives the key-dates .ics feed (issue 0032 F3).
  function goldOnly(evs) { return evs.filter(function (e) { return e.type === 'gold'; }); }
  // La Comunità split (issue 0071): comunita:true rows live on community/ and stay off
  // every CORE calendar surface. This is THE filter point: the week strip, the coming-up
  // band, the calendar month grid and the calendar agenda (City and PE alike) all read
  // their rows through it. The community/ renderers below select exactly these rows;
  // the print sheet already drops them via cat (0066); search is page-based, unaffected.
  function coreRows(evs) { return (evs || []).filter(function (e) { return !e.comunita; }); }
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
  // Icon cell (0050 sweep, per the Claude Design realignment NOTE): generated doc
  // rows use the same Lucide sprite as the static pages where a glyph fits; kinds
  // with no honest glyph (HRS, AIR, ALERT, '...') stay as quiet mono text, which
  // the .doc-list .ic treatment styles anyway. CAL/LINK ride i-go (nav rows).
  var IC_SYM = { PDF: 'i-pdf', LINK: 'i-go', OK: 'i-do', NOTE: 'i-note', DSL: 'i-who', CAL: 'i-go' };
  function ic(kind) {
    return IC_SYM[kind]
      ? '<span class="ic icx"><svg class="ig" aria-hidden="true"><use href="' + ROOT + 'assets/img/icons.svg#' + IC_SYM[kind] + '"/></svg></span>'
      : '<span class="ic">' + kind + '</span>';
  }
  console.assert(ic('PDF').indexOf('#i-pdf') > -1 && ic('HRS').indexOf('>HRS<') > -1, 'ic: sprite when mapped, text otherwise');
  // Shared strip (sprint 3 D3): a doc-list of {nm, sub} rows under one mono icon.
  // Used by the office-hours strip and the air tile.
  function stripRows(items, iconText) {
    return '<div class="doc-list">' + items.map(function (it) {
      return '<div class="doc-row">' + ic(iconText) +
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
    // Multi-day events (P4 pass A): ev.until is the inclusive last day; DTEND is
    // exclusive so it is until+1. Single-day events end the day after the start.
    var endBase = (ev.until && ev.until >= ev.date) ? ev.until : ev.date;
    var end = new Date(endBase + 'T00:00:00Z'); end.setUTCDate(end.getUTCDate() + 1);
    return { start: dt, end: end.toISOString().slice(0, 10).replace(/-/g, '') };
  }
  // Absolute URL of an event's own page (else the calendar page): carries the portal's
  // single-source promise into every calendar export (P4 pass A). evHref returns a
  // site-root-relative path; absolutise it against this page.
  function eventUrl(href) {
    var rel = evHref(href);
    return new URL(rel || (ROOT + 'calendar/'), location.href).href;
  }
  function icsVevent(ev) {
    var d = icsDates(ev);
    var summary = icsEsc(ev.title + (ev.sub ? ', ' + ev.sub : ''));
    var url = eventUrl(ev.href);
    var slug = ev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    // ponytail: no RFC-5545 75-octet line folding; every current SUMMARY is under
    // the limit. Add a fold here if a longer event title ever lands.
    return [
      'BEGIN:VEVENT', 'UID:' + d.start + '-' + slug + '@portal.elc.ac.th',
      'DTSTAMP:' + d.start + 'T000000Z', 'DTSTART;VALUE=DATE:' + d.start, 'DTEND;VALUE=DATE:' + d.end,
      'SUMMARY:' + summary, 'URL:' + url, 'DESCRIPTION:' + icsEsc('Details: ' + url), 'END:VEVENT'
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
    var clean = ev.title.replace(/[\/\\:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
    return 'ELC - ' + clean + ' - ' + fmtDMY(ev.date) + '.ics';
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
      encodeURIComponent(ev.title + (ev.sub ? ', ' + ev.sub : '')) + '&dates=' + d.start + '/' + d.end +
      '&details=' + encodeURIComponent('Details: ' + eventUrl(ev.href));
  }

  // Platform add buttons (issue 0032): Google opens a pre-filled event in a new
  // tab (no file), Apple downloads a named .ics. Monochrome marks, tokens-coloured;
  // Claude Design may restyle (rule 7). Shared by the calendar agenda + windows strips.
  var G_MARK = '<svg viewBox="0 0 488 512" aria-hidden="true"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/></svg>';
  var A_MARK = '<svg viewBox="0 0 384 512" aria-hidden="true"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>';
  function addBtns(date, title, sub, href, until) {
    var ev = { date: date, title: title, sub: sub || '', href: href || null, until: until || null };
    return '<span class="cal-add">' +
      '<a class="add-btn" target="_blank" rel="noopener" href="' + gcalUrl(ev) + '"' +
      ' title="Add to Google Calendar" aria-label="Add ' + escAttr(title) + ' to Google Calendar">' + G_MARK + '</a>' +
      '<button type="button" class="add-btn ics-btn" data-date="' + date + '" data-title="' + escAttr(title) + '" data-sub="' + escAttr(sub || '') +
      '" data-href="' + escAttr(href || '') + '" data-until="' + escAttr(until || '') + '"' +
      ' title="Add to Apple Calendar (.ics file)" aria-label="Add ' + escAttr(title) + ' to Apple Calendar">' + A_MARK + '</button></span>';
  }
  // Share mark (issue 0032 F10): native share where available, LINE fallback.
  var S_MARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 12v8h16v-8M12 3v13M8 7l4-4 4 4"/></svg>';
  function shareBtn(url, title) {
    return '<button type="button" class="add-btn share-btn" data-url="' + escAttr(url) + '" data-title="' + escAttr(title) + '"' +
      ' title="Share" aria-label="Share ' + escAttr(title) + '">' + S_MARK + '</button>';
  }
  // Add/share cluster (0055): on a phone the three squares (Google, Apple, share) are
  // one control that taps open to reveal them; desktop shows all three inline (toggle
  // hidden). CC wires the toggle + a first-pass look; CD refines the expanded control
  // (rule 7). The inner addBtns()/shareBtn() wiring + .ics filenames are unchanged.
  var PLUS_MARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 5v14M5 12h14"/></svg>';
  function calActions(date, title, sub, href, until, shareTarget) {
    return '<span class="cal-actions">' +
      '<button type="button" class="cal-actions-toggle" aria-expanded="false" aria-label="Add or share ' + escAttr(title) + '">' +
      PLUS_MARK + '<span class="lbl">Add / share</span></button>' +
      '<span class="cal-actions-menu">' + addBtns(date, title, sub, href, until) + shareBtn(shareTarget, title) + '</span></span>';
  }
  // Self-check (silent on pass): comma escaping, all-day start/end, multi-event, filename.
  console.assert(toICS({ date: '2026-08-03', title: 'Fest, Session 2', sub: 'to 7 Aug' }).indexOf('SUMMARY:Fest\\, Session 2\\, to 7 Aug') > -1, 'toICS: comma escape');
  console.assert(toICS({ date: '2026-08-03', title: 'x', sub: '' }).indexOf('DTSTART;VALUE=DATE:20260803') > -1, 'toICS: all-day start');
  console.assert(toICS({ date: '2026-08-03', title: 'x', sub: '' }).indexOf('DTEND;VALUE=DATE:20260804') > -1, 'toICS: all-day end');
  console.assert(toICS({ date: '2026-08-03', title: 'x', sub: '', until: '2026-08-07' }).indexOf('DTEND;VALUE=DATE:20260808') > -1, 'toICS: multi-day DTEND is until+1');
  console.assert(toICS({ date: '2026-08-03', title: 'x', sub: '' }).indexOf('URL:') > -1 && toICS({ date: '2026-08-03', title: 'x', sub: '' }).indexOf('DESCRIPTION:Details: ') > -1, 'toICS: carries event URL + description');
  console.assert(toICSAll([{ date: '2026-08-03', title: 'a', sub: '' }, { date: '2026-08-04', title: 'b', sub: '' }]).split('BEGIN:VEVENT').length === 3, 'toICSAll: two events, one calendar');
  console.assert(icsFilename({ date: '2026-08-14', title: 'New Family Orientation' }) === 'ELC - New Family Orientation - 14 Aug 2026.ics', 'icsFilename: readable name');
  console.assert(weekStart('2026-10-08').toISOString().slice(0, 10) === '2026-10-04' && weekStart('2026-10-10').toISOString().slice(0, 10) === '2026-10-04' && weekStart('2026-10-11').toISOString().slice(0, 10) === '2026-10-11', 'weekStart: Sunday for a Thursday/Saturday + a Sunday is its own start');
  console.assert(monthEndISO('2026-10-02') === '2026-10-31' && monthEndISO('2027-02-15') === '2027-02-28', 'monthEndISO: last day of month');
  console.assert(agendaBucket('2026-10-20', '2026-10-02') === 0 && agendaBucket('2026-11-01', '2026-10-02') === 1 && agendaBucket('2026-10-31', '2026-10-02') === 0, 'agendaBucket: this-month vs later, month-end inclusive');
  console.assert(goldOnly([{ type: 'gold' }, { type: 'purple' }, { type: 'gold' }]).length === 2, 'goldOnly: gold events only');
  console.assert(coreRows([{ title: 'a' }, { title: 'b', comunita: true }, { title: 'c', comunita: false }]).length === 2 && coreRows(null).length === 0, 'coreRows: drops comunita rows, tolerates a missing island');
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
  console.assert(extUrl({ ext: 'https://www.elc.ac.th/summer-school/' }) && !extUrl({ ext: '/local/' }) && !extUrl({ ext: 'javascript:alert(1)' }) && !extUrl({ ext: 'https://x/" onmouseover="y' }) && !extUrl({ href: 'x/' }), 'extUrl: https only, rejects relative / js-scheme / attribute-breakout / missing');

  // Delegated: any .ics-btn downloads its event, named after it (issue 0032).
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.ics-btn');
    if (!btn) return;
    e.preventDefault();
    var date = btn.getAttribute('data-date'), title = btn.getAttribute('data-title');
    if (!date || !title) return;
    var ev = {
      date: date, title: title, sub: btn.getAttribute('data-sub') || '',
      href: btn.getAttribute('data-href') || null, until: btn.getAttribute('data-until') || null
    };
    icsDownload(toICS(ev), icsFilename(ev));
  });

  // The whole-year / key-dates snapshot download buttons were retired in P4 pass A
  // (UC-1): a downloaded .ics never updates, so it is the confusing path. The live
  // feed is served headless at api/v1/elc-calendar.ics (build-api.mjs) for the
  // subscribe UI that lands with the source-of-truth ADR at v0.9/1.0. toICSAll +
  // goldOnly stay as tested helpers for that UI. Per-event add-to-calendar remains.

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

  /* Campus switcher (issue 0067). Desktop: highlight the current centre in the
     header .campus-switch. Mobile: the #centres-tab button opens a bottom sheet
     (cloned from the header switcher, so hrefs already carry this page's depth),
     reusing the day-sheet convention (.cal-pop + body.sheet-open). */
  (function () {
    var sw = document.querySelector('.campus-switch');
    if (!sw) return;
    function centreOf(href) {
      if (/purple-elephant\/thong-lor\//.test(href)) return 'thonglor';
      if (/purple-elephant\/samakee\//.test(href)) return 'samakee';
      return 'city';
    }
    var here = /\/purple-elephant\/thong-lor(\/|$)/.test(location.pathname) ? 'thonglor'
             : /\/purple-elephant\/samakee(\/|$)/.test(location.pathname) ? 'samakee'
             : 'city';
    var links = sw.querySelectorAll('.campus');
    for (var i = 0; i < links.length; i++) {
      if (centreOf(links[i].getAttribute('href')) === here) {
        links[i].classList.add('active');
        links[i].setAttribute('aria-current', 'page');
      }
    }

    var tab = document.getElementById('centres-tab');
    if (!tab) return;
    var sheet = null;
    function closeSheet(returnFocus) {
      if (!sheet) return;
      sheet.remove(); sheet = null;
      document.body.classList.remove('sheet-open');
      tab.setAttribute('aria-expanded', 'false');
      if (returnFocus) tab.focus();
    }
    function openSheet() {
      if (sheet) { closeSheet(false); return; }
      sheet = document.createElement('div');
      sheet.className = 'cal-pop';
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-modal', 'true');
      sheet.setAttribute('aria-label', 'Choose an ELC centre');
      sheet.tabIndex = -1;
      sheet.appendChild(sw.cloneNode(true));   // depth-correct links + the .active marker
      document.body.appendChild(sheet);
      document.body.classList.add('sheet-open');
      tab.setAttribute('aria-expanded', 'true');
      sheet.focus();
    }
    tab.addEventListener('click', function () { openSheet(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(true); });
    // Tap outside the sheet (and not on the tab) closes it.
    document.addEventListener('click', function (e) {
      if (!sheet) return;
      if (sheet.contains(e.target) || tab.contains(e.target)) return;
      closeSheet(false);
    });
  })();

  // Add/share cluster toggle (0055): reveal the three controls on mobile. Delegated so it
  // covers every agenda row; the inner add/share buttons keep their own handlers above.
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.cal-actions-toggle');
    if (!t) return;
    var wrap = t.closest('.cal-actions');
    if (!wrap) return;
    var open = wrap.classList.toggle('open');
    t.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Draft chip (sprint 3 D5): a page still being finalised gets a visible marker at
  // the top of its content root. Reuses the .status.soon pill look; no new CSS (rule 7).
  // Matched on [data-page], NOT main[data-page] (issue 0090): every content root is a
  // <main> today, but tying the chip to the element name means a data-page on anything
  // else renders no chip and reports no error. The key is the contract, not the tag.
  var draftRoot = document.querySelector('[data-page]');
  if (draftRoot && isDraftPage(draftRoot.dataset.page, P.draftPages)) {
    var chip = document.createElement('div');
    chip.className = 'status soon draft-chip';
    chip.textContent = 'We are finalising this page. Details may change.';
    draftRoot.insertBefore(chip, draftRoot.firstChild);
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
      statusNow.innerHTML = '<div class="doc-row">' + ic(P.status.level === 'alert' ? 'ALERT' : 'NOTE') +
        '<div class="meta"><div class="nm">' + P.status.title + '</div><div class="sub">' + P.status.body + '</div></div></div>';
    } else {
      statusNow.innerHTML = '<div class="doc-row">' + ic('OK') +
        '<div class="meta"><div class="nm">Everything is running as normal.</div>' +
        '<div class="sub">All campuses are open on their usual hours today.</div></div></div>';
    }
  }

  // Booking windows strip (plan 1.4; P4 pass A): rendered wherever #reg-windows exists
  // (home = inside the This-week band, under its eyebrow). The legacy regWindows
  // countdown path is retired (its two sport rows are calendarEvents now). Booking rows
  // are hand-kept PORTAL.bookingWindows, bounded from..until, whole row = one anchor,
  // no add-to-calendar. The mount self-removes when no booking window is open.
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
    if (!bookRows) { winMount.remove(); }
    else { winMount.innerHTML = bookRows; }
  }

  // La Comunità seams (sprint 4, issue 0039). #community-events (community/) lists
  // upcoming community-tagged calendarEvents rows; #giving-next (community/giving/)
  // shows the next community-tagged fundraising entry. Both self-remove when nothing
  // is upcoming (air-tile pattern): the pages hardcode no claim either way.
  // commRow is one event row (dated, linked title, add-to-calendar), shared with the
  // comunita sections below (issue 0071). extLabel names what an external link opens.
  function commRow(e, extLabel) {
    var d = new Date(e.date + 'T00:00:00Z');
    var mHref = evHref(e.href);   // plan 1.2: same linked-title rule as the agendas
    var mExt = mHref ? null : extUrl(e);   // else, an external https link (round 4)
    var mInner = '<div class="et">' + e.title + '</div>' +
      (e.sub ? '<div class="es">' + e.sub + '</div>' : '');
    return '<div class="ev-row"><span class="dte">' + DOW[d.getUTCDay()] + ' ' + pad(d.getUTCDate()) + ' ' + FN_MONS[d.getUTCMonth()] + '</span>' +
      '<div class="ev-main">' + ((mHref || mExt) ? '<a class="ev-link" href="' + (mHref || mExt) + '"' + (mExt ? ' target="_blank" rel="noopener"' : '') + ' aria-label="' + escAttr(e.title) + (mExt ? extLabel : ' · event page') + '">' + mInner + '</a>' : mInner) + '</div>' +
      addBtns(e.date, e.title, e.sub, e.href, e.until) + '</div>';
  }
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
        commRows.map(function (e) { return commRow(e, ' · on the school site'); }).join('');
    }
  }

  // La Comunità split sections (issue 0071): the comunita rows that coreRows() filters
  // off the core calendar surfaces land HERE instead. #community-workshops = upcoming
  // comunita rows with cat 'workshop'; #community-mornings = cat 'social', shown as
  // "Coffee mornings" (naming fixed in-sheet by Sarah). Both islands feed in, so a
  // PE-tab comunita row is never invisible (no campus chip yet: copy/CD pass). A title
  // links out only when the row carries a registration URL on ext (Jotform etc.:
  // progressive enrichment, no hard content gate). Same self-remove-when-empty idiom
  // as #community-events above, so the page ships inert until Sarah flags rows.
  //
  // 0079 (2026-08-03): workshops separated FULLY from the calendar, and this section is
  // their canonical home, so it STANDS EVEN WHEN EMPTY with an honest waiting line:
  // self-removing would leave workshops with no home at all until Sarah's column lands.
  // Social mornings keep the self-remove idiom; that section carries no such promise.
  function comunitaRows(cat) {
    return (P.calendarEvents || []).concat(P.peEvents || [])
      .filter(function (e) { return e.comunita && e.cat === cat && e.date >= bkkToday; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  }
  [{ id: 'community-workshops', cat: 'workshop', heading: 'Workshops', stands: true,
     empty: 'The year\'s parent workshops are being confirmed with the team. Every one of them will appear here, with its sign-up link, as it lands.' },
   { id: 'community-mornings', cat: 'social', heading: 'Social mornings', stands: false }].forEach(function (sec) {
    var mount = document.getElementById(sec.id);
    if (!mount) return;
    var rows = comunitaRows(sec.cat);
    if (!rows.length && !sec.stands) { mount.remove(); return; }
    mount.hidden = false;
    mount.className = 'section';
    mount.innerHTML =
      '<div class="sec-eyebrow"><span class="eyebrow">' + sec.heading + '</span><span class="ln"></span></div>' +
      (rows.length
        ? rows.map(function (e) { return commRow(e, ' · registration page'); }).join('')
        : '<p class="page-note">' + sec.empty + '</p>');
  });
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
        '<div class="doc-list"><a class="doc-row" href="' + ROOT + 'calendar/">' +
        ic('CAL') + '<div class="meta"><div class="nm">' + drive.title + '</div>' +
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
            return '<div class="doc-row">' + ic(ok ? 'OK' : '...') +
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
      return '<div class="doc-row">' + ic('DSL') +
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

      // Read-state + past-note history (Trevor 2026-07-21). Device-local only: the card
      // (a native <details>) auto-opens for a note this device has not seen, marks it
      // read on first view, then stays collapsed until a newer note appears. Past notes
      // scroll inside the card (revealed on expand). JS-off = the static <details open>.
      var noteCard = document.getElementById('home-note');
      if (noteCard) {
        var SEEN_KEY = 'elcp:note-seen';
        var seen = null;
        try { seen = localStorage.getItem(SEEN_KEY); } catch (e) {}   // private mode: no store, stays open
        var isNew = seen !== current.from;
        noteCard.open = isNew;
        // ponytail: mark read on first view of a new note, not on an explicit collapse
        // click, so a returning device is never nagged. Upgrade path if "read" must mean
        // dwell/scroll: gate this write behind an IntersectionObserver + timer.
        if (isNew) { try { localStorage.setItem(SEEN_KEY, current.from); } catch (e) {} }

        // History: notes already live (from <= today) other than the current, newest first.
        var byFromDesc = function (a, b) { return b.from.localeCompare(a.from); };
        console.assert([{ from: '2026-07-01' }, { from: '2026-08-17' }].slice().sort(byFromDesc)[0].from === '2026-08-17', 'note history: newest first');
        var hist = document.getElementById('note-history');
        var past = (P.notes || []).filter(function (n) { return n.from <= bkkToday && n.from !== current.from; }).sort(byFromDesc);
        if (hist && past.length) {
          var hf = document.createDocumentFragment();
          var lbl = document.createElement('div');
          lbl.className = 'nh-label';
          lbl.textContent = 'Earlier notes';
          hf.appendChild(lbl);
          past.forEach(function (n) {
            var it = document.createElement('article');
            it.className = 'nh-item';
            var w = document.createElement('div'); w.className = 'nh-when'; w.textContent = n.when || '';
            var h = document.createElement('h3'); h.className = 'nh-title'; h.textContent = n.title || '';
            var b = document.createElement('p'); b.className = 'nh-body'; b.textContent = n.body || '';
            it.appendChild(w); it.appendChild(h); it.appendChild(b);
            hf.appendChild(it);
          });
          hist.appendChild(hf);
          hist.hidden = false;
        }
      }
    }
  }

  // This-week strip (#week, home; P4 pass A): one Asia/Bangkok SUNDAY-TO-SATURDAY
  // week as day cards, each event linking into the calendar. Weeks start on Sunday
  // (relay #16, Trevor 2026-07-27) so a family checking on Sunday sees the week
  // ahead; a jump under the eyebrow flips the strip one week forward and back
  // (JS-injected next to the Full-calendar link: no JS, no dead control). Dots
  // carry the audience taxonomy (P4 pass B): the aud value IS the class
  // (.dot.parent/.child/.holiday: colour + shape via app.css), falling back to
  // .gold for a key date, then mono. Same 1:1 aud->class the grid uses; the home
  // key (.legend.wk) teaches it.
  var week = document.getElementById('week');
  if (week && P.calendarEvents) {
    var WK_DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var wkBy = {};
    coreRows(P.calendarEvents).forEach(function (e) { (wkBy[e.date] = wkBy[e.date] || []).push(e); });   // 0071: comunita rows live on community/
    var wkH = document.getElementById('wk-h');
    if (wkH) wkH.setAttribute('aria-live', 'polite');   // the heading announces the flip
    var renderWeek = function (off) {
      var wkSun = weekStart(isoPlusDays(bkkToday, off * 7));
      var wkCells = [];
      for (var wi = 0; wi < 7; wi++) {
        var wd = new Date(wkSun); wd.setUTCDate(wkSun.getUTCDate() + wi);
        var wIso = wd.toISOString().slice(0, 10);
        var wIsToday = wIso === bkkToday;
        var wEvs = wkBy[wIso] || [];
        var wDow = WK_DOW[wi] + (wIsToday ? ' &middot; Today' : '');
        var wEvsHtml = wEvs.length
          ? wEvs.map(function (e) {
              var wxt = evHref(e.href) ? null : extUrl(e);
              var h = evHref(e.href) || wxt || (ROOT + 'calendar/');
              return '<a class="day-ev" href="' + h + '"' + (wxt ? ' target="_blank" rel="noopener"' : '') + '><span class="dot' + (e.aud ? ' ' + e.aud : (e.type === 'gold' ? ' gold' : '')) + '"></span>' +
                '<span class="lbl">' + e.title + '</span></a>';
            }).join('')
          : '<span class="day-none"></span>';
        wkCells.push('<div class="day' + (wIsToday ? ' today' : '') + '"><div class="day-top">' +
          '<span class="dow">' + wDow + '</span><span class="dnum">' + wd.getUTCDate() + '</span></div>' +
          '<div class="day-evs">' + wEvsHtml + '</div></div>');
      }
      week.innerHTML = wkCells.join('');
      if (wkH) wkH.textContent = off ? 'Next week' : 'This week';
      // Narrow screens: bring today's card into view without scrolling the page
      // vertically; next week has no today, so it opens at its Sunday.
      var wkToday = week.querySelector('.day.today');
      if (wkToday && window.matchMedia && window.matchMedia('(max-width:820px)').matches) {
        wkToday.scrollIntoView({ inline: 'center', block: 'nearest' });
      } else if (off) { week.scrollLeft = 0; }
    };
    // The week jump (relay #16): one flip between this week and next, injected into
    // the band header before the Full-calendar link. Look = scaffolding (rule 7).
    var wkHead = wkH && wkH.parentNode;
    if (wkHead) {
      var wkOff = 0;
      var wkJump = document.createElement('button');
      wkJump.type = 'button'; wkJump.className = 'wk-jump';
      var syncJump = function () {
        wkJump.innerHTML = wkOff ? '&larr; This week' : 'Next week &rarr;';
        wkJump.setAttribute('aria-label', wkOff ? 'Show this week' : 'Show next week');
      };
      syncJump();
      wkJump.addEventListener('click', function () {
        wkOff = wkOff ? 0 : 1; renderWeek(wkOff); syncJump();
      });
      wkHead.insertBefore(wkJump, wkHead.querySelector('.more'));
    }
    renderWeek(0);
  }

  // Date-range label for a card's grouped dates (sorted ISO). Single day "SAT 22 Aug";
  // range "MON 17 to TUE 18 Aug" ("to", never a dash: house idiom); cross-month keeps
  // both months. withDow adds the weekday (visible label); aria form drops it.
  function cuLabel(dates, withDow) {
    function part(iso, withMonth) {
      var d = new Date(iso + 'T00:00:00Z');
      return (withDow ? DOW[d.getUTCDay()] + ' ' : '') + d.getUTCDate() +
        (withMonth ? ' ' + FN_MONS[d.getUTCMonth()] : '');
    }
    var a = dates[0], b = dates[dates.length - 1];
    if (a === b) return part(a, true);
    return part(a, a.slice(0, 7) !== b.slice(0, 7)) + ' to ' + part(b, true);
  }
  console.assert(cuLabel(['2026-08-17', '2026-08-18'], true) === 'MON 17 to TUE 18 Aug', 'cuLabel: same-month range, month once');
  console.assert(cuLabel(['2026-08-22'], true) === 'SAT 22 Aug', 'cuLabel: single day');
  console.assert(cuLabel(['2026-09-28', '2026-10-02'], false) === '28 Sep to 2 Oct', 'cuLabel: cross-month keeps both, aria form drops the weekday');

  // Coming up band (P4 pass A, supersedes the curated featuredEvents model): AUTOMATIC
  // next-30-days feed derived from calendarEvents. Rows sharing an href are one card
  // (dates merged); a pageless row is its own card. featuredEvents survives as an
  // editorial OVERLAY supplying title/blurb/go for a featured href (chronological sort, round 2: no reorder).
  // Card state (plan §4): linked (has a real page) -> anchor + "see details"; pageless
  // and page-owed (not holiday, not nopage) -> inert card + "coming soon" pill; holiday
  // or nopage -> inert card, no pill. Cap 4; overflow keeps the label "Full calendar +N
  // more". Empty window -> the honest .ev-empty line.
  var agenda = document.getElementById('agenda');
  if (agenda && P.calendarEvents) {
    var CU_WINDOW_DAYS = 30, CU_CAP = 4;
    var cuHorizon = isoPlusDays(bkkToday, CU_WINDOW_DAYS);
    var featBy = {};
    (P.featuredEvents || []).forEach(function (f) { if (f && f.href) featBy[f.href] = f; });

    var cuMap = {}, cuOrder = [];
    coreRows(P.calendarEvents).forEach(function (e) {   // 0071: comunita rows live on community/
      if (!e.date || e.date < bkkToday || e.date > cuHorizon) return;
      var key = e.href || ('row:' + e.date + ':' + e.title);   // pageless rows never collide with an href group
      if (!cuMap[key]) { cuMap[key] = { rows: [], href: e.href || null }; cuOrder.push(key); }
      cuMap[key].rows.push(e);
    });
    var cuCards = cuOrder.map(function (key) {
      var g = cuMap[key];
      var dates = g.rows.map(function (r) { return r.date; }).sort();
      var ev = g.rows[0];
      var feat = g.href ? featBy[g.href] : null;
      var linkHref = g.href ? evHref(g.href) : null;   // valid, on-disk internal page?
      var extLink = linkHref ? null : extUrl(ev);       // else, an external school-site link (round 4)
      var owed = !linkHref && !extLink && ev.aud !== 'holiday' && !ev.nopage;   // pageless + page owed -> pill + gate
      return { dates: dates, next: dates[0], ev: ev, feat: feat, href: linkHref || extLink, ext: !!extLink, owed: owed, featured: !!feat };
    }).filter(function (c) { return c.next; });
    // Chronological by next date (Trevor 2026-07-19, workshopping round 2): the Coming-up
    // band reads in date order. featuredEvents still supplies title/blurb/go via the overlay,
    // but no longer reorders the feed. ponytail: if a high-consequence event ever sinks below
    // the cap, the pin flag (TODOS) is the fix, not a return to featured-first.
    cuCards.sort(function (a, b) { return a.next < b.next ? -1 : 1; });

    var cuMore = document.getElementById('cu-more');
    if (cuMore && cuCards.length > CU_CAP) {
      cuMore.innerHTML = 'Full calendar &middot; +' + (cuCards.length - CU_CAP) + ' more <span class="arw">&rarr;</span>';
    }   // else keep the default "Full calendar ->" label (never removed: the band always links out)

    if (!cuCards.length) {
      agenda.innerHTML = '<p class="ev-empty">Nothing coming up in the next few weeks. ' +
        '<a href="' + ROOT + 'calendar/">See the whole year</a>.</p>';
    } else {
      agenda.innerHTML = cuCards.slice(0, CU_CAP).map(function (c) {
        var title = c.feat ? c.feat.title : c.ev.title;
        var blurb = c.feat ? c.feat.blurb : (c.ev.sub || '');
        var when = '<span class="when">' + cuLabel(c.dates, true) + '</span>';
        var body = blurb ? '<p>' + blurb + '</p>' : '';
        if (c.href) {
          var go = c.feat ? c.feat.go : (c.ext ? 'On the school site' : 'See details');
          return '<a class="tile ev-card ev-link" href="' + c.href + '"' + (c.ext ? ' target="_blank" rel="noopener"' : '') + ' aria-label="' +
            escAttr(title) + ', ' + cuLabel(c.dates, false) + (c.ext ? ' · on the school site' : ' · event page') + '">' +
            when + '<h3>' + title + '</h3>' + body +
            '<span class="go">' + go + ' <span class="arw">&rarr;</span></span></a>';
        }
        // Inert card: no page to link to. Owed pages carry the honest "coming soon" pill;
        // holidays and deliberately-pageless rows (nopage) do not.
        return '<div class="tile ev-card ev-inert">' + when + '<h3>' + title + '</h3>' + body +
          (c.owed ? '<span class="soon">Page coming soon</span>' : '') + '</div>';
      }).join('');
    }

    // Workshops card (issue 0079). Workshops are fully off every calendar surface, so
    // they would otherwise have no presence in the band families actually scan. One
    // .ev-card, appended to the same grid (not a second grid, and deliberately outside
    // CU_CAP: this is not a calendar row), linking to their canonical home. Row-driven
    // and self-removing: a dateless card in a dated band is noise, and until Sarah's
    // comunita column lands there are no rows, so nothing renders. The community page
    // itself is where the standing "workshops live here" promise is kept.
    var wsRows = comunitaRows('workshop');
    if (wsRows.length) {
      var wsWhen = '<span class="when">' + cuLabel([wsRows[0].date], true) + '</span>';
      var wsBlurb = wsRows.length > 1
        ? wsRows.length + ' parent workshops coming up, starting with ' + wsRows[0].title + '.'
        : wsRows[0].title + (wsRows[0].sub ? '. ' + wsRows[0].sub : '.');
      agenda.insertAdjacentHTML('beforeend',
        '<a class="tile ev-card ev-link" href="' + ROOT + 'community/#community-workshops"' +
        ' aria-label="Parent workshops · La Comunità">' + wsWhen +
        '<h3>Parent workshops</h3><p>' + wsBlurb + '</p>' +
        '<span class="go">See what\'s on <span class="arw">&rarr;</span></span></a>');
    }
  }

  // Calendar page agenda (#cal-agenda): FOLLOWS the month the grid shows (relay #5
  // Adam + #12 Trevor, issues 0073/0075). The current month keeps the two
  // forward-looking buckets from P4 pass A: "On this month" (today through
  // month-end) then "Later this term" (month-end through the next term close),
  // with events past the term close folded into the honest "And N more across the
  // year" line. Any OTHER month, past or future, lists ALL of that month's events
  // under a "Month Year" head: a month view tells the truth about its month
  // (Trevor 2026-07-27), so a past month shows what happened. Every date chip
  // carries its month (#5: rows read as dates, not bare day numbers). The grid's
  // prev/next arrows re-render this agenda through renderCalAgenda.
  var calAgenda = document.getElementById('cal-agenda');
  var renderCalAgenda = null;
  if (calAgenda && P.calendarEvents) {
    var shareUrl = location.origin + location.pathname;   // the calendar page itself (F10)
    // 0064: a Purple Elephant page carries data-pe on the mount, so the agenda reads the
    // filtered peEvents; the main calendar (no data-pe) reads calendarEvents unchanged.
    var agPe = calAgenda.getAttribute('data-pe');
    var agSrc = coreRows(agPe ? (P.peEvents || []).filter(function (e) { return e.pe === agPe; }) : P.calendarEvents);   // 0071
    var agEvs = agSrc.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var agToday0 = new Date(bkkToday + 'T00:00:00Z');
    var agCurY = agToday0.getUTCFullYear(), agCurM = agToday0.getUTCMonth();
    var agTermEnd = termEnd(agEvs, bkkToday);   // next term close (else +120d); bounds "later this term"
    // One agenda row, shared by both views (plan 1.2/1.3: linked title + the event
    // page becomes the share target; ext rows open the school site in a new tab).
    var agRow = function (e) {
      var d = new Date(e.date + 'T00:00:00Z');
      var cHref = evHref(e.href);
      var cExt = cHref ? null : extUrl(e);   // events that live on the main school site (round 4)
      var inner = '<div class="et">' + e.title + '</div><div class="es">' + e.sub + '</div>';
      return '<div class="ev-row"><span class="dte' + (e.date === bkkToday ? ' today' : '') + '">' +
        DOW[d.getUTCDay()] + ' ' + pad(d.getUTCDate()) + ' ' + FN_MONS[d.getUTCMonth()] + '</span>' +
        '<div class="ev-main">' + ((cHref || cExt) ? '<a class="ev-link" href="' + (cHref || cExt) + '"' + (cExt ? ' target="_blank" rel="noopener"' : '') + ' aria-label="' + escAttr(e.title) + (cExt ? ' · on the school site' : ' · event page') + '">' + inner + '</a>' : inner) + '</div>' +
        calActions(e.date, e.title, e.sub, e.href, e.until, cHref ? absHref(e.href) : (cExt || shareUrl)) + '</div>';
    };
    renderCalAgenda = function (y, m) {
      if (y === agCurY && m === agCurM) {
        // Current month: forward-looking, exactly the P4 pass-A shape.
        var buckets = [
          { h: 'On this month', cls: 'wk', rows: [] },
          { h: 'Later this term', cls: 'wk next', rows: [] }
        ];
        var beyondTerm = 0;
        agEvs.forEach(function (e) {
          var d = new Date(e.date + 'T00:00:00Z');
          if (d < agToday0) return;          /* past events drop off the forward view */
          if (e.date > agTermEnd) { beyondTerm++; return; }   /* next term and beyond: counted, not listed here */
          buckets[agendaBucket(e.date, bkkToday)].rows.push(agRow(e));
        });
        /* Keep the agenda column readable: cap "Later this term" at 12 rows; fold the cap
           overflow AND the beyond-term events into one honest line pointing at the grid. */
        var laterShown = buckets[1].rows.length;
        var hidden = beyondTerm + Math.max(0, laterShown - 12);
        if (laterShown > 12) buckets[1].rows = buckets[1].rows.slice(0, 12);
        if (hidden > 0) buckets[1].rows.push('<div class="cal-note mono">And ' + hidden + ' more across the year: use the month grid above.</div>');
        calAgenda.innerHTML = buckets.filter(function (g) { return g.rows.length; })
          .map(function (g) { return '<div class="' + g.cls + '">' + g.h + '</div>' + g.rows.join(''); }).join('');
        return;
      }
      // Any other month: everything in it, oldest first, or an honest empty line.
      var mKey = y + '-' + pad(m + 1);
      var mRows = agEvs.filter(function (e) { return e.date.slice(0, 7) === mKey; }).map(agRow);
      calAgenda.innerHTML = '<div class="wk">' + CAL_MONTHS[m] + ' ' + y + '</div>' +
        (mRows.length ? mRows.join('')
          : '<div class="cal-note mono">Nothing on the calendar in ' + CAL_MONTHS[m] + ' ' + y + '.</div>');
    };
    renderCalAgenda(agCurY, agCurM);
  }

  // Calendar month grid (#cal-grid, calendar page; P4 pass A: moved here from an inline
  // page script so it shares bkkToday + evHref and rides `node --check` + the SW SHELL,
  // not an ungated inline <script>). Audience-coloured dots (aud), up to 3 + "+N"; each
  // event day is a real <button> (accessible name); a dialog popover lists that day's
  // events, each a link to its page (or plain text when pageless). Interaction: hover
  // preview (hover-capable devices), click / Enter / Space open, Esc close + focus
  // return, tap-outside close. Single event with a page navigates; otherwise the
  // popover opens so the day's detail is always reachable.
  var calGrid = document.getElementById('cal-grid');
  if (calGrid && P.calendarEvents) {
    // Sunday-first (relay #16, Trevor 2026-07-27): one convention across the home
    // week strip, this grid and the print sheet (which was already Sunday-first).
    var CAL_DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var AUD_CLASS = { parent: 'parent', child: 'child', holiday: 'holiday' };
    var calByDate = {};
    // 0064: PE page filters peEvents via data-pe on the grid mount; main calendar unchanged.
    var gridPe = calGrid.getAttribute('data-pe');
    var gridSrc = coreRows(gridPe ? (P.peEvents || []).filter(function (e) { return e.pe === gridPe; }) : P.calendarEvents);   // 0071
    gridSrc.forEach(function (e) { if (e.date) (calByDate[e.date] = calByDate[e.date] || []).push(e); });
    var calToday = new Date(bkkToday + 'T00:00:00Z');
    function calUtc(y, m, d) { return new Date(Date.UTC(y, m, d)); }
    function calIso(d) { return d.toISOString().slice(0, 10); }
    function dotClass(ev) { return 'ev' + (AUD_CLASS[ev.aud] ? ' ' + AUD_CLASS[ev.aud] : (ev.type === 'gold' ? ' gold' : '')); }

    calGrid.style.position = 'relative';   // positioning context for the absolute popover
    var calTitle = document.getElementById('cal-title');
    if (calTitle) calTitle.setAttribute('aria-live', 'polite');
    var view = { y: calToday.getUTCFullYear(), m: calToday.getUTCMonth() };
    var pop = null, popCell = null;

    function closePop(returnFocus) {
      if (pop) { pop.remove(); pop = null; }
      document.body.classList.remove('sheet-open');   // 0057: restore the floating controls
      if (returnFocus && popCell) popCell.focus();
      popCell = null;
    }
    // Build one popover for a day; each event row links to its page or is plain text.
    function openPop(cell, iso, evs, focusIt) {
      if (pop && popCell === cell) { closePop(false); return; }
      closePop(false);
      var d = new Date(iso + 'T00:00:00Z');
      var head = CAL_DOWS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + FN_MONS[d.getUTCMonth()];
      var rows = evs.map(function (e) {
        var h = evHref(e.href);
        var inner = '<span class="' + dotClass(e) + '"></span><span><span class="pt">' + e.title + '</span>' +
          (e.sub ? '<span class="ps">' + e.sub + '</span>' : '') + '</span>';
        return h ? '<a class="pev" href="' + h + '">' + inner + '</a>'
                 : '<div class="pev">' + inner + '</div>';
      }).join('');
      pop = document.createElement('div');
      pop.className = 'cal-pop';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-label', head);
      pop.setAttribute('tabindex', '-1');
      pop.innerHTML = '<div class="pop-d">' + head + '</div>' + rows;
      calGrid.appendChild(pop);
      // Edge clamp: keep the popover inside the grid horizontally.
      var maxLeft = calGrid.clientWidth - pop.offsetWidth;
      var left = Math.max(0, Math.min(cell.offsetLeft, maxLeft));
      pop.style.left = left + 'px';
      pop.style.top = (cell.offsetTop + cell.offsetHeight + 4) + 'px';
      popCell = cell;
      // 0057: on mobile the popover is a bottom sheet, and the fixed feedback FAB +
      // project-window pill float over it (z-index). Flag the open sheet so app.css
      // hides those controls under 720px; desktop (anchored card) is unaffected because
      // the hide rule is mobile-scoped.
      document.body.classList.add('sheet-open');
      // Move focus into the dialog (tabindex -1): a screen reader announces the date
      // label, and the user tabs through the event links, then Esc returns to the cell.
      // Focusing the container (not the first row) is robust when a row is a pageless
      // non-interactive div. Hover-preview passes focusIt=false so it never steals focus.
      if (focusIt) pop.focus();
    }

    function renderMonth() {
      closePop(false);
      if (calTitle) calTitle.textContent = CAL_MONTHS[view.m] + ' ' + view.y;
      var lead = calUtc(view.y, view.m, 1).getUTCDay();   // Sunday-first lead-in
      var days = calUtc(view.y, view.m + 1, 0).getUTCDate();
      var total = Math.ceil((lead + days) / 7) * 7;
      var html = CAL_DOWS.map(function (d) { return '<div class="cal-dow">' + d + '</div>'; }).join('');
      for (var i = 0; i < total; i++) {
        var cd = calUtc(view.y, view.m, i - lead + 1);
        var inMonth = cd.getUTCMonth() === view.m;
        var key = calIso(cd);
        var evs = inMonth ? (calByDate[key] || []) : [];
        var isToday = inMonth && key === bkkToday;
        var num = cd.getUTCDate();
        if (!evs.length) {
          html += '<div class="cal-cell' + (inMonth ? '' : ' mut') + (isToday ? ' today' : '') + '">' + num + '</div>';
          continue;
        }
        var dots = evs.slice(0, 3).map(function (e) { return '<span class="' + dotClass(e) + '"></span>'; }).join('');
        var more = evs.length > 3 ? '<span class="more">+' + (evs.length - 3) + '</span>' : '';
        // Mobile presence marker (0056): a multi-event day collapses in the grid to one
        // neutral dot + a count, because the shaped-dot taxonomy is too fine to read in a
        // phone-width cell. Emitted for every viewport; app.css shows the taxonomy on
        // desktop and swaps to this marker under 720px (a CSS :has() gate, so desktop
        // markup is untouched). Single-event days keep their one shaped dot on both. Both
        // nodes are aria-hidden: the button aria-label already states the event count.
        var presence = evs.length > 1
          ? '<span class="pdot" aria-hidden="true"></span><span class="pcount" aria-hidden="true">·' + evs.length + '</span>'
          : '';
        var label = num + ' ' + CAL_MONTHS[view.m] + ', ' + evs.length + (evs.length === 1 ? ' event' : ' events');
        html += '<button type="button" class="cal-cell has' + (isToday ? ' today' : '') +
          '" data-iso="' + key + '" aria-haspopup="dialog" aria-label="' + escAttr(label) + '">' +
          num + '<span class="evs">' + dots + more + presence + '</span></button>';
      }
      calGrid.innerHTML = html;
      // Relay #5/#12: the agenda column follows the grid, so the arrows move both.
      if (renderCalAgenda) renderCalAgenda(view.y, view.m);
    }

    // One delegated click: single-event-with-page navigates; otherwise open the popover.
    calGrid.addEventListener('click', function (e) {
      var cell = e.target.closest('.cal-cell.has');
      if (!cell || !calGrid.contains(cell)) return;
      var iso = cell.getAttribute('data-iso');
      var evs = calByDate[iso] || [];
      if (evs.length === 1) {
        var h = evHref(evs[0].href);
        if (h) { location.href = h; return; }
      }
      openPop(cell, iso, evs, true);   // click / Enter / Space: move focus into the dialog
    });
    // Hover preview on hover-capable devices only (touch opens on tap via click).
    if (window.matchMedia && window.matchMedia('(hover:hover)').matches) {
      var hoverTimer = null;
      calGrid.addEventListener('mouseover', function (e) {
        var cell = e.target.closest('.cal-cell.has');
        if (!cell) return;
        clearTimeout(hoverTimer);
        openPop(cell, cell.getAttribute('data-iso'), calByDate[cell.getAttribute('data-iso')] || [], false);
      });
      calGrid.addEventListener('mouseleave', function () {
        hoverTimer = setTimeout(function () { closePop(false); }, 150);
      });
    }
    // Keyboard: Esc closes and returns focus to the day cell.
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(true); });
    // Tap / click outside the popover and its cell closes it.
    document.addEventListener('click', function (e) {
      if (!pop) return;
      if (pop.contains(e.target) || (popCell && popCell.contains(e.target))) return;
      closePop(false);
    });

    var calPrev = document.getElementById('cal-prev');
    var calNext = document.getElementById('cal-next');
    if (calPrev) calPrev.onclick = function () { view.m--; if (view.m < 0) { view.m = 11; view.y--; } renderMonth(); };
    if (calNext) calNext.onclick = function () { view.m++; if (view.m > 11) { view.m = 0; view.y++; } renderMonth(); };
    renderMonth();
  }

  // Year calendar sheet (calendar/print/ + purple-elephant/*/print/, issue 0046). The
  // whole academic year on one A4, matching the City School PDF (colour + shape by
  // audience). render.js EMITS the month grid + dated key into #print-list; the
  // masthead, subscribe strip, legend + footnote are static in the page HTML (styled
  // .yc-* in app.css). The source dataset is chosen by #print-list[data-cal-source]:
  // "city" -> calendarEvents; "pe-thonglor"/"pe-samakee" -> peEvents filtered by pe.
  // Range picking (0058) is retired: the sheet is always the full year, like the PDF.
  var printList = document.getElementById('print-list');
  if (printList) {
    var calSrc = printList.getAttribute('data-cal-source') || 'city';
    var calRows = calSrc === 'city'
      ? (P.calendarEvents || [])
      : (P.peEvents || []).filter(function (e) { return e.pe === (calSrc === 'pe-samakee' ? 'samakee' : 'thonglor'); });

    // Print sheet = key dates only. Workshops + parent socials stay on the live
    // calendar and the subscribe feed (build-api.mjs, unfiltered), off the printed
    // fridge sheet so it fits one page (0065 density; Trevor 2026-07-21). cat is the
    // SSOT's own human-set field, so Sarah tunes what prints by setting it in the sheet
    // (no title-matching here: the ingest does zero inference, 2026-07-20 decision).
    var PRINT_SKIP = { workshop: 1, social: 1 };
    calRows = calRows.filter(function (e) { return !PRINT_SKIP[e.cat]; });
    console.assert([{ cat: 'workshop' }, { cat: 'holiday' }, { cat: 'social' }, { cat: 'event' }]
      .filter(function (e) { return !PRINT_SKIP[e.cat]; }).length === 2, 'print sheet: drops workshop + social, keeps the rest');

    // Category glyph + label. Grayscale-safe: the shape carries meaning without
    // colour, so the key survives a black-and-white print (WCAG 1.4.1 precedent).
    var YC_CAT = {
      H:  { glyph: '●', label: 'Holiday, school closed' },
      PD: { glyph: '○', label: 'Staff day, no children' },
      PT: { glyph: '◆', label: 'Parent-teacher conferences' },
      SE: { glyph: '■', label: 'School event, parents invited' },
      SC: { glyph: '▲', label: 'For children, parents not expected' }
    };
    var YC_PREC = { H: 5, PT: 4, PD: 3, SC: 2, SE: 1 };   // category that wins a shared day cell
    function ycTxt(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

    // Derive the sheet category from the SSOT row: aud is the spine (holiday/parent/
    // child); two title splits carve the no-children days into staff/PD days and
    // parent-teacher conferences, to match the PDF's audience key.
    // ponytail: keyword heuristic on the holiday split; upgrade path = an explicit
    // category column on the SSOT sheet (then this collapses to a field read).
    function ycCat(e) {
      if (/parent[\s-]*teacher conference/i.test(e.title || '')) return 'PT';
      if (e.aud === 'holiday') {
        return /staff (training|day)|in[\s-]?service|professional development|pd day/i.test((e.title || '') + ' ' + (e.sub || '')) ? 'PD' : 'H';
      }
      return e.aud === 'child' ? 'SC' : 'SE';
    }

    // 12 months from the academic-year start (data-driven; rolls forward each year).
    var AY0 = (P.academicYear && P.academicYear.start) || '2026-08-01';
    var ayY = parseInt(AY0.slice(0, 4), 10), ayStartM = parseInt(AY0.slice(5, 7), 10) - 1;
    var YCM = [];
    for (var ycm = 0; ycm < 12; ycm++) {
      var mm = (ayStartM + ycm) % 12, yy = ayY + Math.floor((ayStartM + ycm) / 12);
      YCM.push({ mi: mm, y: yy, name: CAL_MONTHS[mm] });
    }

    // Paint every day a row touches into a "year-month" -> {day: cat} map. Multi-day
    // rows expand across their until (crossing month/year boundaries); a higher-
    // precedence category wins a shared cell (a holiday over an event on the same day).
    var ycDayMap = {};
    calRows.forEach(function (e) {
      var cat = ycCat(e), cur = new Date(e.date + 'T00:00:00Z');
      var end = e.until ? new Date(e.until + 'T00:00:00Z') : new Date(cur);
      for (; cur <= end; cur.setUTCDate(cur.getUTCDate() + 1)) {
        var mk = cur.getUTCFullYear() + '-' + cur.getUTCMonth(), day = cur.getUTCDate();
        var bucket = ycDayMap[mk] || (ycDayMap[mk] = {});
        if (!bucket[day] || YC_PREC[cat] > YC_PREC[bucket[day]]) bucket[day] = cat;
      }
    });

    function ycMonthCells(M) {
      var dim = new Date(Date.UTC(M.y, M.mi + 1, 0)).getUTCDate();
      var firstDow = new Date(Date.UTC(M.y, M.mi, 1)).getUTCDay();
      var dc = ycDayMap[M.y + '-' + M.mi] || {}, h = '';
      ['S', 'M', 'T', 'W', 'TH', 'F', 'S'].forEach(function (x) { h += '<i class="yc-dow">' + x + '</i>'; });
      for (var b = 0; b < firstDow; b++) h += '<i class="yc-d yc-e"></i>';
      for (var day = 1; day <= dim; day++) {
        var cat = dc[day];
        h += '<i class="yc-d' + (cat ? ' yc-c yc-c-' + cat : '') + '">' + day + '</i>';
      }
      return '<div class="yc-cells">' + h + '</div>';
    }

    // Key day label from the real row: single "12", same-month range "12-16" (en-dash),
    // cross-month "26 Jul to 7 Aug" (house idiom: "to", never an em-dash).
    function ycKeyDay(e) {
      var s = new Date(e.date + 'T00:00:00Z'), sd = s.getUTCDate();
      if (!e.until) return String(sd);
      var u = new Date(e.until + 'T00:00:00Z');
      if (u.getUTCMonth() === s.getUTCMonth() && u.getUTCFullYear() === s.getUTCFullYear()) return sd + '–' + u.getUTCDate();
      return sd + ' ' + FN_MONS[s.getUTCMonth()] + ' to ' + u.getUTCDate() + ' ' + FN_MONS[u.getUTCMonth()];
    }

    var ycMonthsHTML = '<div class="yc-months">' + YCM.map(function (M) {
      return '<div class="yc-mini"><div class="yc-mn">' + M.name + '</div>' + ycMonthCells(M) + '</div>';
    }).join('') + '</div>';
    var ycKeysHTML = '<div class="yc-keys">' + YCM.map(function (M) {
      var rows = calRows.filter(function (e) {
        var s = new Date(e.date + 'T00:00:00Z');
        return s.getUTCMonth() === M.mi && s.getUTCFullYear() === M.y;
      });
      if (!rows.length) return '';
      return '<div class="yc-kgm"><div class="yc-km">' + M.name + '</div>' + rows.map(function (e) {
        var cat = ycCat(e);
        return '<div class="yc-kr"><span class="yc-kd">' + ycKeyDay(e) + '</span>' +
          '<b class="yc-kgl yc-g-' + cat + '">' + YC_CAT[cat].glyph + '</b>' +
          '<span class="yc-kt">' + ycTxt(e.title) + '</span></div>';
      }).join('') + '</div>';
    }).join('') + '</div>';

    if (calRows.length) printList.innerHTML = ycMonthsHTML + ycKeysHTML;   // else the static no-JS fallback stands
    var pLabel = document.getElementById('print-range-label');
    if (pLabel) pLabel.textContent = ayY + '–' + (ayY + 1);
    var pStamp = document.getElementById('print-stamp');
    if (pStamp) pStamp.textContent = 'printed ' + fmtDMY(bkkToday);

    // self-check (ponytail): the classifier + day label are the load-bearing logic.
    console.assert(ycCat({ aud: 'holiday', title: 'The Queen Mother’s Birthday Holiday' }) === 'H', 'ycCat: public holiday -> H');
    console.assert(ycCat({ aud: 'holiday', title: 'No school for children (staff training day)' }) === 'PD', 'ycCat: staff training -> PD');
    console.assert(ycCat({ aud: 'parent', title: 'Parent Teacher Conferences (Progress)' }) === 'PT', 'ycCat: conferences -> PT');
    console.assert(ycCat({ aud: 'parent', title: 'K1 Coffee morning' }) === 'SE', 'ycCat: parent event -> SE');
    console.assert(ycCat({ aud: 'child', title: 'K1 first day of school' }) === 'SC', 'ycCat: children-only -> SC');
    console.assert(ycKeyDay({ date: '2026-10-12', until: '2026-10-16' }) === '12–16', 'ycKeyDay: same-month range');
    console.assert(ycKeyDay({ date: '2026-12-21', until: '2027-01-09' }) === '21 Dec to 9 Jan', 'ycKeyDay: cross-month range');
  }

  // Subscribe control (ADR-0006, superseded-for-launch by issue 0077). The UI was peeled
  // off every calendar page on 2026-08-03, so NO [data-subscribe] mount ships today and
  // this block is dormant, not dead: the feeds still build each deploy. Re-flip = restore
  // a mount in the page HTML + set PORTAL.subscribeLive true; this wires Apple (webcal),
  // Google (add by URL) and a visible https line for any other app, every URL derived
  // from THIS page's own origin + depth at render time, no host ever hardcoded.
  var subMounts = document.querySelectorAll('[data-subscribe]');
  if (subMounts.length && P.subscribeLive) {
    subMounts.forEach(function (el) {
      var feedUrl = new URL(ROOT + 'api/v1/' + el.getAttribute('data-subscribe'), location.href).href;
      if (feedUrl.indexOf('https:') !== 0) return;   // webcal needs https; a local preview keeps the mock
      var webcal = 'webcal:' + feedUrl.slice('https:'.length);
      var gcal = 'https://calendar.google.com/calendar/render?cid=' + encodeURIComponent(feedUrl);
      el.innerHTML =
        '<a class="btn purple sm" href="' + escAttr(webcal) + '">Subscribe in Apple Calendar</a> ' +
        '<a class="btn purple sm" target="_blank" rel="noopener" href="' + escAttr(gcal) + '">Subscribe in Google Calendar</a>';
      var urlLine = document.createElement('p');
      urlLine.className = 'cal-note mono';
      urlLine.textContent = 'Any other calendar app: subscribe to ' + feedUrl;
      el.parentNode.insertBefore(urlLine, el.nextSibling);
    });
  }

  // Sport rows + status pills (home sport tile). status vocab: open | soon |
  // waitlist | full (sprint 3 F5). Each value maps straight to a .status.<value>
  // class + its label, so waitlist/full need no code branch here.
  // (app.css styles .status.open/.soon; waitlist/full would render as unstyled
  // pills, visible and honest, if data ever ships them. No rules until then.)
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
        var inner = ic(d.kind) +
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
  //
  // KISS MODE (issue 0078, 2026-08-03): the mount carrying data-faces renders the same
  // class-keyed cards with the bios and the booking cell OMITTED, and drops the demo
  // card (a booking walkthrough is meaningless with no booking on the page). Teachers
  // send their own booking links; the page only explains the programme. classes[] keeps
  // every bio and bookingUrl untouched in data.js, so Payal's 2026-08-10 call reverses
  // this by deleting one attribute from the page HTML. No data, CSS or renderer rebuild.
  var teamMount = document.getElementById('team-cards');
  if (teamMount && P.ptc && P.classes) {
    var facesOnly = teamMount.hasAttribute('data-faces');
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
    P.classes.forEach(function (c) {
      if (facesOnly && c.year === 'demo') return;
      (byYear[c.year] = byYear[c.year] || []).push(c);
    });
    var years = YEAR_ORDER.filter(function (y) { return byYear[y]; });

    var jump = document.getElementById('team-jump');
    if (jump) {
      jump.innerHTML = years.map(function (y) {
        return '<a class="f" href="#y-' + y + '">' + (y === 'demo' ? 'Demo' : y) + '</a>';
      }).join('');
    }
    // Honest closed line when the window has passed (cards stay; Book turns off).
    // Skipped in faces mode: the page makes no booking claim to withdraw (0078).
    var ptcStatus = document.getElementById('ptc-status');
    if (ptcStatus && !ptcIsOpen && !facesOnly) {
      ptcStatus.textContent = 'Bookings are closed. The next conferences are in October.';
    }

    function avatar(t) {
      return t.photo
        ? '<img class="headshot" src="' + ROOT + escAttr(t.photo) + '" alt="" width="48" height="48" loading="lazy">'
        : '<span class="hs-ph" aria-hidden="true">' + initials(t.name) + '</span>';
    }
    function teacherLine(t, faces) {
      var head = '<div class="tname">' + t.name +
        (t.role ? ' <span class="role">' + t.role + '</span>' : '') +
        (t.flag ? ' <span class="chip">' + t.flag + '</span>' : '') + '</div>';
      if (faces) return head;   // 0078: faces + names, no bio text
      return head +
        (t.bio ? '<p class="tbio">' + t.bio + '</p>' : '<p class="tbio none">A short introduction is on the way.</p>');
    }
    console.assert(teacherLine({ name: 'A B', bio: 'x' }, true).indexOf('tbio') === -1 &&
      teacherLine({ name: 'A B' }, true).indexOf('tbio') === -1,
      'teacherLine: faces mode emits no bio, present or absent (0078)');
    console.assert(teacherLine({ name: 'A B', bio: 'x' }, false).indexOf('tbio') > -1,
      'teacherLine: full mode still emits the bio');
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
          c.teachers.map(function (t) { return teacherLine(t, facesOnly); }).join('') + '</div>' +
          (facesOnly ? '' : '<div class="rt">' + bookCell(c, state) + '</div>') + '</div>';
      }).join('');
      return '<div class="section" id="y-' + y + '">' +
        '<div class="sec-eyebrow"><span class="eyebrow">' + (YEAR_LABEL[y] || y) + '</span><span class="ln"></span></div>' +
        '<div class="doc-list">' + cards + '</div></div>';
    }).join('');
  }

  // Coffee Mornings (issue 0049): one calendar-derived card per static cohort
  // wrapper. Dates stay single-copy in calendarEvents; the page adds no island.
  var coffeeMount = document.getElementById('coffee-cards');
  if (coffeeMount) {
    var COFFEE_IDS = { K1: 'k1', K2: 'k2', Y1: 'y1', Y2: 'y2', 'Y3 to Y6': 'y3-6', Dove: 'dove' };
    function validISODate(date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return false;
      var parsed = new Date(date + 'T00:00:00Z');
      return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date;
    }
    function coffeeRows(events) {
      return (events || []).filter(function (e) { return e.href === 'coffee-mornings/'; })
        .slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    }
    function coffeeState(date, todayISO) {
      return date < todayISO ? 'past' : date === todayISO ? 'today' : 'upcoming';
    }
    function validHTTPS(href) {
      if (typeof href !== 'string' || !/^https:\/\//i.test(href)) return false;
      try {
        var url = new URL(href);
        return url.protocol === 'https:' && !!url.hostname;
      } catch (e) {
        return false;
      }
    }
    function validSlides(slides) {
      if (slides === null) return true;
      if (!slides || typeof slides !== 'object' || Array.isArray(slides)) return false;
      var keys = Object.keys(slides);
      return keys.indexOf('href') > -1 && keys.every(function (key) { return key === 'href' || key === 'tag'; }) &&
        validHTTPS(slides.href) && (slides.tag === undefined || typeof slides.tag === 'string');
    }
    function coffeeValid(row) {
      return !!row && !!COFFEE_IDS[row.cohort] && validISODate(row.date) &&
        row.date >= '2026-08-01' && row.date <= '2027-07-31' &&
        (row.time === null || typeof row.time === 'string') &&
        (row.venue === null || typeof row.venue === 'string') &&
        validSlides(row.slides);
    }
    function coffeeSetValid(rows) {
      if (rows.length !== 6 || !rows.every(coffeeValid)) return false;
      var cohorts = rows.map(function (row) { return row.cohort; });
      return new Set(cohorts).size === 6 && Object.keys(COFFEE_IDS).every(function (cohort) {
        return cohorts.indexOf(cohort) > -1;
      });
    }
    function coffeeSlides(row, todayISO) {
      var state = coffeeState(row.date, todayISO);
      if (row.slides) {
        return '<a class="cm-slide" target="_blank" rel="noopener" href="' + escAttr(row.slides.href) + '">View ' + row.cohort + ' slides' + (row.slides.tag ? ' · ' + row.slides.tag : '') + '</a>';
      }
      if (state !== 'past') return '<p class="cm-slide-note">Slides will be added within 24 hours after the morning.</p>';
      var due = isoPlusDays(row.date, 1);
      if (todayISO <= due) return '<p class="cm-slide-note">Slides are on their way. Expected by ' + fmtDMY(due) + '.</p>';
      var office = P.contacts && P.contacts.office && P.contacts.office.email;
      var helpHref = office ? 'mailto:' + office : ROOT + 'help/';
      return '<p class="cm-slide-note">Slides are not available yet. <a class="cm-inline-action" href="' + escAttr(helpHref) + '">' +
        (office ? 'Ask the school office' : 'Get help') + '</a>.</p>';
    }
    function coffeeCard(row) {
      var state = coffeeState(row.date, bkkToday);
      var date = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }).format(new Date(row.date + 'T00:00:00Z'));
      var stateLabel = state === 'today' ? 'This morning' : state === 'past' ? 'Past morning' : 'Upcoming';
      var slides = coffeeSlides(row, bkkToday);
      return '<div class="cm-card ' + state + '">' +
        '<span class="chip cm-cohort">' + row.cohort + '</span>' +
        '<span class="cm-state">' + stateLabel + '</span>' +
        '<div class="cm-date">' + date + '</div>' +
        '<dl class="cm-details"><div><dt>Time</dt><dd>' + (row.time || 'To be confirmed') + '</dd></div>' +
        '<div><dt>Place</dt><dd>' + (row.venue || 'To be confirmed') + '</dd></div></dl>' +
        '<div class="cm-slides">' + slides + '</div></div>';
    }

    console.assert(coffeeRows([
      { href: 'coffee-mornings/', date: '2026-08-24' },
      { href: 'calendar/', date: '2026-08-01' },
      { href: 'coffee-mornings/', date: '2026-08-17' }
    ]).map(function (e) { return e.date; }).join(',') === '2026-08-17,2026-08-24', 'coffeeRows: explicit date order');
    console.assert(coffeeState('2026-08-18', '2026-08-17') === 'upcoming' &&
      coffeeState('2026-08-17', '2026-08-17') === 'today' &&
      coffeeState('2026-08-16', '2026-08-17') === 'past', 'coffeeState: upcoming, today, past');
    console.assert(coffeeRows(P.calendarEvents).length === 6, 'coffeeRows: six Coffee Mornings rows');
    console.assert(!validISODate('2026-02-30') && !validISODate('2026-99-99'), 'validISODate: malformed dates rejected');
    var plantedCoffeeRow = {
      href: 'coffee-mornings/', cohort: 'K1', date: '2026-08-17', time: null, venue: null, slides: null
    };
    console.assert(['deck/k1', 'data:text/html,unsafe', 'http://example.com/k1'].every(function (href) {
      return !coffeeValid(Object.assign({}, plantedCoffeeRow, { slides: { href: href } }));
    }) && !coffeeValid(Object.assign({}, plantedCoffeeRow, { slides: 'https://example.com/k1' })),
    'coffeeValid: unsafe and malformed slides rejected');
    console.assert(!coffeeValid(Object.assign({}, plantedCoffeeRow, { time: {} })) &&
      !coffeeValid(Object.assign({}, plantedCoffeeRow, { venue: 7 })) &&
      !coffeeValid(Object.assign({}, plantedCoffeeRow, { slides: { href: 'https://example.com/k1', tag: 7 } })) &&
      !coffeeValid(Object.assign({}, plantedCoffeeRow, { date: '2027-08-01' })),
    'coffeeValid: malformed fields and out-of-season dates rejected');
    console.assert(coffeeValid(Object.assign({}, plantedCoffeeRow, { slides: { href: 'https://example.com/k1', tag: 'PDF' } })),
      'coffeeValid: absolute HTTPS slides with optional string tag');
    var plantedCoffeeRows = Object.keys(COFFEE_IDS).map(function (cohort, index) {
      return Object.assign({}, plantedCoffeeRow, { cohort: cohort, date: '2026-08-' + String(17 + index).padStart(2, '0') });
    });
    console.assert(coffeeSetValid(plantedCoffeeRows), 'coffee set: exact cohort set accepted');
    console.assert(!coffeeSetValid(plantedCoffeeRows.concat(Object.assign({}, plantedCoffeeRows[0]))) &&
      !coffeeSetValid(plantedCoffeeRows.map(function (row, index) {
        return index === 5 ? Object.assign({}, row, { cohort: 'K1' }) : row;
      })) && !coffeeSetValid(plantedCoffeeRows.map(function (row, index) {
        return index === 5 ? Object.assign({}, row, { cohort: 'Unknown' }) : row;
      })), 'coffee set: seventh, duplicate and unknown cohorts rejected');
    var plantedCoffeeCard = coffeeCard(plantedCoffeeRow);
    console.assert(plantedCoffeeCard.indexOf('<span class="chip cm-cohort">K1</span>') === plantedCoffeeCard.indexOf('>') + 1,
      'coffeeCard: cohort chip is the first card element');
    console.assert(coffeeSlides({ cohort: 'K1', date: '2026-08-17', slides: null }, '2026-08-18').indexOf('Expected by 18 Aug 2026') > -1,
      'coffeeSlides: missing past deck keeps its dated expectation through the due date');
    console.assert(coffeeSlides({ cohort: 'K1', date: '2026-08-17', slides: null }, '2026-08-19').indexOf('Slides are not available yet') > -1 &&
      coffeeSlides({ cohort: 'K1', date: '2026-08-17', slides: null }, '2026-08-19').indexOf('on their way') === -1 &&
      coffeeSlides({ cohort: 'K1', date: '2026-08-17', slides: null }, '2026-08-19').indexOf('mailto:office@elc.ac.th') > -1,
      'coffeeSlides: overdue deck is unavailable, not on its way');
    console.assert(coffeeSlides({ cohort: 'K1', date: '2026-08-20', slides: null }, '2026-08-17').indexOf('within 24 hours') > -1,
      'coffeeSlides: upcoming promise unchanged');
    console.assert(coffeeSlides({ cohort: 'K1', date: '2026-08-17', slides: { href: 'https://example.com/deck', tag: 'PDF' } }, '2026-08-19').indexOf('target="_blank" rel="noopener"') > -1,
      'coffeeSlides: posted deck action unchanged');

    var rows = coffeeRows(P.calendarEvents);
    var contractValid = coffeeSetValid(rows);
    var mounts = {};
    coffeeMount.querySelectorAll('[data-cohort]').forEach(function (el) { mounts[el.dataset.cohort] = el; });
    var handled = {}, validRows = [], malformed = 0;
    rows.forEach(function (row) {
      var mount = mounts[row.cohort];
      if (!coffeeValid(row) || !mount || handled[row.cohort]) {
        malformed += 1;
        if (mount && !handled[row.cohort]) {
          mount.innerHTML = '<p class="cm-failure">This morning\'s details could not be loaded.</p>';
          handled[row.cohort] = true;
        }
        return;
      }
      mount.innerHTML = coffeeCard(row);
      handled[row.cohort] = true;
      validRows.push(row);
    });

    var missing = 0;
    Object.keys(mounts).forEach(function (cohort) {
      if (!handled[cohort]) {
        mounts[cohort].innerHTML = '<p class="cm-failure">This morning\'s details are unavailable.</p>';
        missing += 1;
      }
    });
    var coffeeErrors = document.getElementById('coffee-errors');
    if (coffeeErrors && !rows.length) {
      var office = P.contacts && P.contacts.office && P.contacts.office.email;
      coffeeErrors.innerHTML = '<p class="cm-failure">Morning details are unavailable. Check the <a class="cm-inline-action" href="' + ROOT + 'calendar/">calendar</a>' +
        (office ? ' or <a class="cm-inline-action" href="mailto:' + escAttr(office) + '">email the school office</a>' : '') + '.</p>';
    } else if (coffeeErrors && (!contractValid || malformed || missing)) {
      coffeeErrors.innerHTML = '<p class="cm-failure">One morning\'s details could not be loaded. Check the calendar for the latest information.</p>';
    }

    var coffeeTitle = document.getElementById('coffee-title');
    if (coffeeTitle && rows.length === 6 && !malformed && !missing &&
        validRows.every(function (row) { return coffeeState(row.date, bkkToday) === 'past'; })) {
      coffeeTitle.textContent = 'This year\'s mornings';
    }

    var saveGuide = document.getElementById('coffee-save-guide');
    if (saveGuide) {
      var ua = navigator.userAgent || '';
      var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
      saveGuide.textContent = standalone
        ? 'This page is already saved with the Portal on your device.'
        : /Line\//i.test(ua)
          ? 'Open this page in your browser first, then use the browser menu to add it to your home screen.'
          : /iPhone|iPad|iPod/i.test(ua)
            ? 'In Safari, tap Share, then Add to Home Screen.'
            : 'Bookmark this page, or use your browser menu to add it to your home screen.';
    }
    var coffeeUrl = document.getElementById('coffee-page-url');
    if (coffeeUrl) coffeeUrl.textContent = location.href.split('#')[0];

    if (location.hash) {
      var hashTarget = document.getElementById(location.hash.slice(1));
      if (hashTarget && hashTarget.classList.contains('cm-group')) {
        requestAnimationFrame(function () { hashTarget.scrollIntoView({ block: 'start' }); });
      }
    }
  }

  // Version stamp (0061): rewrite the footer fine print from PORTAL.version + build.
  // data.js is network-first, so a new deploy restamps every page the moment fresh
  // data lands, the visible signal that the update propagated. The message text is
  // unchanged; JS just prefixes the live version + build date. Static HTML keeps the
  // hardcoded "v0.8 ..." as the no-JS fallback.
  var fineStamp = document.querySelector('.fine');
  if (fineStamp && P.version) {
    fineStamp.textContent = P.version + (P.build ? ' · ' + P.build : '') +
      ' · for internal feedback, not a live school page';
  }

  // Page-open beacon (issue 0028 / W1): one anonymous datapoint per view, to the
  // ops worker. DNT '1' opts out. Fire-and-forget: no cookies, no IP/UA stored, and
  // it never blocks or errors the page (wrapped, sendBeacon returns immediately).
  // 0054: a ?ref= campaign tag (naming a send we mailed, never a person) rides along;
  // the fixed vocabulary is enforced at the worker's store boundary, so an off-list
  // tag is dropped there and the readout never sprawls.
  try {
    if (!navigator.doNotTrack || navigator.doNotTrack !== '1') {
      var beacon = { path: location.pathname.replace(/^.*portal-test/, '') || location.pathname };
      var beaconRef = new URLSearchParams(location.search).get('ref');
      if (beaconRef) beacon.ref = beaconRef;
      navigator.sendBeacon && navigator.sendBeacon(
        'https://elc-ops.elcportal.workers.dev/hit',
        JSON.stringify(beacon)
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

/* PWA update flow (0061). A new service worker taking control means a fresh build
   shipped (sw.js skipWaiting + clients.claim make that immediate). Reload ONCE to
   adopt it, but never yank a reader mid-page: if the tab is backgrounded, reload
   now; if it is in the foreground, hold until the reader leaves and returns. Skip
   the very first controller acquisition: a first-ever visit installs the SW with
   no prior version to replace, so that controllerchange must not reload. Guarded by
   a one-shot flag so it can never loop. Self-contained IIFE, no PORTAL dependency. */
(function () {
  if (!('serviceWorker' in navigator)) return;
  var hadController = !!navigator.serviceWorker.controller;  // captured before any update
  var reloaded = false;
  function go() {
    if (reloaded) return;
    reloaded = true;
    location.reload();
  }
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController) return;              // first SW claim on a fresh visit: nothing to refresh
    if (document.visibilityState === 'visible') {
      // reader is looking: wait until the tab is hidden then shown again, so the
      // refresh lands on their return, not mid-sentence.
      document.addEventListener('visibilitychange', function onVis() {
        if (document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', onVis);
          go();
        }
      });
    } else {
      go();                                  // tab backgrounded: safe to reload now
    }
  });
})();
