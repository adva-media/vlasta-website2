/* ВЛАСТА-КОНСАЛТИНГ — interactions (no dependencies) */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------- theme */
  var KEY = 'vlasta-theme';
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem(KEY, t); } catch (e) {}
    $$('.tt').forEach(function (b) { b.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false'); });
  }
  setTheme(root.getAttribute('data-theme') || 'light');
  $$('.tt').forEach(function (b) {
    b.addEventListener('click', function () {
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  });
  try {
    if (!localStorage.getItem(KEY)) {
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      });
    }
  } catch (e) {}

  /* ------------------------------------------------ header + progress */
  var hdr = $('.hdr'), bar = $('.progress'), top = $('.totop');
  function onScroll() {
    var y = window.scrollY || 0;
    // over a photo hero the bar only materialises once the page moves
    if (hdr) hdr.classList.toggle('is-stuck', y > (doc.body.classList.contains('over-hero') ? 40 : 8));
    if (top) top.classList.toggle('is-on', y > 520);
    if (bar) {
      var max = root.scrollHeight - root.clientHeight;
      bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (top) top.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ------------------------------------------------------- mobile nav */
  var burger = $('.burger'), mnav = $('.mnav'), ovl = $('.overlay'), mx = $('.mnav__x');
  function nav(open) {
    if (!mnav) return;
    mnav.classList.toggle('is-open', open);
    mnav.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (ovl) ovl.classList.toggle('is-open', open);
    if (burger) {
      burger.classList.toggle('is-on', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    }
    root.classList.toggle('is-locked', open);
  }
  if (burger) burger.addEventListener('click', function () { nav(!mnav.classList.contains('is-open')); });
  if (mx) mx.addEventListener('click', function () { nav(false); });
  if (ovl) ovl.addEventListener('click', function () { nav(false); });
  $$('.mnav__l').forEach(function (a) { a.addEventListener('click', function () { nav(false); }); });

  /* --------------------------------------------------------- reveal */
  var rev = $$('.reveal');
  if (!reduce && 'IntersectionObserver' in window && rev.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    rev.forEach(function (el) { io.observe(el); });
  } else {
    rev.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ------------------------------- practice figures count up on first view */
  var figures = $$('[data-count]');
  if (figures.length) {
    var fmt = function (n, dec) {
      // Russian copy uses a comma for the decimal separator
      var s = dec ? n.toFixed(dec) : String(Math.round(n));
      return root.lang === 'en' ? s : s.replace('.', ',');
    };
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var out = $('.res__v, .geo__v', el);
      if (!out || isNaN(target)) return;
      if (reduce) { out.textContent = fmt(target, dec); return; }
      var start = null, dur = 1400;
      (function tick(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        out.textContent = fmt(target * eased, dec);
        if (p < 1) requestAnimationFrame(tick);
        else out.textContent = fmt(target, dec);
      })(performance.now());
    };
    if ('IntersectionObserver' in window) {
      var fo = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          run(e.target);
          fo.unobserve(e.target);
        });
      }, { threshold: 0.4 });
      figures.forEach(function (el) {
        var out = $('.res__v, .geo__v', el);
        if (out) out.textContent = '0';
        fo.observe(el);
      });
    } else {
      figures.forEach(run);
    }
  }

  /* --------------------------------------------- generic filter chips */
  function wireFilter(gridId, emptyId, countId, initial) {
    var grid = $('#' + gridId);
    if (!grid) return null;
    var items = $$('[data-cat]', grid);
    var empty = emptyId ? $('#' + emptyId) : null;
    var count = countId ? $('#' + countId) : null;
    var state = { cat: 'all', shown: initial || items.length };

    function matches(el) { return state.cat === 'all' || el.getAttribute('data-cat') === state.cat; }
    function apply() {
      var m = items.filter(matches), n = 0;
      items.forEach(function (el) { el.hidden = true; });
      m.forEach(function (el) { if (n++ < state.shown) el.hidden = false; });
      if (empty) empty.hidden = m.length !== 0;
      if (count) count.textContent = 'Показано ' + Math.min(state.shown, m.length) + ' из ' + m.length + ' материалов';
      var more = $('#newsMore');
      if (more) more.hidden = m.length <= state.shown;
      $$('.reveal', grid).forEach(function (el) { if (!el.hidden) el.classList.add('is-in'); });
    }
    apply();
    return {
      setCat: function (c) { state.cat = c; state.shown = initial || items.length; apply(); },
      more: function (step) { state.shown += step; apply(); },
    };
  }

  var newsF = wireFilter('newsGrid', 'newsEmpty', 'newsCount', 12);
  var caseF = wireFilter('caseGrid', 'caseEmpty', null, 0);

  $$('.chips').forEach(function (group) {
    var chips = $$('.chip[data-filter]', group);
    if (!chips.length) return;
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('is-on'); });
        chip.classList.add('is-on');
        var cat = chip.getAttribute('data-filter');
        if (newsF && $('#newsGrid')) newsF.setCat(cat);
        if (caseF && $('#caseGrid')) caseF.setCat(cat);
      });
    });
  });
  var moreBtn = $('#newsMore');
  if (moreBtn && newsF) moreBtn.addEventListener('click', function () { newsF.more(12); });

  /* ------------------------------------------------- dialog plumbing */
  /* Which input opened the dialog decides whether focus goes back to the
     trigger on close. Returning focus is right for the keyboard, but the
     carousels pause on :focus-within — so parking focus on a tile after a
     mouse click left the belt stopped for good once the cursor moved away. */
  var usingKeyboard = false;
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') usingKeyboard = true;
  }, true);
  doc.addEventListener('pointerdown', function () { usingKeyboard = false; }, true);

  var lastFocus = null, lastFocusByKeyboard = false;
  function openDialog(el) {
    lastFocus = doc.activeElement;
    lastFocusByKeyboard = usingKeyboard;
    el.hidden = false;
    root.classList.add('is-locked');
    /* Flush layout so the opening transition still runs from the closed state.
       A rAF would do the same but does not fire in a backgrounded tab, which
       would leave the dialog stuck half-open. */
    void el.offsetWidth;
    el.classList.add('is-open');
    /* Second flush: focus() tests focusability against the last computed
       style, which still says visibility:hidden until the new class is
       applied — without this the focus silently goes nowhere and Tab walks
       the page behind the dialog. The backdrop carries data-close too but is
       a div, so target a real control. */
    void el.offsetWidth;
    var f = el.querySelector('button, a[href]');
    if (f) f.focus();
  }
  function closeDialog(el) {
    el.classList.remove('is-open');
    root.classList.remove('is-locked');
    setTimeout(function () { el.hidden = true; }, 320);
    if (lastFocusByKeyboard && lastFocus && doc.contains(lastFocus)) {
      lastFocus.focus();               // keyboard: hand the trigger back
    } else if (doc.activeElement && doc.activeElement !== doc.body) {
      doc.activeElement.blur();        // mouse: never leave focus parked in a belt
    }
  }
  function wireClose(el) {
    $$('[data-close]', el).forEach(function (b) {
      b.addEventListener('click', function () { closeDialog(el); });
    });
  }

  /* ------------------------------------------- associations modal */
  var modal = $('#assocModal');
  var dataEl = $('#assocData');
  if (modal && dataEl) {
    var A = [];
    try { A = JSON.parse(dataEl.textContent); } catch (e) {}
    wireClose(modal);
    $$('[data-assoc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var a = A[+btn.getAttribute('data-assoc')];
        if (!a) return;
        var logo = $('#amLogo');
        logo.src = a.logo; logo.alt = a.name;
        $('#amMeta').textContent = a.meta;
        $('#amTitle').textContent = a.name;
        $('#amDesc').textContent = a.desc;
        var link = $('#amLink');
        link.href = a.url;
        link.querySelector('span').textContent = a.site;
        openDialog(modal);
      });
    });
  }

  /* ------------------------------------------------- letters lightbox */
  var lb = $('#lightbox');
  if (lb) {
    wireClose(lb);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeDialog(lb); });
    $$('[data-letter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var img = btn.querySelector('img');
        var name = btn.querySelector('.letter__n');
        var t = $('.lightbox__t', lb), i = $('.lightbox__b img', lb);
        if (i && img) { i.src = img.src; i.alt = img.alt; }
        if (t && name) t.textContent = name.textContent;
        openDialog(lb);
      });
    });
  }

  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (mnav && mnav.classList.contains('is-open')) nav(false);
    $$('.modal.is-open,.lightbox.is-open').forEach(closeDialog);
  });

  /* ------------------------------------------------- roadmap arc light */
  /* A light travels the milestone arc as the section scrolls past. The roadmap
     reads newest first, so moving down the page moves the light back through
     the years. The marker it is passing lights up, echoing the country
     outlines on the geography map. */
  var roads = $$('.road').map(function (road) {
    var lit = $('.road__arcLit', road), body = $('.road__body', road);
    if (!lit || !body || reduce || typeof lit.getTotalLength !== 'function') return null;
    var len = 0;
    try { len = lit.getTotalLength(); } catch (e) { return null; }
    if (!len) return null;
    var marks = $$('.road__i', road);
    // the drawn arc overshoots the first and last milestone by --over, so a
    // milestone's position along the path is not simply its position in the list
    var over = parseFloat(getComputedStyle(body).getPropertyValue('--over')) / 100 || 0;
    // where each milestone sits as a fraction of the column
    var mid = marks.map(function (_, i) { return (i + .5) / marks.length; });
    var seg = len * .16;
    lit.style.strokeDasharray = seg + ' ' + (len + seg);
    lit.classList.add('is-live');
    return { lit: lit, body: body, len: len, seg: seg, over: over,
             marks: marks, mid: mid, last: -1 };
  }).filter(Boolean);

  function paintRoads() {
    var vh = window.innerHeight || root.clientHeight;
    roads.forEach(function (r) {
      var b = r.body.getBoundingClientRect();
      /* Progress is measured against a reading line across the middle of the
         viewport, not the column's whole entry-to-exit travel. Spreading it
         over the entry and exit made the light drift out of step with the
         page: it was only two thirds of the way down by the time the last
         milestone was read, and finished its run off-screen. Tied to the
         reading line it stays on whichever milestone is at eye level. */
      var p = (vh * .5 - b.top) / b.height;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      // p is a fraction of the column; the drawn arc also covers the overshoot
      var g = (p + r.over) / (1 + 2 * r.over);
      // half a comet length back, so the head sits on the reading line
      r.lit.style.strokeDashoffset = r.seg / 2 - g * r.len;
      var near = -1, best = .5 / r.marks.length;
      r.mid.forEach(function (a, i) {
        var d = Math.abs(a - p);
        if (d < best) { best = d; near = i; }
      });
      if (near !== r.last) {
        r.marks.forEach(function (m, i) { m.classList.toggle('is-lit', i === near); });
        r.last = near;
      }
    });
  }

  if (roads.length) {
    var queued = false;
    var onRoadScroll = function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; paintRoads(); });
    };
    window.addEventListener('scroll', onRoadScroll, { passive: true });
    window.addEventListener('resize', onRoadScroll);
    paintRoads();
  }

  /* --------------------------- drag + wheel scrolling for horizontal rails */
  $$('.case-rail,.letters-rail,.assoc-rail').forEach(function (rail) {
    var down = false, moved = false, sx = 0, sl = 0, pid = null;

    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;   // native touch scrolling is better
      if (e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; pid = e.pointerId;
      /* Deliberately NOT capturing here. Capturing on pointerdown sends the
         following pointerup to the rail instead of the card, so the browser
         never raises a click on the link and the cards stop working. Capture
         only once a real drag is under way. */
    });

    rail.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (!moved) {
        if (Math.abs(dx) <= 4) return;         // still a click, leave it alone
        moved = true;
        rail.classList.add('is-drag');
        try { rail.setPointerCapture(pid); } catch (err) {}
      }
      rail.scrollLeft = sl - dx;
    });

    function end() {
      if (moved) { try { rail.releasePointerCapture(pid); } catch (err) {} }
      down = false; pid = null;
      rail.classList.remove('is-drag');
    }
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      rail.addEventListener(ev, end);
    });

    // swallow the click that ends a drag, so dragging never opens a card
    rail.addEventListener('click', function (e) {
      if (!moved) return;
      e.preventDefault(); e.stopPropagation();
      moved = false;
    }, true);

    /* No wheel hijacking. Turning vertical wheel into horizontal scroll meant
       the page stopped moving whenever the cursor was over a rail, and only
       resumed once the rail hit its end — which read as the scroll jamming. */
  });

  /* --------------------------------------------------- cookie consent */
  var ck = $('#cookie');
  if (ck) {
    var CK = 'vlasta-cookie';
    var stored = null;
    try { stored = localStorage.getItem(CK); } catch (e) {}
    if (!stored) {
      ck.hidden = false;
      // let it settle in after the page has painted, so it doesn't fight the hero
      setTimeout(function () { ck.classList.add('is-on'); }, 900);
    }
    $$('[data-ck]', ck).forEach(function (b) {
      b.addEventListener('click', function () {
        var choice = b.getAttribute('data-ck');
        try { localStorage.setItem(CK, choice); } catch (e) {}
        ck.classList.remove('is-on');
        setTimeout(function () { ck.hidden = true; }, 420);
        // analytics stay off unless the visitor opted in
        if (choice === 'all') doc.dispatchEvent(new CustomEvent('vlasta:analytics-allowed'));
      });
    });
  }

  /* ------------------------------------------- country map name tooltip */
  var cmap = $('.cmap');
  if (cmap) {
    var tip = $('.cmap__tip', cmap);
    var homes = $$('.cm__c--home', cmap);
    function showTip(el, ev) {
      var box = cmap.getBoundingClientRect();
      var r = el.getBoundingClientRect();
      var x = ev ? ev.clientX - box.left : r.left + r.width / 2 - box.left;
      var y = ev ? ev.clientY - box.top : r.top + r.height / 2 - box.top;
      tip.textContent = el.getAttribute('data-name') || '';
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
      tip.hidden = false;
    }
    homes.forEach(function (el) {
      el.addEventListener('pointerenter', function (e) { showTip(el, e); });
      el.addEventListener('pointermove', function (e) { showTip(el, e); });
      el.addEventListener('pointerleave', function () { tip.hidden = true; });
      el.addEventListener('focus', function () { showTip(el, null); });
      el.addEventListener('blur', function () { tip.hidden = true; });
    });
  }

  /* ----------------------------------------------------- contact form */
  var form = $('#contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var ok = $('#formOk');
      if (ok) { ok.classList.add('is-on'); ok.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); }
      form.reset();
    });
  }

  /* ------------------------------------------------------ footer year */
  var yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
