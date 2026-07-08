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

  // Joint leadership note rotation (issue 0007; drafts docs/content/hos-notes-2026-08.md).
  // render.js shows the latest note whose `from` <= today (Bangkok). Payal's read pending;
  // the sample chip in index.html stays until she blesses the copy.
  notes: [
    { from: '2026-07-01', eyebrow: 'A note from Payal and Trevor', when: 'This month · August',
      title: 'Welcome to a new year.',
      body: 'This portal is the one place for everything your family does with ELC beyond the classroom: the week ahead, the calendar, sign-ups, and every policy and form. It is new, and it will grow. Tell us what is missing with the feedback button, and we will build it.',
      sig: 'Payal, Head of School · Trevor, Head of Operations and Educational Experience' },
    { from: '2026-08-10', eyebrow: 'A note from Payal and Trevor', when: 'This week',
      title: 'We start with your hopes.',
      body: 'This week your child\'s teachers sit down with you for Hopes and Wishes: what you want this year to hold for your child, in your words. It is our favourite way to begin. Everything else on this page can wait until you have booked your time.',
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

  // Real documents from the policies registry (docs/sources/policies-registry.md,
  // sheet 1J5J8xNhre5N3mr88vLSlSKUK_efVJ6rb6pq8zdRca9Q). Rule: admissions and fee
  // documents NEVER surface on the portal (Trevor, 2026-07-08). Sizes from live
  // HEAD checks 2026-07-08. href:null = no real document yet; render honest, never href="#".
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
    { group: 'Activities', name: 'Activity terms and conditions', sub: 'Booking, places and what happens if plans change.', kind: 'PDF', tag: null, href: null }
  ]
};
