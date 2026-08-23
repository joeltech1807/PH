/* ─────────────────────────────────────────────────────────────────────────
   app.js — SĀVA Studio JavaScript
   Handles: scroll effects, fade-in animations, nav, testimonials, form
   ───────────────────────────────────────────────────────────────────────── */

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

      /* Lerp current toward target for buttery-smooth scrubbing */
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
        /* Start as soon as the first frame is ready */
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
    onScroll(); /* Set correct initial frame on page load */
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

  /* ── Testimonials: Simple carousel on mobile ─────────────────────────── */
  const track = document.getElementById('testimonials-track');
  const dots = document.querySelectorAll('.t-dot');
  let currentSlide = 0;
  let autoAdvance = null;

  function getSlideCount() {
    if (window.innerWidth <= 768) return 4;
    if (window.innerWidth <= 1024) return 2;
    return 0; // no sliding needed on desktop (all 4 visible)
  }

  function goToSlide(index) {
    const total = getSlideCount();
    if (total === 0) return;
    currentSlide = Math.max(0, Math.min(index, total - 1));
    track.style.transform = `translateX(calc(-${currentSlide * 100}% - ${currentSlide * 24}px))`;
    dots.forEach((d, i) => d.classList.toggle('t-dot--active', i === currentSlide));
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      clearInterval(autoAdvance);
      goToSlide(parseInt(dot.dataset.index, 10));
      startAutoAdvance();
    });
  });

  function startAutoAdvance() {
    autoAdvance = setInterval(() => {
      const total = getSlideCount();
      if (total === 0) return;
      goToSlide((currentSlide + 1) % total);
    }, 5000);
  }

  // Touch swipe support for testimonials
  let touchStartX = 0;
  let touchEndX = 0;

  if (track) {
    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        clearInterval(autoAdvance);
        goToSlide(diff > 0 ? currentSlide + 1 : currentSlide - 1);
        startAutoAdvance();
      }
    }, { passive: true });
  }

  // Handle responsive layout changes
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (getSlideCount() === 0 && track) {
        track.style.transform = '';
      }
      goToSlide(0);
    }, 250);
  });

  startAutoAdvance();

  /* ── Parallax: Hero image ────────────────────────────────────────────── */
  const heroImg = document.querySelector('.hero-img');

  function heroParallax() {
    if (!heroImg || window.innerWidth <= 768) return;
    const scrolled = window.scrollY;
    heroImg.style.transform = `translateY(${scrolled * 0.04}px)`;
  }

  window.addEventListener('scroll', heroParallax, { passive: true });

  /* ── Parallax: Inner Light Section ──────────────────────────────────── */
  const innerLightImg = document.querySelector('.inner-light-img');

  function innerLightParallax() {
    if (!innerLightImg || window.innerWidth <= 768) return;
    const section = innerLightImg.closest('.inner-light-section');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const offset = rect.top;
    innerLightImg.style.transform = `translateY(${offset * -0.08}px)`;
  }

  window.addEventListener('scroll', innerLightParallax, { passive: true });

  /* ── Form: Booking ───────────────────────────────────────────────────── */
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

      // Simulate submission
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      setTimeout(() => {
        bookingForm.querySelectorAll('.form-group').forEach(g => {
          g.style.opacity = '0';
          g.style.transition = 'opacity 0.4s';
        });
        submitBtn.style.display = 'none';

        setTimeout(() => {
          formSuccess.classList.add('visible');
        }, 400);
      }, 1200);
    });
  }

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

  /* ── Date input: set min to today ───────────────────────────────────── */
  const dateInput = document.getElementById('preferredDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  /* ── Subtle ambient movement on pillar cards ─────────────────────────── */
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

  /* ── Cursor: optional subtle organic motion ──────────────────────────── */
  // Lightweight — only on desktop
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const sessionCards = document.querySelectorAll('.session-card');

    sessionCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-10px) rotateX(${y * -3}deg) rotateY(${x * 3}deg)`;
        card.style.transition = 'transform 0.1s ease';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s';
      });
    });
  }

  /* ── Retreat card image hover ────────────────────────────────────────── */
  document.querySelectorAll('.retreat-card').forEach((card) => {
    const img = card.querySelector('.retreat-img');
    if (!img) return;

    card.addEventListener('mouseenter', () => {
      img.style.transform = 'scale(1.05)';
      img.style.transition = 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
    });
    card.addEventListener('mouseleave', () => {
      img.style.transform = '';
    });
  });

  console.log('%cSĀVA Studio — A space to breathe.', 'font-family:Georgia,serif;font-size:14px;color:#9c8570;');
})();
