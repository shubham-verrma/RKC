/* ==========================================================================
   Events data — single source of truth for the Upcoming Events page.

   To add an event, append an object to the EVENTS array below. Shape:
   {
     title:        string — event name
     date:         string — ISO date "YYYY-MM-DD" (drives the upcoming/past
                            split: date >= today → Upcoming, else Past)
     time:         string — human-readable, e.g. "6:00 PM – 8:00 PM IST"
     mode:         string — "Online" | "Offline"
     access:       string — "public" | "gaps"
                            "public" → open registration, Register button
                            "gaps"   → GAPS members only, renders locked
                                       (gold lock, masked details, no link)
     description:  string — one or two sentences
     registerUrl:  string — registration link (public events)
     recordingUrl: string — OPTIONAL; past public events show a muted
                            "Watch recording" link if present
     thumbnail:    string — image path. Real photos live in media/images/
                            as event1.jpg … event9.JPG — extensions are
                            MIXED CASE and case-sensitive; copy exactly.
   }

   Order in this array does not matter — main.js sorts events by date.
   ========================================================================== */

/* --------------------------------------------------------------------------
   PAST EVENTS — drives the "Past" card grid on events.html.
   Add an event by appending an object here (newest first is the display
   order); never edit the HTML. Shape:
   {
     title:       string  — event name
     tagline:     string  — short line under the title
     date:        string  — human-readable, e.g. "18 July 2026"
     venue:       string  — e.g. "The Camellias Club, Gurugram"
     access:      string  — e.g. "By invitation only"
     membersOnly: boolean — true → gold "Exclusively for GAPS Members"
                            lock badge on the card
     cover:       string  — image path under media/past-events/ (16:9
                            crop looks best). If the file is missing,
                            the card falls back to placeholder.png in
                            the same folder — never a broken image. For
                            a future entry with no photo yet, you can
                            also set cover to
                            "media/past-events/placeholder.png" directly.
     summary:     string  — 2–3 lines describing the event
   }
   -------------------------------------------------------------------------- */
export const PAST_EVENTS = [
  // Rendered NEWEST-FIRST by date (sorted at render — array order here
  // doesn't matter). Every entry currently membersOnly: true.
  // `mode` ("Online"|"Offline") joins date + venue in the cover strip.
  {
    title: "The Opportunity Exchange",
    tagline: "Industry-ready technologies, from lab to factory floor.",
    date: "18 July 2026", venue: "The Camellias Club, Gurugram",
    mode: "Offline", access: "By invitation only", membersOnly: true,
    cover: "media/past-events/opportunity-exchange.png",
    summary: "Validated technologies from Panjab University, IIT Ropar, CSIR-CSIO and leading startups, presented to entrepreneurs who could commercialise them through transfer fees, royalties or joint ventures. Fifty seats, strictly by invitation.",
  },
  {
    title: "2nd National Conclave on Environmental Services",
    tagline: "Green business, exports and the India-EU FTA opportunity.",
    date: "3 July 2026", venue: "Constitution Club of India, New Delhi",
    mode: "Offline", access: "Members access", membersOnly: true,
    cover: "media/past-events/environmental-services.png",
    summary: "SEPC, under the Ministry of Commerce & Industry, convened industry and policymakers on EV, solar, BESS, carbon credits and climate finance. GAPS members from Delhi NCR joined, with a special showcase of women-led export initiatives.",
  },
  {
    title: "Special Session: India-Russia Trade Opportunities",
    tagline: "Exports, buyer connect, supply chain and banking support.",
    date: "16 June 2026", venue: "Park Plaza, Sector 21-C, Faridabad",
    mode: "Offline", access: "Members only", membersOnly: true,
    cover: "media/past-events/india-russia-trade.png",
    summary: "A working session on the Russian market for Indian manufacturers and exporters: buyer connections, reliable supply chains, the rupee-rouble settlement mechanism, export banking support and documentation.",
  },
  {
    title: "Inaugural BRICS MSME Forum 2026",
    tagline: "India's BRICS Chairship year — a seat at the table.",
    date: "19 June 2026", venue: "Taj Hotel & Convention Centre, Agra",
    mode: "Offline", access: "By nomination", membersOnly: true,
    cover: "media/past-events/brics-msme-forum.png",
    summary: "The Ministry of MSME hosted the inaugural BRICS MSME Forum under India's Chairship. GAPS was invited to nominate a small number of credible entrepreneurs to join delegates from BRICS member and partner countries on finance, technology access and sustainability.",
  },
  {
    title: "World MSME Day with Zee Business",
    tagline: "Fifteen members in the room with India's iconic founders.",
    date: "14 June 2026", venue: "Intimo, The Camellias Club, Gurugram",
    mode: "Offline", access: "15 seats only", membersOnly: true,
    cover: "media/past-events/world-msme-day.png",
    summary: "Zee Business and IamSMEofIndia curated a televised conversation with first-generation founders including Aman Gupta (boAt), Ram Aggarwal (V2 Retail), Swati Bhargava (CashKaro), Neeruu Singhal (Prekies) and Mohit Sadani (The Mom's Co.). Fifteen members joined the live recording as participants, not audience.",
  },
  {
    title: "From Local to Global",
    tagline: "Digital commerce for women entrepreneurs.",
    date: "22 June 2026", venue: "Online",
    mode: "Online", access: "Members access", membersOnly: true,
    cover: "media/past-events/local-to-global.png",
    summary: "A virtual workshop with WENeurs and Amazon Saheli on selling online: wider market reach, low-cost growth, digital marketing, payments and delivery. Built for women entrepreneurs, startups, SHGs and artisans.",
  },
  {
    title: "Roundtable: IE2 to IE3 Motor Transition",
    tagline: "Manufacturers, face to face with the policymakers.",
    date: "29 May 2026", venue: "Jaypee Hotel, Vasant Vihar, New Delhi",
    mode: "Offline", access: "Members only", membersOnly: true,
    cover: "media/past-events/motor-roundtable.png",
    summary: "Motor manufacturers raised cost escalation, technology upgrades, testing readiness and implementation timelines directly with the Director General of BEE, the Director (S&L) BEE, CLASP and Rajiv K Chawla. Policy shaped by industry reality, not boardroom assumption.",
  },
  {
    title: "The New Income Tax Rules",
    tagline: "The 1962 rules are gone. What changed from 1 April 2026.",
    date: "28 May 2026", venue: "Zoom Live",
    mode: "Online", access: "Members only", membersOnly: true,
    cover: "media/past-events/new-income-tax.png",
    summary: "CA Sangeet Kr. Gupta on the new compliance framework: digital audit trails, AI-based scrutiny, AIS versus books mismatch risk, Sec 43B(h), Sec 80JJAA benefits, salary structuring and how to reply on the faceless portal.",
  },
  {
    title: "Protecting Your Business from GST Notices",
    tagline: "KYC, documentation and fake invoice-ITC risk.",
    date: "15 May 2026", venue: "Online",
    mode: "Online", access: "Members only", membersOnly: true,
    cover: "media/past-events/gst-notices.png",
    summary: "With GST scrutiny rising, CA Rajesh Kumar Khandelwal (CPA, CS, LLB, NACIN faculty, 500+ GST lectures) walked members through what triggers a notice and how to be ready before one lands.",
  },
  {
    title: "National Conference on Manufacturing Excellence",
    tagline: "Building world-class manufacturing capabilities for tomorrow.",
    date: "12 May 2026", venue: "PHD House, New Delhi",
    mode: "Offline", access: "Members access", membersOnly: true,
    cover: "media/past-events/manufacturing-excellence.png",
    summary: "Shri Bhupathiraju Srinivasa Varma, Minister of State for Heavy Industries, was Chief Guest. Sessions covered Design for Manufacturing, value engineering, and Industry 4.0 — AI, IoT, CAD/CAM/CAE and low-cost automation, with smart factory case studies.",
  },
  {
    title: "360-Degree Business Automation for MSMEs",
    tagline: "Powered by SALTWORX.",
    date: "16 April 2026", venue: "Zoom Live",
    mode: "Online", access: "Members only", membersOnly: true,
    cover: "media/past-events/saltworx-automation.png",
    summary: "An exclusive session on affordable, scalable automation for growing businesses: unlimited users, subscription pricing, and practical digital transformation tools, with success stories from Indian SMEs.",
  },
  {
    title: "High Level Committee on Ease of Doing Business",
    tagline: "Heavy industries and defence sector compliance.",
    date: "1 April 2026", venue: "New Delhi",
    mode: "Offline", access: "By nomination", membersOnly: true,
    cover: "media/past-events/ease-of-doing-business.png",
    summary: "The Government of India's High Level Committee convened on easing compliance across fifteen Acts spanning environment, pollution control, mining, industries, BIS, foreign trade, companies, electricity and SEZ law. Members were invited to submit constructive suggestions.",
  },
  {
    title: "Master the GeM Portal",
    tagline: "Government procurement, from registration to winning bids.",
    date: "27 March 2026", venue: "Online",
    mode: "Online", access: "Members only", membersOnly: true,
    cover: "media/past-events/gem-portal.png",
    summary: "Sahil Sharma, senior GeM trainer with 200+ sessions delivered to State and Central departments, covered seller registration, what evaluators look for in vendor assessment, and how to find and win bids.",
  },
  {
    title: "From Lab to Factory Floor",
    tagline: "Newly developed technologies, ready for transfer.",
    date: "17 March 2026", venue: "Park Plaza, Sector 21-C, Faridabad",
    mode: "Offline", access: "Members only", membersOnly: true,
    cover: "media/past-events/lab-to-factory.png",
    summary: "Technologies from Panjab University, IIT Ropar, CSIR-CSIO and tech startups across AI, Industry 4.0, CNC IoT, water tech, recycling, automation and medical devices, presented to members exploring diversification or new projects.",
  },
  {
    title: "Securing Your Business Legacy",
    tagline: "Succession planning for entrepreneurs.",
    date: "11 March 2026", venue: "Online",
    mode: "Online", access: "Members only", membersOnly: true,
    cover: "media/past-events/succession-planning.png",
    summary: "Rajiv K Chawla on the question every business must eventually answer: what happens after you. Real case studies from Indian business families, structuring ownership for the next generation, and avoiding the conflicts that break family businesses.",
  },
  {
    title: "Decode & Strengthen Your Balance Sheet",
    tagline: "The document banks use to decide whether to fund you.",
    date: "26 February 2026", venue: "Online",
    mode: "Online", access: "Members only", membersOnly: true,
    cover: "media/past-events/balance-sheet.png",
    summary: "CA Sangeet Gupta on reading your provisional data before the financial year closes: identifying gaps, taking corrective action, and building a balance sheet that earns better funding at lower rates.",
  },
];

export const EVENTS = [
  /* ---- TBA sessions (tba: true) — always render in Upcoming, no date
     needed, no Register button. Shape:
     { title, tagline, dateLabel, mode ("Online"|"Offline"),
       access: "gaps", tba: true, cover } ---- */
  {
    title: "Monthly Masterclass",
    tagline: "A working session on one gap — schemes, structure, capital or growth.",
    dateLabel: "Date to be announced",
    mode: "Online",
    access: "public",   // open session — Register CTA, no members lock
    tba: true,
    registerUrl: "#", // TODO: real registration link to follow
    cover: "media/upcoming/upcoming-tba.png",
  },
  {
    title: "In-Person Members Meet",
    tagline: "Owners from across India in one room, twice a quarter.",
    dateLabel: "Date and venue to be announced",
    mode: "Offline",
    access: "gaps",
    tba: true,
    cover: "media/upcoming/upcoming-tba.png",
  },
  {
    title: "Expert Panel Roundtable",
    tagline: "Direct access to the counsels — tax, GST, subsidy, legal and growth.",
    dateLabel: "Date to be announced",
    mode: "Online",
    access: "gaps",
    tba: true,
    cover: "media/upcoming/upcoming-tba.png",
  },

  /* ---- Real dated events go here when dates are fixed, using the
     dated shape documented at the top of this file. The date split
     (upcoming vs past) applies to them automatically; tba entries
     always stay in Upcoming regardless. ---- */
  {
    title: "Indian MSMEs and Sustainability in the Global Supply Chain",
    date: "2026-08-13",
    time: "11:00 AM – 1:00 PM IST",
    mode: "Offline",
    venue: "Hotel Trident, BKC, Mumbai",
    access: "gaps",
    description: "UN Global Compact Network India convenes industry leaders, policymakers and MSMEs on strengthening India's position in global supply chains. A highlight is the signing of an MoU between UN GCNI and IamSMEofIndia. Seats limited — Mumbai region members encouraged to attend.",
    registerUrl: "#", // TODO: real registration link to follow
    cover: "media/past-events/un-gcni-mumbai.png",
  },
  {
    title: "Ministry of MSME Delegation to Taiwan",
    date: "2026-08-18",
    time: "18–21 August 2026",
    mode: "Offline",
    venue: "Taipei, Taiwan",
    access: "gaps",
    description: "An NSIC-led delegation of Indian MSMEs in smart manufacturing and AI. Includes Automation Taipei 2026, visits to technology parks, the 5th India-Taiwan SME Cooperation Forum, and B2B matchmaking. Selected participants are eligible for economy airfare reimbursement and USD 150/day allowance under the Ministry's IC Scheme.",
    registerUrl: "#", // TODO: real registration link to follow
    cover: "media/past-events/taiwan-delegation.png",
  },
];
