#!/usr/bin/env node
/* ==========================================================================
   Generates content/geo-map.json — SVG paths for Russia and its neighbours.

   Source: Natural Earth 1:110m Admin 0 countries (public domain).
   Projection: Albers equal-area conic, standard parallels 50°N / 68°N,
   central meridian 100°E — the projection that gives Russia its familiar
   silhouette instead of the stretched shape an equirectangular produces.

   Run only when the map needs regenerating:
       node tools/make-map.mjs path/to/ne_110m_admin_0_countries.geojson
   ========================================================================== */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const src = process.argv[2];
if (!src) { console.error('usage: node tools/make-map.mjs <ne_110m_admin_0_countries.geojson>'); process.exit(1); }
const gj = JSON.parse(fs.readFileSync(src, 'utf8'));

/* countries where the company runs programmes (from content/site.json) */
const HOME = ['Russia', 'Belarus', 'Kazakhstan', 'Uzbekistan', 'Kyrgyzstan', 'Armenia', 'Georgia'];
/* surrounding context */
const NEAR = ['Ukraine', 'Moldova', 'Estonia', 'Latvia', 'Lithuania', 'Poland', 'Finland', 'Norway', 'Sweden',
  'Turkey', 'Iran', 'Turkmenistan', 'Tajikistan', 'Afghanistan', 'China', 'Mongolia',
  'North Korea', 'South Korea', 'Japan', 'Romania', 'Slovakia', 'Hungary', 'Belarus'];

/* Natural Earth's NAME_RU carries some dated Soviet-era forms; use the names
   these states actually go by, and shorten the long official ones. */
const EN_NAME = {
  'Russia': 'Russia', 'Belarus': 'Belarus', 'Kyrgyzstan': 'Kyrgyzstan',
  'Moldova': 'Moldova', 'China': 'China', 'South Korea': 'South Korea',
  'North Korea': 'North Korea', 'Turkmenistan': 'Turkmenistan',
};

const RU_NAME = {
  'Российская Федерация': 'Россия',
  'Белоруссия': 'Беларусь',
  'Киргизия': 'Кыргызстан',
  'Туркмения': 'Туркменистан',
  'Молдавия': 'Молдова',
  'Китайская Народная Республика': 'Китай',
  'Республика Корея': 'Южная Корея',
};

/* ------------------------------------------------------- Albers conic */
const D = Math.PI / 180;
const φ1 = 50 * D, φ2 = 68 * D, φ0 = 56 * D, λ0 = 100 * D;
const n = (Math.sin(φ1) + Math.sin(φ2)) / 2;
const C = Math.cos(φ1) ** 2 + 2 * n * Math.sin(φ1);
const ρ = φ => Math.sqrt(Math.max(C - 2 * n * Math.sin(φ), 1e-9)) / n;
const ρ0 = ρ(φ0);

function project([lon, lat]) {
  // Russia crosses the antimeridian: pull the far east into a continuous range
  let L = lon;
  if (L < -20) L += 360;
  const θ = n * (L * D - λ0);
  const r = ρ(lat * D);
  // negate the northing: SVG's y axis grows downward, Albers' grows north
  return [r * Math.sin(θ), r * Math.cos(θ) - ρ0];
}

/* --------------------------------------------- Douglas–Peucker simplify */
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const sq = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  function segDist(p, a, b) {
    let x = a[0], y = a[1], dx = b[0] - x, dy = b[1] - y;
    if (dx || dy) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) { x = b[0]; y = b[1]; } else if (t > 0) { x += dx * t; y += dy * t; }
    }
    return (p[0] - x) ** 2 + (p[1] - y) ** 2;
  }
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  const t2 = tol * tol;
  while (stack.length) {
    const [i, jj] = stack.pop();
    let maxD = 0, idx = -1;
    for (let k = i + 1; k < jj; k++) {
      const d = segDist(pts[k], pts[i], pts[jj]);
      if (d > maxD) { maxD = d; idx = k; }
    }
    if (maxD > t2 && idx > 0) { keep[idx] = 1; stack.push([i, idx], [idx, jj]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/* ------------------------------------------------------------- collect */
const wanted = new Set([...HOME, ...NEAR]);
const raw = [];
for (const f of gj.features) {
  const admin = f.properties.ADMIN;
  if (!wanted.has(admin)) continue;
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const rings = [];
  for (const poly of polys) {
    for (const ring of poly) {
      // drop tiny islands: they add weight and read as noise at this size
      if (ring.length < 5) continue;
      const pr = ring.map(project);
      const xs = pr.map(p => p[0]), ys = pr.map(p => p[1]);
      const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
      if (w < 0.012 && h < 0.012) continue;
      rings.push(pr);
    }
  }
  if (!rings.length) continue;
  const nameRu = RU_NAME[f.properties.NAME_RU] || f.properties.NAME_RU || admin;
  const nameEn = EN_NAME[admin] || f.properties.NAME_EN || admin;
  raw.push({ admin, name: nameRu, name_en: nameEn, home: HOME.includes(admin), rings });
}

/* ------------------------------------------------- fit to a viewBox */
const W = 980, H = 560, PAD = 8;
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
/* Frame on the operating countries only — including Japan and Iran in the fit
   would shrink Russia/CIS into the middle third. Neighbours still draw and are
   allowed to run past the frame, where the mask fades them out. */
for (const c of raw) {
  if (!c.home) continue;
  for (const r of c.rings) for (const [x, y] of r) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
}
/* Frame tighter (a ~50% closer crop) and bias the window left of centre, which
   pushes the landmass to the right inside the panel. */
const ZOOM = 1.12, SHIFT_X = 0.06;
const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
const halfW = (maxX - minX) / 2 / ZOOM, halfH = (maxY - minY) / 2 / ZOOM;
const offX = halfW * 2 * SHIFT_X;
minX = cx - halfW - offX; maxX = cx + halfW - offX;
minY = cy - halfH; maxY = cy + halfH;
const s = Math.min((W - PAD * 2) / (maxX - minX), (H - PAD * 2) / (maxY - minY));
const ox = PAD + ((W - PAD * 2) - (maxX - minX) * s) / 2;
const oy = PAD + ((H - PAD * 2) - (maxY - minY) * s) / 2;
const tx = x => (ox + (x - minX) * s);
const ty = y => (oy + (y - minY) * s);

const countries = raw.map(c => {
  let d = '';
  for (const ring of c.rings) {
    const pr = simplify(ring.map(([x, y]) => [tx(x), ty(y)]), 0.7);
    if (pr.length < 3) continue;
    d += 'M' + pr.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') + 'Z';
  }
  return { admin: c.admin, name: c.name, name_en: c.name_en, home: c.home, d };
}).filter(c => c.d);

// draw neighbours first so the operating countries sit on top
countries.sort((a, b) => (a.home === b.home ? 0 : a.home ? 1 : -1));

const out = { width: W, height: H, countries };
fs.writeFileSync(path.join(ROOT, 'content/geo-map.json'), JSON.stringify(out), 'utf8');

const bytes = fs.statSync(path.join(ROOT, 'content/geo-map.json')).size;
console.log(`geo-map.json: ${countries.length} стран, ${(bytes / 1024).toFixed(0)} KB`);
console.log('  выделены:', countries.filter(c => c.home).map(c => c.name).join(', '));
