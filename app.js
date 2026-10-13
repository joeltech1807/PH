/* ─────────────────────────────────────────────────────────────────────────
   app.js — Universe Healing Haven JavaScript
   Handles: scroll bg, header, nav, fade-in, journey, cards, form, WhatsApp
   ─────────────────────────────────────────────────────────────────────────

   ── MAJOR EVENTS DATA ────────────────────────────────────────────────────
   To update events: add, remove or edit objects in this array only.
   The section layout will automatically reflect your changes.
   Fields:
     date        — displayed event date string
     title       — full conference/event title
     shortTitle  — abbreviation shown as a badge (optional, pass '' to hide)
     description — one or two short sentences about the event (optional)
     image       — path relative to site root, e.g. 'assets/event_xyz.jpg'
     imageAlt    — descriptive alt text for the image
     links       — array of { label, url, newTab } objects;
                   newTab defaults to true for external links
   ─────────────────────────────────────────────────────────────────────────
*/

const majorEvents = [
  {
    date: '28th & 29th August 2026',
    title: '2nd International Conference on “Smart Systems for Electrical, Electronics, Communication and Computer Engineering”',
    shortTitle: 'ICSSECC 26',
    description: 'A premier gathering of global researchers, engineers and innovators advancing the frontiers of smart systems across electrical, electronics, communication and computing domains.',
    image: 'assets/event_icssecc_26.webp',
    imageAlt: 'ICSSECC 26 — Smart Systems International Conference',
    links: [
      { label: 'Poster',   url: '#', newTab: false },
      { label: 'Brochure', url: '#', newTab: false },
      { label: 'Website',  url: '#', newTab: true  }
    ]
  },
  {
    date: '24th & 25th August 2026',
    title: '3rd International Conference on “Materials, Design and Manufacturing for Sustainable Environment”',
    shortTitle: 'ICMDMSE 2026',
    description: 'Bringing together thought leaders in sustainable materials science, advanced manufacturing and eco-conscious design to shape the future of responsible engineering.',
    image: 'assets/event_icmdmse_2026.webp',
    imageAlt: 'ICMDMSE 2026 — Materials, Design & Manufacturing Conference',
    links: [
      { label: 'Website', url: '#', newTab: true }
    ]
  }
];

/* ─────────────────────────────────────────────────────────────────────────
   TESTIMONIALS DATA
   ─────────────────────────────────────────────────────────────────────────
   NOTE: The testimonials below are sample placeholder entries created for
   design & development purposes. Replace them with genuine client feedback
   before presenting this section publicly as real verified reviews.
   ─────────────────────────────────────────────────────────────────────────
   To add a genuine testimonial, append an object with:
     name     — Display name (e.g. "Priya R." — use initials for privacy)
     rating   — Number from 1–5
     text     — Short, authentic feedback (1–4 sentences)
   ─────────────────────────────────────────────────────────────────────────
*/
const testimonialsData = [
  {
    name: 'Priya R.',
    rating: 5,
    text: 'Every session with Jennifer felt like a gentle reset for my soul. I came in exhausted and left feeling lighter than I have in years.'
  },
  {
    name: 'Ananya M.',
    rating: 5,
    text: 'I was struggling with sleep and anxiety for months. After just a few healing sessions, I noticed a remarkable shift — calmer nights, clearer mornings.'
  },
  {
    name: 'Shalini T.',
    rating: 5,
    text: 'Jennifer has a rare gift for making you feel completely safe. Her compassion and dedication to healing is evident in every moment of the session.'
  },
  {
    name: 'Deepa N.',
    rating: 5,
    text: 'Universe Healing Haven is a truly special place. I feel hopeful and at peace every time I leave. Grateful for Jennifer\'s guidance and warmth.'
  },
  {
    name: 'Kavitha S.',
    rating: 5,
    text: 'The energy work Jennifer does is profound. I walked in feeling scattered and overwhelmed — I walked out grounded, calm, and clear.'
  },
  {
    name: 'Meera P.',
    rating: 5,
    text: 'I have tried many wellness practices but nothing has felt as transformative as the healing sessions here. Truly from the heart.'
  },
  {
    name: 'Roshni K.',
    rating: 5,
    text: 'Jennifer\'s healing touched areas of my life I didn\'t even know were blocked. I feel more myself than I have in a very long time.'
  },
  {
    name: 'Lalitha V.',
    rating: 5,
    text: 'A deeply nurturing experience. Jennifer holds space with such love and intention — I always leave feeling renewed and hopeful.'
  },
  {
    name: 'Sunita B.',
    rating: 5,
    text: 'After my first session I slept peacefully for the first time in months. The healing is gentle yet incredibly powerful. Highly recommended.'
  }
];

/* ─────────────────────────────────────────────────────────────────────────
   BUILD MARQUEE TESTIMONIALS
   Duplicates cards within each track so the loop is seamless.
   Row 1 uses the full set; Row 2 uses a slightly rotated subset for variety.
   ─────────────────────────────────────────────────────────────────────────
*/
(function buildMarquee() {
  const STAR_FILLED = '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  const STAR_EMPTY  = '<svg viewBox="0 0 24 24" class="star-empty"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  const QUOTE_ICON  = '<svg class="testimonial-quote-icon" viewBox="0 0 32 32"><path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z"/></svg>';

  function initials(name) {
    return name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
  }

  function stars(rating) {
    var html = '';
    for (var i = 1; i <= 5; i++) {
      html += i <= rating ? STAR_FILLED : STAR_EMPTY;
    }
    return html;
  }

  function buildCard(t, isDuplicate) {
    return (
      '<article class="testimonial-card"' + (isDuplicate ? ' aria-hidden="true"' : '') + '>' +
        '<div class="testimonial-card-top">' +
          '<div class="testimonial-avatar">' + initials(t.name) + '</div>' +
          '<div class="testimonial-meta">' +
            '<div class="testimonial-name">' + t.name + '</div>' +
            '<div class="testimonial-stars">' + stars(t.rating) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="testimonial-body">' +
          QUOTE_ICON +
          '<p class="testimonial-text">' + t.text + '</p>' +
        '</div>' +
      '</article>'
    );
  }

  function fillTrack(trackId, items) {
    var track = document.getElementById(trackId);
    if (!track) return;
    // Build single set of cards, then a visual-only duplicate for the seamless
    // loop (translateX(-50%) → translateX(0%) animation). Duplicates are not extra reviews.
    var cardsHTML = items.map(function (t) { return buildCard(t, false); }).join('');
    var dupHTML = items.map(function (t) { return buildCard(t, true); }).join('');
    track.innerHTML = cardsHTML + dupHTML;
  }

  // Single scrolling row
  fillTrack('marquee-track-1', testimonialsData);
})();

(function () {
  'use strict';

  /* ── Scroll Background Frame Animation ───────────────────────────────── */
  (function initScrollBgAnimation() {
    const canvas  = document.getElementById('scroll-bg-canvas');
    if (!canvas) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.display = 'none';
      return;
    }

    const isMobile = window.innerWidth < 768 || window.matchMedia('(max-width: 768px)').matches;
    const ctx     = canvas.getContext('2d');
    const TOTAL   = 75;
    const FOLDER  = 'ezgif-6b3159b15437ef17-jpg/';
    const frames  = new Array(TOTAL);
    let   loaded  = 0;
    let   currentFrame = 0;
    let   targetFrame  = 0;
    let   rafId   = null;
    let   ready   = false;

    /* ── Resize canvas to viewport with capped DPR for mobile efficiency ── */
    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5);
      canvas.width  = Math.floor(window.innerWidth  * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      drawFrame(currentFrame);
    }

    /* ── Draw a single frame with cover-fit ── */
    function drawFrame(index) {
      const img = frames[Math.round(index)];
      if (!img || !img.complete) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth  || img.width;
      const ih = img.naturalHeight || img.height;
      if (!iw || !ih) return;

      const scale = Math.max(cw / iw, ch / ih);
      const sw    = iw * scale;
      const sh    = ih * scale;
      const sx    = (cw - sw) / 2;
      const sy    = (ch - sh) / 2;

      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, sx, sy, sw, sh);
    }

    /* ── Animation loop: runs ONLY while moving, pauses when idle ── */
    function tick() {
      if (!ready) {
        rafId = null;
        return;
      }
      currentFrame += (targetFrame - currentFrame) * 0.12;
      drawFrame(currentFrame);

      if (Math.abs(targetFrame - currentFrame) > 0.05) {
        rafId = requestAnimationFrame(tick);
      } else {
        currentFrame = targetFrame;
        drawFrame(currentFrame);
        rafId = null;
      }
    }

    /* ── Map scroll position → frame index ── */
    function onScroll() {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress  = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
      targetFrame = progress * (TOTAL - 1);
      if (!rafId && ready) {
        rafId = requestAnimationFrame(tick);
      }
    }

    function pad(n) { return String(n).padStart(3, '0'); }

    /* Mobile: only load the 1st frame to preserve aesthetic without downloading 3MB */
    if (isMobile) {
      const firstImg = new Image();
      firstImg.src = FOLDER + 'ezgif-frame-001.jpg';
      firstImg.onload = function () {
        frames[0] = firstImg;
        ready = true;
        resizeCanvas();
        drawFrame(0);
      };
      window.addEventListener('resize', resizeCanvas, { passive: true });
      return;
    }

    /* Desktop: load 1st frame immediately, defer remainder to idle time */
    const firstImg = new Image();
    firstImg.src = FOLDER + 'ezgif-frame-001.jpg';
    firstImg.onload = function () {
      loaded++;
      ready = true;
      resizeCanvas();
      drawFrame(0);

      const loadRemaining = function () {
        for (let i = 1; i < TOTAL; i++) {
          const img = new Image();
          img.src = FOLDER + 'ezgif-frame-' + pad(i + 1) + '.jpg';
          frames[i] = img;
        }
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(loadRemaining, { timeout: 2000 });
      } else {
        setTimeout(loadRemaining, 400);
      }
    };
    frames[0] = firstImg;

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('scroll', onScroll,     { passive: true });
  })();

  /* ── Header Scroll State ─────────────────────────────────────────────── */
  const header = document.getElementById('site-header');
  let headerScrolled = false;

  function handleHeaderScroll() {
    if (!header) return;
    const isScrolled = window.scrollY > 40;
    if (isScrolled !== headerScrolled) {
      headerScrolled = isScrolled;
      header.classList.toggle('scrolled', isScrolled);
    }
  }
  handleHeaderScroll();

  /* ── Mobile Navigation ───────────────────────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileNavClose = document.getElementById('mobile-nav-close');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link, .mobile-book');

  function openNav() {
    mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (hamburger) hamburger.addEventListener('click', openNav);
  if (mobileNavClose) mobileNavClose.addEventListener('click', closeNav);
  mobileNavLinks.forEach(link => link.addEventListener('click', closeNav));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Reveal system ───────────────────────────────────────────────────────
     .fade-in elements are only hidden when JS runs (html.js), so content is
     never lost if scripts fail. Header blocks reveal their children in a
     short stagger (index exposed as --i; timing tokens live in style.css).
     After the reveal settles, .is-settled swaps to quick interaction timing. */
  const STAGGER_GROUPS = '.welcome-text, .philosophy-header, .services-header, .wellness-text-col, .journey-header, .why-header, .events-header, .testimonials-header, .cta-content, .contact-info';
  document.querySelectorAll(STAGGER_GROUPS).forEach((group) => {
    if (!group.classList.contains('fade-in')) return;
    group.setAttribute('data-stagger', '');
    Array.from(group.children).forEach((child, i) => child.style.setProperty('--i', i));
  });

  const REVEAL_SETTLE_MS = 900;
  function reveal(el) {
    const delay = prefersReducedMotion ? 0 : parseInt(el.dataset.delay || '0', 10);
    setTimeout(() => {
      el.classList.add('visible');
      setTimeout(() => el.classList.add('is-settled'), prefersReducedMotion ? 0 : REVEAL_SETTLE_MS);
    }, delay);
  }

  const fadeEls = document.querySelectorAll('.fade-in');
  const fadeObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              reveal(entry.target);
              fadeObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      )
    : { observe: reveal, unobserve() {} };

  fadeEls.forEach((el) => fadeObserver.observe(el));
  window.__uhhReveal = true; // tells the <head> failsafe that reveals are handled

  /* ── One-shot reveals for non-.fade-in elements (e.g. CTA backdrop) ──── */
  if ('IntersectionObserver' in window) {
    const onceObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          onceObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.cta-section, .journey-steps').forEach((el) => onceObserver.observe(el));
  } else {
    document.querySelectorAll('.cta-section, .journey-steps').forEach((el) => el.classList.add('is-revealed'));
  }

  /* ── Ambient animations run only while their section is on screen ────── */
  const ambientEls = document.querySelectorAll('.site-footer, .founder-section, .events-section, .testimonials-section');
  if ('IntersectionObserver' in window) {
    const ambientObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('in-view', entry.isIntersecting));
    });
    ambientEls.forEach((el) => ambientObserver.observe(el));
  } else {
    ambientEls.forEach((el) => el.classList.add('in-view'));
  }

  /* ── Button arrows: wrap the trailing arrow so it can nudge on hover ── */
  document.querySelectorAll('.btn-primary, .btn-ghost, .btn-outline, .btn-book, .btn-text-link, .btn-cta-primary, .btn-submit').forEach((btn) => {
    const last = btn.lastChild;
    if (!last || last.nodeType !== Node.TEXT_NODE || !/\u2192\s*$/.test(last.textContent)) return;
    last.textContent = last.textContent.replace(/\s*\u2192\s*$/, ' ');
    const arrow = document.createElement('span');
    arrow.className = 'btn-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '\u2192';
    btn.appendChild(arrow);
  });

  /* ── Mobile nav: expose link index for the staggered entrance ───────── */
  document.querySelectorAll('.mobile-nav > a').forEach((link, i) => link.style.setProperty('--i', i));

  /* ── Smooth scroll: Anchor links ─────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 0;
        const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top: targetTop, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  });

  /* ── Card depth: one delegated pointer handler (desktop, motion allowed) ──
     Sets --rx / --ry (tilt) and --mx / --my (highlight) on the hovered card;
     the transform itself is composed in CSS so it stacks with the reveal. */
  const TILT_CARDS = '.pillar-card, .service-card, .why-card';
  document.querySelectorAll(TILT_CARDS).forEach((card) => card.setAttribute('data-tilt', ''));

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion) {
    const MAX_TILT = 3; // degrees: subtle, never hard to read
    let tiltCard = null;
    let tiltFrame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const applyTilt = () => {
      tiltFrame = 0;
      if (!tiltCard) return;
      const rect = tiltCard.getBoundingClientRect();
      const x = (pointerX - rect.left) / rect.width;
      const y = (pointerY - rect.top) / rect.height;
      tiltCard.style.setProperty('--ry', ((x - 0.5) * 2 * MAX_TILT).toFixed(2) + 'deg');
      tiltCard.style.setProperty('--rx', ((0.5 - y) * 2 * MAX_TILT).toFixed(2) + 'deg');
      tiltCard.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      tiltCard.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      tiltCard.style.setProperty('--px', (x - 0.5).toFixed(3));
      tiltCard.style.setProperty('--py', (y - 0.5).toFixed(3));
    };

    const releaseTilt = (card) => {
      card.classList.remove('is-tilting');
      card.style.removeProperty('--rx');
      card.style.removeProperty('--ry');
      card.style.removeProperty('--px');
      card.style.removeProperty('--py');
    };

    document.addEventListener('pointerover', (e) => {
      const card = e.target.closest('[data-tilt]');
      if (card === tiltCard) return;
      if (tiltCard) releaseTilt(tiltCard);
      tiltCard = card;
      if (tiltCard) tiltCard.classList.add('is-tilting');
    }, { passive: true });

    document.addEventListener('pointermove', (e) => {
      if (!tiltCard) return;
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (!tiltFrame) tiltFrame = requestAnimationFrame(applyTilt);
    }, { passive: true });

    document.documentElement.addEventListener('pointerleave', () => {
      if (tiltCard) releaseTilt(tiltCard);
      tiltCard = null;
    });
  }

  /* ── Journey Steps: Staggered animation via observer ─────────────────── */
  const journeySteps = document.querySelectorAll('.journey-step');
  const journeyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const number = el.querySelector('.journey-step-number');
          if (number) {
            number.style.animation = prefersReducedMotion ? 'none' : 'journeyPulse 0.7s cubic-bezier(0.22, 1, 0.36, 1) both';
          }
          journeyObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.3 }
  );

  journeySteps.forEach((step) => journeyObserver.observe(step));

  // Add keyframe for journey pulse
  const journeyStyle = document.createElement('style');
  journeyStyle.textContent = `
    @keyframes journeyPulse {
      0% { transform: scale(0.82); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(journeyStyle);

  /* ── Form: Contact / Booking ─────────────────────────────────────────── */
  const bookingForm = document.getElementById('booking-form');
  const formSuccess = document.getElementById('form-success');
  const submitBtn = document.getElementById('submit-btn');

  if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Simple validation
      const required = bookingForm.querySelectorAll('[required]');
      let valid = true;

      required.forEach((field) => {
        if (!field.value.trim()) {
          field.style.borderColor = 'rgba(180, 100, 80, 0.5)';
          field.classList.remove('is-invalid');
          void field.offsetWidth; // restart the shake on repeated submits
          field.classList.add('is-invalid');
          field.setAttribute('aria-invalid', 'true');
          const clear = () => {
            field.style.borderColor = '';
            field.classList.remove('is-invalid');
            field.removeAttribute('aria-invalid');
          };
          field.addEventListener('input', clear, { once: true });
          field.addEventListener('change', clear, { once: true });
          valid = false;
        }
      });

      if (!valid) {
        const firstInvalid = bookingForm.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Retrieve form values
      const fullName = document.getElementById('fullName').value.trim();
      const phoneVal = document.getElementById('phone').value.trim();
      const emailVal = document.getElementById('email').value.trim();
      const locationVal = document.getElementById('location').value.trim() || 'Not specified';
      const serviceSelect = document.getElementById('service');
      const serviceText = serviceSelect.options[serviceSelect.selectedIndex].text;
      
      const sessionRadio = bookingForm.querySelector('input[name="sessionType"]:checked');
      const sessionVal = sessionRadio ? sessionRadio.value : 'Not specified';
      
      const messageVal = document.getElementById('message').value.trim() || 'None';

      // Save contact submission to real database (localStorage hh_db_contacts)
      const contacts = JSON.parse(localStorage.getItem('hh_db_contacts')) || [];
      const nextId = 'MSG' + String(contacts.length + 1).padStart(3, '0');
      const timestamp = new Date().toISOString().replace('Z', '+05:30');
      
      const newContact = {
        id: nextId,
        name: fullName,
        phone: phoneVal,
        whatsapp: phoneVal, // fallback phone as whatsapp
        email: emailVal,
        location: locationVal,
        preferredService: serviceText,
        preferredSessionType: sessionVal,
        message: messageVal,
        status: 'new',
        assignedTo: '',
        internalNotes: '',
        createdAt: timestamp,
        updatedAt: timestamp,
        repliedAt: '',
        closedAt: ''
      };
      
      contacts.push(newContact);
      localStorage.setItem('hh_db_contacts', JSON.stringify(contacts));

      // Append Audit Log
      const logs = JSON.parse(localStorage.getItem('hh_db_logs')) || [];
      logs.unshift({
        timestamp: timestamp,
        user: 'anonymous@visitor.com',
        role: 'Website Visitor',
        action: 'Contact Submission',
        details: `Visitor ${fullName} submitted contact enquiry message ${nextId}`,
        oldValue: '',
        newValue: JSON.stringify(newContact),
        ip: '127.0.0.1 (Web Visitor)'
      });
      localStorage.setItem('hh_db_logs', JSON.stringify(logs));

      // Build structured WhatsApp message
      const waText = `Hello! I would like to book a session at Universe Healing Haven. Here are my details:

• Name: ${fullName}
• Phone: ${phoneVal || 'Not specified'}
• Email: ${emailVal}
• Location: ${locationVal}
• Service: ${serviceText}
• Session Type: ${sessionVal}
• Message: ${messageVal}`;

      // Construct WhatsApp URL
      const waUrl = `https://wa.me/919493132940?text=${encodeURIComponent(waText)}`;

      // Open WhatsApp immediately in new tab (avoids popup blockers)
      window.open(waUrl, '_blank');

      // Update UI
      submitBtn.textContent = 'Opening WhatsApp...';
      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');

      setTimeout(() => {
        bookingForm.querySelectorAll('.form-group, .form-row').forEach(g => {
          g.style.opacity = '0';
          g.style.transition = 'opacity 0.4s';
        });
        submitBtn.style.display = 'none';

        setTimeout(() => {
          formSuccess.classList.add('visible');
        }, 400);
      }, 1000);
    });
  }

  /* ── Major Events: Data-driven rendering ────────────────────────────── */
  (function renderEvents() {
    const list  = document.getElementById('events-list');
    const empty = document.getElementById('events-empty');
    if (!list) return;

    // Retrieve published events from the real database
    const dbEvents = JSON.parse(localStorage.getItem('hh_db_events')) || [];
    const publishedEvents = dbEvents
      .filter(ev => ev.status === 'published')
      .sort((a, b) => parseInt(a.displayOrder || 99) - parseInt(b.displayOrder || 99));

    if (publishedEvents.length === 0) {
      list.style.display  = 'none';
      if (empty) {
        empty.style.display = 'block';
        empty.innerHTML = '<p class="events-empty-text">No published events currently available. Check back soon.</p>';
      }
      return;
    }

    if (empty) empty.style.display = 'none';
    list.style.display = 'flex';
    list.innerHTML = ''; // clear initial content

    publishedEvents.forEach(function (ev, idx) {
      /* ── Build links HTML ── */
      const linksHTML = ev.links && ev.links.length
        ? ev.links.map(function (lk) {
            const target = lk.newTab ? 'target="_blank" rel="noopener"' : '';
            return '<a href="' + (lk.url || '#') + '" class="event-link-btn" ' + target + '>' +
                   lk.label + ' <span class="event-link-arrow">&rarr;</span>' +
                   '</a>';
          }).join('')
        : '';

      /* ── Build short-title badge ── */
      const badgeHTML = ev.shortTitle
        ? '<span class="event-short-title">' + ev.shortTitle + '</span>'
        : '';

      /* ── Build description text ── */
      const descHTML = ev.description
        ? '<p class="event-description">' + ev.description + '</p>'
        : '';

      /* ── Assemble event row ── */
      const row = document.createElement('article');
      row.className  = 'event-row fade-in';
      row.dataset.delay = String(idx * 120);
      row.innerHTML  =
        '<div class="event-details">' +
          '<span class="event-number">Event ' + String(idx + 1).padStart(2, '0') + '</span>' +
          '<span class="event-date">' + ev.date + '</span>' +
          '<h3 class="event-title">' + ev.title + '</h3>' +
          badgeHTML +
          descHTML +
          (linksHTML ? '<div class="event-links">' + linksHTML + '</div>' : '') +
        '</div>' +
        '<div class="event-image-col">' +
          '<div class="event-image-wrap">' +
            '<img src="' + ev.image + '" alt="' + (ev.imageAlt || ev.title) + '" class="event-img" loading="lazy" />' +
          '</div>' +
        '</div>';

      list.appendChild(row);
    });

    /* Re-observe newly added fade-in elements */
    list.querySelectorAll('.fade-in').forEach(function (el) {
      fadeObserver.observe(el);
    });
  })();

  /* ── Active Nav Highlight on Scroll (with cached layout geometry) ─── */
  const navLinks = document.querySelectorAll('.nav-link');
  let cachedSections = [];

  function updateSectionGeometry() {
    cachedSections = Array.from(document.querySelectorAll('section[id]')).map((sec) => ({
      id: sec.getAttribute('id') === 'founder' ? 'about' : sec.getAttribute('id'),
      top: sec.offsetTop,
      bottom: sec.offsetTop + sec.offsetHeight
    }));
  }
  updateSectionGeometry();
  window.addEventListener('resize', updateSectionGeometry, { passive: true });

  let activeNavId = '';
  function highlightNav() {
    const scrollPos = window.scrollY + 120;
    for (let i = 0; i < cachedSections.length; i++) {
      const s = cachedSections[i];
      if (scrollPos >= s.top && scrollPos < s.bottom) {
        if (activeNavId !== s.id) {
          activeNavId = s.id;
          navLinks.forEach((link) => {
            link.style.color = (link.getAttribute('href') === '#' + s.id) ? '#C396FC' : '';
          });
        }
        break;
      }
    }
  }

  /* ── WhatsApp float: toggle with state check ─────────────────────────── */
  const waFloat = document.querySelector('.whatsapp-float');
  let waFloatVisible = false;

  if (waFloat) {
    waFloat.style.opacity = '0';
    waFloat.style.transform = 'scale(0.8)';
    waFloat.style.pointerEvents = 'none';
    waFloat.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  }

  function showWaFloat() {
    if (!waFloat) return;
    const shouldShow = window.scrollY > 300;
    if (shouldShow !== waFloatVisible) {
      waFloatVisible = shouldShow;
      waFloat.style.opacity = shouldShow ? '1' : '0';
      waFloat.style.transform = shouldShow ? 'scale(1)' : 'scale(0.8)';
      waFloat.style.pointerEvents = shouldShow ? 'auto' : 'none';
    }
  }

  /* ── Single Unified RAF Scroll Listener (Zero Layout Thrashing) ─────── */
  let scrollTicking = false;
  function onScrollUnified() {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        handleHeaderScroll();
        highlightNav();
        showWaFloat();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }

  window.addEventListener('scroll', onScrollUnified, { passive: true });
  onScrollUnified();

  /* ── Console branding ───────────────────────────────────────────────── */
  console.log(
    '%cUniverse Healing Haven — Heal · Balance · Wellness',
    'font-family:Georgia,serif;font-size:14px;color:#C396FC;'
  );

  /* ── Cursor-following lavender glow (desktop only) ──────────────────── */
  (function initCursorGlow() {
    /* Skip on touch devices and when reduced-motion is preferred */
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const glow = document.getElementById('cursor-glow');
    if (!glow) return;

    let active = false;

    document.addEventListener('mousemove', function (e) {
      if (!active) {
        glow.classList.add('active');
        active = true;
      }
      document.documentElement.style.setProperty('--cursor-x', e.clientX + 'px');
      document.documentElement.style.setProperty('--cursor-y', e.clientY + 'px');
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      glow.classList.remove('active');
      active = false;
    });
  })();

  /* ── prefers-reduced-motion: skip scroll-bg frame animation ────────── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const bgCanvas = document.getElementById('scroll-bg-canvas');
    if (bgCanvas) bgCanvas.style.display = 'none';
  }
})();
