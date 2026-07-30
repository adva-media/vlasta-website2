/* ВЛАСТА-КОНСАЛТИНГ — interactions */
(function () {
  'use strict';

  /* Header shadow on scroll */
  var header = document.querySelector('.header');
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile nav */
  var burger = document.querySelector('.burger');
  var mnav = document.querySelector('.mnav');
  var overlay = document.querySelector('.overlay');
  var closeBtn = document.querySelector('.mnav__close');

  function openNav() {
    if (!mnav) return;
    mnav.classList.add('is-open');
    overlay.classList.add('is-open');
    burger.classList.add('is-open');
    document.body.classList.add('no-scroll');
  }
  function closeNav() {
    if (!mnav) return;
    mnav.classList.remove('is-open');
    overlay.classList.remove('is-open');
    burger.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
  }
  if (burger) burger.addEventListener('click', function () {
    mnav.classList.contains('is-open') ? closeNav() : openNav();
  });
  if (closeBtn) closeBtn.addEventListener('click', closeNav);
  if (overlay) overlay.addEventListener('click', closeNav);
  document.querySelectorAll('.mnav__link').forEach(function (a) {
    a.addEventListener('click', closeNav);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });

  /* Scroll reveal */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Animated counters */
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        var dur = 1500, start = null;
        function set(v) {
          if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.nodeValue = v;
          else el.textContent = v;
        }
        function tick(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          set(Math.round(eased * target));
          if (p < 1) requestAnimationFrame(tick);
          else set(target);
        }
        requestAnimationFrame(tick);
        co.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* Contact form (demo, no backend) */
  var form = document.querySelector('#contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = form.querySelector('.form__success');
      if (ok) ok.classList.add('show');
      form.reset();
      if (ok) ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* Footer year */
  var y = document.querySelector('#year');
  if (y) y.textContent = new Date().getFullYear();
})();

/* ===== V2: Day / night theme toggle ===== */
(function () {
  'use strict';
  var KEY = 'vlasta-theme';
  var root = document.documentElement;

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    document.querySelectorAll('.theme-toggle').forEach(function (b) {
      b.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    });
  }

  /* initial theme is set by the inline <head> script to avoid a flash;
     this only wires up the buttons */
  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  });

  /* follow OS changes if user never chose manually */
  try {
    if (!localStorage.getItem(KEY) && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      });
    }
  } catch (e) {}
})();

/* ===== V3: scroll progress, to-top, news filter, letter lightbox ===== */
(function () {
  'use strict';

  /* Scroll progress bar */
  var bar = document.querySelector('.scroll-progress');
  if (bar) {
    var setProgress = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', setProgress, { passive: true });
    setProgress();
  }

  /* Back-to-top button */
  var toTop = document.querySelector('.to-top');
  if (toTop) {
    window.addEventListener('scroll', function () {
      toTop.classList.toggle('show', window.scrollY > 500);
    }, { passive: true });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* News category filter chips */
  var chips = document.querySelectorAll('[data-news-filter]');
  var newsItems = document.querySelectorAll('[data-news-cat]');
  if (chips.length && newsItems.length) {
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('is-current'); });
        chip.classList.add('is-current');
        var cat = chip.getAttribute('data-news-filter');
        newsItems.forEach(function (item) {
          var show = cat === 'all' || item.getAttribute('data-news-cat') === cat;
          item.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* Thank-you letters lightbox (simple image viewer) */
  var letters = document.querySelectorAll('.letter');
  var lightbox = document.querySelector('.letter-lightbox');
  if (letters.length && lightbox) {
    var lbImg = lightbox.querySelector('img');
    var lbTitle = lightbox.querySelector('.letter-lightbox__title');
    var lbClose = lightbox.querySelector('.letter-lightbox__close');
    letters.forEach(function (letter) {
      letter.addEventListener('click', function () {
        var img = letter.querySelector('img');
        var name = letter.querySelector('.letter__name');
        if (lbImg && img) lbImg.src = img.src;
        if (lbTitle && name) lbTitle.textContent = name.textContent;
        lightbox.classList.add('is-open');
        document.documentElement.classList.add('is-letter-lightbox-open');
      });
    });
    function closeLightbox() {
      lightbox.classList.remove('is-open');
      document.documentElement.classList.remove('is-letter-lightbox-open');
    }
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
  }
})();
