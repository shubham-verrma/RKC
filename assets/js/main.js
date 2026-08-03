/* ==========================================================================
   Rajiv K Chawla — shared site script
   Loaded as an ES module on every page. Handles:
     1. js-ready stamp + motion gate (reduced motion / missing CDN)
     2. Lenis smooth scroll wired to GSAP ScrollTrigger
     3. Reusable ".reveal" scroll-reveal
     4. Hero entrance choreography + parallax (index.html)
     5. Sticky header state
     6. Mobile overlay menu
     7. Footer copyright year
     8. Events helper (splitEvents) — consumed by the events page later

   GSAP + ScrollTrigger + Lenis are loaded globally via CDN <script> tags
   before this module, so they are available as window globals here.
   ========================================================================== */

import { EVENTS, PAST_EVENTS } from "./events.js";

/* --------------------------------------------------------------------------
   1. js-ready stamp + motion gate
   CSS applies animation initial states (hiding .reveal, hero lines, the
   portrait mask, etc.) ONLY under html.js-ready. Stamp it first thing so
   those states are in place before first paint and nothing flashes.
   -------------------------------------------------------------------------- */
document.documentElement.classList.add("js-ready");

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* Single gate for all animation work: user preference AND every CDN
   dependency must be satisfied, otherwise we animate nothing. */
const motionOK =
  !prefersReducedMotion && !!(window.gsap && window.ScrollTrigger && window.Lenis);

if (prefersReducedMotion) {
  document.documentElement.classList.add("no-motion");
}

/* Critical fail-safe: if we won't be animating (reduced motion, or a CDN
   script failed to load), drop js-ready so the CSS initial states never
   apply and the page renders fully visible and static. No blank pages. */
if (!motionOK) {
  document.documentElement.classList.remove("js-ready");
}

/* --------------------------------------------------------------------------
   2. GSAP + Lenis smooth scroll
   Lenis virtualises scrolling, so ScrollTrigger must be told about every
   scroll frame (lenis.on("scroll", ScrollTrigger.update)) — without that
   hook ScrollTrigger never updates and nothing animates on scroll.
   Lenis is driven from GSAP's ticker so both share one rAF loop.
   -------------------------------------------------------------------------- */
let lenis = null;

if (motionOK) {
  gsap.registerPlugin(ScrollTrigger);

  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* --------------------------------------------------------------------------
   3. Scroll-reveal
   Any element with class "reveal" fades up 24px when it enters the
   viewport (start "top 85%"). Elements sharing a parent are grouped and
   staggered 0.08s so grids and lists animate as a set.
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  if (!motionOK) return;

  const revealEls = document.querySelectorAll(".reveal");
  if (!revealEls.length) return;

  // Group .reveal elements by their parent so siblings stagger together.
  const groups = new Map();
  revealEls.forEach((el) => {
    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(el);
  });

  groups.forEach((els) => {
    /* Event-card grids get a subtle scale-from-0.98 on top of the
       fade-up; everything else reveals flat (scale 1 → no-op). */
    const withScale = !!els[0].closest(".pe-grid, .events-grid");
    gsap.fromTo(
      els,
      { opacity: 0, y: 24, scale: withScale ? 0.98 : 1 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: els[0],
          start: "top 85%",
          once: true, // reveal once, don't replay on scroll-up
          /* Failsafe: once this group's trigger has fired, guarantee
             visibility shortly after the tween should have finished —
             if the tween errored or was killed, the CSS override
             (.reveal-force, !important) unhides the group anyway. */
          onEnter: () =>
            setTimeout(
              () => els.forEach((el) => el.classList.add("reveal-force")),
              1600
            ),
        },
      }
    );
  });
}

/* --------------------------------------------------------------------------
   4. Hero choreography (index.html)
   The signature moment. On-load timeline, all power4.out — slow, weighted,
   confident:
     1. Portrait wipes in via clip-path (bottom inset 100% → 0) over 1s
        while the photo settles from scale 1.06 → 1.0. Starts first.
     2. Headline lines mask-reveal: yPercent 110 → 0, 0.9s, stagger 0.09,
        starting 0.2s in.
     3. Eyebrow, subline, CTAs, stats fade up, stagger 0.08, once the
        headline is underway.
   Then on scroll: the portrait drifts up slower than the page (yPercent
   -10, scrubbed) and the navy orb drifts slightly for depth.
   Initial states live in CSS under html.js-ready, so the sequence starts
   from a stable first paint (no flash of the final state).
   -------------------------------------------------------------------------- */
function initHero() {
  const hero = document.querySelector(".hero");
  if (!hero || !motionOK) return;

  const mask = hero.querySelector(".hero__portrait-mask");
  const portrait = hero.querySelector(".hero__portrait");
  const lines = hero.querySelectorAll(".hero-line__inner");
  const fadeEls = hero.querySelectorAll("[data-hero-fade]");
  const media = hero.querySelector(".hero__media");
  const glow = hero.querySelector(".hero__glow");

  // Diagnostic: 0 here means the mask-reveal markup is gone and the
  // headline tween has nothing to animate.
  console.log("hero lines found:", lines.length);

  /* FAILSAFE (registered before anything can throw): if, 2s from now,
     any hero element is still in its CSS-hidden state — tween errored,
     fonts hung, anything — force the whole hero visible via the
     .hero-failsafe CSS override. The headline must never stay blank. */
  setTimeout(() => hero.classList.add("hero-failsafe"), 2000);

  const startHero = () => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    // 1. Portrait: clip-path wipe + scale settle, from t=0
    if (mask && portrait) {
      tl.fromTo(
        mask,
        { clipPath: "inset(0% 0% 100% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1 },
        0
      );
      tl.fromTo(portrait, { scale: 1.06 }, { scale: 1, duration: 1 }, 0);
    }

    /* 2. Headline: line-by-line mask reveal, from t=0.2.
       CRITICAL: y:0 must be set explicitly. The CSS hidden state is
       translateY(110%), which GSAP parses as a PIXEL y offset — it
       lives on a separate channel from yPercent, so animating yPercent
       alone leaves that pixel offset in place and the lines end
       "revealed" yet still shifted below their masks (invisible). */
    tl.fromTo(
      lines,
      { yPercent: 110, y: 0 },
      { yPercent: 0, y: 0, duration: 0.9, stagger: 0.09 },
      0.2
    );

    // 3. Supporting elements: fade up once the headline is underway
    tl.fromTo(
      fadeEls,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 },
      0.55
    );

    return tl;
  };

  /* Run the entrance after fonts are ready so line heights are final
     (a swapped font mid-tween changes the 110% offset), then refresh
     ScrollTrigger against the settled layout. Falls back to running
     immediately if the Font Loading API is unavailable. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      startHero();
      ScrollTrigger.refresh();
    });
  } else {
    startHero();
  }

  // Scroll parallax: portrait moves up slower than the page
  if (media) {
    gsap.to(media, {
      yPercent: -10,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  // Decorative glow drifts on its own rate — subtle depth, nothing more
  if (glow) {
    gsap.to(glow, {
      yPercent: 20,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }
}

/* --------------------------------------------------------------------------
   4b. GAPS page visuals
   Two scroll-in behaviours, both fail-safe:
   - [data-diagram] elements (hub-and-spoke, maths panel) get .diagram-in
     when they enter the viewport; CSS transitions draw the spokes /
     strikethrough. Hidden initial states exist only under
     html.js-ready:not(.no-motion), so no JS / reduced motion renders
     everything fully drawn.
   - [data-countup] numbers animate 0 → data-countup (Indian-format) on
     scroll-in. The markup already contains the final value as text, so
     without JS the real number simply shows.
   -------------------------------------------------------------------------- */
function initGapsVisuals() {
  const diagrams = document.querySelectorAll("[data-diagram]");
  const counters = document.querySelectorAll("[data-countup]");
  if (!diagrams.length && !counters.length) return;
  if (!motionOK) return; // static markup/CSS fallbacks apply

  diagrams.forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => el.classList.add("diagram-in"),
    });
  });

  counters.forEach((el) => {
    const target = parseInt(el.dataset.countup, 10);
    if (Number.isNaN(target)) return;
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";

    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => {
        const state = { v: 0 };
        gsap.to(state, {
          v: target,
          duration: 1.4,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent =
              prefix + Math.round(state.v).toLocaleString("en-IN") + suffix;
          },
        });
      },
    });
  });
}

/* --------------------------------------------------------------------------
   5. Sticky header
   Two states, both class-toggled (styling lives in CSS):
     .is-scrolled   — after 80px the transparent header gains a solid bar.
     .is-over-dark  — the header is currently floating over a
                      .section--dark section, so its text flips light
                      (and the scrolled bar flips dark) for contrast.
   Detection samples the section under the header's vertical midpoint on
   every scroll/resize. Plain scroll listener on purpose — NOT GSAP — so
   header contrast keeps working even if the animation CDNs fail.
   -------------------------------------------------------------------------- */
function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const darkSections = document.querySelectorAll(".section--dark");

  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 80);

    if (darkSections.length) {
      const band = (header.offsetHeight || 80) * 0.5; // sample mid-header
      const overDark = [...darkSections].some((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= band && r.bottom > band;
      });
      header.classList.toggle("is-over-dark", overDark);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll(); // set correct state on load (e.g. page restored mid-scroll)
}

/* --------------------------------------------------------------------------
   6. Mobile overlay menu
   Hamburger toggles a full-screen overlay. With motion enabled the overlay
   fades in and links stagger up via GSAP; otherwise it simply appears.
   Scrolling is locked while the menu is open.
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".mobile-menu");
  if (!toggle || !menu) {
    // Diagnostic: if this warns, the markup is missing/renamed — the
    // listener never bound and taps can't do anything.
    console.warn("[menu] nav-toggle or mobile-menu not found — listener not bound");
    return;
  }

  // Every anchor in the overlay closes it (links, CTAs, back-link)
  const items = menu.querySelectorAll("a");
  // Optional explicit × inside the overlay (index + gaps). When present
  // it takes over as the close control and the header's hamburger-X is
  // hidden while open; pages without it keep the hamburger-X.
  const closeBtn = menu.querySelector(".mobile-menu__close");
  let isOpen = false;

  /* Open/close is NEVER motion-gated: the .is-open class drives the
     overlay via CSS (opacity/visibility transition), so the menu works
     even if GSAP/Lenis fail to load. GSAP only layers the optional link
     stagger on top when motion is available. */
  const openMenu = () => {
    isOpen = true;
    toggle.setAttribute("aria-expanded", "true");
    menu.classList.add("is-open");
    if (closeBtn) toggle.classList.add("nav-toggle--replaced");
    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden"; // lock page scroll

    if (motionOK) {
      gsap.fromTo(
        items,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.07, delay: 0.1, clearProps: "all" }
      );
    }
  };

  const closeMenu = () => {
    isOpen = false;
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open"); // CSS fades it out
    toggle.classList.remove("nav-toggle--replaced");
    if (lenis) lenis.start();
    document.body.style.overflow = ""; // unlock page scroll
  };

  if (closeBtn) closeBtn.addEventListener("click", () => closeMenu());

  toggle.addEventListener("click", () => {
    /* Diagnostic: if this line logs on tap but the menu doesn't appear,
       the fault is the CSS open state (class mismatch / no visible
       .is-open rule). If it does NOT log, the tap is being blocked
       before the button (stacking/pointer-events) or the module never
       loaded (check for the boot logs / serve over http, not file://). */
    console.log("nav-toggle tapped");
    isOpen ? closeMenu() : openMenu();
  });

  /* Tapping any overlay link closes the menu. Same-page anchors
     (#section, used by the GAPS overlay) additionally smooth-scroll via
     Lenis when it's active — default jump otherwise (sections carry
     scroll-margin-top so native jumps clear the sticky stack too).
     href="#" placeholders are excluded (length > 1 guard). */
  items.forEach((item) =>
    item.addEventListener("click", (e) => {
      const href = item.getAttribute("href") || "";
      if (href.startsWith("#") && href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          closeMenu();
          if (lenis) {
            lenis.scrollTo(target, { offset: -126, duration: 1.1 });
          } else {
            target.scrollIntoView();
          }
          return;
        }
      }
      closeMenu();
    })
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closeMenu();
  });
}

/* --------------------------------------------------------------------------
   6b. Video testimonial lightbox
   Builds one modal per page (only if video cards exist) and opens it from
   any element carrying data-video-type:
     data-video-type="youtube" data-video-id="..."   → YouTube embed
     data-video-type="mp4"     data-video-src="..."  → native <video>
   Closes on the × button, click on the backdrop, or Escape. Closing
   empties the player node, which destroys the iframe/video and therefore
   stops playback. Focus moves to the close button on open, is trapped
   inside the dialog while open, and returns to the card on close.
   -------------------------------------------------------------------------- */
function initVideoLightbox() {
  const cards = document.querySelectorAll("[data-video-type]");
  /* Diagnostic: if this logs 0 (or never appears at all), no click
     listeners were bound. Never appears → main.js didn't load (file://,
     stale cache, or script 404). Logs 0 → cards are missing their
     data-video-type attributes. */
  console.log("testimonial cards found:", cards.length);
  if (!cards.length) return;

  // Build the modal once and append to <body>
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Video player");
  lightbox.innerHTML = `
    <div class="lightbox__dialog">
      <button class="lightbox__close" type="button" aria-label="Close video">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <div class="lightbox__player"></div>
    </div>`;
  document.body.appendChild(lightbox);

  const player = lightbox.querySelector(".lightbox__player");
  const closeBtn = lightbox.querySelector(".lightbox__close");
  let lastFocused = null;
  let isOpen = false;

  const openLightbox = (card) => {
    const type = card.dataset.videoType;

    /* Diagnostic: proves the click reached the handler. If this logs but
       no modal appears, the fault is CSS-side (lightbox open state). */
    console.log("card clicked", card.dataset.videoSrc || card.dataset.videoId);

    // Vertical videos: size the player by viewport height, not width
    lightbox.classList.toggle(
      "lightbox--portrait",
      card.dataset.videoOrientation === "portrait"
    );

    if (type === "youtube") {
      const id = encodeURIComponent(card.dataset.videoId || "");
      player.innerHTML = `<iframe
        src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0"
        title="Testimonial video"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowfullscreen></iframe>`;
    } else if (type === "mp4") {
      const video = document.createElement("video");
      video.src = card.dataset.videoSrc || "";
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      player.appendChild(video);
    }

    lastFocused = card;
    isOpen = true;
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
    /* The dialog animates from visibility:hidden — focus() fails until
       the style change has flushed, so assert it immediately AND after
       the flush. */
    closeBtn.focus();
    setTimeout(() => closeBtn.focus(), 80);
  };

  const closeLightbox = () => {
    isOpen = false;
    lightbox.classList.remove("is-open", "lightbox--portrait");
    player.innerHTML = ""; // destroy iframe/video → playback stops
    document.body.style.overflow = "";
    if (lenis) lenis.start();
    if (lastFocused) lastFocused.focus(); // return focus to the card
  };

  cards.forEach((card) =>
    card.addEventListener("click", () => openLightbox(card))
  );
  closeBtn.addEventListener("click", closeLightbox);

  // Click outside the dialog (i.e. directly on the backdrop) closes
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!isOpen) return;

    if (e.key === "Escape") {
      closeLightbox();
      return;
    }

    // Minimal focus trap: cycle Tab within the dialog's focusables
    if (e.key === "Tab") {
      const focusables = lightbox.querySelectorAll("button, iframe, video");
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

/* --------------------------------------------------------------------------
   6c. Promo banner (home page ribbon)
   body.has-promo shifts the sticky header's stick-point below the ribbon
   and trims the hero height. Dismissing (×) removes the banner node and
   the class, so the layout closes up with no gap. In-memory only by
   design — no localStorage/sessionStorage — so it returns on reload.
   -------------------------------------------------------------------------- */
function initPromoBanner() {
  const banner = document.querySelector(".promo-banner");
  if (!banner) return;

  document.body.classList.add("has-promo");

  const closeBtn = banner.querySelector(".promo-banner__close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      banner.remove();
      document.body.classList.remove("has-promo");
    });
  }
}

/* --------------------------------------------------------------------------
   7. Footer year
   -------------------------------------------------------------------------- */
function initFooterYear() {
  document.querySelectorAll("[data-current-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

/* --------------------------------------------------------------------------
   8. Events helper
   Splits EVENTS into { upcoming, past } relative to today (local time):
     - upcoming: date >= today, sorted soonest first
     - past:     date <  today, sorted most recent first
   An event dated today counts as upcoming.
   The events page (built later) will import/use this to render its lists.
   -------------------------------------------------------------------------- */
export function splitEvents(events = EVENTS) {
  // Midnight today, local time — so today's events are still "upcoming".
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = [];
  const past = [];

  const tba = [];

  events.forEach((event) => {
    if (event.tba) {
      tba.push(event); // TBA sessions always show in Upcoming, dateless
      return;
    }
    const eventDate = new Date(event.date + "T00:00:00"); // parse as local
    (eventDate >= today ? upcoming : past).push(event);
  });

  upcoming.sort((a, b) => new Date(a.date) - new Date(b.date)); // soonest first
  past.sort((a, b) => new Date(b.date) - new Date(a.date)); // most recent first

  // Dated upcoming first (they have concrete dates), then TBA sessions
  return { upcoming: upcoming.concat(tba), past };
}

/* --------------------------------------------------------------------------
   8b. Events page renderer (events.html)
   Fills [data-events-list="upcoming"] and [data-events-list="past"] with
   cards built from the EVENTS array — the page is driven entirely by
   assets/js/events.js. Runs BEFORE initScrollReveal in the boot sequence
   so the rendered cards are picked up by the scroll-reveal stagger.
   Upcoming cards get a Register button; past cards drop it and render at
   reduced visual weight. Empty upcoming → friendly weekly-sessions note;
   empty past → the whole Past section is hidden.
   -------------------------------------------------------------------------- */
function initEventsPage() {
  const upcomingWrap = document.querySelector('[data-events-list="upcoming"]');
  const pastWrap = document.querySelector("[data-past-events]");
  if (!upcomingWrap && !pastWrap) return; // not on the events page

  const { upcoming, past } = splitEvents();

  /* Diagnostic: how many events each section received after the date
     split. If a section looks blank in the browser, check this first —
     "upcoming: 0" means a DATA problem (no future-dated events in
     events.js), not a rendering problem. If this log never appears at
     all, the module itself failed to load (open via a local server, not
     file:// — ES module imports are blocked on file://). */
  console.log(
    `[events] upcoming: ${upcoming.length}, past: ${past.length}`
  );

  // "15 Aug 2026" — compact date badge text
  const formatDate = (iso) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // Escape data before interpolating into HTML
  const esc = (value = "") =>
    String(value).replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  /* Gold lock badge for GAPS-exclusive cards. The shackle is a separate
     path so CSS can animate it "clicking shut" when the card scrolls in. */
  const LOCK_SVG = `
    <span class="lock-badge" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path class="lock-badge__shackle" d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <rect x="5.5" y="10.5" width="13" height="9" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/>
        <circle cx="12" cy="15" r="1.3" fill="currentColor"/>
      </svg>
    </span>`;

  /* Card factory. Three states:
       public upcoming — full details + Register button (new tab)
       public past     — reduced weight, no button; muted "Watch recording"
                         link only if the event has a recordingUrl
       access:"gaps"   — locked: dimmed/blurred thumb with the lock badge,
                         title + date visible, time/description masked,
                         "Explore GAPS" instead of any register link */
  const cardHTML = (ev, isPast) => {
    /* TBA branch: dateless announced-soon sessions. Two variants:
       - access "gaps"  → gold members-first badge + border, Explore
         GAPS ghost CTA, members-first note (never Register)
       - access "public" → open session: no lock treatment, a Register
         CTA from registerUrl (new tab) */
    if (ev.tba) {
      const open = ev.access === "public";
      const badge = open
        ? ""
        : `<span class="pe-card__lock">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><rect x="5.5" y="10.5" width="13" height="9" rx="2.2"/></svg>
          GAPS Members First</span>`;
      const cta = open
        ? `<a href="${esc(ev.registerUrl || "#")}" target="_blank" rel="noopener" class="btn btn--primary event-card__cta">Register</a>`
        : `<a href="gaps.html" class="btn btn--ghost event-card__cta event-card__cta--gold">Explore GAPS</a>`;
      const note = open ? "" : `<p class="event-card__note">Announced first to GAPS members.</p>`;
      return `
    <article class="card event-card event-card--tba${open ? "" : " event-card--mfirst"} reveal">
      <span class="event-card__thumb">
        <img src="${esc(ev.cover)}" alt="${esc(ev.title)}" width="1920" height="1080" loading="lazy" />
        ${badge}
      </span>
      <div class="event-card__body">
        <div class="event-card__meta">
          <span class="event-card__date">${esc(ev.dateLabel)}</span>
          <span class="event-card__mode event-card__mode--${esc(ev.mode).toLowerCase()}">${esc(ev.mode)}</span>
        </div>
        <h3 class="event-card__title">${esc(ev.title)}</h3>
        <p class="event-card__desc">${esc(ev.tagline)}</p>
        ${cta}
        ${note}
      </div>
    </article>`;
    }

    const locked = ev.access === "gaps";
    const classes = [
      "card",
      "event-card",
      "reveal",
      isPast ? "event-card--past" : "",
      locked ? "event-card--locked" : "",
    ]
      .filter(Boolean)
      .join(" ");

    let body;
    if (locked) {
      body = `
        <p class="event-card__time event-card__masked" aria-hidden="true">${esc(ev.time)}${ev.venue ? " &middot; " + esc(ev.venue) : ""}</p>
        <p class="event-card__desc event-card__masked" aria-hidden="true">${esc(ev.description)}</p>
        <p class="event-card__lock-title">Exclusive to GAPS members.</p>
        <p class="event-card__lock-sub">Join GAPS to be part of these sessions.</p>
        <a href="gaps.html" class="btn btn--ghost event-card__cta">Explore GAPS</a>`;
    } else {
      const cta = isPast
        ? ev.recordingUrl
          ? `<a href="${esc(ev.recordingUrl)}" class="event-card__recording" target="_blank" rel="noopener">Watch recording</a>`
          : ""
        : `<a href="${esc(ev.registerUrl)}" class="btn btn--primary event-card__cta" target="_blank" rel="noopener">Register</a>`;
      body = `
        <p class="event-card__time">${esc(ev.time)}</p>
        <p class="event-card__desc">${esc(ev.description)}</p>
        ${cta}`;
    }

    /* width/height are intrinsic-ratio hints only — the CSS absolutely
       positions and cover-crops the thumb, so layout can't shift */
    return `
    <article class="${classes}">
      <span class="event-card__thumb">
        <img src="${esc(ev.thumbnail || ev.cover)}" alt="${esc(ev.title)}" width="1600" height="1066" loading="lazy" />
        ${locked ? LOCK_SVG : ""}
      </span>
      <div class="event-card__body">
        <div class="event-card__meta">
          <span class="event-card__date">${formatDate(ev.date)}</span>
          <span class="event-card__mode event-card__mode--${esc(ev.mode).toLowerCase()}">${esc(ev.mode)}</span>
        </div>
        <h3 class="event-card__title">${esc(ev.title)}</h3>
        ${body}
      </div>
    </article>`;
  };

  if (upcomingWrap) {
    upcomingWrap.innerHTML = upcoming.length
      ? upcoming.map((ev) => cardHTML(ev, false)).join("")
      : `<div class="events-empty reveal">
           <span class="icon-chip icon-chip--lg" aria-hidden="true">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16M8.5 3.5v3M15.5 3.5v3"/></svg>
           </span>
           <div>
             <h3>New sessions announced weekly</h3>
             <p>Nothing is open for registration right now — check back soon.</p>
           </div>
         </div>`;
  }

  /* Past events grid — driven by PAST_EVENTS (curated cards), NOT by
     the date-split of EVENTS. A missing cover falls back to
     placeholder.png; if even that is absent, the img removes itself and
     the dark cover panel shows — never broken alt text. */
  if (pastWrap) {
    /* Diagnostic: 0 here with an empty grid = data problem; a non-zero
       count with an empty grid = render problem. */
    console.log("[past events] entries:", PAST_EVENTS.length);
    const LOCK = `<span class="pe-card__lock">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><rect x="5.5" y="10.5" width="13" height="9" rx="2.2"/></svg>
        Exclusively for GAPS Members</span>`;

    // Newest first, whatever order the array is maintained in
    const pastSorted = [...PAST_EVENTS].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    const peCard = (ev) => `
      <article class="card pe-card reveal${ev.membersOnly ? " pe-card--members" : ""}">
        <div class="pe-card__cover">
          <img src="${esc(ev.cover)}" alt="${esc(ev.title)}" loading="lazy" onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src='media/past-events/placeholder.png'}else{this.remove()}" />
          ${ev.membersOnly ? LOCK : ""}
        </div>
        <div class="pe-card__body">
          <h3 class="pe-card__title">${esc(ev.title)}</h3>
          <p class="pe-card__tagline">${esc(ev.tagline)}</p>
          <p class="pe-card__summary">${esc(ev.summary)}</p>
          <p class="pe-card__access">${esc(ev.access)}</p>
        </div>
      </article>`;

    /* Paged carousel: 6 cards (3×2) per slide on desktop with arrow +
       dot navigation and a 0.5s horizontal slide (user-driven, never
       auto-advancing). On mobile the slide wrappers dissolve
       (display:contents) and the track becomes a native scroll-snap
       swiper, one card per view, arrows hidden, dots per card. */
    const PER_SLIDE = 6;
    const slides = [];
    for (let i = 0; i < pastSorted.length; i += PER_SLIDE) {
      slides.push(pastSorted.slice(i, i + PER_SLIDE));
    }

    const ARROW = (dir) =>
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${dir === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}"/></svg>`;

    pastWrap.innerHTML = `
      <button class="pe-carousel__arrow pe-carousel__arrow--prev" type="button" aria-label="Previous events" disabled>${ARROW("prev")}</button>
      <div class="pe-carousel__viewport">
        <div class="pe-carousel__track">
          ${slides.map((s) => `<div class="pe-carousel__slide">${s.map(peCard).join("")}</div>`).join("")}
        </div>
      </div>
      <button class="pe-carousel__arrow pe-carousel__arrow--next" type="button" aria-label="Next events">${ARROW("next")}</button>
      <div class="pe-carousel__dots" role="tablist" aria-label="Past event pages"></div>`;

    const track = pastWrap.querySelector(".pe-carousel__track");
    const prevBtn = pastWrap.querySelector(".pe-carousel__arrow--prev");
    const nextBtn = pastWrap.querySelector(".pe-carousel__arrow--next");
    const dotsEl = pastWrap.querySelector(".pe-carousel__dots");
    const mobileMq = window.matchMedia("(max-width: 760px)");
    let page = 0;

    const buildDots = (count, onPick) => {
      dotsEl.innerHTML = "";
      for (let i = 0; i < count; i++) {
        const d = document.createElement("button");
        d.type = "button";
        d.className = "pe-carousel__dot";
        d.setAttribute("aria-label", `Go to page ${i + 1}`);
        d.addEventListener("click", () => onPick(i));
        dotsEl.appendChild(d);
      }
    };
    const markDot = (i) =>
      [...dotsEl.children].forEach((d, j) => d.classList.toggle("is-active", j === i));

    const desktopUpdate = () => {
      track.style.transform = `translateX(-${page * 100}%)`;
      prevBtn.disabled = page === 0;
      nextBtn.disabled = page === slides.length - 1;
      markDot(page);
    };

    prevBtn.addEventListener("click", () => { if (page > 0) { page--; desktopUpdate(); } });
    nextBtn.addEventListener("click", () => { if (page < slides.length - 1) { page++; desktopUpdate(); } });

    // Mobile: sync the active dot to the nearest snapped card
    const cardsFlat = () => [...pastWrap.querySelectorAll(".pe-card")];
    let scrollTimer = null;
    track.addEventListener("scroll", () => {
      if (!mobileMq.matches) return;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const cards = cardsFlat();
        if (!cards.length) return;
        const step = cards[0].offsetWidth + 12;
        markDot(Math.min(cards.length - 1, Math.round(track.scrollLeft / step)));
      }, 80);
    }, { passive: true });

    const setupMode = () => {
      if (mobileMq.matches) {
        track.style.transform = "";
        buildDots(pastSorted.length, (i) => {
          const cards = cardsFlat();
          track.scrollTo({ left: i * (cards[0].offsetWidth + 12), behavior: "smooth" });
        });
        markDot(0);
      } else {
        page = Math.min(page, slides.length - 1);
        buildDots(slides.length, (i) => { page = i; desktopUpdate(); });
        desktopUpdate();
      }
    };
    setupMode();
    mobileMq.addEventListener("change", setupMode);
  }

  /* SEO: one Event JSON-LD block covering every UPCOMING event (past
     events are skipped). Injected at render time from the same EVENTS
     data that builds the cards, so the markup can never drift from it. */
  if (upcoming.length) {
    const eventLd = upcoming.map((ev) => ({
      "@context": "https://schema.org",
      "@type": "Event",
      name: ev.title,
      description: ev.description,
      startDate: ev.date,
      eventAttendanceMode:
        ev.mode === "Online"
          ? "https://schema.org/OnlineEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
      organizer: { "@type": "Person", name: "Rajiv K Chawla" },
      offers: { "@type": "Offer", url: ev.registerUrl },
    }));
    const ldScript = document.createElement("script");
    ldScript.type = "application/ld+json";
    ldScript.textContent = JSON.stringify(eventLd);
    document.head.appendChild(ldScript);
  }

  /* Lock choreography: when a locked card scrolls into view, .lock-in
     triggers the one-time shackle "click shut", which then settles into
     the slow glow loop (both defined in CSS, gated on this class).
     With reduced motion / no GSAP the class is never added, so the lock
     renders static — no pulse, no motion. */
  if (motionOK) {
    // .lock-in also drives the TBA badge's settle-pulse (CSS keyframes
    // with a finite iteration count — it pulses on entry, then settles).
    // Only members-first TBA cards (--mfirst) carry the badge.
    document.querySelectorAll(".event-card--locked, .event-card--mfirst").forEach((cardEl) => {
      ScrollTrigger.create({
        trigger: cardEl,
        start: "top 85%",
        once: true,
        onEnter: () => cardEl.classList.add("lock-in"),
      });
    });
  }
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */
initHeader();
initPromoBanner();
initMobileMenu();
initVideoLightbox();
initFooterYear();
initEventsPage();   // must run before initScrollReveal — it creates .reveal cards
initScrollReveal();
initGapsVisuals();
initHero();
