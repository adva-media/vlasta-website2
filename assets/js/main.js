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

  /* -------- CTA fabric: one connected violet mesh + traveling edge pulses */
  (function () {
    var sections = $$('.sec--cta');
    if (!sections.length) return;

    var TAU = Math.PI * 2;

    function boot(sec) {
      var canvas = $('.cta__field', sec);
      if (!canvas) {
        canvas = doc.createElement('canvas');
        canvas.className = 'cta__field';
        canvas.setAttribute('aria-hidden', 'true');
        sec.insertBefore(canvas, sec.firstChild);
      }
      var blur = $('.cta__blur', sec);
      if (!blur) {
        blur = doc.createElement('div');
        blur.className = 'cta__blur';
        blur.setAttribute('aria-hidden', 'true');
        if (canvas.nextSibling) sec.insertBefore(blur, canvas.nextSibling);
        else sec.appendChild(blur);
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
      var bleedX = 48;
      var bleedY = 100;
      var minDist = 48;
      var raf = 0;
      var visible = false;
      var staticDrawn = false;
      var t0 = performance.now();
      var lastNow = 0;
      var spawnAcc = 0;
      var dark = root.getAttribute('data-theme') === 'dark';

      function isDark() {
        return root.getAttribute('data-theme') === 'dark';
      }

      function violet(alpha, bright) {
        var r, g, b;
        if (bright) {
          r = dark ? 198 : 118;
          g = dark ? 158 : 88;
          b = dark ? 255 : 188;
        } else {
          r = dark ? 168 : 98;
          g = dark ? 142 : 74;
          b = dark ? 228 : 156;
        }
        return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
      }

      /* Soften under the CTA copy column (section-local coords). */
      function zoneQuiet(x, y) {
        var nx = (x - bleedX) / Math.max(1, sw);
        var ny = (y - bleedY) / Math.max(1, sh);
        if (nx > 0.06 && nx < 0.58 && ny > 0.16 && ny < 0.84) return 0.5;
        return 1;
      }

      /* True when a point sits inside the CTA band (not the bleed margin). */
      function inBand(x, y) {
        return x >= bleedX && x <= bleedX + sw && y >= bleedY && y <= bleedY + sh;
      }

      /* Uniform sample in one of the four bleed strips outside the CTA band. */
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

      function sampleNodes(count, spacing) {
        var pts = [];
        /* Light edge inset so the mesh reaches the band perimeter (frost covers
           full section; a large pad left an empty strip at the bottom). */
        var pad = Math.max(6, spacing * 0.12);
        var attempts = 0;
        var maxAttempts = count * 90;
        var x, y, ok, i, dx, dy, minSq, wantExt, p;
        /* ~48% of nodes land in the bleed so chords visibly leave the band. */
        var exteriorQuota = Math.max(4, Math.round(count * 0.48));
        var exteriorCount = 0;
        minSq = spacing * spacing;
        while (pts.length < count && attempts < maxAttempts) {
          attempts++;
          wantExt = exteriorCount < exteriorQuota &&
            (pts.length - exteriorCount >= count - exteriorQuota || Math.random() < 0.55);
          if (wantExt) {
            p = sampleBleedPoint(pad);
            x = p.x;
            y = p.y;
          } else {
            x = bleedX + pad + Math.random() * Math.max(1, sw - pad * 2);
            y = bleedY + pad + Math.random() * Math.max(1, sh - pad * 2);
          }
          ok = true;
          for (i = 0; i < pts.length; i++) {
            dx = pts[i].x - x;
            dy = pts[i].y - y;
            if (dx * dx + dy * dy < minSq) { ok = false; break; }
          }
          if (!ok) continue;
          if (!inBand(x, y)) exteriorCount++;
          pts.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 28,
            vy: (Math.random() - 0.5) * 28,
            wander: Math.random() * TAU,
            wanderSpeed: 0.75 + Math.random() * 1.1,
            size: 0.88 + Math.random() * 0.4,
            phase: Math.random() * TAU,
            energy: 0
          });
        }
        /* Pin a few interior nodes near the bottom edge so the band never reads
           as an empty strip above the footer. */
        var edgeN = Math.max(2, Math.min(4, Math.round(count * 0.12)));
        var ei, ex, ey, eok, ej;
        for (ei = 0; ei < edgeN && pts.length < count + edgeN; ei++) {
          ex = bleedX + pad + Math.random() * Math.max(1, sw - pad * 2);
          ey = bleedY + sh - pad - Math.random() * Math.min(18, sh * 0.08);
          eok = true;
          for (ej = 0; ej < pts.length; ej++) {
            dx = pts[ej].x - ex;
            dy = pts[ej].y - ey;
            if (dx * dx + dy * dy < minSq * 0.55) { eok = false; break; }
          }
          if (!eok) continue;
          pts.push({
            x: ex,
            y: ey,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            wander: Math.random() * TAU,
            wanderSpeed: 0.7 + Math.random() * 1.0,
            size: 0.9 + Math.random() * 0.35,
            phase: Math.random() * TAU,
            energy: 0
          });
        }
        return pts;
      }

      /* Union-find helpers for Kruskal MST. */
      function ufFind(parent, i) {
        while (parent[i] !== i) {
          parent[i] = parent[parent[i]];
          i = parent[i];
        }
        return i;
      }

      /* Fully connected sparse graph: MST spanning all nodes + cross-boundary chords. */
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
            /* Slight MST bias toward edges that cross the CTA boundary. */
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
          list.push({ a: a, b: b, rest: candidates[c].d, len: candidates[c].d, glow: 0 });
          deg[a]++;
          deg[b]++;
          used[a + ':' + b] = 1;
          if (list.length >= n - 1) break;
        }

        /* Extra chords: prefer short cross-boundary links; exterior nodes can fan out more. */
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
          list.push({ a: a, b: b, rest: candidates[c].d, len: candidates[c].d, glow: 0 });
          deg[a]++;
          deg[b]++;
          used[key] = 1;
          extras++;
        }
        return list;
      }

      function rebuild() {
        /* offset* = full border box incl. padding — matches absolute inset:0 frost. */
        sw = Math.max(1, sec.offsetWidth || Math.round(sec.getBoundingClientRect().width));
        sh = Math.max(1, sec.offsetHeight || Math.round(sec.getBoundingClientRect().height));
        bleedX = Math.max(44, Math.min(78, Math.round(sw * 0.055)));
        bleedY = Math.max(88, Math.min(168, Math.round(sh * 0.72)));
        w = sw + bleedX * 2;
        h = sh + bleedY * 2;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.top = -bleedY + 'px';
        canvas.style.left = -bleedX + 'px';
        canvas.style.right = 'auto';
        canvas.style.bottom = 'auto';
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        /* Frost: CSS inset:0 only — clear any stale inline box so it always
           covers the full .sec--cta edge-to-edge (no bottom gap after reflow). */
        blur.style.cssText = 'inset:0';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        /* Sparse: ~18–36 nodes across the expanded canvas. */
        var area = w * h;
        var target = Math.round(area / 16000);
        if (w < 640) target = Math.min(target, 20);
        else if (w < 1000) target = Math.min(target, 28);
        target = Math.max(w < 640 ? 14 : 18, Math.min(36, target));

        /* Larger nodes need more clearance so pulse-grown dots don’t collide. */
        minDist = Math.max(68, Math.sqrt(area / (target * 0.78)));
        minDist = Math.max(minDist, 75);

        nodes = sampleNodes(target, minDist);
        edges = buildConnectedGraph(nodes, Math.max(5, Math.round(target * 0.42)));
        pulses = [];
        spawnAcc = 0.4;
        staticDrawn = false;
        lastNow = 0;
      }

      function excite(idx, amount) {
        if (idx < 0 || idx >= nodes.length) return;
        nodes[idx].energy = Math.min(1, nodes[idx].energy + amount);
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

      /* Soft wander + separation + weak edge springs; topology stays fixed. */
      function updateDrift(dt) {
        var i, j, n, ed, a, b, dx, dy, dist, f, nx, ny, rest, pad;
        var sep = minDist * 1.12;
        var sepSq = sep * sep;

        for (i = 0; i < nodes.length; i++) {
          n = nodes[i];
          /* Slow coherent drift + Brownian noise — clearly alive, not frantic. */
          n.wander += n.wanderSpeed * dt;
          n.vx += Math.cos(n.wander) * 38 * dt;
          n.vy += Math.sin(n.wander) * 38 * dt;
          n.vx += (Math.random() - 0.5) * 88 * dt;
          n.vy += (Math.random() - 0.5) * 88 * dt;
          /* Soft home pull so the mesh stays near the CTA without freezing. */
          n.vx += ((bleedX + sw * 0.5) - n.x) * 0.0022 * dt;
          n.vy += ((bleedY + sh * 0.5) - n.y) * 0.003 * dt;
        }

        for (i = 0; i < nodes.length; i++) {
          for (j = i + 1; j < nodes.length; j++) {
            a = nodes[i];
            b = nodes[j];
            dx = b.x - a.x;
            dy = b.y - a.y;
            dist = dx * dx + dy * dy;
            if (dist >= sepSq || dist < 0.0001) continue;
            dist = Math.sqrt(dist);
            f = (sep - dist) / sep * 38 * dt;
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
          f = (dist - rest) * 0.018 * dt;
          nx = dx / dist;
          ny = dy / dist;
          a.vx += nx * f;
          a.vy += ny * f;
          b.vx -= nx * f;
          b.vy -= ny * f;
        }

        pad = 10;
        for (i = 0; i < nodes.length; i++) {
          n = nodes[i];
          n.vx *= Math.pow(0.935, dt * 60);
          n.vy *= Math.pow(0.935, dt * 60);
          var speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
          if (speed > 72) {
            n.vx = n.vx / speed * 72;
            n.vy = n.vy / speed * 72;
          }
          n.x += n.vx * dt;
          n.y += n.vy * dt;
          if (n.x < pad) { n.x = pad; n.vx *= -0.45; }
          if (n.x > w - pad) { n.x = w - pad; n.vx *= -0.45; }
          if (n.y < pad) { n.y = pad; n.vy *= -0.45; }
          if (n.y > h - pad) { n.y = h - pad; n.vy *= -0.45; }
        }
        syncEdgeLens();
      }

      function spawnPulse() {
        if (!edges.length) return;
        var ei = (Math.random() * edges.length) | 0;
        var forward = Math.random() < 0.5;
        pulses.push({
          e: ei,
          t: forward ? 0 : 1,
          speed: (0.28 + Math.random() * 0.32) * (forward ? 1 : -1),
          hitA: forward,
          hitB: !forward
        });
        var ed = edges[ei];
        excite(forward ? ed.a : ed.b, 0.78);
      }

      function updatePulses(dt) {
        var i, p, ed, arrived;
        var targetLive = Math.max(2, Math.min(5, Math.round(edges.length * 0.18)));

        spawnAcc += dt;
        while (pulses.length < targetLive && spawnAcc > 0) {
          spawnPulse();
          spawnAcc -= 0.6 + Math.random() * 0.9;
        }
        if (pulses.length >= targetLive) spawnAcc = Math.min(spawnAcc, 0.2);

        for (i = pulses.length - 1; i >= 0; i--) {
          p = pulses[i];
          ed = edges[p.e];
          if (!ed) { pulses.splice(i, 1); continue; }

          p.t += p.speed * dt / Math.max(0.001, ed.len / 150);
          ed.glow = Math.min(1, ed.glow + dt * 2.2);

          arrived = false;
          if (p.speed > 0) {
            if (!p.hitA && p.t >= 0) { excite(ed.a, 0.9); p.hitA = true; }
            if (!p.hitB && p.t >= 0.97) { excite(ed.b, 1); p.hitB = true; }
            if (p.t >= 1.02) arrived = true;
          } else {
            if (!p.hitB && p.t <= 1) { excite(ed.b, 0.9); p.hitB = true; }
            if (!p.hitA && p.t <= 0.03) { excite(ed.a, 1); p.hitA = true; }
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
            if (hops.length && Math.random() < 0.62) {
              var next = hops[(Math.random() * hops.length) | 0];
              e2 = edges[next];
              var fwd = e2.a === at;
              pulses[i] = {
                e: next,
                t: fwd ? 0 : 1,
                speed: (0.28 + Math.random() * 0.32) * (fwd ? 1 : -1),
                hitA: fwd,
                hitB: !fwd
              };
              excite(at, 0.35);
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
        }
      }

      function drawEdges() {
        var i, ed, a, b, alpha, q, lw, mid;
        ctx.lineCap = 'round';
        for (i = 0; i < edges.length; i++) {
          ed = edges[i];
          a = nodes[ed.a];
          b = nodes[ed.b];
          q = (zoneQuiet(a.x, a.y) + zoneQuiet(b.x, b.y)) * 0.5;
          mid = Math.min(1, Math.max(0.35, 1 - ed.len / (minDist * 5.5)));
          alpha = (0.11 + mid * 0.1 + ed.glow * 0.14) * q;
          if (alpha < 0.02) continue;
          lw = 1.05 + mid * 0.35 + ed.glow * 0.4;
          ctx.lineWidth = lw;
          ctx.strokeStyle = violet(alpha, ed.glow > 0.3);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      /* Short thicker stroke rides each active edge — readable travel, not a blob. */
      function drawPulses() {
        var i, p, ed, a, b, t, dx, dy, len, half, t0, t1, x0, y0, x1, y1, q, mx, my;
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
          half = Math.min(0.22, 18 / len);
          t0 = Math.max(0, t - half);
          t1 = Math.min(1, t + half * 0.35);
          x0 = a.x + dx * t0;
          y0 = a.y + dy * t0;
          x1 = a.x + dx * t1;
          y1 = a.y + dy * t1;
          mx = (x0 + x1) * 0.5;
          my = (y0 + y1) * 0.5;
          q = zoneQuiet(mx, my);

          ctx.strokeStyle = violet(0.22 * q, true);
          ctx.lineWidth = 4.2;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();

          ctx.strokeStyle = violet(0.78 * q, true);
          ctx.lineWidth = 2.35;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
      }

      function drawNodes(animate, t) {
        var i, n, sc, alpha, en, baseR, r, breath;
        for (i = 0; i < nodes.length; i++) {
          n = nodes[i];
          en = n.energy;
          breath = animate ? (0.012 * Math.sin(t * 0.65 + n.phase)) : 0;
          sc = n.size * (1 + breath + en * 1.15);
          baseR = 4.9 * sc;
          r = Math.min(baseR, minDist * 0.34);
          alpha = (0.28 + en * 0.5) * zoneQuiet(n.x, n.y);
          if (alpha < 0.04) continue;

          if (en > 0.08) {
            var halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3.4);
            halo.addColorStop(0, violet(0.32 * en, true));
            halo.addColorStop(1, violet(0, true));
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(n.x, n.y, r * 3.4, 0, TAU);
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, TAU);
          ctx.fillStyle = violet(Math.min(0.82, alpha), en > 0.18);
          ctx.fill();
        }
      }

      function paint(t, animate, dt) {
        dark = isDark();
        ctx.clearRect(0, 0, w, h);
        if (animate) {
          updateDrift(dt || 0.016);
          updatePulses(dt || 0.016);
        } else {
          syncEdgeLens();
        }
        drawEdges();
        if (animate) drawPulses();
        drawNodes(animate, t);
      }

      function frame(now) {
        raf = 0;
        if (!visible || reduce) return;
        var dt = lastNow ? Math.min(0.05, (now - lastNow) * 0.001) : 0.016;
        lastNow = now;
        paint((now - t0) * 0.001, true, dt);
        raf = requestAnimationFrame(frame);
      }

      function play() {
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

      rebuild();

      if ('IntersectionObserver' in window) {
        var vio = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            visible = e.isIntersecting && e.intersectionRatio > 0.02;
            if (visible) play();
            else pause();
          });
        }, { threshold: [0, 0.05, 0.15], rootMargin: '100px 0px 100px 0px' });
        vio.observe(sec);
      } else {
        visible = true;
        play();
      }

      var resizeTimer = 0;
      function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          rebuild();
          if (reduce) {
            paint(0, false, 0);
            staticDrawn = true;
          } else if (visible) play();
        }, 120);
      }
      addEventListener('resize', onResize, { passive: true });
      /* Section box can change without a window resize (webfonts, wrap). */
      if (typeof ResizeObserver === 'function') {
        var ro = new ResizeObserver(onResize);
        ro.observe(sec);
      }

      var mo = new MutationObserver(function () {
        dark = isDark();
        if (reduce) {
          paint(0, false, 0);
          staticDrawn = true;
        }
      });
      mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

      if (reduce) {
        paint(0, false, 0);
        staticDrawn = true;
      }
    }

    sections.forEach(boot);
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
  /* Progress trail uses getTotalLength() dashes. The tip is a circle placed
     with getPointAtLength — a dashed “comet” path wraps and draws a second
     glow at the opposite end of the arc. */
  var roads = $$('.road').map(function (road) {
    var body = $('.road__body', road);
    if (!body || reduce) return null;
    var doneEl = $('.road__arcH .road__arcDone', road);
    var tipEl = $('.road__arcH .road__arcTip', road);
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
    var mid = marks.map(function (_, i) { return (i + .5) / marks.length; });
    body.addEventListener('scroll', function () { paintRoads(); }, { passive: true });
    return { body: body, list: list, done: doneEl, tip: tipEl, len: len,
             marks: marks, mid: mid, last: -1 };
  }).filter(Boolean);

  /* Soft edge fades only on the overflowing side — start/end stay fully readable. */
  function roadEdgeFade(body) {
    if (!body) return;
    var max = Math.max(0, body.scrollWidth - body.clientWidth);
    var sl = body.scrollLeft;
    var atStart = sl <= 3;
    var atEnd = max <= 3 || sl >= max - 3;
    /* scrollWidth can overstate max scrollLeft when padding was on the scroller;
       fall back to whether the last tile is fully inside the rail. */
    if (!atEnd) {
      var last = body.querySelector('.road__i:last-child');
      if (last) {
        var br = body.getBoundingClientRect();
        atEnd = last.getBoundingClientRect().right <= br.right - 2;
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
    var body = r.body, list = r.list;
    if (!list) return 0;
    var last = list.lastElementChild;
    var br = body.getBoundingClientRect();
    /* Hard end: last milestone card is fully inside the rail (past the fade). */
    if (last && last.getBoundingClientRect().right <= br.right - 2) return 1;

    var maxList = list.scrollWidth - body.clientWidth;
    var maxBody = body.scrollWidth - body.clientWidth;
    if (maxList <= 1 && maxBody <= 1) return 1;
    /* Smaller positive range — inflated scrollWidth was capping p at ~0.5. */
    var max = maxList > 1 && maxBody > 1 ? Math.min(maxList, maxBody)
      : (maxList > 1 ? maxList : maxBody);
    if (max <= 1) return 1;
    if (body.scrollLeft >= max - 2) return 1;
    var p = body.scrollLeft / max;
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
      var near = -1, best = .55 / r.marks.length;
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
    var pop = $('.appr-hex__pop', apprHex);
    var fine = matchMedia('(hover: hover) and (pointer: fine)');
    var narrow = matchMedia('(max-width:899px)');
    var panelDur = reduce ? 0 : 520;

    /* Park the copy on the far side of the arm being read on desktop. On the
       phone the panel simply drops in under the V, so placePop is a no-op. */
    function placePop(cell) {
      if (!pop || narrow.matches) {
        if (pop) pop.style.transform = '';
        return;
      }
      var col = parseFloat(cell.style.getPropertyValue('--x')) || 0;
      var sr = stage.getBoundingClientRect();
      var cr = cell.getBoundingClientRect();
      var w = pop.offsetWidth;
      var left = (sr.width - w) / 2;
      if (col < 0) left = cr.right - sr.left + 10;
      else if (col > 0) left = cr.left - sr.left - w - 10;
      left = Math.max(0, Math.min(sr.width - w, left));
      pop.style.transform = 'translate(' + (left - sr.width / 2) + 'px,-50%)';
    }

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
      if (i >= 0) placePop(cells[i]);
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
    addEventListener('resize', function () { if (active >= 0) placePop(cells[active]); });
  }
})();
