/* ELC Portal: volatile content. One edit here updates every surface.
   Pages render these islands via assets/render.js. Statuses are honest
   (rule 6): football live, the rest open 7 Sep. */
window.PORTAL = {
  version: 'v0.5',
  term: 'Term 1',

  // Pages still being finalised (sprint 3 D5). render.js prepends a visible
  // "We are finalising this page" chip on any page whose <main data-page> key is
  // listed here. Removing a key = that page's verify-artifact row is signed off
  // (docs/verify-v0.5.md).
  draftPages: ['hopes-and-wishes', 'glossary', 'photo-consent', 'how-to-pay', 'gate-card',
               'armonia', 'armonia-expressive-languages', 'armonia-science',
               'armonia-technology', 'armonia-sport', 'armonia-drama',
               'armonia-music', 'community-giving'],

  // School status (issue 0031 item 1). null = normal day, no banner anywhere.
  // To raise a notice, replace null with an object and deploy (see docs/runbook.md):
  //   status: { level: 'notice',                 // 'notice' (gold) or 'alert' (red)
  //             title: 'Early pickup today',
  //             body: 'All campuses close at 1pm. Buses leave at 1:15.',
  //             expires: '2026-08-20' }          // last day the banner shows; it kills itself after
  // BEGIN SHEET-OWNED: status
  status: null,
  // END SHEET-OWNED: status

  // Outdoor air quality (sprint 3 F4). null = no air tile anywhere (it is hidden).
  // When the outdoor-play call is made (runbook, manual for now), set the level so
  // the home tile and the status page show today's decision:
  //   air: { level: 'caution',                 // 'good' | 'caution' | 'indoor'
  //          note: 'Short outdoor breaks only.',
  //          updated: 'today, 9am' }            // shown verbatim after "Updated "
  // BEGIN SHEET-OWNED: air
  air: null,
  // END SHEET-OWNED: air

  // Contacts: the single edit point every contact chip on the site reads from.
  // phone: null renders as "Coming" until the real number is supplied (rule 6).
  // ⚠️ office@ per people directory (Praveen); Trevor to verify parent-facing (issue 0031).
  contacts: {
    office:     { label: 'School office',   email: 'office@elc.ac.th',     phone: '+66 (0)2 381 2919' },
    activities: { label: 'Activities team', email: 'activities@elc.ac.th', phone: '+66 (0)2 381 2919' }
  },

  // Office hours per campus (sprint 3 P7). null renders one honest "Office hours
  // coming" row wherever [data-strip="office"] appears (gate card, help, contacts).
  // Fill when confirmed:
  //   officeHours: [
  //     { campus: 'The City School', hours: 'Mon to Fri, 7:30am to 4:30pm', note: '' },
  //     { campus: 'Dove Centre',      hours: 'Mon to Fri, 8am to 4pm',       note: 'Term time only' }
  //   ]
  // BEGIN SHEET-OWNED: officeHours
  officeHours: null,
  // END SHEET-OWNED: officeHours

  // Registration windows (issue 0031 item 4): dated strip with countdowns on
  // home + activities. Rows disappear the day after `date`. Honest dates only.
  // BEGIN SHEET-OWNED: regWindows
  regWindows: [
    { date: '2026-08-20', label: 'Sport parent info evening', sub: 'Basketball, cricket and swimming explained' },
    { date: '2026-09-07', label: 'Sport sign-up opens', sub: 'Basketball, cricket and swimming' }
  ],
  // END SHEET-OWNED: regWindows

  // Booking windows (plan 2026-07-16 item 1.4): bounded "book now" rows in the same
  // strip, rendered BEFORE the countdown rows. Whole row is one link; no add-to-
  // calendar. HAND-KEPT, deliberately NOT sheet-owned: pull-sheet.py regenerates
  // the fenced blocks and its schema cannot express these rows (it would silently
  // wipe them). href is SITE-ROOT-relative and gate-checked against disk. Schema:
  //   { from: '2026-08-10',                    // first day shown (inclusive)
  //     until: '2026-08-18',                   // last day (inclusive); self-removes after
  //     href: 'hopes-and-wishes/',             // must resolve to site/<href>index.html
  //     label: 'Book your Hopes and Wishes time',
  //     sub: 'All year groups · 17 to 18 Aug' }
  bookingWindows: [
    { from: '2026-08-10', until: '2026-08-18', href: 'hopes-and-wishes/',
      label: 'Book your Hopes and Wishes time', sub: 'All year groups · 17 to 18 Aug' }
  ],

  // Safeguarding leads (issue 0031 item 6): /safeguarding/ renders a card per
  // entry; empty = the page shows the generic route only. Fill when confirmed:
  //   { campus: 'The City School', name: '...', role: 'Designated Safeguarding Lead', email: '...' }
  safeguarding: [],

  // This-week strip derives from calendarEvents in render.js (current week, else next up).
  // No separate week[]: one source of truth (issue 0018).

  // Joint leadership note rotation (issue 0007; drafts docs/content/hos-notes-2026-08.md).
  // render.js shows the latest note whose `from` <= today (Bangkok). Payal's read pending;
  // the sample chip in index.html stays until she blesses the copy.
  notes: [
    { from: '2026-07-01', eyebrow: 'A note from Payal and Trevor', when: 'This month · August',
      title: 'Welcome to a new year.',
      body: 'This portal is the one place for everything your family does with ELC beyond the classroom: the week ahead, the calendar, sign-ups, and every policy and form. It is new, and it will grow. Tell us what is missing with the feedback button, and we will build it.',
      sig: 'Payal, Head of School · Trevor, Head of Operations and Educational Experience' },
    // Optional cta (plan 1.5): renders as one link after the body, gone after `until`.
    { from: '2026-08-10', eyebrow: 'A note from Payal and Trevor', when: 'This week',
      title: 'We start with your hopes.',
      body: 'This week your child\'s teachers sit down with you for Hopes and Wishes: what you want this year to hold for your child, in your words. It is our favourite way to begin. Everything else on this page can wait until you have booked your time.',
      cta: { href: 'hopes-and-wishes/', label: 'Book your time', until: '2026-08-18' },
      sig: 'Payal and Trevor' },
    { from: '2026-08-17', eyebrow: 'A note from Payal and Trevor', when: 'This week',
      title: 'Come for coffee.',
      body: 'Coffee mornings run this week, campus by campus. No agenda beyond meeting the people who will spend the year with your child, and the other families walking the same route. Times are on the calendar; just come.',
      sig: 'Payal and Trevor' },
    { from: '2026-08-24', eyebrow: 'A note from Payal and Trevor', when: 'This week',
      title: 'Everyone is in.',
      body: 'From this week every child, every year group, every campus is in school. The rhythm of the year starts now: the week ahead lives on this page, and anything you need to sign up for is under Activities. We are glad you are here.',
      sig: 'Payal and Trevor' }
  ],

  // ---- Hopes and Wishes / PTC booking (issue 0043, plan 2026-07-16) ----
  // The start-of-year parent-teacher conference. ONE page (site/hopes-and-wishes/)
  // renders these islands via render.js; Payal emails the single link. The SAME page
  // + rail is reused for the October and March PTCs by editing this block (CONTEXT "PTC").
  // HAND-KEPT (Sarah/Neung edit): plain data, deliberately NOT a SHEET-OWNED fence
  // (pull-sheet.py knows only its four schemas and would wipe these rows).
  // Booking is LINK-OUT only (rule 1): each bookingUrl opens the teacher's Google
  // Calendar appointment page in a new tab; no embed ships until the device-QA gate
  // passes. Every field null-degrades honestly (rule 6): no bookingUrl -> "Booking
  // link coming" (never a dead button, never href="#"), no photo -> initials
  // placeholder, no bio -> "a short introduction is on the way". Booking closes by
  // DATE (derived from ptc.dates), no manual active flag anyone must remember to flip.
  ptc: {
    name: 'Hopes and Wishes',
    // Calendar truth (mirrors the calendarEvents H&W rows; build-api.mjs asserts they
    // match). booking-open derives from these: open while today <= the last date.
    // Dates per the City School calendar 3rd version (docs/sources/calendars.md:
    // the Drive working deck is the date authority; the April draft said 17/18/19).
    dates: [
      { date: '2026-08-17', groups: 'K2 to Y6' },
      { date: '2026-08-18', groups: 'K1' }
    ],
    slotNote: 'Twenty minutes, one to one with your child\'s teacher.',   // hours TBC (Payal)
    questionnaireUrl: null,   // Jotform; null renders an honest "coming" row
    packUrl: null             // Nuts and Bolts PDF; same
  },

  // Booking cards, class-keyed (a co-taught class carries two teachers on one card,
  // one bookingUrl). `year` drives the grouping + the jump strip (explicit order in
  // render.js, not lexicographic). REPRESENTATIVE set K1->Y6 (matches the design
  // study); the full ~24-card roster lands on staffing sign-off (Payal + Heather +
  // Trevor) with photos + teacher-checked bios. Roster + bio source:
  // docs/sources/staffing-2026-27.md. Bios are drafts and await each teacher's check
  // (the page carries the "finalising" chip). photo:null until sign-off + photo import
  // to assets/img/team/; only the demo card is live today.
  classes: [
    // INTERACTIVE TEST CARD (Trevor, 2026-07-16): real photo + real live booking link
    // + sample bio. Proves the whole flow end to end and gives the embed QA gate a
    // live schedule to test against. Fate at parent launch = Trevor's call (remove, or
    // repurpose as a "Questions about booking?" support card). Link source: Trevor's
    // Gmail signature, /u/0/ account segment stripped.
    { class: 'How booking works', year: 'demo', campus: null, flag: null,
      teachers: [ { name: 'Trevor Cardozo', role: 'Head of operations and educational experience',
        photo: 'assets/img/trevor.png',
        bio: 'SAMPLE (Trevor edits): Born in Canada, Trevor has taught in Bangkok and at Upper Canada College, and now leads operations and educational experience at ELC. He is happiest weaving technology into education: computers, robotics and digital media.' } ],
      bookingUrl: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3iBMbLleKHpScuhn2uyBpVYxrOGdtpq3pLUwzuWBACrTJCGJM2rOParGZx4TyU1K5DacnUEoat?gv=true' },

    { class: 'K1 Bee', year: 'K1', campus: null, flag: null,
      teachers: [ { name: 'Blathain Callaghan', role: 'Class teacher', photo: null,
        bio: 'From Ireland and in Bangkok since 2019, Bee joins ELC this year. With a degree in early childhood studies and ten years alongside our youngest learners, she is passionate about learning through play. Off the clock: Gaelic football, museums and exploring the city.' } ],
      bookingUrl: null },

    { class: 'K1 new class', year: 'K1', campus: null, flag: 'New teacher joining',
      teachers: [ { name: 'Teacher to be confirmed', role: 'Class teacher', photo: null, bio: null } ],
      bookingUrl: null },

    { class: 'K2 Nasreen', year: 'K2', campus: null, flag: null,
      teachers: [ { name: 'Nasreen Hassan', role: 'Class teacher', photo: null,
        bio: 'Ms Nas comes from Cape Town with fifteen years of teaching behind her, ten of them international. In her K2 room, curiosity and joy sit beside the academics, and she counts a child happy to arrive as half the job done. Outside school: yoga, cooking and the hand pan.' } ],
      bookingUrl: null },

    { class: 'Y1 Rowan', year: 'Y1', campus: null, flag: null,
      teachers: [ { name: 'Rowan Hayworth', role: 'Class teacher', photo: null,
        bio: 'Rowan trained in Scotland and taught in Spain before Bangkok. He believes every child deserves to feel safe, heard and valued, and shows up each day with the energy for it. Beyond the classroom you will find him playing Gaelic football or padel, mic in hand given the chance.' } ],
      bookingUrl: null },

    { class: 'Y2 Kobus', year: 'Y2', campus: null, flag: null,
      teachers: [ { name: 'Kobus Roux', role: 'Class teacher', photo: null,
        bio: 'Born in South Africa and in Thailand since 2015, Kobus is a qualified elementary teacher who loves building a real relationship with every child in a room where all feel seen. This is his second year as a City School homeroom teacher. Outside: rugby, scuba diving, hiking and family.' } ],
      bookingUrl: null },

    { class: 'Y3 Sophie', year: 'Y3', campus: null, flag: null,
      teachers: [ { name: 'Sophie Mottet', role: 'Class teacher', photo: null,
        bio: 'Now in her third year on the Year 3 team, Sophie studied psychology in Montreal and teaching in Wellington. She builds classrooms grounded in curiosity, respect and connection, and keeps learning alongside the children. At home she is happiest trying out a new recipe.' } ],
      bookingUrl: null },

    { class: 'Y4 Lauren', year: 'Y4', campus: null, flag: null,
      teachers: [ { name: 'Lauren Marsh', role: 'Class teacher', photo: null,
        bio: 'Lauren joins Year 4 with fifteen years across Key Stage 2, most recently in Thailand and before that Shanghai and England. A specialist in maths and history, she co-creates a room where children take the risks real learning needs. Mum to Winnie; loves the outdoors, gardening and reading.' } ],
      bookingUrl: null },

    { class: 'Y5 Clifford and Athena', year: 'Y5', campus: null, flag: null,
      teachers: [
        { name: 'Clifford Sumner', role: 'Class teacher, room 5A', photo: null,
          bio: 'Originally from the UK with a decade teaching in Seoul, Clifford is in his second year in Bangkok. He is drawn to educational technology and to shaping learning around each child in a collaborative room. Outside school he reads, stays active and heads for the water when he can.' },
        { name: 'Athena', role: 'Class teacher, room 5B', flag: 'Name to confirm', photo: null, bio: null }
      ],
      bookingUrl: null },

    { class: 'Y6 Maddy and Chrissy', year: 'Y6', campus: null, flag: null,
      teachers: [
        { name: 'Madison Moore', role: 'Class teacher', photo: null,
          bio: 'Maddy is from the United States, where a design degree led her to teaching. After two years in Year 4 she steps up to Year 6, aiming for a room where children feel safe, have fun and are genuinely challenged. Outside class: reading, learning Thai and taking up golf.' },
        { name: 'Chrissy Turnbull', role: 'Class teacher', photo: null,
          bio: 'Back for her fifth year at the City School, Chrissy leads Year 6 literacy and our responsive classroom and SEL work. A Hong Kong upbringing, a first career in events and thirteen years of teaching give her a wide-angle view of childhood. Off duty: travel, music, films and pilates.' }
      ],
      bookingUrl: null }
  ],

  // Honest sport statuses (PRD 0002 F2 confirmed truth as of 2026-07-07)
  sports: [
    { name: 'Football',   status: 'open', label: 'Open now' },
    { name: 'Basketball', status: 'soon', label: 'Opens 7 Sep' },
    { name: 'Cricket',    status: 'soon', label: 'Opens 7 Sep' },
    { name: 'Swimming',   status: 'soon', label: 'Opens 7 Sep' }
  ],
  sportNote: 'Parent info evening 20 Aug. Sign-up opens 7 Sep.',

  // (Refund and withdrawal content is deliberately NOT on the portal, Trevor 2026-07-12.)

  // REAL 2026/27 events: parsed from "The City School Events 26" sheet per issue 0018,
  // filter rule applied (staff-only dropped; two no-school staff days rescued per Trevor
  // 2026-07-09; Dec 5 Saturday performance confirmed). Review trail:
  // docs/sources/events-review-2026-27.md. Future live feed (0004) swaps in behind this.
  // type:'gold' MEANS key date / milestone (drives the key-dates .ics feed); 'purple' = everything else.
  // Optional href (plan 2026-07-16 item 1.1): SITE-ROOT-relative page path
  // ('hopes-and-wishes/') renders the title as a link wherever the event appears
  // and becomes the share target. CLICK-ONLY: href never promotes an event visually
  // (D2); homepage prominence stays editorial (bookingWindows/notes). Rows sharing
  // one href are one event (the slice-2 grouping key). NOTE: docs[] hrefs further
  // down use the OTHER convention (page-relative from policies/), do not mix.
  // build-api.mjs strips href from the public calendar JSON.
  // The three Hopes and Wishes rows below carry href: 'hopes-and-wishes/' (plan §2c);
  // build-api.mjs asserts they match ptc.dates.
  calendarEvents: [
    { date: '2026-08-03', type: 'purple', title: 'ELC Summer Festival of the Arts, Session 2', sub: 'to 7 Aug' },
    { date: '2026-08-12', type: 'purple', title: 'The Queen Mother\'s Birthday Holiday', sub: '' },
    { date: '2026-08-14', type: 'gold',   title: 'New Family Orientation', sub: '' },
    { date: '2026-08-17', type: 'purple', title: 'K2 to Y6 Hopes and Wishes meetings', sub: '', href: 'hopes-and-wishes/' },
    { date: '2026-08-17', type: 'purple', title: 'K1 Coffee Morning', sub: '' },
    { date: '2026-08-18', type: 'gold',   title: 'K2 to Y6 first day of school', sub: '' },
    { date: '2026-08-18', type: 'purple', title: 'K1 Hopes and Wishes meetings', sub: '', href: 'hopes-and-wishes/' },
    { date: '2026-08-18', type: 'purple', title: 'Y1 Coffee Morning', sub: '' },
    { date: '2026-08-19', type: 'gold',   title: 'K1 first day of school', sub: '' },
    { date: '2026-08-20', type: 'purple', title: 'Y3 to Y6 Coffee Morning for parents', sub: '' },
    { date: '2026-08-21', type: 'purple', title: 'Y2 Coffee Morning', sub: '' },
    { date: '2026-08-24', type: 'purple', title: 'K2 Coffee Morning for parents', sub: '' },
    { date: '2026-08-25', type: 'purple', title: 'Dove Coffee Morning', sub: 'Dove Centre' },
    { date: '2026-09-07', type: 'purple', title: 'Parent Social Morning', sub: '', community: true },
    { date: '2026-09-17', type: 'purple', title: 'Safeguarding parent info session', sub: '' },
    { date: '2026-09-18', type: 'purple', title: 'International Schools Holiday', sub: '' },
    { date: '2026-09-24', type: 'purple', title: 'Open Evening', sub: '' },
    { date: '2026-10-01', type: 'purple', title: 'ISB parent info session', sub: '' },
    { date: '2026-10-02', type: 'purple', title: 'Parent Teacher Conferences (Progress)', sub: 'No school for children' },
    { date: '2026-10-05', type: 'purple', title: 'Parent Social Morning', sub: '', community: true },
    { date: '2026-10-08', type: 'purple', title: 'Digital Safety parent info session', sub: '' },
    { date: '2026-10-12', type: 'purple', title: 'Holiday: ELC October mid-term break', sub: 'to 16 Oct' },
    { date: '2026-10-23', type: 'purple', title: 'King Chulalongkorn Memorial Day', sub: 'No school for children' },
    { date: '2026-10-29', type: 'purple', title: 'Parent Workshop: Emotional Regulation', sub: '', community: true },
    { date: '2026-11-02', type: 'purple', title: 'Parent Social Morning', sub: '', community: true },
    { date: '2026-11-04', type: 'purple', title: 'ELC celebrates Loy Krathong', sub: '' },
    { date: '2026-11-23', type: 'purple', title: 'Y1 and Y2 Holiday Pageant', sub: '' },
    { date: '2026-11-26', type: 'purple', title: 'K1 Holiday Pageant', sub: '' },
    { date: '2026-11-27', type: 'purple', title: 'K2 Holiday Pageant', sub: '' },
    { date: '2026-12-05', type: 'purple', title: 'King Rama IX Birthday and National Day Performance', sub: 'Saturday' },
    { date: '2026-12-07', type: 'purple', title: 'King Rama IX Birthday Substitution Holiday', sub: '' },
    { date: '2026-12-11', type: 'purple', title: 'Y3 to Y6 Holiday Choir Concert', sub: '' },
    { date: '2026-12-14', type: 'purple', title: 'Parent Teacher Conferences (Report Card)', sub: 'No school for children' },
    { date: '2026-12-16', type: 'purple', title: 'K2 to Y6 Fun Field Day', sub: '', community: true },
    { date: '2026-12-17', type: 'purple', title: 'K1 and Dove Centre Fun Field Day', sub: '', community: true },
    { date: '2026-12-18', type: 'gold',   title: 'Last day of Term 1', sub: '11:30 hometime K1 and K2, 12:00 hometime Y1 to Y6' },
    { date: '2026-12-21', type: 'purple', title: 'Holiday: Christmas and New Year', sub: 'to 9 Jan' },
    { date: '2027-01-11', type: 'purple', title: 'No school for children (staff training day)', sub: '' },
    { date: '2027-01-12', type: 'gold',   title: 'School resumes for Term 2', sub: '' },
    { date: '2027-01-14', type: 'purple', title: 'Puberty Workshop', sub: 'Y5 and Y6' },
    { date: '2027-01-18', type: 'purple', title: 'Parent Social Morning', sub: '', community: true },
    { date: '2027-01-28', type: 'purple', title: 'Parent Workshop: Supporting Behaviours', sub: '', community: true },
    { date: '2027-02-01', type: 'purple', title: 'Parent Social Morning', sub: '', community: true },
    { date: '2027-02-08', type: 'purple', title: 'Parent Workshop: Making Learning Visible', sub: '', community: true },
    { date: '2027-02-11', type: 'purple', title: 'Project Through the Years at ELC', sub: '' },
    { date: '2027-02-12', type: 'purple', title: 'Project Through the Years at ELC', sub: '' },
    { date: '2027-02-12', type: 'purple', title: 'Project in Kindergarten', sub: '' },
    { date: '2027-02-19', type: 'purple', title: 'Parent Workshop: An Author\'s Workshop', sub: '', community: true },
    { date: '2027-02-19', type: 'purple', title: 'Athletics Day', sub: '' },
    { date: '2027-02-22', type: 'purple', title: 'Holiday: ELC February mid-term break', sub: 'to 26 Feb' },
    { date: '2027-03-01', type: 'purple', title: 'Parent Social Morning', sub: '', community: true },
    { date: '2027-03-04', type: 'purple', title: 'Atelier explorations and learning', sub: '' },
    { date: '2027-03-09', type: 'purple', title: 'Wycombe Abbey Head of School info session', sub: '' },
    { date: '2027-03-11', type: 'purple', title: 'Emergent reading skill development', sub: '' },
    { date: '2027-03-17', type: 'purple', title: 'Philosophy Circle with Y6', sub: '' },
    { date: '2027-03-19', type: 'purple', title: 'Parent Teacher Conference (Progress)', sub: 'No school for children' },
    { date: '2027-03-22', type: 'purple', title: 'Compass Initiatives: transitions to K1', sub: 'Morning, Atrium' },
    { date: '2027-03-22', type: 'purple', title: 'Y3 to Y6 Drama and Music Evening', sub: '' },
    { date: '2027-03-25', type: 'purple', title: 'Y3 to Y6 Drama and Music Evening', sub: '' },
    { date: '2027-04-01', type: 'purple', title: 'ELC Songkran celebrations', sub: '' },
    { date: '2027-04-01', type: 'purple', title: 'The Wonder of Y6', sub: '' },
    { date: '2027-04-05', type: 'purple', title: 'Songkran Holiday', sub: 'to 16 Apr' },
    { date: '2027-04-06', type: 'purple', title: 'Chakri Day Holiday', sub: '' },
    { date: '2027-04-13', type: 'purple', title: 'Thai New Year: Songkran', sub: 'to 15 Apr' },
    { date: '2027-04-22', type: 'purple', title: 'Math at ELC', sub: '' },
    { date: '2027-04-26', type: 'purple', title: 'Art From The Heart exhibition and fundraising week', sub: 'to 29 Apr', community: true },
    { date: '2027-04-26', type: 'purple', title: 'New Families and PE Families to ELC', sub: '' },
    { date: '2027-05-03', type: 'purple', title: 'Parent Social Morning', sub: '', community: true },
    { date: '2027-05-04', type: 'purple', title: 'Coronation Day Holiday', sub: '' },
    { date: '2027-05-05', type: 'purple', title: 'Little Steps, Big Futures: charting your child\'s K to 6 journey', sub: '' },
    { date: '2027-05-06', type: 'purple', title: 'Little Steps, Big Futures: charting your child\'s K to 6 journey', sub: '' },
    { date: '2027-05-10', type: 'purple', title: 'New Families and PE Families to ELC', sub: 'Afternoon K1 session' },
    { date: '2027-05-13', type: 'purple', title: 'Navigating the AI Terrain', sub: '' },
    { date: '2027-05-20', type: 'purple', title: 'Visakha Bucha Holiday', sub: '' },
    { date: '2027-06-03', type: 'purple', title: 'The Queen\'s Birthday: normal school day', sub: '' },
    { date: '2027-06-07', type: 'purple', title: 'Parent Social Morning', sub: '', community: true },
    { date: '2027-06-09', type: 'purple', title: 'Wan Wai Khru: Teacher\'s Appreciation Day', sub: '' },
    { date: '2027-06-17', type: 'gold',   title: 'Last day of the school year', sub: '' },
    { date: '2027-06-18', type: 'purple', title: 'No school for children (staff training day)', sub: '' },
    { date: '2027-06-22', type: 'purple', title: 'ELC Summer Festival of the Arts, Session 1', sub: 'to 2 Jul' },
    { date: '2027-07-06', type: 'purple', title: 'School holiday: office open', sub: 'to 23 Jul' },
    { date: '2027-07-26', type: 'purple', title: 'ELC Summer Festival of the Arts, Session 2', sub: '26 to 27 and 29 to 30 Jul' },
    { date: '2027-07-28', type: 'purple', title: 'King Vajiralongkorn\'s Birthday Holiday', sub: '' }
  ],

  // Real documents from the policies registry (docs/sources/policies-registry.md,
  // sheet 1J5J8xNhre5N3mr88vLSlSKUK_efVJ6rb6pq8zdRca9Q). Rule: admissions and fee
  // documents NEVER surface on the portal (Trevor, 2026-07-08). Sizes from live
  // HEAD checks 2026-07-08. href:null = no real document yet; render honest, never href="#".
  // Optional per-doc fields (sprint 3): reviewed:'YYYY-MM' -> a "Reviewed <Mon YYYY>"
  // mono stamp; rule:'one operative sentence' -> an "In short:" line. Honest only: set
  // reviewed from the registry's stated review date, rule from the PDF's own words, and
  // flag every extracted rule on docs/verify-v0.5.md (misquoting policy is worse than silence).
  docs: [
    { group: 'Start here', name: 'Parent handbook, 2026/27', sub: 'How the school runs, from the day to the year. The one to read first.', kind: 'PDF', tag: 'PDF · 1.9 MB', href: 'https://www.elc.ac.th/wp-content/uploads/Parent-Handbook-2026-27.pdf' },
    { group: 'Start here', name: 'Term dates and calendar', sub: 'Every term, break and key date for the year ahead.', kind: 'LINK', tag: 'View', href: '../calendar/' },
    { group: 'Start here', name: 'The City School calendar', sub: 'The official academic year calendar for The City School.', kind: 'LINK', tag: 'View', href: 'https://www.elc.ac.th/the-city-school-calendar/' },
    { group: 'Start here', name: 'The Purple Elephant calendar', sub: 'The official academic year calendar for The Purple Elephant at 39, 49 and 55.', kind: 'LINK', tag: 'View', href: 'https://www.elc.ac.th/purple-elephant-calendar/' },
    { group: 'Start here', name: 'The Purple Elephant Samakee calendar', sub: 'The official academic year calendar for The Purple Elephant Samakee.', kind: 'LINK', tag: 'View', href: 'https://www.elc.ac.th/purple-elephant-samakee-calendar/' },
    { group: 'Health and safety', name: 'Safeguarding and child protection', sub: 'Our commitment, and who to speak to if something is not right.', kind: 'PDF', tag: 'PDF · 700 KB', href: 'https://www.elc.ac.th/wp-content/uploads/Safeguarding-and-Child-Protection-Policy-1.pdf' },
    { group: 'Health and safety', name: 'Safeguarding triage chart', sub: 'How a concern moves from first report to action, at a glance.', kind: 'PDF', tag: 'PDF · 53 KB', href: 'https://www.elc.ac.th/wp-content/uploads/Safeguarding-Triage-Chart.pdf' },
    { group: 'Health and safety', name: 'School emergency operations plan', sub: 'How the school prepares for and responds to an emergency.', kind: 'PDF', tag: 'PDF · 810 KB', href: 'https://www.elc.ac.th/wp-content/uploads/School-Emergency-Operations-Policy-and-Plan.pdf' },
    { group: 'Health and safety', name: 'Accident and illness process', sub: 'What happens when a child is hurt or unwell at school.', kind: 'PDF', tag: 'PDF · 44 KB', href: 'https://www.elc.ac.th/wp-content/uploads/ACCIDENT-ILLNESS-PROCESS-23-24.pdf' },
    { group: 'Health and safety', name: 'Outdoor air quality policy', sub: 'How we decide on outdoor play when the air is poor.', kind: 'PDF', tag: 'PDF · 138 KB', href: 'https://www.elc.ac.th/wp-content/uploads/2025_Outdoor_Air_Quality_Policy.pdf' },
    { group: 'Health and safety', name: 'Safe handling policy', sub: 'How and when staff may physically support a child.', kind: 'PDF', tag: 'PDF · 131 KB', href: 'https://www.elc.ac.th/wp-content/uploads/Safe-Handling-Policy.pdf' },
    { group: 'Health and safety', name: 'Low level of concern policy', sub: 'How we notice and act on the small worries early.', kind: 'PDF', tag: 'PDF · 148 KB', href: 'https://www.elc.ac.th/wp-content/uploads/Low-Level-of-Concern-Policy.pdf' },
    { group: 'Health and safety', name: 'Intimate care guidelines', sub: 'How we support toileting and personal care with dignity.', kind: 'PDF', tag: 'PDF · 127 KB', href: 'https://www.elc.ac.th/wp-content/uploads/Intimate-Care-Guidelines.pdf' },
    { group: 'Health and safety', name: 'Lightning procedures', sub: 'When outdoor activity stops and how we shelter.', kind: 'PDF', tag: 'PDF · 240 KB', href: 'https://www.elc.ac.th/wp-content/uploads/Lightning-Procedures.pdf' },
    { group: 'Everyday', name: 'Challenging behaviour policy, 2026/27', sub: 'How we understand and respond to challenging behaviour.', kind: 'PDF', tag: 'PDF · 481 KB', href: 'https://www.elc.ac.th/wp-content/uploads/Challenging-Behaviour-Policy-2026-27.pdf' },
    { group: 'Everyday', name: 'Bus behaviour policy', sub: 'What we expect on the bus, for safety and calm.', kind: 'PDF', tag: 'PDF · 123 KB', href: 'https://www.elc.ac.th/wp-content/uploads/Bus-Behaviour-Policy.pdf' },
    { group: 'Everyday', name: 'Data privacy policy', sub: 'How we handle your family\'s information and images.', kind: 'PDF', tag: 'PDF · 85 KB', href: 'https://www.elc.ac.th/wp-content/uploads/Data-Privacy-Policy.pdf' },
    { group: 'Everyday', name: 'Student technology acceptance', sub: 'How children use school technology, agreed each year.', kind: 'PDF', tag: 'PDF · 861 KB', href: 'https://www.elc.ac.th/wp-content/uploads/Student-Technology-Acceptance.pdf' },
    { group: 'Everyday', name: 'Digital assets acceptable use', sub: 'The rules for school accounts, devices and systems.', kind: 'PDF', tag: 'PDF · 163 KB', href: 'https://www.elc.ac.th/wp-content/uploads/ELC-Digital_Assets-Acceptable_Use_Policy.pdf' },
    { group: 'Everyday', name: 'Photo consent and takedown', sub: 'What we photograph, your choices, and our 48 hour takedown promise.', kind: 'LINK', tag: 'View', href: 'photo-consent/' },
    { group: 'Activities', name: 'Activity terms and conditions', sub: 'Booking, places and what happens if plans change.', kind: 'PDF', tag: null, href: null }
  ]
};
