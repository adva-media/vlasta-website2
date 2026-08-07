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

  /* -------------------------------- CTA title: fade + slight rise once */
  (function () {
    var bands = $$('[data-cta]');
    if (!bands.length) return;

    function arm(band) {
      if (band.classList.contains('is-in')) return;
      band.classList.add('is-in');
    }

    if (reduce || !('IntersectionObserver' in window)) {
      bands.forEach(arm);
      return;
    }
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        arm(e.target);
        cio.unobserve(e.target);
      });
    }, { threshold: 0.28, rootMargin: '0px 0px -8% 0px' });
    bands.forEach(function (el) { cio.observe(el); });
  })();

  /* -------- Fabric mesh: MST graph + traveling pulses (CTA band + approach hex) */
  var FABRIC_TAU = Math.PI * 2;

  function bootFabricMesh(host, opts) {
    if (!host) return;
    opts = opts || {};
    var fieldClass = opts.fieldClass || 'cta__field';
    var blurClass = opts.blurClass || 'cta__blur';
    var observeEl = opts.observeEl || host;
    var alphaScale = opts.alphaScale == null ? 1 : opts.alphaScale;
    var exteriorRatio = opts.exteriorRatio == null ? 0.48 : opts.exteriorRatio;
    var pinBottom = opts.pinBottom !== false;
    var useBleedY = opts.bleedY !== 0;
    /* Horizontal overscan only when opted in (approach shell clips; CTA must not expand scrollWidth). */
    var useBleedX = opts.bleedX != null && opts.bleedX !== 0;
    var enabledMq = opts.enabledMq || null;
    /* Motion / size tuning — CTA defaults are bolder; approach passes softer values. */
    var sizeAmp = opts.sizeAmp == null ? 0.085 : opts.sizeAmp;
    var driftAmp = opts.driftAmp == null ? 1 : opts.driftAmp;
    var driftStyle = opts.driftStyle || 'orbit';
    var flowAmp = opts.flowAmp == null ? 1 : opts.flowAmp;
    var repelAmp = opts.repelAmp == null ? 1 : opts.repelAmp;
    var lineBreathe = opts.lineBreathe == null ? 0.1 : opts.lineBreathe;
    var pulseBoost = opts.pulseBoost == null ? 1 : opts.pulseBoost;
    var pingAmp = opts.pingAmp == null ? 1 : opts.pingAmp;
    var hubChance = opts.hubChance == null ? 0.18 : opts.hubChance;
    var softDrift = driftStyle === 'soft';

    var canvas = host.querySelector('.' + fieldClass);
    if (!canvas) {
      canvas = doc.createElement('canvas');
      canvas.className = fieldClass;
      canvas.setAttribute('aria-hidden', 'true');
      host.insertBefore(canvas, host.firstChild);
    }
    var blur = host.querySelector('.' + blurClass);
    if (!blur) {
      blur = doc.createElement('div');
      blur.className = blurClass;
      blur.setAttribute('aria-hidden', 'true');
      if (canvas.nextSibling) host.insertBefore(blur, canvas.nextSibling);
      else host.appendChild(blur);
    }
    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    var nodes = [];
    var edges = [];
    var pulses = [];
    var dpr = 1;
    var w = 0;
    var h = 0;
    var sw = 0;
    var sh = 0;
    var bleedX = 0;
    var bleedY = 0;
    var minDist = 48;
    var raf = 0;
    var visible = false;
    var staticDrawn = false;
    var t0 = performance.now();
    var lastNow = 0;
    var spawnAcc = 0;
    var dark = root.getAttribute('data-theme') === 'dark';
    var softStrongAcc = 0;
    /* Last size used to seed MST — idle motion must not rewire topology. */
    var seedW = 0;
    var seedH = 0;
    var graphSeeded = false;

    function meshEnabled() {
      return !enabledMq || enabledMq.matches;
    }

    function isDark() {
      return root.getAttribute('data-theme') === 'dark';
    }

    /* Indigo/slate — matches --accent (#535D86); avoid purple neon. */
    function violet(alpha, bright) {
      var r, g, b;
      var a = alpha * alphaScale;
      if (bright) {
        r = dark ? 176 : 100;
        g = dark ? 186 : 112;
        b = dark ? 214 : 154;
      } else {
        r = dark ? 148 : 83;
        g = dark ? 158 : 93;
        b = dark ? 188 : 134;
      }
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }

    /* Soften under copy / panel zones (section-local coords). */
    function zoneQuiet(x, y) {
      if (typeof opts.quietZone === 'function') {
        return opts.quietZone(x, y, sw, sh, bleedX, bleedY, w, h);
      }
      var nx = (x - bleedX) / Math.max(1, sw);
      var ny = (y - bleedY) / Math.max(1, sh);
      if (nx > 0.06 && nx < 0.58 && ny > 0.16 && ny < 0.84) return 0.5;
      return 1;
    }

    function inBand(x, y) {
      return x >= bleedX && x <= bleedX + sw && y >= bleedY && y <= bleedY + sh;
    }

    function sampleBleedPoint(pad) {
      var side = (Math.random() * 4) | 0;
      var x, y;
      if (side === 0) {
        x = pad + Math.random() * (w - pad * 2);
        y = pad + Math.random() * Math.max(1, bleedY - pad);
      } else if (side === 1) {
        x = pad + Math.random() * (w - pad * 2);
        y = bleedY + sh + Math.random() * Math.max(1, bleedY - pad);
      } else if (side === 2) {
        x = pad + Math.random() * Math.max(1, bleedX - pad);
        y = bleedY + Math.random() * sh;
      } else {
        x = bleedX + sw + Math.random() * Math.max(1, bleedX - pad);
        y = bleedY + Math.random() * sh;
      }
      return { x: x, y: y };
    }

    function pickDotSize() {
      var r = Math.random();
      if (r < hubChance) return 1.5;
      if (r < hubChance + 0.22) return 1.18;
      return 0.82 + Math.random() * 0.28;
    }

    function makeNode(x, y, sz, speedScale) {
      var ss = speedScale == null ? 1 : speedScale;
      return {
        x: x,
        y: y,
        homeX: x,
        homeY: y,
        vx: (Math.random() - 0.5) * 22 * ss,
        vy: (Math.random() - 0.5) * 22 * ss,
        wander: Math.random() * FABRIC_TAU,
        wanderSpeed: (0.55 + Math.random() * 1.35) * ss,
        orbitPhase: Math.random() * FABRIC_TAU,
        orbitR: (softDrift ? 4 : 7) + Math.random() * (softDrift ? 10 : 16),
        orbitSpeed: (0.18 + Math.random() * 0.42) * (Math.random() < 0.5 ? 1 : -1) * ss,
        speedMul: (0.65 + Math.random() * 0.85) * ss,
        size: sz,
        phase: Math.random() * FABRIC_TAU,
        breathSpeed: 0.45 + Math.random() * 0.55,
        breathPhase2: Math.random() * FABRIC_TAU,
        energy: 0,
        ping: 0
      };
    }

    function sampleNodes(count, spacing) {
      var pts = [];
      var pad = Math.max(6, spacing * 0.12);
      var attempts = 0;
      var maxAttempts = count * 90;
      var x, y, ok, i, dx, dy, need, needSq, wantExt, p, sz;
      var exteriorQuota = Math.max(0, Math.round(count * exteriorRatio));
      var exteriorCount = 0;
      while (pts.length < count && attempts < maxAttempts) {
        attempts++;
        sz = pickDotSize();
        wantExt = exteriorQuota > 0 && exteriorCount < exteriorQuota &&
          (pts.length - exteriorCount >= count - exteriorQuota || Math.random() < 0.55);
        if (wantExt && (bleedX > 0 || bleedY > 0)) {
          p = sampleBleedPoint(pad);
          x = p.x;
          y = p.y;
        } else {
          x = bleedX + pad + Math.random() * Math.max(1, sw - pad * 2);
          y = bleedY + pad + Math.random() * Math.max(1, sh - pad * 2);
        }
        ok = true;
        for (i = 0; i < pts.length; i++) {
          need = spacing * (pts[i].size + sz) * 0.5;
          needSq = need * need;
          dx = pts[i].x - x;
          dy = pts[i].y - y;
          if (dx * dx + dy * dy < needSq) { ok = false; break; }
        }
        if (!ok) continue;
        if (!inBand(x, y)) exteriorCount++;
        pts.push(makeNode(x, y, sz, 1));
      }
      if (!pinBottom) return pts;
      var edgeN = Math.max(2, Math.min(4, Math.round(count * 0.12)));
      var ei, ex, ey, eok, ej;
      for (ei = 0; ei < edgeN && pts.length < count + edgeN; ei++) {
        sz = pickDotSize();
        ex = bleedX + pad + Math.random() * Math.max(1, sw - pad * 2);
        ey = bleedY + sh - pad - Math.random() * Math.min(18, sh * 0.08);
        eok = true;
        for (ej = 0; ej < pts.length; ej++) {
          need = spacing * (pts[ej].size + sz) * 0.5 * 0.74;
          needSq = need * need;
          dx = pts[ej].x - ex;
          dy = pts[ej].y - ey;
          if (dx * dx + dy * dy < needSq) { eok = false; break; }
        }
        if (!eok) continue;
        pts.push(makeNode(ex, ey, sz, 0.85));
      }
      return pts;
    }

    function ufFind(parent, i) {
      while (parent[i] !== i) {
        parent[i] = parent[parent[i]];
        i = parent[i];
      }
      return i;
    }

    function buildConnectedGraph(pts, extraCount) {
      var n = pts.length;
      var list = [];
      var parent = new Array(n);
      var deg = new Array(n);
      var exterior = new Array(n);
      var candidates = [];
      var i, j, dx, dy, dist, c, a, b, ra, rb, key, used, extras, maxA, maxB, cross;
      if (n < 2) return list;

      for (i = 0; i < n; i++) {
        parent[i] = i;
        deg[i] = 0;
        exterior[i] = !inBand(pts[i].x, pts[i].y);
      }

      for (i = 0; i < n; i++) {
        for (j = i + 1; j < n; j++) {
          dx = pts[j].x - pts[i].x;
          dy = pts[j].y - pts[i].y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1) continue;
          cross = exterior[i] !== exterior[j];
          candidates.push({
            a: i,
            b: j,
            d: dist,
            score: dist * (cross ? 0.78 : 1),
            cross: cross
          });
        }
      }
      candidates.sort(function (u, v) { return u.score - v.score; });

      used = {};
      for (c = 0; c < candidates.length; c++) {
        a = candidates[c].a;
        b = candidates[c].b;
        ra = ufFind(parent, a);
        rb = ufFind(parent, b);
        if (ra === rb) continue;
        parent[ra] = rb;
        list.push({
          a: a,
          b: b,
          rest: candidates[c].d,
          len: candidates[c].d,
          glow: 0,
          phase: Math.random() * FABRIC_TAU
        });
        deg[a]++;
        deg[b]++;
        used[a + ':' + b] = 1;
        if (list.length >= n - 1) break;
      }

      candidates.sort(function (u, v) {
        if (u.cross !== v.cross) return u.cross ? -1 : 1;
        return u.d - v.d;
      });
      extras = 0;
      for (c = 0; c < candidates.length && extras < extraCount; c++) {
        a = candidates[c].a;
        b = candidates[c].b;
        key = a + ':' + b;
        if (used[key]) continue;
        maxA = exterior[a] ? 6 : 4;
        maxB = exterior[b] ? 6 : 4;
        if (deg[a] >= maxA || deg[b] >= maxB) continue;
        if (candidates[c].d > minDist * (candidates[c].cross ? 4.6 : 3.2)) continue;
        list.push({
          a: a,
          b: b,
          rest: candidates[c].d,
          len: candidates[c].d,
          glow: 0,
          phase: Math.random() * FABRIC_TAU
        });
        deg[a]++;
        deg[b]++;
        used[key] = 1;
        extras++;
      }
      return list;
    }

    function applyCanvasBox() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.top = -bleedY + 'px';
      canvas.style.left = -bleedX + 'px';
      canvas.style.right = 'auto';
      canvas.style.bottom = 'auto';
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      blur.style.cssText = 'inset:0';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function measureLayout() {
      /* Prefer observeEl (e.g. full plate) when host is an absolute fill layer. */
      var sizeEl = observeEl && observeEl !== host ? observeEl : host;
      sw = Math.max(1, sizeEl.offsetWidth || Math.round(sizeEl.getBoundingClientRect().width));
      sh = Math.max(1, sizeEl.offsetHeight || Math.round(sizeEl.getBoundingClientRect().height));
      if (sw < 8 || sh < 8) return false;
      bleedX = useBleedX ? Math.max(48, Math.min(110, Math.round(sw * 0.16))) : 0;
      bleedY = useBleedY ? Math.max(88, Math.min(168, Math.round(sh * 0.72))) : 0;
      /* Approach uses a modest vertical overscan so edges clip at the plate; CTA keeps taller bleed. */
      if (useBleedX && useBleedY) {
        bleedY = Math.max(56, Math.min(120, Math.round(sh * 0.22)));
      }
      w = sw + bleedX * 2;
      h = sh + bleedY * 2;
      return true;
    }

    function seedGraph() {
      var area = w * h;
      var target = Math.round(area / 16000);
      if (w < 640) target = Math.min(target, 20);
      else if (w < 1000) target = Math.min(target, 28);
      target = Math.max(w < 640 ? 14 : 18, Math.min(36, target));
      if (!useBleedY && !useBleedX) {
        /* Compact stage: slightly denser than CTA bleed canvas. */
        target = Math.max(12, Math.min(26, Math.round(area / 14000)));
      }
      /* Approach plate overscan: keep mobile lighter while still reading as a network. */
      if (useBleedX && sw < 640) {
        target = Math.max(12, Math.min(16, target));
      }

      minDist = Math.max(useBleedY || useBleedX ? 68 : 52, Math.sqrt(area / (target * 0.78)));
      if (useBleedY || useBleedX) minDist = Math.max(minDist, useBleedX ? 62 : 75);

      nodes = sampleNodes(target, minDist);
      edges = buildConnectedGraph(nodes, Math.max(5, Math.round(target * 0.42)));
      pulses = [];
      spawnAcc = 0.4;
      softStrongAcc = 0;
      seedW = w;
      seedH = h;
      graphSeeded = true;
      staticDrawn = false;
      lastNow = 0;
    }

    /* Keep the same MST; only stretch homes/positions when the box changes a little. */
    function remapGraph(prevW, prevH) {
      if (!prevW || !prevH || !nodes.length) return;
      var sx = w / prevW;
      var sy = h / prevH;
      var sr = (sx + sy) * 0.5;
      var i, n, ed;
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        n.x *= sx;
        n.y *= sy;
        n.homeX *= sx;
        n.homeY *= sy;
        n.orbitR *= sr;
      }
      for (i = 0; i < edges.length; i++) {
        ed = edges[i];
        ed.rest *= sr;
      }
      minDist *= sr;
      syncEdgeLens();
      seedW = w;
      seedH = h;
    }

    function needsTopologyReseed(prevW, prevH) {
      if (!graphSeeded || !nodes.length) return true;
      if (!prevW || !prevH) return true;
      /* Prefer remapping the fixed MST. Reseed only on breakpoint hops or
         a drastic box change (true window resize) — never on idle timers. */
      if ((seedW < 640) !== (w < 640)) return true;
      if ((seedW < 1000) !== (w < 1000)) return true;
      var dw = Math.abs(w - seedW) / Math.max(1, seedW);
      var dh = Math.abs(h - seedH) / Math.max(1, seedH);
      if (dw > 0.28 || dh > 0.38) return true;
      return false;
    }

    function rebuild(forceSeed) {
      if (!meshEnabled()) {
        pause();
        return;
      }
      var prevW = w;
      var prevH = h;
      if (!measureLayout()) {
        pause();
        return;
      }
      applyCanvasBox();

      if (forceSeed || needsTopologyReseed(prevW, prevH)) {
        seedGraph();
      } else if (prevW && prevH && (w !== prevW || h !== prevH) && graphSeeded) {
        remapGraph(prevW, prevH);
        staticDrawn = false;
        lastNow = 0;
      }
    }

    function excite(idx, amount) {
      if (idx < 0 || idx >= nodes.length) return;
      nodes[idx].energy = Math.min(1, nodes[idx].energy + amount);
    }

    function pingNode(idx, amount) {
      if (idx < 0 || idx >= nodes.length) return;
      var n = nodes[idx];
      n.ping = Math.min(1, n.ping + amount * pingAmp);
      excite(idx, amount * 0.55);
    }

    function syncEdgeLens() {
      var i, ed, a, b, dx, dy;
      for (i = 0; i < edges.length; i++) {
        ed = edges[i];
        a = nodes[ed.a];
        b = nodes[ed.b];
        dx = b.x - a.x;
        dy = b.y - a.y;
        ed.len = Math.sqrt(dx * dx + dy * dy) || 0.001;
      }
    }

    /* Cheap multi-octave flow — readable network drift, not Brownian chaos. */
    function flowAt(x, y, t) {
      var t1 = t * 0.11;
      var t2 = t * 0.07;
      var fx =
        Math.sin(x * 0.0038 + t1) * Math.cos(y * 0.0031 - t2) +
        0.45 * Math.sin(x * 0.007 + y * 0.0025 + t * 0.09);
      var fy =
        Math.cos(x * 0.0032 - t2) * Math.sin(y * 0.0042 + t1) +
        0.45 * Math.cos(y * 0.0065 - x * 0.002 + t * 0.08);
      return { fx: fx, fy: fy };
    }

    function updateDrift(dt, t) {
      var i, j, n, ed, a, b, dx, dy, dist, f, nx, ny, rest, pad, sep, sepSq;
      var sepBase = minDist * 1.12;
      var amp = driftAmp * (softDrift ? 0.72 : 1);
      var jitter = softDrift ? 36 : 58;
      var wanderF = softDrift ? 26 : 38;
      var homeK = softDrift ? 0.012 : 0.008;
      var flowK = (softDrift ? 22 : 34) * flowAmp * amp;
      var orbitK = softDrift ? 0.55 : 0.85;
      var fl, ox, oy, maxSp;

      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        n.wander += n.wanderSpeed * dt * amp;
        n.orbitPhase += n.orbitSpeed * dt * amp;

        /* Soft wander steering */
        n.vx += Math.cos(n.wander) * wanderF * n.speedMul * amp * dt;
        n.vy += Math.sin(n.wander * 0.87 + n.phase) * wanderF * n.speedMul * amp * dt;

        /* Slight orbital pull around home — keeps graph readable */
        if (driftStyle !== 'wander') {
          ox = n.homeX + Math.cos(n.orbitPhase) * n.orbitR;
          oy = n.homeY + Math.sin(n.orbitPhase * 1.13) * n.orbitR * 0.72;
          n.vx += (ox - n.x) * orbitK * amp * dt;
          n.vy += (oy - n.y) * orbitK * amp * dt;
        }

        /* Home spring — prevents long-term drift collapse / chaos */
        n.vx += (n.homeX - n.x) * homeK * dt * 60;
        n.vy += (n.homeY - n.y) * homeK * dt * 60;

        /* Soft flow field */
        fl = flowAt(n.x, n.y, t);
        n.vx += fl.fx * flowK * n.speedMul * dt;
        n.vy += fl.fy * flowK * n.speedMul * dt;

        /* Tiny residual noise */
        n.vx += (Math.random() - 0.5) * jitter * amp * dt;
        n.vy += (Math.random() - 0.5) * jitter * amp * dt;

        /* Mild center bias */
        n.vx += ((bleedX + sw * 0.5) - n.x) * 0.0016 * amp * dt;
        n.vy += ((bleedY + sh * 0.5) - n.y) * 0.0022 * amp * dt;
      }

      for (i = 0; i < nodes.length; i++) {
        for (j = i + 1; j < nodes.length; j++) {
          a = nodes[i];
          b = nodes[j];
          sep = sepBase * (a.size + b.size) * 0.5 * (1 + Math.max(a.energy, b.energy) * 0.55);
          sepSq = sep * sep;
          dx = b.x - a.x;
          dy = b.y - a.y;
          dist = dx * dx + dy * dy;
          if (dist >= sepSq || dist < 0.0001) continue;
          dist = Math.sqrt(dist);
          f = (sep - dist) / sep * 42 * repelAmp * amp * dt;
          nx = dx / dist;
          ny = dy / dist;
          a.vx -= nx * f;
          a.vy -= ny * f;
          b.vx += nx * f;
          b.vy += ny * f;
        }
      }

      for (i = 0; i < edges.length; i++) {
        ed = edges[i];
        a = nodes[ed.a];
        b = nodes[ed.b];
        dx = b.x - a.x;
        dy = b.y - a.y;
        dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        rest = ed.rest || dist;
        f = (dist - rest) * 0.02 * amp * dt;
        nx = dx / dist;
        ny = dy / dist;
        a.vx += nx * f;
        a.vy += ny * f;
        b.vx -= nx * f;
        b.vy -= ny * f;
      }

      pad = 10;
      maxSp = softDrift ? 48 : 68;
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        n.vx *= Math.pow(0.93, dt * 60);
        n.vy *= Math.pow(0.93, dt * 60);
        var speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > maxSp) {
          n.vx = n.vx / speed * maxSp;
          n.vy = n.vy / speed * maxSp;
        }
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < pad) { n.x = pad; n.vx *= -0.4; }
        if (n.x > w - pad) { n.x = w - pad; n.vx *= -0.4; }
        if (n.y < pad) { n.y = pad; n.vy *= -0.4; }
        if (n.y > h - pad) { n.y = h - pad; n.vy *= -0.4; }

        /* Slowly migrate home so the field can breathe without snapping */
        n.homeX += (n.x - n.homeX) * 0.04 * dt;
        n.homeY += (n.y - n.homeY) * 0.04 * dt;
      }
      syncEdgeLens();
    }

    function spawnPulse(forceStrong) {
      if (!edges.length) return;
      var ei = (Math.random() * edges.length) | 0;
      var forward = Math.random() < 0.5;
      var strong = forceStrong || Math.random() < (0.16 * pulseBoost);
      var base = strong ? 0.4 : 0.26;
      var spread = strong ? 0.38 : 0.3;
      pulses.push({
        e: ei,
        t: forward ? 0 : 1,
        speed: (base + Math.random() * spread) * (forward ? 1 : -1),
        power: strong ? 1.55 + Math.random() * 0.35 : 1,
        hitA: forward,
        hitB: !forward
      });
      var ed = edges[ei];
      pingNode(forward ? ed.a : ed.b, strong ? 0.95 : 0.7);
    }

    function updatePulses(dt) {
      var i, p, ed, arrived;
      var targetLive = Math.max(2, Math.min(5, Math.round(edges.length * 0.18 * (0.85 + 0.2 * pulseBoost))));
      var spawnGap = softDrift ? 0.75 : 0.55;

      spawnAcc += dt * pulseBoost;
      softStrongAcc += dt;
      while (pulses.length < targetLive && spawnAcc > 0) {
        spawnPulse(false);
        spawnAcc -= spawnGap + Math.random() * (softDrift ? 1.1 : 0.85);
      }
      if (pulses.length >= targetLive) spawnAcc = Math.min(spawnAcc, 0.2);

      /* Occasional stronger hero pulse */
      if (softStrongAcc > (softDrift ? 4.2 : 2.8) / Math.max(0.5, pulseBoost)) {
        softStrongAcc = 0;
        if (pulses.length < targetLive + 1) spawnPulse(true);
      }

      for (i = pulses.length - 1; i >= 0; i--) {
        p = pulses[i];
        ed = edges[p.e];
        if (!ed) { pulses.splice(i, 1); continue; }

        p.t += p.speed * dt / Math.max(0.001, ed.len / 150);
        ed.glow = Math.min(1, ed.glow + dt * 2.2 * (p.power || 1));

        arrived = false;
        if (p.speed > 0) {
          if (!p.hitA && p.t >= 0) { pingNode(ed.a, 0.85 * (p.power || 1)); p.hitA = true; }
          if (!p.hitB && p.t >= 0.97) { pingNode(ed.b, 1 * (p.power || 1)); p.hitB = true; }
          if (p.t >= 1.02) arrived = true;
        } else {
          if (!p.hitB && p.t <= 1) { pingNode(ed.b, 0.85 * (p.power || 1)); p.hitB = true; }
          if (!p.hitA && p.t <= 0.03) { pingNode(ed.a, 1 * (p.power || 1)); p.hitA = true; }
          if (p.t <= -0.02) arrived = true;
        }

        if (arrived) {
          var at = p.speed > 0 ? ed.b : ed.a;
          var hops = [];
          var j, e2;
          for (j = 0; j < edges.length; j++) {
            if (j === p.e) continue;
            e2 = edges[j];
            if (e2.a === at || e2.b === at) hops.push(j);
          }
          if (hops.length && Math.random() < (0.58 + (p.power > 1.2 ? 0.18 : 0))) {
            var next = hops[(Math.random() * hops.length) | 0];
            e2 = edges[next];
            var fwd = e2.a === at;
            var keepStrong = p.power > 1.2 && Math.random() < 0.35;
            pulses[i] = {
              e: next,
              t: fwd ? 0 : 1,
              speed: ((keepStrong ? 0.4 : 0.26) + Math.random() * 0.3) * (fwd ? 1 : -1),
              power: keepStrong ? p.power * 0.85 : 1,
              hitA: fwd,
              hitB: !fwd
            };
            pingNode(at, 0.4);
          } else {
            pulses.splice(i, 1);
          }
        }
      }

      for (i = 0; i < edges.length; i++) {
        edges[i].glow = Math.max(0, edges[i].glow - dt * 1.05);
      }
      for (i = 0; i < nodes.length; i++) {
        if (nodes[i].energy > 0) {
          nodes[i].energy = Math.max(0, nodes[i].energy - dt * 1.35);
        }
        if (nodes[i].ping > 0) {
          nodes[i].ping = Math.max(0, nodes[i].ping - dt * 2.4);
        }
      }
    }

    function drawEdges(t, animate) {
      var i, ed, a, b, alpha, q, lw, mid, breath;
      ctx.lineCap = 'round';
      for (i = 0; i < edges.length; i++) {
        ed = edges[i];
        a = nodes[ed.a];
        b = nodes[ed.b];
        q = (zoneQuiet(a.x, a.y) + zoneQuiet(b.x, b.y)) * 0.5;
        mid = Math.min(1, Math.max(0.35, 1 - ed.len / (minDist * 5.5)));
        breath = animate
          ? (1 + lineBreathe * Math.sin(t * 0.38 + (ed.phase || 0)))
          : 1;
        alpha = (0.11 + mid * 0.1 + ed.glow * 0.14) * q * breath;
        if (alpha < 0.02) continue;
        lw = (1.05 + mid * 0.35 + ed.glow * 0.4) * (0.92 + 0.08 * breath);
        ctx.lineWidth = lw;
        ctx.strokeStyle = violet(alpha, ed.glow > 0.3);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    function drawPulses() {
      var i, p, ed, a, b, t, dx, dy, len, half, t0p, t1, x0, y0, x1, y1, q, mx, my, pow;
      ctx.lineCap = 'round';
      for (i = 0; i < pulses.length; i++) {
        p = pulses[i];
        ed = edges[p.e];
        if (!ed) continue;
        a = nodes[ed.a];
        b = nodes[ed.b];
        dx = b.x - a.x;
        dy = b.y - a.y;
        len = ed.len || Math.sqrt(dx * dx + dy * dy) || 1;
        t = Math.max(0, Math.min(1, p.t));
        pow = p.power || 1;
        half = Math.min(0.22, (18 * Math.min(1.35, pow)) / len);
        t0p = Math.max(0, t - half);
        t1 = Math.min(1, t + half * 0.35);
        x0 = a.x + dx * t0p;
        y0 = a.y + dy * t0p;
        x1 = a.x + dx * t1;
        y1 = a.y + dy * t1;
        mx = (x0 + x1) * 0.5;
        my = (y0 + y1) * 0.5;
        q = zoneQuiet(mx, my);

        ctx.strokeStyle = violet(0.2 * q * Math.min(1.25, pow), true);
        ctx.lineWidth = 3.8 * Math.min(1.4, pow);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();

        ctx.strokeStyle = violet(0.72 * q * Math.min(1.2, pow), true);
        ctx.lineWidth = 2.2 * Math.min(1.35, pow);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }

    function drawNodes(animate, t) {
      var i, n, sc, alpha, en, baseR, r, breath, ping, ring;
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        en = n.energy;
        ping = n.ping || 0;
        /* Slow dual-frequency organic size breath — not strobe */
        breath = animate
          ? sizeAmp * (
              0.72 * Math.sin(t * n.breathSpeed + n.phase) +
              0.28 * Math.sin(t * n.breathSpeed * 0.37 + n.breathPhase2)
            )
          : 0;
        sc = n.size * (1 + breath + en * 0.95 + ping * 0.35);
        baseR = 4.9 * sc;
        r = Math.min(baseR, minDist * 0.34 * n.size);
        alpha = (0.28 + en * 0.5 + ping * 0.18) * zoneQuiet(n.x, n.y);
        if (alpha < 0.04 && ping < 0.05) continue;

        if (en > 0.08 || ping > 0.12) {
          var halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * (3.2 + ping * 1.4));
          halo.addColorStop(0, violet(0.28 * Math.max(en, ping * 0.85), true));
          halo.addColorStop(1, violet(0, true));
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * (3.2 + ping * 1.4), 0, FABRIC_TAU);
          ctx.fill();
        }

        /* Brief arrival ping ring */
        if (ping > 0.04) {
          ring = r * (1.6 + (1 - ping) * 2.4);
          ctx.beginPath();
          ctx.arc(n.x, n.y, ring, 0, FABRIC_TAU);
          ctx.strokeStyle = violet(0.28 * ping * zoneQuiet(n.x, n.y), true);
          ctx.lineWidth = 1.1 + ping * 0.8;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, FABRIC_TAU);
        ctx.fillStyle = violet(Math.min(0.82, alpha), en > 0.18 || ping > 0.25);
        ctx.fill();
      }
    }

    function paint(t, animate, dt) {
      dark = isDark();
      ctx.clearRect(0, 0, w, h);
      if (animate) {
        updateDrift(dt || 0.016, t);
        updatePulses(dt || 0.016);
      } else {
        syncEdgeLens();
      }
      drawEdges(t, animate);
      if (animate) drawPulses();
      drawNodes(animate, t);
    }

    function frame(now) {
      raf = 0;
      if (!visible || reduce || !meshEnabled()) return;
      var dt = lastNow ? Math.min(0.05, (now - lastNow) * 0.001) : 0.016;
      lastNow = now;
      paint((now - t0) * 0.001, true, dt);
      raf = requestAnimationFrame(frame);
    }

    function play() {
      if (!meshEnabled()) return;
      if (reduce) {
        if (!staticDrawn) {
          paint(0, false, 0);
          staticDrawn = true;
        }
        return;
      }
      if (!visible || raf) return;
      lastNow = 0;
      raf = requestAnimationFrame(frame);
    }

    function pause() {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      lastNow = 0;
    }

    rebuild(true);

    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          visible = e.isIntersecting && e.intersectionRatio > 0.02;
          if (visible) play();
          else pause();
        });
      }, { threshold: [0, 0.05, 0.15], rootMargin: '100px 0px 100px 0px' });
      vio.observe(observeEl);
    } else {
      visible = true;
      play();
    }

    var resizeTimer = 0;
    function onResize(forceSeed) {
      clearTimeout(resizeTimer);
      /* Settle before touching topology — hex open height anim must not reseed mid-flight. */
      resizeTimer = setTimeout(function () {
        rebuild(forceSeed === true);
        if (!meshEnabled()) return;
        if (reduce) {
          paint(0, false, 0);
          staticDrawn = true;
        } else if (visible) play();
      }, 280);
    }
    addEventListener('resize', onResize, { passive: true });
    if (typeof ResizeObserver === 'function') {
      var ro = new ResizeObserver(function () { onResize(false); });
      ro.observe(host);
      if (observeEl !== host) ro.observe(observeEl);
    }
    if (enabledMq) {
      var onMq = function () { onResize(true); };
      if (enabledMq.addEventListener) enabledMq.addEventListener('change', onMq);
      else if (enabledMq.addListener) enabledMq.addListener(onMq);
    }

    var mo = new MutationObserver(function () {
      dark = isDark();
      if (reduce && meshEnabled()) {
        paint(0, false, 0);
        staticDrawn = true;
      }
    });
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    if (reduce && meshEnabled()) {
      paint(0, false, 0);
      staticDrawn = true;
    }
  }

  $$('.sec--cta').forEach(function (sec) {
    bootFabricMesh(sec, {
      fieldClass: 'cta__field',
      blurClass: 'cta__blur',
      sizeAmp: 0.1,
      driftStyle: 'orbit',
      driftAmp: 1.08,
      flowAmp: 1.05,
      lineBreathe: 0.12,
      pulseBoost: 1.15,
      pingAmp: 1.1,
      hubChance: 0.2
    });
  });

  (function () {
    var mesh = doc.querySelector('#apprHex .appr-hex__mesh');
    if (!mesh) return;
    var shell = mesh.closest('.appr-hex__shell') || mesh;
    bootFabricMesh(mesh, {
      fieldClass: 'appr-hex__field',
      blurClass: 'appr-hex__blur',
      /* Overscan canvas inside overflow:hidden shell — exterior nodes clip mid-edge. */
      bleedX: true,
      bleedY: true,
      exteriorRatio: 0.46,
      pinBottom: false,
      alphaScale: 0.74,
      /* Softer under frost — impressive but must not overpower hexes/text. */
      sizeAmp: 0.055,
      driftStyle: 'soft',
      driftAmp: 0.78,
      flowAmp: 0.7,
      repelAmp: 0.85,
      lineBreathe: 0.06,
      pulseBoost: 0.82,
      pingAmp: 0.75,
      hubChance: 0.14,
      /* Size + visibility track the full white plate, not just the hex column. */
      observeEl: shell,
      quietZone: function (x, y, sw, sh, bleedX, bleedY) {
        var nx = (x - (bleedX || 0)) / Math.max(1, sw);
        var ny = (y - (bleedY || 0)) / Math.max(1, sh);
        var desk = typeof matchMedia === 'function' && matchMedia('(min-width:900px)').matches;
        if (desk) {
          /* Soften on the copy half; keep density toward the hex column. */
          if (nx < 0.42) return 0.22 + nx * 0.55;
          if (nx > 0.28 && nx < 0.72 && ny > 0.12 && ny < 0.58) return 0.38;
          return 0.85;
        }
        /* Mobile stack: quiet under copy, mesh readable behind the hex V. */
        if (ny < 0.36) return 0.16 + ny * 0.55;
        if (ny < 0.5) return 0.36 + (ny - 0.36) * 2.4;
        return 0.88;
      }
    });
  })();


  /* Open a service fold when linked as #service-icon (homepage bullets). */
  function openHashFold() {
    var id = (location.hash || '').slice(1);
    if (!id) return;
    var el = doc.getElementById(id);
    if (el && el.tagName === 'DETAILS') el.open = true;
  }
  openHashFold();
  window.addEventListener('hashchange', openHashFold);

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
      var out = $('.res__v, .geo__v, .stat__v', el);
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
        var out = $('.res__v, .geo__v, .stat__v', el);
        if (out) out.textContent = '0';
        fo.observe(el);
      });
    } else {
      figures.forEach(run);
    }
  }

  /* -------------------- intro KPI watermark: subtle vertical parallax */
  (function () {
    var row = $('.stats');
    var mark = row && $('.stats__mark', row);
    if (!row || !mark || reduce) return;
    var pending = false;
    function frame() {
      pending = false;
      var rect = row.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      // 0 when row center is mid-viewport; drifts ±~18px as it scrolls past
      var mid = rect.top + rect.height * 0.5;
      var t = (mid - vh * 0.5) / vh;
      var py = Math.max(-18, Math.min(18, t * -28));
      row.style.setProperty('--stats-py', py.toFixed(2) + 'px');
    }
    function onMove() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(frame);
    }
    window.addEventListener('scroll', onMove, { passive: true });
    window.addEventListener('resize', onMove, { passive: true });
    frame();
  })();

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
    /* Sections use position:relative + z-index, which traps position:fixed
       dialogs in that stacking context — the next .sec paints over them.
       Park overlays on <body> so they sit above the whole page. */
    if (el.parentNode !== doc.body) doc.body.appendChild(el);
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
        var yearWrap = $('#amYearWrap');
        var yearEl = $('#amYear');
        if (yearWrap && yearEl) {
          if (a.year) {
            yearEl.textContent = a.year;
            yearWrap.hidden = false;
          } else {
            yearEl.textContent = '';
            yearWrap.hidden = true;
          }
        }
        var metaWrap = $('#amMetaWrap');
        var metaL = $('#amMetaL');
        var meta = $('#amMeta');
        if (metaWrap && meta) {
          if (a.meta) {
            if (metaL) metaL.textContent = a.metaLabel || '';
            meta.textContent = a.meta;
            metaWrap.hidden = false;
          } else {
            if (metaL) metaL.textContent = '';
            meta.textContent = '';
            metaWrap.hidden = true;
          }
        }
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
  /* Progress trail uses getTotalLength() dashes. The tip is a circle placed
     with getPointAtLength along the rising path (including the ahead stretch
     past the last year). */
  var roads = $$('.road').map(function (road) {
    var body = $('.road__body', road);
    if (!body || reduce) return null;
    var doneEl = $('.road__arcH .road__arcDone', road);
    var tipEl = $('.road__arcH .road__arcTip', road);
    var svg = $('.road__arcH', road);
    var marks = $$('.road__i', road);
    var list = $('.road__list', road);
    if (!marks.length || !list || !doneEl || typeof doneEl.getTotalLength !== 'function') return null;
    var len = 0;
    try { len = doneEl.getTotalLength(); } catch (e) { return null; }
    if (!len) return null;
    doneEl.style.strokeDasharray = String(len);
    doneEl.style.strokeDashoffset = String(len);
    doneEl.classList.add('is-live');
    if (tipEl) tipEl.classList.add('is-live');
    body.addEventListener('scroll', function () { paintRoads(); }, { passive: true });
    return { body: body, list: list, svg: svg, done: doneEl, tip: tipEl, len: len,
             marks: marks, last: -1 };
  }).filter(Boolean);

  function roadMarkMids(r) {
    var svg = r.svg;
    if (!svg) {
      return r.marks.map(function (_, i) { return (i + .5) / r.marks.length; });
    }
    var sr = svg.getBoundingClientRect();
    var w = sr.width || 1;
    return r.marks.map(function (m) {
      var mr = m.getBoundingClientRect();
      var x = (mr.left + mr.width * .5 - sr.left) / w;
      return x < 0 ? 0 : x > 1 ? 1 : x;
    });
  }

  /* Soft edge fades only on the overflowing side — start/end stay fully readable. */
  function roadEdgeFade(body) {
    if (!body) return;
    var max = Math.max(0, body.scrollWidth - body.clientWidth);
    var sl = body.scrollLeft;
    var atStart = sl <= 3;
    var atEnd = max <= 3 || sl >= max - 3;
    /* Prefer the ahead tip of the trail; fall back to the last milestone. */
    if (!atEnd) {
      var endEl = body.querySelector('.road__ahead') || body.querySelector('.road__i:last-child');
      if (endEl) {
        var br = body.getBoundingClientRect();
        atEnd = endEl.getBoundingClientRect().right <= br.right - 2;
      }
    }
    if (atStart) body.style.setProperty('--fade-l', '0px');
    else body.style.removeProperty('--fade-l');
    if (atEnd) body.style.setProperty('--fade-r', '0px');
    else body.style.removeProperty('--fade-r');
  }

  /* Edge fades must run even when arc light is skipped (reduced motion). */
  var roadRails = $$('.road__body');
  roadRails.forEach(function (rail) {
    rail.addEventListener('scroll', function () { roadEdgeFade(rail); }, { passive: true });
    roadEdgeFade(rail);
  });
  window.addEventListener('resize', function () {
    roadRails.forEach(roadEdgeFade);
  });

  function roadProgress(r) {
    var body = r.body;
    /* Include the ahead stretch past the last year so the tip keeps moving. */
    var maxBody = body.scrollWidth - body.clientWidth;
    if (maxBody <= 1) return 1;
    if (body.scrollLeft >= maxBody - 2) return 1;
    var p = body.scrollLeft / maxBody;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  }

  function paintRoads() {
    var vh = window.innerHeight || root.clientHeight;
    roads.forEach(function (r) {
      var p = roadProgress(r);
      /* Page-scroll fallback only when the rail truly does not overflow. */
      if (r.body.scrollWidth <= r.body.clientWidth + 12) {
        var b = r.body.getBoundingClientRect();
        p = (vh * .55 - b.top) / Math.max(1, b.height + vh * .2);
        p = p < 0 ? 0 : p > 1 ? 1 : p;
      }
      r.done.style.strokeDashoffset = String(r.len * (1 - p));
      if (r.tip && typeof r.done.getPointAtLength === 'function') {
        var pt = r.done.getPointAtLength(Math.max(0, Math.min(r.len, p * r.len)));
        r.tip.setAttribute('cx', pt.x);
        r.tip.setAttribute('cy', pt.y);
      }
      roadEdgeFade(r.body);
      var mids = roadMarkMids(r);
      var near = -1, best = .55 / r.marks.length;
      mids.forEach(function (a, i) {
        var d = Math.abs(a - p);
        if (d < best) { best = d; near = i; }
      });
      if (near !== r.last) {
        r.marks.forEach(function (m, i) { m.classList.toggle('is-lit', i === near); });
        r.last = near;
      }
    });
  }

  /* ------------------------------------------- geography panes catch light */
  /* One value, --sweep, for how far the row has crossed the viewport. The
     panes read it in CSS and offset it per tile, so the light drifts across
     them as the page moves rather than looping on its own. */
  var geoBar = reduce ? null : $('.geo__bar');
  function paintGeo() {
    if (!geoBar) return;
    var b = geoBar.getBoundingClientRect();
    var vh = window.innerHeight || root.clientHeight;
    var p = (vh - b.top) / (vh + b.height);
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    geoBar.style.setProperty('--sweep', p.toFixed(3));
  }

  /* ------------------------------------- the article hero pans down its photo */
  /* It opens on the top edge of the picture and travels toward the bottom while
     the visitor scrolls from the hero into the article body, so a face near the
     top is never cropped off on the first screen. Landscape heroes still sweep
     the full frame (--bgy 0→100). Very vertical photos (height/width above
     PHERO_PORTRAIT_RATIO) cap travel at PHERO_PORTRAIT_TRAVEL so the scrub
     covers roughly half of the image instead of racing head-to-toe. Override with
     data-portrait-travel="0.5"–"1" (or 50–100) on .phero--photo if needed. */
  var phero = reduce ? null : $('.phero--photo');
  var PHERO_PORTRAIT_RATIO = 1.2;
  var PHERO_PORTRAIT_TRAVEL = 0.5;
  var pheroMax = 100;

  function resolvePheroMax() {
    if (!phero) return;
    var override = phero.getAttribute('data-portrait-travel');
    if (override != null && override !== '') {
      var t = parseFloat(override);
      if (!isNaN(t) && t > 0) {
        pheroMax = t <= 1 ? t * 100 : Math.min(100, t);
        if (pheroMax < 100) phero.setAttribute('data-portrait', '');
        return;
      }
    }
    var bg = getComputedStyle(phero).backgroundImage;
    var m = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(bg);
    if (!m) return;
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth || 0, h = img.naturalHeight || 0;
      if (w > 0 && h / w > PHERO_PORTRAIT_RATIO) {
        pheroMax = PHERO_PORTRAIT_TRAVEL * 100;
        phero.setAttribute('data-portrait', '');
      }
      paintPhero();
    };
    img.src = m[1];
  }

  function paintPhero() {
    if (!phero) return;
    var b = phero.getBoundingClientRect();
    /* A shorter travel distance means the same scroll covers more of the photo —
       the pan finishes while the hero is still partly on screen. */
    var p = -b.top / Math.max(1, b.height * .48);
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    phero.style.setProperty('--bgy', (p * pheroMax).toFixed(1));
  }
  resolvePheroMax();

  if (roads.length || geoBar || phero) {
    var queued = false;
    var onPaintScroll = function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false; paintRoads(); paintGeo(); paintPhero();
      });
    };
    window.addEventListener('scroll', onPaintScroll, { passive: true });
    window.addEventListener('resize', onPaintScroll);
    paintRoads();
    paintGeo();
    paintPhero();
  }

  /* --------------------------- drag + wheel scrolling for horizontal rails */
  $$('.case-rail,.letters-rail,.assoc-rail,.news-rail').forEach(function (rail) {
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

  /* -------- roadmap: lerped scroll + long coast (buttery, soft edges) */
  $$('.road__body').forEach(function (rail) {
    var down = false, moved = false, dragging = false;
    var sx = 0, sl = 0, pid = null;
    var lastX = 0, lastT = 0, vel = 0;
    var target = rail.scrollLeft;
    var raf = 0;

    function maxScroll() {
      return Math.max(0, rail.scrollWidth - rail.clientWidth);
    }
    function clamp(x) {
      var max = maxScroll();
      return x < 0 ? 0 : x > max ? max : x;
    }
    function wake() {
      if (raf || reduce) return;
      raf = requestAnimationFrame(tick);
    }
    function tick() {
      raf = 0;
      var max = maxScroll();
      var x = rail.scrollLeft;
      var zone = Math.min(220, max * .3);

      if (!dragging) {
        if (Math.abs(vel) > 0.03) {
          var damp = 1;
          if (target < zone) damp = 0.08 + 0.92 * Math.pow(Math.max(0, target) / zone, 1.75);
          else if (target > max - zone) damp = 0.08 + 0.92 * Math.pow(Math.max(0, max - target) / zone, 1.75);
          /* Higher friction — leisurely coast, less runaway. */
          vel *= 0.948 * damp;
          target = clamp(target + vel);
        } else {
          vel = 0;
          if (target < 6) target = 0;
          else if (target > max - 6) target = max;
        }
      }

      var dest = clamp(target);
      /* Follow slowly while coasting; a bit snappier while dragging. */
      var follow = dragging ? 0.10 : 0.045;
      if (x < zone || x > max - zone || dest < zone || dest > max - zone) follow *= 0.5;

      var next = x + (dest - x) * follow;
      var still = Math.abs(dest - next) < 0.2 && Math.abs(vel) < 0.03;
      rail.scrollLeft = still && !dragging ? dest : next;

      if (dragging || !still || Math.abs(vel) >= 0.03) wake();
    }

    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      if (e.button !== 0) return;
      down = true; moved = false; dragging = false;
      sx = lastX = e.clientX;
      sl = target = rail.scrollLeft;
      pid = e.pointerId;
      lastT = performance.now();
      vel = 0;
    });

    rail.addEventListener('pointermove', function (e) {
      if (!down) return;
      var now = performance.now();
      var dx = e.clientX - sx;
      if (!moved) {
        if (Math.abs(dx) <= 2) return;
        moved = true;
        dragging = true;
        rail.classList.add('is-drag');
        try { rail.setPointerCapture(pid); } catch (err) {}
        wake();
      }
      /* ~0.42× drag travel — less distance per swipe. */
      var sense = 0.42;
      var proposed = sl - dx * sense;
      var max = maxScroll();
      var zone = Math.min(220, max * .3);
      if (zone > 10) {
        if (proposed < zone) {
          var tl = Math.max(0, proposed) / zone;
          proposed = sl - dx * sense * (0.12 + 0.88 * tl * tl);
        } else if (proposed > max - zone) {
          var tr = Math.max(0, max - proposed) / zone;
          proposed = sl - dx * sense * (0.12 + 0.88 * tr * tr);
        }
      }
      target = clamp(proposed);
      if (reduce) rail.scrollLeft = target;

      var dt = now - lastT;
      if (dt > 0 && dt < 80) {
        var inst = -(e.clientX - lastX) / dt * 16.7 * sense;
        vel = vel * 0.72 + inst * 0.28;
      }
      lastX = e.clientX; lastT = now;
      wake();
    });

    function endDrag() {
      if (!down) return;
      if (moved) {
        try { rail.releasePointerCapture(pid); } catch (err) {}
        dragging = false;
        /* Soften release throw — shorter, calmer coast. */
        if (!reduce) {
          vel *= 0.75;
          if (Math.abs(vel) < 0.25) {
            var max = maxScroll();
            if (target < 14) { target = 0; vel = 0; }
            else if (target > max - 14) { target = max; vel = 0; }
          }
          wake();
        }
      }
      down = false; dragging = false; pid = null;
      rail.classList.remove('is-drag');
    }
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      rail.addEventListener(ev, endDrag);
    });
    rail.addEventListener('pointerleave', function () {
      if (down && !moved) { down = false; pid = null; }
    });

    rail.addEventListener('click', function (e) {
      if (!moved) return;
      e.preventDefault(); e.stopPropagation();
      moved = false;
    }, true);

    /* Trackpad: route horizontal deltas through the same lerp for creamier stops. */
    if (!reduce) {
      rail.addEventListener('wheel', function (e) {
        if (Math.abs(e.deltaX) < 0.5 || Math.abs(e.deltaX) < Math.abs(e.deltaY) * 0.9) return;
        e.preventDefault();
        dragging = false;
        /* Lower wheel gain — same gesture covers less rail. */
        var wSense = 0.35;
        target = clamp(target + e.deltaX * wSense);
        vel = vel * 0.55 + e.deltaX * wSense * 0.22;
        wake();
      }, { passive: false });
    }
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

  /* ---------------------------------------- approach hex (homepage) */
  var apprHex = $('#apprHex');
  if (apprHex) {
    var stage = $('.appr-hex__stage', apprHex);
    var cells = $$('.appr-hex__cell:not(.appr-hex__cell--hub)', apprHex);
    var panels = $$('.appr-hex__panel', apprHex);
    var active = -1;
    var offTimer = 0;
    var hideTimers = [];
    var fine = matchMedia('(hover: hover) and (pointer: fine)');
    var narrow = matchMedia('(max-width:899px)');
    var panelDur = reduce ? 0 : 520;

    /* Desktop: CSS docks satellites on the big-hex perimeter (--open).
       Mobile: V stays put; hex-shaped hub drops under the cluster. */
    function clearHideTimers() {
      hideTimers.forEach(clearTimeout);
      hideTimers = [];
    }

    function setActive(i) {
      if (i === active) return;
      clearTimeout(offTimer);
      clearHideTimers();
      active = i;
      apprHex.classList.toggle('is-dim', i >= 0);
      apprHex.classList.toggle('is-open', i >= 0);
      cells.forEach(function (c, j) {
        c.classList.toggle('is-active', j === i);
        c.setAttribute('aria-expanded', j === i ? 'true' : 'false');
      });
      panels.forEach(function (p, j) {
        var on = j === i;
        if (on) {
          p.hidden = false;
          /* Two frames so the browser paints opacity:0 before .is-on. */
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              if (active === j) p.classList.add('is-on');
            });
          });
        } else {
          p.classList.remove('is-on');
          if (i < 0) {
            /* Closing: keep in flow so the exit fade can run. */
            hideTimers.push(setTimeout(function () {
              if (!p.classList.contains('is-on')) p.hidden = true;
            }, panelDur));
          } else {
            /* Switching tiles: hide immediately so panels don't stack. */
            p.hidden = true;
          }
        }
      });
    }

    function scheduleOff() {
      clearTimeout(offTimer);
      offTimer = setTimeout(function () { setActive(-1); }, 140);
    }

    cells.forEach(function (cell, i) {
      cell.addEventListener('pointerenter', function () {
        if (!fine.matches || narrow.matches) return;
        clearTimeout(offTimer);
        setActive(i);
      });
      cell.addEventListener('focus', function () {
        clearTimeout(offTimer);
        setActive(i);
      });
      cell.addEventListener('blur', function () {
        if (!cell.matches(':focus')) scheduleOff();
      });
      cell.addEventListener('click', function () {
        /* Below 900px the V is the only way into the copy, so a tap must
           toggle even when the browser still claims a fine hover pointer. */
        if (fine.matches && !narrow.matches) return;
        setActive(active === i ? -1 : i);
      });
    });
    if (stage) {
      stage.addEventListener('pointerleave', function (e) {
        if (!fine.matches || narrow.matches) return;
        if (!stage.contains(e.relatedTarget)) scheduleOff();
      });
      stage.addEventListener('pointerenter', function () {
        if (fine.matches && !narrow.matches) clearTimeout(offTimer);
      });
    }
    /* Mobile: tap outside the stage dismisses the open panel. */
    doc.addEventListener('pointerdown', function (e) {
      if (!narrow.matches || active < 0 || !stage) return;
      if (!stage.contains(e.target)) setActive(-1);
    });
  }

  /* ------------------------------------------- clients logo marquee
     Two brick rows share one band. Auto-scroll at half the old CSS speed,
     with pointer drag + flick inertia that blends back into the marquee.
     Clicks/taps never pause — only a real horizontal swipe does. */
  (function initMq() {
    var section = $('.mq');
    if (!section) return;
    var vp = $('.mq__vp', section);
    var band = $('.mq__band', section);
    var track = $('.mq__tr--a', section) || $('.mq__tr', section);
    if (!vp || !band || !track) return;
    /* Reduced-motion: CSS disables the anim and allows native overflow scroll. */
    if (reduce) return;

    section.classList.add('is-live');

    var DUR = 92; /* seconds per loop — was 46s */
    var THRESH = 8; /* px before a press becomes a drag */
    var x = 0;
    var vel = 0;
    var loopW = 0;
    var auto = 0;
    var pressed = false;
    var dragging = false;
    var pid = null;
    var startX = 0;
    var startY = 0;
    var lastX = 0;
    var samples = [];
    var resumeAt = 0;

    function measure() {
      loopW = track.scrollWidth / 2;
      auto = loopW > 0 ? loopW / DUR : 0;
    }
    function wrap(v) {
      if (loopW <= 0) return 0;
      v %= loopW;
      if (v < 0) v += loopW;
      return v;
    }
    function paint() {
      band.style.transform = 'translate3d(' + (-wrap(x)) + 'px,0,0)';
    }

    measure();
    paint();

    var last = performance.now();
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!dragging) {
        if (now >= resumeAt) x += auto * dt;
        if (vel) {
          x += vel * dt;
          vel *= Math.exp(-3.2 * dt);
          if (Math.abs(vel) < 6) vel = 0;
        }
        paint();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    addEventListener('resize', function () {
      var prev = loopW;
      measure();
      if (prev > 0 && loopW > 0) x = x * (loopW / prev);
      paint();
    });

    function sample(cx) {
      samples.push({ t: performance.now(), x: cx });
      while (samples.length > 6) samples.shift();
    }

    function commitDrag(e) {
      dragging = true;
      vel = 0;
      lastX = e.clientX;
      samples = [{ t: performance.now(), x: e.clientX }];
      vp.classList.add('is-dragging');
      try { vp.setPointerCapture(pid); } catch (err) {}
    }

    function down(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      /* Do not freeze on press — auto-scroll keeps running until a real swipe. */
      pressed = true;
      dragging = false;
      pid = e.pointerId;
      startX = lastX = e.clientX;
      startY = e.clientY;
      samples = [{ t: performance.now(), x: e.clientX }];
    }
    function move(e) {
      if (!pressed || e.pointerId !== pid) return;

      if (!dragging) {
        var adx = Math.abs(e.clientX - startX);
        var ady = Math.abs(e.clientY - startY);
        /* Vertical intent → abandon so the page can scroll natively. */
        if (ady > THRESH && ady > adx) {
          pressed = false;
          pid = null;
          samples = [];
          return;
        }
        if (adx < THRESH) return;
        commitDrag(e);
      }

      var dx = e.clientX - lastX;
      lastX = e.clientX;
      x -= dx;
      sample(e.clientX);
      paint();
      if (e.cancelable) e.preventDefault();
    }
    function up(e) {
      if (!pressed || (pid != null && e.pointerId !== pid)) return;
      var wasDrag = dragging;
      pressed = false;
      dragging = false;
      vp.classList.remove('is-dragging');
      try { if (pid != null) vp.releasePointerCapture(pid); } catch (err) {}
      pid = null;

      /* Click / tap: leave marquee alone — no pause, no inertia. */
      if (!wasDrag) {
        samples = [];
        return;
      }

      if (samples.length >= 2) {
        var a = samples[0], b = samples[samples.length - 1];
        var dt = (b.t - a.t) / 1000;
        if (dt > 0.012) {
          vel = -(b.x - a.x) / dt;
          if (vel > 2800) vel = 2800;
          if (vel < -2800) vel = -2800;
        }
      }
      /* Brief pause so flick can play out, then ease back into marquee */
      resumeAt = performance.now() + 320;
      samples = [];
    }

    vp.addEventListener('pointerdown', down);
    vp.addEventListener('pointermove', move, { passive: false });
    vp.addEventListener('pointerup', up);
    vp.addEventListener('pointercancel', up);
    vp.addEventListener('lostpointercapture', function (e) {
      if (pressed && e.pointerId === pid) up(e);
    });
    vp.addEventListener('dragstart', function (e) { e.preventDefault(); });
    /* If logos are ever wrapped in <a>, a completed swipe must not navigate. */
    vp.addEventListener('click', function (e) {
      if (Math.abs(e.clientX - startX) >= THRESH || Math.abs(e.clientY - startY) >= THRESH) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  })();
})();
