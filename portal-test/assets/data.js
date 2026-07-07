/* ELC Portal: volatile content. One edit here updates every surface.
   Pages render these islands via assets/render.js. Statuses are honest
   (rule 6): football live, the rest open 7 Sep. */
window.PORTAL = {
  version: 'v0.2',
  term: 'Term 1',

  // PLACEHOLDER pending PRD 0002 F1 (real week shape from Trevor)
  week: [
    { dow: 'TUE', date: 7,  title: 'Term 1 activity registration opens', today: true },
    { dow: 'THU', date: 9,  title: 'Football trials, Years 3 to 6, 15:30' },
    { dow: 'FRI', date: 10, title: 'Armonia open studio, 17:00' }
  ],

  // Honest sport statuses (PRD 0002 F2 confirmed truth as of 2026-07-07)
  sports: [
    { name: 'Football',   status: 'open', label: 'Open now' },
    { name: 'Basketball', status: 'soon', label: 'Opens 7 Sep' },
    { name: 'Cricket',    status: 'soon', label: 'Opens 7 Sep' },
    { name: 'Swimming',   status: 'soon', label: 'Opens 7 Sep' }
  ],
  sportNote: 'Parent info evening 20 Aug. Sign-up opens 7 Sep.',

  // PLACEHOLDER pending PRD 0002 F4 (calendar source of truth, Sarah/Neung)
  calendarEvents: [
    { date: '2026-07-07', type: 'purple', title: 'Term 1 activity registration opens', sub: 'Portal · all families' },
    { date: '2026-07-09', type: 'purple', title: 'Football trials',                    sub: '15:30 · The Dove pitch' },
    { date: '2026-07-10', type: 'purple', title: 'Armonia open studio',                sub: '17:00 · Music room' },
    { date: '2026-07-14', type: 'gold',   title: 'Swimming season announced',          sub: 'All years' },
    { date: '2026-07-17', type: 'purple', title: 'FotA welcome morning',               sub: '08:30 · Courtyard' },
    { date: '2026-07-24', type: 'gold',   title: 'Community open day',                 sub: '10:00 · The Dove' }
  ],

  // PLACEHOLDER pending PRD 0002 F5 (real policy documents, issue 0016).
  // href:null = no real document yet; render as honest placeholder, never href="#".
  docs: [
    { group: 'Start here', name: 'Parent handbook, 2026/27', sub: 'How the school runs, from the day to the year. The one to read first.', kind: 'PDF', tag: 'PDF · 1.2 MB', href: null },
    { group: 'Start here', name: 'Term dates and calendar', sub: 'Every term, break and key date for the year ahead.', kind: 'LINK', tag: 'View', href: '../calendar/' },
    { group: 'Start here', name: 'Code of conduct', sub: 'What we expect, of children and of the adults around them.', kind: 'PDF', tag: 'PDF · 320 KB', href: null },
    // PLACEHOLDER pending PRD 0002 F5: 'Due 31 Jul' is the package's sample date, unconfirmed
    { group: 'Health and safety', name: 'Medical and consent form', sub: 'Complete once a year, per child. Required before activities begin.', kind: 'FORM', due: 'Due 31 Jul', href: null },
    { group: 'Health and safety', name: 'Safeguarding and child protection', sub: 'Our commitment, and who to speak to if something is not right.', kind: 'PDF', tag: 'PDF · 480 KB', href: null },
    { group: 'Health and safety', name: 'Medication and allergy policy', sub: 'How we hold, record and give medication, and manage dietary needs.', kind: 'PDF', tag: 'PDF · 260 KB', href: null },
    { group: 'Everyday', name: 'Uniform and kit list', sub: 'What to wear and bring, for the classroom and the court.', kind: 'PDF', tag: 'PDF · 540 KB', href: null },
    { group: 'Everyday', name: 'Attendance and absence', sub: 'How to report an absence, and how we follow up.', kind: 'PDF', tag: 'PDF · 180 KB', href: null },
    { group: 'Everyday', name: 'Data privacy and photography', sub: 'How we handle your family\'s information and images.', kind: 'PDF', tag: 'PDF · 210 KB', href: null },
    { group: 'Activities and fees', name: 'Activity terms and conditions', sub: 'Booking, places and what happens if plans change.', kind: 'PDF', tag: 'PDF · 200 KB', href: null },
    { group: 'Activities and fees', name: 'Fees, refunds and cancellations', sub: 'What is charged, when, and how refunds work.', kind: 'PDF', tag: 'PDF · 190 KB', href: null }
  ]
};
