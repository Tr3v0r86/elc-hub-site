/* ELC Portal: volatile content. One edit here updates every surface.
   Pages render these islands via assets/render.js. Statuses are honest
   (rule 6): football live, the rest open 7 Sep. */
window.PORTAL = {
  // version + build: render.js stamps these into the footer fine print (.fine) on
  // every page, so the stamp refreshes the instant this network-first file lands
  // (0061): one edit here restamps the whole site, the reviewer's tell that
  // update-propagation worked. feedback.js payloads also read version. The MASTHEAD
  // tape (.tape) stays shell-owned, hardcoded per page: bump it in the v0.8 stamp
  // pass. build = deploy date of the current shell (honest, not the viewer's clock).
  version: 'v0.8',
  build: '27 Jul',
  term: 'Term 1',

  // Live-feed subscribe controls (ADR-0006, superseded-for-launch by issue 0077). The UI
  // came off every calendar page on 2026-08-03 and the flip is frozen: launch advertises
  // no subscription at all. Feeds still build each deploy, unadvertised. Re-flip = restore
  // a [data-subscribe] row + set this true; render.js wires the rest.
  subscribeLive: false,

  // Academic-year bounds for the calendar print "academic year" range (0058). A full
  // span that brackets the school year's dated events (first 3 Aug 2026, last 28 Jul
  // 2027), NOT a claim about the exact first/last school day: those live in
  // calendarEvents ("K2 to Y6 first day of school" 18 Aug, "Last day of the school
  // year" 17 Jun). Date authority = the City School calendar SSOT
  // (docs/sources/calendars.md); widen if events ever fall outside. Used full-span,
  // never today-anchored.
  academicYear: { start: '2026-08-01', end: '2027-07-31' },

  // Pages still being finalised (sprint 3 D5). render.js prepends a visible
  // "We are finalising this page" chip on any page whose content-root data-page key
  // is listed here. Removing a key = that page's verify-artifact row is signed off
  // (docs/verify-v0.5.md).
  // 0080 (2026-08-03): gate-card + the 7 armonia slugs dropped (pages archived).
  draftPages: ['hopes-and-wishes', 'glossary', 'photo-consent', 'how-to-pay',
               'community-giving', 'nuts-and-bolts', 'coffee-mornings'],

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
    activities: { label: 'Activities team', email: 'activities@elc.ac.th', phone: '+66 (0)2 381 2919' },
    // Nurse Apple, per the comms Nuts & Bolts doc (docs/sources/nuts-and-bolts-doc.md).
    // No dedicated nurse line: the school number reaches her (Trevor, 2026-07-17).
    nurse:      { label: 'School nurse',    email: 'apples@elc.ac.th',     phone: '+66 (0)2 381 2919' }
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

  // Registration windows RETIRED (P4 pass A, 2026-07-19): the two sport rows moved
  // into calendarEvents (2026-08-20 info evening, 2026-09-07 sign-up opens, both
  // aud:'parent', href:'activities/') so the week strip and Coming up own them from
  // one source. The legacy countdown renderer + the SHEET-OWNED regWindows fence are
  // gone; pull-sheet.py tolerates-and-warns on any leftover regWindows sheet rows.

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

  // Coming up cards (slice 2, issue 0047). EDITORIAL curation (D2): each row here
  // promotes ONE event group to a homepage card. href is the group identity: every
  // calendarEvents row sharing it folds into the card, and render.js computes the
  // exact date window from those rows. A card ages out when the group's last date
  // passes; groups surface once their next date is within ~30 days; the band caps
  // at 4 (overflow rewrites the header link to "+N more"). The title lives HERE:
  // a grouped card's name exists in no single row (plan decision #19).
  // HAND-KEPT like bookingWindows: pull-sheet.py never touches this island.
  // Schema: { href: 'hopes-and-wishes/',   // group key; must resolve on disk (gate-checked)
  //           title: 'Hopes and Wishes',   // group display title
  //           blurb: 'One card sentence.',
  //           go: 'Find your class' }      // card action label
  featuredEvents: [
    { href: 'hopes-and-wishes/', title: 'Hopes and Wishes',
      blurb: 'Twenty minutes with your child\'s teacher to start the year, in your words.',
      go: 'Find your class' },
    { href: 'coffee-mornings/', title: 'Coffee morning',
      blurb: 'Meet your year group\'s coordinators and administrators and hear how the year runs, in the opening weeks.',
      go: 'Find your year group' }
  ],

  // Safeguarding leads (issue 0031 item 6): /safeguarding/ renders a card per
  // entry; empty = the page shows the generic route only. Fill when confirmed:
  //   { campus: 'The City School', name: '...', role: 'Designated Safeguarding Lead', email: '...' }
  safeguarding: [],

  // This-week strip derives from calendarEvents in render.js (current week, else next up).
  // No separate week[]: one source of truth (issue 0018).

  // Note rotation, single voice: Trevor (0051 parent-facing hard launch; Trevor cools
  // each body before deploy). The HoS letter stays a live seam: index.html renders a
  // "note from Payal coming" line and issue 0007 holds her real-copy path.
  // render.js shows the latest note whose `from` <= today (Bangkok).
  notes: [
    { from: '2026-07-01', eyebrow: 'A note from Trevor', when: 'This month · August',
      title: 'Welcome to a new year.',
      body: 'ELC Portal is new this year: one place for everything your family does with us beyond the classroom. We are building it not just for our community, but with you. Just as we shape the children\'s learning around relationships and listening, this page grows from what families tell us they need. So tell us, with the feedback button, and together we will make something that fits our school and our community.',
      sig: 'Trevor · Head of Operations and Educational Experience' },
    // Optional cta (plan 1.5): renders as one link after the body, gone after `until`.
    { from: '2026-08-10', eyebrow: 'A note from Trevor', when: '17 to 18 August',
      title: 'We start with your hopes.',
      body: 'On 17 and 18 August your child\'s teachers sit down with you for Hopes and Wishes: what you want this year to hold for your child, in your words. It is my favourite way to begin the year. Everything else on this page can wait until you have booked your time.',
      cta: { href: 'hopes-and-wishes/', label: 'Book your time', until: '2026-08-18' },
      sig: 'Trevor · Head of Operations and Educational Experience' },
    { from: '2026-08-17', eyebrow: 'A note from Trevor', when: '17 to 25 August',
      title: 'Come and meet your year team.',
      body: 'Your year group\'s coffee morning lands between 17 and 25 August: this is the information session for the year ahead, where you meet the coordinators and administrators who hold your year together and hear how it runs. The social mornings that run through the rest of the year are a different, more relaxed thing. Times are on the calendar; come find me while you are there.',
      cta: { href: 'coffee-mornings/', label: 'Find your year group' },
      sig: 'Trevor · Head of Operations and Educational Experience' },
    { from: '2026-08-24', eyebrow: 'A note from Trevor', when: 'This week',
      title: 'Everyone is in.',
      body: 'From this week every child, every year group, every campus is in school. The rhythm of the year starts now: the week ahead lives on this page, and anything you need to sign up for is under Activities. Tell me what is missing; this page is built from what families ask for.',
      sig: 'Trevor · Head of Operations and Educational Experience' }
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
    // NOT WIRED YET (0050 sweep truth pass): no renderer reads the three fields
    // below; the H&W page copy is hardcoded in hopes-and-wishes/index.html. They
    // are deliberate seams for the October/March PTC reuse (issue 0043): wire a
    // render.js mount when that page goes data-driven, or cut them then.
    slotNote: 'Twenty minutes, one to one with your child\'s teacher.',   // hours TBC (Payal)
    questionnaireUrl: null,
    packUrl: null
  },

  // Booking cards, class-keyed (a co-taught class carries two teachers on one card,
  // one bookingUrl). `year` drives the grouping + the jump strip (explicit order in
  // render.js, not lexicographic). Roster + bio source: docs/sources/staffing-2026-27.md.
  // Bios are drafts and await each teacher's check (the page carries the "finalising"
  // chip); only the demo card's booking link is live today.
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

    // FULL ROSTER (2026-07-17), 23 booking cards from docs/sources/staffing-2026-27.md.
    // Photos: assets/img/team/<key>.jpg, 560px B&W squares from the Headshots.zip set
    // (manifest = the Claude Design system project). Bios compressed 40-60 words from
    // the 25/26 bios Doc (canonical, pulled at build time); every card awaits its
    // teacher's self-check + staffing sign-off (Payal + Heather + Trevor) before
    // parent-facing publish; the page-level draft note covers the interim.
    // PE49 K1 class (Tina) deliberately absent: Purple Elephant is out of launch scope.
    // Y4 Lauren photo stays null: the headshot set's 'lauren' is last year's SSW
    // Lauren; identity unconfirmed for Lauren Marsh (new to Y4). Resolve at sign-off.

    { class: 'K1 Sarah', year: 'K1', campus: null, flag: null,
      teachers: [ { name: 'Sarah Jansen van Vuuren', role: 'Class teacher', photo: 'assets/img/team/sarah.jpg',
        bio: 'From South Africa and in Bangkok since 2022, Sarah holds an honours degree in education from the University of Cape Town. She builds a nurturing room where children explore, experiment and engage with the world, with strong relationships between families, staff and children at the centre. Outside school: hiking, swimming and photography.' } ],
      bookingUrl: null },

    { class: 'K1 Bee', year: 'K1', campus: null, flag: null,
      teachers: [ { name: 'Blathain Callaghan', role: 'Class teacher', photo: 'assets/img/team/bee.jpg',
        bio: 'From Ireland and in Bangkok since 2019, Bee joins ELC this year. With a degree in early childhood studies and ten years alongside our youngest learners, she is passionate about learning through play. Off the clock: Gaelic football, museums and exploring the city.' } ],
      bookingUrl: null },

    { class: 'K1 Katie', year: 'K1', campus: null, flag: null,
      teachers: [ { name: 'Ekaterina Mokrushina', role: 'Class teacher', photo: 'assets/img/team/katie.jpg',
        bio: 'Katie has taught K1 at ELC since 2019, after classrooms in Beijing and Chengdu, and speaks Mandarin. A master\'s in educational technology made her our technology integration lead, and she is always happy to talk with families about screen time at home. Beyond school: tennis and diving.' } ],
      bookingUrl: null },

    // 5th K1 class (Trevor 2026-07-17): K1 = Sarah, Bee, Katie, SINEAD, Rae. The
    // sheet's "Sinead replacement, hire TBC" row is stale: Sinead stays, no new hire.
    { class: 'K1 Sinead', year: 'K1', campus: null, flag: null,
      teachers: [ { name: 'Sinead McGee', role: 'Class teacher', photo: 'assets/img/team/sinead.jpg',
        bio: 'Sinead is from Ireland and lives in Bangkok with her husband and two daughters. With a PGDE in early years and classrooms in the UK, China and Cambodia behind her, she builds a safe, nurturing room grounded in inquiry, agency and collaboration. Off duty: good food, weight lifting and a good cup of coffee.' } ],
      bookingUrl: null },

    { class: 'K1 Rae', year: 'K1', campus: null, flag: null,
      teachers: [ { name: 'Rae-Lynn Neill', role: 'Class teacher', photo: 'assets/img/team/rae.jpg',
        bio: 'Rae has been part of ELC since 2013. From Ontario, Canada, with degrees in arts and education, she is now training in dyslexia support: literacy is her passion. She believes children learn best through play, inquiry and the senses, in a room built on inclusivity.' } ],
      bookingUrl: null },

    { class: 'K2 Izzy', year: 'K2', campus: null, flag: null,
      teachers: [ { name: 'Isreal Tan', role: 'Class teacher', photo: 'assets/img/team/izzy.jpg',
        bio: 'From New Zealand with an education degree from Victoria University of Wellington, Izzy has been part of ELC for over ten years in roles across the school. He documents children\'s learning with a photographer\'s eye and takes their ideas seriously. Outside: rugby, world music and Bangkok\'s food.' } ],
      bookingUrl: null },

    { class: 'K2 Nasreen', year: 'K2', campus: null, flag: null,
      teachers: [ { name: 'Nasreen Hassan', role: 'Class teacher', photo: 'assets/img/team/nas.jpg',
        bio: 'Ms Nas comes from Cape Town with fifteen years of teaching behind her, ten of them international. In her K2 room, curiosity and joy sit beside the academics, and she counts a child happy to arrive as half the job done. Outside school: yoga, cooking and the hand pan.' } ],
      bookingUrl: null },

    { class: 'K2 Kelly', year: 'K2', campus: null, flag: null,
      teachers: [ { name: 'Kelly Wadenholm', role: 'Class teacher', photo: 'assets/img/team/kelly.jpg',
        bio: 'Kelly grew up in Bangkok with Stockholm roots, then spent six years in Melbourne earning her early years degree and teaching kindergarten. She builds a room where every child feels valued and takes an active part in their own learning. Off duty she stays active, eats Thai food and heads for the beach.' } ],
      bookingUrl: null },

    { class: 'K2 Jess', year: 'K2', campus: null, flag: null,
      teachers: [ { name: 'Jessica Melton', role: 'Class teacher', photo: 'assets/img/team/jess.jpg',
        bio: 'Jess is from Virginia and has taught in Thailand since 2016, with a master\'s in teaching multilingual learners. Homeroom and learning support roles taught her to build language-rich rooms where children feel safe, seen and heard. Outside school: art, singing, studying Thai and scuba diving.' } ],
      bookingUrl: null },

    { class: 'K2 Emillia', year: 'K2', campus: null, flag: null,
      teachers: [ { name: 'Emillia Harris', role: 'Class teacher', photo: 'assets/img/team/emillia.jpg',
        bio: 'Emillia is from the UK, with a primary education degree from Leeds Trinity, and has called Bangkok home for four years. She believes young children thrive when encouraged to wonder, test ideas and discover, and loves bringing the natural world into the room. Happiest outdoors, especially by the beach.' } ],
      bookingUrl: null },

    { class: 'Y1 Tammy', year: 'Y1', campus: null, flag: null,
      teachers: [ { name: 'Tammy Sion', role: 'Class teacher', photo: 'assets/img/team/tammy.jpg',
        bio: 'Tammy is from Singapore, with over twenty five years of teaching across Singapore and Australia and an early childhood degree from Monash. She builds an inclusive room where every voice matters and every idea is met with curiosity and respect. Outside school: shopping and a good murder mystery.' } ],
      bookingUrl: null },

    { class: 'Y1 Rowan', year: 'Y1', campus: null, flag: null,
      teachers: [ { name: 'Rowan Hayworth', role: 'Class teacher', photo: 'assets/img/team/rowan.jpg',
        bio: 'Rowan trained in Scotland and taught in Spain before Bangkok. He believes every child deserves to feel safe, heard and valued, and shows up each day with the energy for it. Beyond the classroom you will find him playing Gaelic football or padel, mic in hand given the chance.' } ],
      bookingUrl: null },

    { class: 'Y1 Rin', year: 'Y1', campus: null, flag: null,
      teachers: [ { name: 'Rarinthip Gandhi', role: 'Class teacher', photo: 'assets/img/team/rin.jpg',
        bio: 'Rin starts her third year at the City School, moving to Year 1 after two years in Year 3. A computer science background and a master\'s in education from Exeter shape a room where children think creatively, collaborate joyfully and embrace challenges. Outside: adventure outdoors and new cultures.' } ],
      bookingUrl: null },

    { class: 'Y1 Meg', year: 'Y1', campus: null, flag: null,
      teachers: [ { name: 'Meghan Costello', role: 'Class teacher', photo: 'assets/img/team/meg.jpg',
        bio: 'Meg is from Vermont, USA, with dual master\'s degrees in education and special education. She has taught in New Hampshire and in Nagoya, Japan, and builds a classroom where children feel safe to explore and express themselves with joyful curiosity. This year she is excited to explore Thailand and its language.' } ],
      bookingUrl: null },

    { class: 'Y2 Julie', year: 'Y2', campus: null, flag: null,
      teachers: [ { name: 'Julie Thomson', role: 'Class teacher', photo: 'assets/img/team/julie.jpg',
        bio: 'Julie is from New Zealand and arrives after six years teaching in Doha, Qatar, fourteen years in classrooms in all. She believes children learn best where it is safe to ask questions, make mistakes and explore the world around them. Outside school: new places, different foods and other cultures.' } ],
      bookingUrl: null },

    { class: 'Y2 Eric', year: 'Y2', campus: null, flag: null,
      teachers: [ { name: 'Eric Olorenshaw', role: 'Class teacher', photo: 'assets/img/team/eric.jpg',
        bio: 'Eric is Canadian, from the Toronto area, with a master of teaching from the University of Toronto and fifteen years across South Korea, Bahrain and Bangkok. His passion is helping children imagine and design a sustainable future. Many Year 2 families will already know him from last year.' } ],
      bookingUrl: null },

    { class: 'Y2 Kobus', year: 'Y2', campus: null, flag: null,
      teachers: [ { name: 'Kobus Roux', role: 'Class teacher', photo: 'assets/img/team/kobus.jpg',
        bio: 'Born in South Africa and in Thailand since 2015, Kobus is a qualified elementary teacher who loves building a real relationship with every child in a room where all feel seen. This is his second year as a City School homeroom teacher. Outside: rugby, scuba diving, hiking and family.' } ],
      bookingUrl: null },

    { class: 'Y3 Sophie', year: 'Y3', campus: null, flag: null,
      teachers: [ { name: 'Sophie Mottet', role: 'Class teacher', photo: 'assets/img/team/sophie.jpg',
        bio: 'Now in her third year on the Year 3 team, Sophie studied psychology in Montreal and teaching in Wellington. She builds classrooms grounded in curiosity, respect and connection, and keeps learning alongside the children. At home she is happiest trying out a new recipe.' } ],
      bookingUrl: null },

    { class: 'Y3 Keyyona', year: 'Y3', campus: null, flag: null,
      teachers: [ { name: 'Keyyona Lennon-Booker', role: 'Class teacher', photo: 'assets/img/team/keyyona.jpg',
        bio: 'Keyyona is from the USA with a decade of teaching across South Korea and Hong Kong, where she earned her PGDE and master\'s at the University of Hong Kong. Her room is child-centred and inquiry-driven, growing confident, compassionate and globally minded learners. Outside: staying active and Bangkok\'s food scene.' } ],
      bookingUrl: null },

    { class: 'Y4 Lauren', year: 'Y4', campus: null, flag: null,
      teachers: [ { name: 'Lauren Marsh', role: 'Class teacher', photo: null,
        bio: 'Lauren joins Year 4 with fifteen years across Key Stage 2, most recently in Thailand and before that Shanghai and England. A specialist in maths and history, she co-creates a room where children take the risks real learning needs. Mum to Winnie; loves the outdoors, gardening and reading.' } ],
      bookingUrl: null },

    { class: 'Y4 Carl', year: 'Y4', campus: null, flag: null,
      teachers: [ { name: 'Carl Allinson', role: 'Class teacher', photo: 'assets/img/team/carl.jpg',
        bio: 'Carl is from the UK, a geologist turned teacher with fifteen years across Germany, China, South Korea, Spain and Thailand. His daughter Sunny is in K2 here. In his room children choose work that matches their level and goals, building confidence and ownership. Outside: music, football and travel.' } ],
      bookingUrl: null },

    { class: 'Y5 Clifford and Athena', year: 'Y5', campus: null, flag: null,
      teachers: [
        { name: 'Clifford Sumner', role: 'Class teacher, room 5A', photo: 'assets/img/team/clifford.jpg',
          bio: 'Originally from the UK with a decade teaching in Seoul, Clifford is in his second year in Bangkok. He is drawn to educational technology and to shaping learning around each child in a collaborative room. Outside school he reads, stays active and heads for the water when he can.' },
        { name: 'Athena Lee Moria', role: 'Class teacher, room 5B', photo: 'assets/img/team/athena.jpg', bio: null }
      ],
      bookingUrl: null },

    { class: 'Y6 Maddy and Chrissy', year: 'Y6', campus: null, flag: null,
      teachers: [
        { name: 'Madison Moore', role: 'Class teacher', photo: 'assets/img/team/madison.jpg',
          bio: 'Maddy is from the United States, where a design degree led her to teaching. After two years in Year 4 she steps up to Year 6, aiming for a room where children feel safe, have fun and are genuinely challenged. Outside class: reading, learning Thai and taking up golf.' },
        { name: 'Chrissy Turnbull', role: 'Class teacher', photo: 'assets/img/team/chrissy.jpg',
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
  // REQUIRED aud (P4 pass A, 2026-07-19): audience taxonomy driving dot colour on the
  // calendar grid + agenda: 'parent' (involves parents: coffee mornings, H&W, info
  // evenings, workshops, PTCs, performances), 'child' (children-only school days: first/
  // last day, athletics/field day, cultural celebrations), 'holiday' (no school / closed).
  // "Registration/booking opens" folds into 'parent'. Presentation metadata, retune freely.
  // Optional until:'YYYY-MM-DD' (inclusive last day) on multi-day rows: drives ICS DTEND
  // (exclusive until+1) in render.js AND build-api's feed; visual surfaces stay start-anchored.
  // Optional nopage:true = deliberately page-less (a portal page is never owed): exempts the
  // row from the Coming-up "coming soon" pill AND the check-coming-up coverage gate. Set on
  // children-only school days and programme rows (summer festivals). aud:'holiday' is exempt
  // without nopage. The gate alerts on any pageless, non-holiday, non-nopage row inside its
  // window: that alert means "build this page or flag it nopage" (deliberate, per plan §9).
  // Optional href (plan 2026-07-16 item 1.1): SITE-ROOT-relative page path
  // ('hopes-and-wishes/') renders the title as a link wherever the event appears
  // and becomes the share target. CLICK-ONLY: href never promotes an event visually
  // (D2); homepage prominence stays editorial (featuredEvents/bookingWindows/notes).
  // Rows sharing one href are one event (the slice-2 grouping key: a featuredEvents
  // card folds every row with its href). NOTE: docs[] hrefs further down use the
  // OTHER convention (page-relative from policies/), do not mix.
  // build-api.mjs strips href from the public calendar JSON.
  // The two Hopes and Wishes rows below carry href: 'hopes-and-wishes/' (plan §2c);
  // build-api.mjs asserts every ptc date has a matching calendar row (one-directional).
  // Optional community:true surfaces the row on community/ + giving pages.
  // Coffee-morning rows additionally carry: cohort (K1|K2|Y1|Y2|'Y3 to Y6'|Dove) ·
  // time/venue (null = "To be confirmed") · slides (null until the deck lands, then
  // { href:'https://…', tag:'PDF' }; HTTPS only or the build gate rejects).
  // BEGIN SHEET-OWNED: calendarEvents
  calendarEvents: [
    { date: '2026-07-29', cat: 'event', type: 'purple', aud: 'parent', until: '2026-08-07', nopage: true, ext: 'https://www.elc.ac.th/summer-school/', title: 'ELC Summer Festival of the Arts, Session 2', sub: 'A week of making and performing, to 7 Aug.' },
    { date: '2026-08-12', cat: 'holiday', type: 'purple', aud: 'holiday', title: 'The Queen Mother\'s Birthday Holiday', sub: '' },
    { date: '2026-08-14', cat: 'event', type: 'gold', aud: 'parent', href: 'new-family-orientation/', title: 'New Family Orientation', sub: 'A warm welcome for families new to ELC.' },
    { date: '2026-08-17', cat: 'event', type: 'purple', aud: 'parent', href: 'coffee-mornings/', cohort: 'K1', title: 'K1 Coffee morning', sub: 'Information session' },
    { date: '2026-08-17', cat: 'event', type: 'purple', aud: 'parent', href: 'hopes-and-wishes/', title: 'K2 to Y6 Hopes and Wishes meetings', sub: '' },
    { date: '2026-08-18', cat: 'event', type: 'purple', aud: 'parent', href: 'hopes-and-wishes/', title: 'K1 Hopes and Wishes meetings', sub: '' },
    { date: '2026-08-18', cat: 'event', type: 'gold', aud: 'child', nopage: true, title: 'K2 to Y6 first day of school', sub: '' },
    { date: '2026-08-18', cat: 'event', type: 'purple', aud: 'parent', href: 'coffee-mornings/', cohort: 'Y1', title: 'Y1 Coffee morning', sub: 'Information session' },
    { date: '2026-08-19', cat: 'event', type: 'gold', aud: 'child', nopage: true, title: 'K1 first day of school', sub: '' },
    { date: '2026-08-20', cat: 'event', type: 'purple', aud: 'parent', href: 'coffee-mornings/', cohort: 'Y3 to Y6', title: 'Y3 to Y6 Coffee morning', sub: 'Information session' },
    { date: '2026-08-21', cat: 'event', type: 'purple', aud: 'parent', href: 'coffee-mornings/', cohort: 'Y2', title: 'Y2 Coffee morning', sub: 'Information session' },
    { date: '2026-08-24', cat: 'event', type: 'purple', aud: 'parent', href: 'coffee-mornings/', cohort: 'K2', title: 'K2 Coffee morning', sub: 'Information session' },
    { date: '2026-08-25', cat: 'event', type: 'purple', aud: 'parent', href: 'coffee-mornings/', cohort: 'Dove', title: 'Dove Coffee morning', sub: 'Information session' },
    { date: '2026-09-07', cat: 'social', type: 'purple', aud: 'parent', nopage: true, community: true, title: 'Parent Social Morning', sub: '' },
    { date: '2026-09-17', cat: 'workshop', type: 'purple', aud: 'parent', title: 'Safeguarding parent info session', sub: '' },
    { date: '2026-09-18', cat: 'holiday', type: 'purple', aud: 'holiday', title: 'International Schools Holiday', sub: '' },
    { date: '2026-09-24', cat: 'event', type: 'purple', aud: 'parent', title: 'Open Evening', sub: '' },
    { date: '2026-10-01', cat: 'workshop', type: 'purple', aud: 'parent', title: 'ISB parent info session', sub: '' },
    { date: '2026-10-02', cat: 'event', type: 'purple', aud: 'parent', title: 'Parent Teacher Conferences (Progress)', sub: 'No school for children' },
    { date: '2026-10-05', cat: 'social', type: 'purple', aud: 'parent', nopage: true, community: true, title: 'Parent Social Morning', sub: '' },
    { date: '2026-10-08', cat: 'workshop', type: 'purple', aud: 'parent', title: 'Digital Safety parent info session', sub: '' },
    { date: '2026-10-12', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2026-10-16', title: 'Holiday: ELC October mid-term break', sub: 'to 16 Oct' },
    { date: '2026-10-23', cat: 'holiday', type: 'purple', aud: 'holiday', title: 'King Chulalongkorn Memorial Day', sub: 'No school for children' },
    { date: '2026-10-29', cat: 'workshop', type: 'purple', aud: 'parent', community: true, title: 'Parent Workshop: Emotional Regulation', sub: '' },
    { date: '2026-11-02', cat: 'social', type: 'purple', aud: 'parent', nopage: true, community: true, title: 'Parent Social Morning', sub: '' },
    { date: '2026-11-04', cat: 'event', type: 'purple', aud: 'child', nopage: true, title: 'ELC celebrates Loy Krathong', sub: '' },
    { date: '2026-11-23', cat: 'event', type: 'purple', aud: 'parent', title: 'Y1 and Y2 Holiday Pageant', sub: '' },
    { date: '2026-11-26', cat: 'event', type: 'purple', aud: 'parent', title: 'K1 Holiday Pageant', sub: '' },
    { date: '2026-11-27', cat: 'event', type: 'purple', aud: 'parent', title: 'K2 Holiday Pageant', sub: '' },
    { date: '2026-12-05', cat: 'event', type: 'purple', aud: 'parent', title: 'King Rama IX Birthday and National Day Performance', sub: 'Saturday' },
    { date: '2026-12-07', cat: 'holiday', type: 'purple', aud: 'holiday', title: 'King Rama IX Birthday Substitution Holiday', sub: '' },
    { date: '2026-12-11', cat: 'event', type: 'purple', aud: 'parent', title: 'Y3 to Y6 Holiday Choir Concert', sub: '' },
    { date: '2026-12-14', cat: 'event', type: 'purple', aud: 'parent', title: 'Parent Teacher Conferences (Report Card)', sub: 'No school for children' },
    { date: '2026-12-16', cat: 'athletics', type: 'purple', aud: 'child', nopage: true, community: true, title: 'K2 to Y6 Fun Field Day', sub: '' },
    { date: '2026-12-17', cat: 'athletics', type: 'purple', aud: 'child', nopage: true, community: true, title: 'K1 and Dove Centre Fun Field Day', sub: '' },
    { date: '2026-12-18', cat: 'event', type: 'gold', aud: 'child', nopage: true, title: 'Last day of Term 1', sub: '11:30 hometime K1 and K2, 12:00 hometime Y1 to Y6' },
    { date: '2026-12-21', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2027-01-09', title: 'Holiday: Christmas and New Year', sub: 'to 9 Jan' },
    { date: '2027-01-11', cat: 'holiday', type: 'purple', aud: 'holiday', title: 'No school for children (staff training day)', sub: '' },
    { date: '2027-01-12', cat: 'event', type: 'gold', aud: 'child', nopage: true, title: 'School resumes for Term 2', sub: '' },
    { date: '2027-01-14', cat: 'workshop', type: 'purple', aud: 'child', nopage: true, title: 'Puberty Workshop', sub: 'Y5 and Y6' },
    { date: '2027-01-18', cat: 'social', type: 'purple', aud: 'parent', nopage: true, community: true, title: 'Parent Social Morning', sub: '' },
    { date: '2027-01-28', cat: 'workshop', type: 'purple', aud: 'parent', community: true, title: 'Parent Workshop: Supporting Behaviours', sub: '' },
    { date: '2027-02-01', cat: 'social', type: 'purple', aud: 'parent', nopage: true, community: true, title: 'Parent Social Morning', sub: '' },
    { date: '2027-02-08', cat: 'workshop', type: 'purple', aud: 'parent', community: true, title: 'Parent Workshop: Making Learning Visible', sub: '' },
    { date: '2027-02-11', cat: 'workshop', type: 'purple', aud: 'parent', title: 'Project Through the Years at ELC', sub: '' },
    { date: '2027-02-12', cat: 'workshop', type: 'purple', aud: 'parent', title: 'Project Through the Years at ELC', sub: '' },
    { date: '2027-02-12', cat: 'workshop', type: 'purple', aud: 'parent', title: 'Project in Kindergarten', sub: '' },
    { date: '2027-02-19', cat: 'athletics', type: 'purple', aud: 'child', nopage: true, title: 'Athletics Day', sub: '' },
    { date: '2027-02-19', cat: 'workshop', type: 'purple', aud: 'parent', community: true, title: 'Parent Workshop: An Author\'s Workshop', sub: '' },
    { date: '2027-02-22', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2027-02-26', title: 'Holiday: ELC February mid-term break', sub: 'to 26 Feb' },
    { date: '2027-03-01', cat: 'social', type: 'purple', aud: 'parent', nopage: true, community: true, title: 'Parent Social Morning', sub: '' },
    { date: '2027-03-04', cat: 'workshop', type: 'purple', aud: 'parent', title: 'Atelier explorations and learning', sub: '' },
    { date: '2027-03-09', cat: 'workshop', type: 'purple', aud: 'parent', title: 'Wycombe Abbey Head of School info session', sub: '' },
    { date: '2027-03-11', cat: 'workshop', type: 'purple', aud: 'parent', title: 'Emergent reading skill development', sub: '' },
    { date: '2027-03-17', cat: 'workshop', type: 'purple', aud: 'parent', title: 'Philosophy Circle with Y6', sub: '' },
    { date: '2027-03-19', cat: 'event', type: 'purple', aud: 'parent', title: 'Parent Teacher Conference (Progress)', sub: 'No school for children' },
    { date: '2027-03-22', cat: 'workshop', type: 'purple', aud: 'parent', title: 'Compass Initiatives: transitions to K1', sub: 'Morning, Atrium' },
    { date: '2027-03-22', cat: 'event', type: 'purple', aud: 'parent', title: 'Y3 to Y6 Drama and Music Evening', sub: '' },
    { date: '2027-03-25', cat: 'event', type: 'purple', aud: 'parent', title: 'Y3 to Y6 Drama and Music Evening', sub: '' },
    { date: '2027-04-01', cat: 'event', type: 'purple', aud: 'child', nopage: true, title: 'ELC Songkran celebrations', sub: '' },
    { date: '2027-04-01', cat: 'workshop', type: 'purple', aud: 'parent', title: 'The Wonder of Y6', sub: '' },
    { date: '2027-04-05', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2027-04-16', title: 'Songkran Holiday', sub: 'to 16 Apr' },
    { date: '2027-04-06', cat: 'holiday', type: 'purple', aud: 'holiday', title: 'Chakri Day Holiday', sub: '' },
    { date: '2027-04-13', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2027-04-15', title: 'Thai New Year: Songkran', sub: 'to 15 Apr' },
    { date: '2027-04-22', cat: 'workshop', type: 'purple', aud: 'parent', title: 'Math at ELC', sub: '' },
    { date: '2027-04-26', cat: 'event', type: 'purple', aud: 'parent', until: '2027-04-29', community: true, title: 'Art From The Heart exhibition and fundraising week', sub: 'to 29 Apr' },
    { date: '2027-04-26', cat: 'event', type: 'purple', aud: 'parent', title: 'New Families and PE Families to ELC', sub: '' },
    { date: '2027-05-03', cat: 'social', type: 'purple', aud: 'parent', nopage: true, community: true, title: 'Parent Social Morning', sub: '' },
    { date: '2027-05-04', cat: 'holiday', type: 'purple', aud: 'holiday', title: 'Coronation Day Holiday', sub: '' },
    { date: '2027-05-05', cat: 'workshop', type: 'purple', aud: 'parent', title: 'Little Steps, Big Futures: charting your child\'s K to 6 journey', sub: '' },
    { date: '2027-05-06', cat: 'workshop', type: 'purple', aud: 'parent', title: 'Little Steps, Big Futures: charting your child\'s K to 6 journey', sub: '' },
    { date: '2027-05-10', cat: 'event', type: 'purple', aud: 'parent', title: 'New Families and PE Families to ELC', sub: 'Afternoon K1 session' },
    { date: '2027-05-13', cat: 'workshop', type: 'purple', aud: 'parent', title: 'Navigating the AI Terrain', sub: '' },
    { date: '2027-05-20', cat: 'holiday', type: 'purple', aud: 'holiday', title: 'Visakha Bucha Holiday', sub: '' },
    { date: '2027-06-03', cat: 'event', type: 'purple', aud: 'child', nopage: true, title: 'The Queen\'s Birthday: normal school day', sub: '' },
    { date: '2027-06-07', cat: 'social', type: 'purple', aud: 'parent', nopage: true, community: true, title: 'Parent Social Morning', sub: '' },
    { date: '2027-06-09', cat: 'event', type: 'purple', aud: 'child', nopage: true, title: 'Wan Wai Khru: Teacher\'s Appreciation Day', sub: '' },
    { date: '2027-06-17', cat: 'event', type: 'gold', aud: 'child', nopage: true, title: 'Last day of the school year', sub: '' },
    { date: '2027-06-18', cat: 'holiday', type: 'purple', aud: 'holiday', title: 'No school for children (staff training day)', sub: '' },
    { date: '2027-06-22', cat: 'event', type: 'purple', aud: 'parent', until: '2027-07-02', nopage: true, ext: 'https://www.elc.ac.th/summer-school/', title: 'ELC Summer Festival of the Arts, Session 1', sub: 'to 2 Jul' },
    { date: '2027-07-06', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2027-07-23', title: 'School holiday: office open', sub: 'to 23 Jul' },
    { date: '2027-07-26', cat: 'event', type: 'purple', aud: 'parent', until: '2027-07-30', nopage: true, ext: 'https://www.elc.ac.th/summer-school/', title: 'ELC Summer Festival of the Arts, Session 2', sub: '26 to 27 and 29 to 30 Jul' },
    { date: '2027-07-28', cat: 'holiday', type: 'purple', aud: 'holiday', title: 'King Vajiralongkorn\'s Birthday Holiday', sub: '' }
  ],
  // END SHEET-OWNED: calendarEvents

  // Purple Elephant events (issue 0064). PROVISIONAL: hand-synced from the DRAFT
  // staff calendar SSOT sheet 1stE9Z9H0lH4z2VeziEUnt9fBEBn5i8Phx8Ger6yPs1g
  // (tabs 'PE Events 26' gid 181294013 + 'PE Samakee 26' gid 1433628630), parent-safe
  // filtered (staff-only dropped, no-school days rescued). The PE head confirms dates.
  // Deliberately ISOLATED from calendarEvents: tagged pe:'thonglor'|'samakee', rendered
  // only on the /purple-elephant/ microsites. NOT the coffee-morning `cohort` key.
  // BEGIN SHEET-OWNED: peEvents
  peEvents: [
    { date: '2026-08-03', cat: 'event', type: 'purple', aud: 'parent', until: '2026-08-11', pe: 'samakee', title: 'ELC Summer Festival of the Arts, Session 2', sub: 'A week of making and performing, to 11 Aug.' },
    { date: '2026-08-12', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'samakee', title: 'The Queen Mother\'s Birthday Holiday', sub: '' },
    { date: '2026-08-17', cat: 'event', type: 'purple', aud: 'parent', pe: 'samakee', title: 'Hopes and Wishes for K1 and K2', sub: '' },
    { date: '2026-08-17', cat: 'event', type: 'purple', aud: 'parent', pe: 'samakee', title: 'Meet and Greet for T1 and T2 parents', sub: 'By appointment only.' },
    { date: '2026-08-18', cat: 'event', type: 'gold', aud: 'child', pe: 'samakee', title: 'First day of school for K1 and K2', sub: '' },
    { date: '2026-08-19', cat: 'event', type: 'gold', aud: 'child', pe: 'samakee', title: 'First day of school for T1 and T2', sub: '' },
    { date: '2026-09-18', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'samakee', title: 'International Schools Holiday', sub: '' },
    { date: '2026-10-02', cat: 'event', type: 'purple', aud: 'parent', pe: 'samakee', title: 'Open Evening', sub: 'Parents only.' },
    { date: '2026-10-03', cat: 'event', type: 'purple', aud: 'parent', pe: 'samakee', title: 'Open House at PE Samakee', sub: 'For new families.' },
    { date: '2026-10-09', cat: 'event', type: 'purple', aud: 'parent', pe: 'samakee', title: 'Parent Teacher Conference', sub: 'No school for K1 and K2. Normal school day for T1 and T2.' },
    { date: '2026-10-13', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'samakee', title: 'King Rama IX Memorial Day', sub: '' },
    { date: '2026-10-19', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2026-10-23', pe: 'samakee', title: 'Holiday: October mid-term break', sub: 'to 23 Oct' },
    { date: '2026-10-23', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'samakee', title: 'King Chulalongkorn Memorial Day', sub: 'No school.' },
    { date: '2026-11-13', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'samakee', title: 'Professional Development Day', sub: 'No school for children.' },
    { date: '2026-11-24', cat: 'event', type: 'purple', aud: 'child', pe: 'samakee', title: 'Loy Krathong Celebrations', sub: '' },
    { date: '2026-12-07', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'samakee', title: 'King Rama IX Birthday and National Day', sub: 'Substitution day.' },
    { date: '2026-12-14', cat: 'event', type: 'purple', aud: 'parent', pe: 'samakee', title: 'Winter Celebration and Christmas Brunch', sub: '' },
    { date: '2026-12-18', cat: 'event', type: 'gold', aud: 'parent', pe: 'samakee', title: 'Last day of Term 1', sub: 'Early dismissal. Hometime 11:00 for T1 and T2, 11:30 for K1 and K2.' },
    { date: '2026-12-21', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2026-12-31', pe: 'samakee', title: 'Holiday: Christmas and New Year', sub: 'to 31 Dec' },
    { date: '2027-01-01', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2027-01-08', pe: 'samakee', title: 'Holiday: Christmas and New Year', sub: 'to 8 Jan' },
    { date: '2027-01-11', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'samakee', title: 'Professional Development Day', sub: 'No school for children.' },
    { date: '2027-01-12', cat: 'event', type: 'gold', aud: 'child', pe: 'samakee', title: 'Start of Term 2', sub: '' },
    { date: '2027-01-22', cat: 'event', type: 'purple', aud: 'parent', pe: 'samakee', title: 'Term 1 reports sent to parents', sub: 'K1 and K2.' },
    { date: '2027-01-29', cat: 'event', type: 'purple', aud: 'parent', pe: 'samakee', title: 'Parent Teacher Conference', sub: 'No school for children.' },
    { date: '2027-02-05', cat: 'event', type: 'purple', aud: 'child', pe: 'samakee', title: 'Samakee Celebrates Lunar New Year', sub: 'Children only.' },
    { date: '2027-02-06', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'samakee', title: 'Lunar New Year Day', sub: '' },
    { date: '2027-02-16', cat: 'athletics', type: 'purple', aud: 'child', pe: 'samakee', title: 'Fun Field Day for T1 and T2', sub: 'Children only.' },
    { date: '2027-02-18', cat: 'athletics', type: 'purple', aud: 'child', pe: 'samakee', title: 'Fun Field Day for K1 and K2', sub: 'Children only.' },
    { date: '2027-02-22', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2027-02-26', pe: 'samakee', title: 'Holiday: mid-term break', sub: 'to 26 Feb' },
    { date: '2027-02-22', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'samakee', title: 'Makha Bucha Day', sub: '' },
    { date: '2027-03-01', cat: 'event', type: 'purple', aud: 'child', nopage: true, pe: 'samakee', title: 'Festival of Literature Month', sub: 'Throughout March.' },
    { date: '2027-03-10', cat: 'event', type: 'purple', aud: 'parent', until: '2027-03-11', pe: 'samakee', title: 'Photo Session', sub: 'Children and parents.' },
    { date: '2027-03-26', cat: 'event', type: 'purple', aud: 'child', pe: 'samakee', title: 'Book Character Parade', sub: '' },
    { date: '2027-04-02', cat: 'event', type: 'purple', aud: 'child', pe: 'samakee', title: 'ELC Songkran Celebrations', sub: '' },
    { date: '2027-04-05', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2027-04-16', pe: 'samakee', title: 'Songkran Holiday', sub: 'to 16 Apr' },
    { date: '2027-04-06', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'samakee', title: 'Chakri Day', sub: '' },
    { date: '2027-04-13', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2027-04-15', pe: 'samakee', title: 'Thai New Year, Songkran', sub: 'to 15 Apr' },
    { date: '2027-05-04', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'samakee', title: 'Coronation Day', sub: '' },
    { date: '2027-05-17', cat: 'event', type: 'purple', aud: 'parent', until: '2027-05-21', pe: 'samakee', title: 'Arts Exhibition Week', sub: 'to 21 May' },
    { date: '2027-05-20', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'samakee', title: 'Visakha Bucha Day', sub: '' },
    { date: '2027-05-25', cat: 'event', type: 'purple', aud: 'parent', pe: 'samakee', title: 'Art From the Heart Art Auction Evening', sub: 'Parents only.' },
    { date: '2027-06-01', cat: 'event', type: 'purple', aud: 'parent', until: '2027-06-17', pe: 'samakee', title: 'K1 and K2 Learning Journey', sub: 'to 17 Jun' },
    { date: '2027-06-03', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'samakee', title: 'The Queen\'s Birthday', sub: 'No school.' },
    { date: '2027-06-17', cat: 'event', type: 'gold', aud: 'parent', pe: 'samakee', title: 'Last day of Term 2', sub: 'Early dismissal. Hometime 11:00 for T1 and T2, 11:30 for K1 and K2.' },
    { date: '2027-06-18', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'samakee', title: 'Professional Development Day', sub: 'No school for children.' },
    { date: '2027-06-21', cat: 'event', type: 'purple', aud: 'parent', until: '2027-06-30', pe: 'samakee', title: 'ELC Summer Festival of the Arts, Session 1', sub: 'to 30 Jun' },
    { date: '2027-07-01', cat: 'event', type: 'purple', aud: 'parent', until: '2027-07-02', pe: 'samakee', title: 'ELC Summer Festival of the Arts, Session 1', sub: 'to 2 Jul' },
    { date: '2027-07-05', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2027-07-30', pe: 'samakee', title: 'Summer holiday', sub: 'Office and accounting open.' },
    { date: '2027-07-26', cat: 'event', type: 'purple', aud: 'parent', until: '2027-07-30', pe: 'samakee', title: 'ELC Summer Festival of the Arts, Session 2', sub: 'to 30 Jul' },
    { date: '2027-07-28', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'samakee', title: 'King Vajiralongkorn\'s Birthday', sub: '' },
    { date: '2026-08-03', cat: 'event', type: 'purple', aud: 'child', until: '2026-08-14', nopage: true, ext: 'https://www.elc.ac.th/summer-school/', pe: 'thonglor', title: 'ELC Summer Festival of the Arts, Session 2', sub: 'to 14 Aug' },
    { date: '2026-08-12', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'thonglor', title: 'The Queen Mother\'s Birthday Holiday', sub: '' },
    { date: '2026-08-21', cat: 'event', type: 'purple', aud: 'parent', nopage: true, community: true, pe: 'thonglor', title: 'Meet and Greet with Parents', sub: 'PE 39, 49 and 55' },
    { date: '2026-08-24', cat: 'event', type: 'gold', aud: 'child', nopage: true, pe: 'thonglor', title: 'Start of Term 1', sub: '' },
    { date: '2026-09-18', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'thonglor', title: 'International Schools Holiday', sub: '' },
    { date: '2026-09-23', cat: 'event', type: 'purple', aud: 'parent', nopage: true, pe: 'thonglor', title: 'PE Open House', sub: '' },
    { date: '2026-09-29', cat: 'event', type: 'purple', aud: 'parent', until: '2026-09-30', nopage: true, pe: 'thonglor', title: 'Building Bridges: Information Session and Tours at TCS', sub: '29 and 30 Sep' },
    { date: '2026-10-02', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'thonglor', title: 'Professional Development Day', sub: 'No school for children' },
    { date: '2026-10-12', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2026-10-16', pe: 'thonglor', title: 'Holiday: ELC October mid-term break', sub: 'to 16 Oct' },
    { date: '2026-10-19', cat: 'event', type: 'purple', aud: 'parent', nopage: true, pe: 'thonglor', title: 'K1 Project Share at PE Campuses with Chiara', sub: '' },
    { date: '2026-10-23', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'thonglor', title: 'King Chulalongkorn Memorial Day', sub: 'No school' },
    { date: '2026-11-10', cat: 'event', type: 'purple', aud: 'parent', nopage: true, pe: 'thonglor', title: 'Atelier Experiences at PE 55', sub: '' },
    { date: '2026-11-12', cat: 'event', type: 'purple', aud: 'parent', nopage: true, pe: 'thonglor', title: 'Atelier Experiences at PE 39', sub: '' },
    { date: '2026-11-17', cat: 'event', type: 'purple', aud: 'parent', until: '2026-11-19', nopage: true, pe: 'thonglor', title: 'Atelier Experiences at PE 49', sub: '17 and 19 Nov' },
    { date: '2026-11-25', cat: 'event', type: 'purple', aud: 'child', nopage: true, pe: 'thonglor', title: 'Loy Krathong Celebrations', sub: '' },
    { date: '2026-12-07', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'thonglor', title: 'King Rama IX Birthday and National Day Substitution Holiday', sub: '' },
    { date: '2026-12-15', cat: 'event', type: 'purple', aud: 'child', nopage: true, community: true, pe: 'thonglor', title: 'PE 39 Christmas Party', sub: '' },
    { date: '2026-12-16', cat: 'event', type: 'purple', aud: 'child', nopage: true, community: true, pe: 'thonglor', title: 'PE 49 Christmas Party', sub: '' },
    { date: '2026-12-17', cat: 'event', type: 'purple', aud: 'child', nopage: true, community: true, pe: 'thonglor', title: 'PE 55 Christmas Party', sub: '' },
    { date: '2026-12-21', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2026-12-31', pe: 'thonglor', title: 'Holiday: Christmas and New Year', sub: 'to 31 Dec' },
    { date: '2027-01-01', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2027-01-08', pe: 'thonglor', title: 'Holiday: Christmas and New Year', sub: 'to 8 Jan' },
    { date: '2027-01-11', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'thonglor', title: 'Professional Development Day', sub: 'No school for children' },
    { date: '2027-01-12', cat: 'event', type: 'gold', aud: 'child', nopage: true, pe: 'thonglor', title: 'Start of Term 2', sub: '' },
    { date: '2027-01-27', cat: 'event', type: 'purple', aud: 'parent', nopage: true, pe: 'thonglor', title: 'PE Open House', sub: '' },
    { date: '2027-02-22', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2027-02-26', pe: 'thonglor', title: 'Holiday: ELC February mid-term break', sub: 'to 26 Feb' },
    { date: '2027-03-19', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'thonglor', title: 'Professional Development Day', sub: 'No school for children' },
    { date: '2027-03-22', cat: 'event', type: 'purple', aud: 'parent', nopage: true, pe: 'thonglor', title: 'Compass Initiatives: transitions to K1', sub: 'In the Atrium' },
    { date: '2027-04-02', cat: 'event', type: 'purple', aud: 'child', nopage: true, pe: 'thonglor', title: 'ELC Songkran Celebrations', sub: '' },
    { date: '2027-04-05', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2027-04-16', pe: 'thonglor', title: 'Songkran Holiday', sub: 'to 16 Apr' },
    { date: '2027-04-13', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2027-04-15', pe: 'thonglor', title: 'Thai New Year: Songkran', sub: 'to 15 Apr' },
    { date: '2027-04-26', cat: 'event', type: 'purple', aud: 'parent', nopage: true, pe: 'thonglor', title: 'New Families and PE Families to ELC', sub: 'Afternoon K1 session' },
    { date: '2027-05-04', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'thonglor', title: 'Coronation Day Holiday', sub: '' },
    { date: '2027-05-08', cat: 'event', type: 'purple', aud: 'parent', nopage: true, pe: 'thonglor', title: 'PE Open House', sub: '' },
    { date: '2027-05-10', cat: 'event', type: 'purple', aud: 'parent', nopage: true, pe: 'thonglor', title: 'New Families and PE Families to ELC', sub: 'Afternoon K1 session' },
    { date: '2027-05-18', cat: 'event', type: 'purple', aud: 'parent', nopage: true, pe: 'thonglor', title: 'T1 Family Tours at The City School', sub: '' },
    { date: '2027-05-20', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'thonglor', title: 'Visakha Bucha Holiday', sub: '' },
    { date: '2027-05-29', cat: 'event', type: 'purple', aud: 'parent', nopage: true, community: true, pe: 'thonglor', title: 'Art Auction', sub: 'Location TBD' },
    { date: '2027-06-03', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'thonglor', title: 'The Queen\'s Birthday', sub: 'No School' },
    { date: '2027-06-17', cat: 'event', type: 'gold', aud: 'child', nopage: true, pe: 'thonglor', title: 'Last day of School Year', sub: '' },
    { date: '2027-06-18', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'thonglor', title: 'Teacher In-Service Day', sub: 'No school for children' },
    { date: '2027-06-21', cat: 'event', type: 'purple', aud: 'child', until: '2027-06-30', nopage: true, ext: 'https://www.elc.ac.th/summer-school/', pe: 'thonglor', title: 'ELC Summer Festival of the Arts, Session 1', sub: 'to 30 Jun' },
    { date: '2027-07-01', cat: 'event', type: 'purple', aud: 'child', until: '2027-07-09', nopage: true, ext: 'https://www.elc.ac.th/summer-school/', pe: 'thonglor', title: 'ELC Summer Festival of the Arts, Session 1', sub: 'to 9 Jul' },
    { date: '2027-07-12', cat: 'holiday', type: 'purple', aud: 'holiday', until: '2027-07-23', pe: 'thonglor', title: 'Holiday: Office and Accounting open', sub: 'to 23 Jul' },
    { date: '2027-07-26', cat: 'event', type: 'purple', aud: 'child', until: '2027-07-30', nopage: true, ext: 'https://www.elc.ac.th/summer-school/', pe: 'thonglor', title: 'ELC Summer Festival of the Arts, Session 2', sub: '26 to 30 Jul' },
    { date: '2027-07-28', cat: 'holiday', type: 'purple', aud: 'holiday', pe: 'thonglor', title: 'King Vajiralongkorn\'s Birthday Holiday', sub: '' }
  ],
  // END SHEET-OWNED: peEvents

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
    // CALENDAR ROWS REMOVED 2026-08-04 (Trevor, walking the policies hub per 0084). Four
    // rows went: 'Term dates and calendar' pointing at ../calendar/, plus the three
    // official WordPress academic-year calendars (City, PE 39/49/55, PE Samakee).
    // Policies is the document hub; the calendar has its own nav item AND tabbar tab on
    // every page, so the internal row was a third route to a place already two taps away.
    // The three external ones also sat beside the portal's own calendar offering families
    // a choice of calendars with no way to tell which is current, and the portal's is the
    // sheet-fed one (0046: sheet stays planning SSOT, portal publishes). Restoring is
    // re-adding these rows; the WordPress pages are untouched and still live.
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
