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
    image: 'assets/event_icssecc_26.jpg',
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
    image: 'assets/event_icmdmse_2026.jpg',
    imageAlt: 'ICMDMSE 2026 — Materials, Design & Manufacturing Conference',
    links: [
      { label: 'Website', url: '#', newTab: true }
    ]
  }
];

(function () {
  'use strict';

  /* ── Scroll Background Frame Animation ───────────────────────────────── */
  (function initScrollBgAnimation() {
    const canvas  = document.getElementById('scroll-bg-canvas');
    if (!canvas) return;

    const ctx     = canvas.getContext('2d');
    const TOTAL   = 75;
    const FOLDER  = 'ezgif-6b3159b15437ef17-jpg/';
    const frames  = new Array(TOTAL);
    let   loaded  = 0;
    let   currentFrame = 0;
    let   targetFrame  = 0;
    let   rafId   = null;
    let   ready   = false;

    /* ── Resize canvas to full viewport ── */
    function resizeCanvas() {
      canvas.width  = window.innerWidth  * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
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

    /* ── Animation loop with smooth lerp ── */
    function tick() {
      rafId = requestAnimationFrame(tick);
      if (!ready) return;

      currentFrame += (targetFrame - currentFrame) * 0.12;
      const rounded = Math.round(currentFrame);
      drawFrame(rounded);
    }

    /* ── Map scroll position → frame index ── */
    function onScroll() {
      const scrollTop  = window.scrollY;
      const maxScroll  = document.documentElement.scrollHeight - window.innerHeight;
      const progress   = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
      targetFrame = progress * (TOTAL - 1);
    }

    /* ── Preload all frames ── */
    function pad(n) { return String(n).padStart(3, '0'); }

    for (let i = 0; i < TOTAL; i++) {
      const img = new Image();
      img.src = FOLDER + 'ezgif-frame-' + pad(i + 1) + '.jpg';
      img.onload = function () {
        loaded++;
        if (loaded === 1) {
          ready = true;
          drawFrame(0);
        }
      };
      frames[i] = img;
    }

    /* ── Boot ── */
    resizeCanvas();
    window.addEventListener('resize',  resizeCanvas, { passive: true });
    window.addEventListener('scroll',  onScroll,     { passive: true });
    tick();
    onScroll();
  })();

  /* ── Scroll: Header ──────────────────────────────────────────────────── */
  const header = document.getElementById('site-header');

  function handleHeaderScroll() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
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

  /* ── Intersection Observer: Fade-in ─────────────────────────────────── */
  const fadeEls = document.querySelectorAll('.fade-in');

  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.delay || '0', 10);
          setTimeout(() => {
            el.classList.add('visible');
          }, delay);
          fadeObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  fadeEls.forEach((el) => fadeObserver.observe(el));

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
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    });
  });

  /* ── Service Card hover tilt (desktop only) ──────────────────────────── */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-6px) rotateX(${y * -3}deg) rotateY(${x * 3}deg)`;
        card.style.transition = 'transform 0.1s ease';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s';
      });
    });

    /* ── Pillar Card hover tilt ── */
    const pillarCards = document.querySelectorAll('.pillar-card');
    pillarCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-8px) rotateX(${y * -4}deg) rotateY(${x * 4}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      });
    });

    /* ── Why Card hover tilt ── */
    const whyCards = document.querySelectorAll('.why-card');
    whyCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-6px) rotateX(${y * -3}deg) rotateY(${x * 3}deg)`;
        card.style.transition = 'transform 0.1s ease';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s';
      });
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
            number.style.animation = 'journeyPulse 0.6s ease both';
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
      0% { transform: scale(0.7); opacity: 0; }
      60% { transform: scale(1.1); }
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
          field.addEventListener('input', () => {
            field.style.borderColor = '';
          }, { once: true });
          valid = false;
        }
      });

      if (!valid) return;

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
      const waUrl = `https://wa.me/917207960077?text=${encodeURIComponent(waText)}`;

      // Open WhatsApp immediately in new tab (avoids popup blockers)
      window.open(waUrl, '_blank');

      // Update UI
      submitBtn.textContent = 'Opening WhatsApp...';
      submitBtn.disabled = true;

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

  /* ── Active Nav Highlight on Scroll ──────────────────────────────────── */
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  function highlightNav() {
    const scrollPos = window.scrollY + 120;

    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      let id = section.getAttribute('id');

      // Map founder section to #about nav link
      if (id === 'founder') {
        id = 'about';
      }

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach((link) => {
          link.style.color = '';
          if (link.getAttribute('href') === '#' + id) {
            link.style.color = '#C396FC';
          }
        });
      }
    });
  }

  window.addEventListener('scroll', highlightNav, { passive: true });
  highlightNav();

  /* ── WhatsApp float: show after scroll ───────────────────────────────── */
  const waFloat = document.querySelector('.whatsapp-float');
  if (waFloat) {
    waFloat.style.opacity = '0';
    waFloat.style.transform = 'scale(0.8)';
    waFloat.style.transition = 'opacity 0.5s, transform 0.5s';

    function showWaFloat() {
      if (window.scrollY > 300) {
        waFloat.style.opacity = '1';
        waFloat.style.transform = 'scale(1)';
      } else {
        waFloat.style.opacity = '0';
        waFloat.style.transform = 'scale(0.8)';
      }
    }

    window.addEventListener('scroll', showWaFloat, { passive: true });
    showWaFloat();
  }

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
