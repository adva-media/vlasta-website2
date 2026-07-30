#!/usr/bin/env node
/* ==========================================================================
   Cover artwork for the three cases added from the .docx sources.

   Topical royalty-free photography could not be sourced automatically, and
   generic filler would look worse than nothing. These are drawn instead —
   same palette and guilloche motif as the site, each diagramming what its
   case is actually about, so the three read as a set.

       node tools/make-case-covers.mjs
   ========================================================================== */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const W = 1200, H = 750;

const INK = '#11192B', NAVY = '#1D2537', ACC = '#344361', MIST = '#C5CDDA';

/* guilloche rosette, same construction as the site's engraving */
function rosette(cx, cy, rings, rx, ry, op) {
  let p = '';
  for (let i = 0; i < rings; i++) {
    const a = (i * 180) / rings;
    p += `<ellipse cx="${cx}" cy="${cy}" rx="${(rx - i * 1.8).toFixed(1)}" ry="${Math.max(ry - i * 2.9, 8).toFixed(1)}" transform="rotate(${a.toFixed(1)} ${cx} ${cy})"/>`;
  }
  return `<g fill="none" stroke="${MIST}" stroke-width=".8" opacity="${op}">${p}</g>`;
}

const frame = inner => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${NAVY}"/><stop offset="1" stop-color="${INK}"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="46%" r="58%">
    <stop offset="0" stop-color="${ACC}" stop-opacity=".55"/><stop offset="1" stop-color="${ACC}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
${rosette(980, 130, 22, 300, 120, .16)}
${rosette(180, 690, 16, 220, 90, .12)}
${inner}
</svg>`;

const dot = (x, y, r = 7, fill = MIST, op = 1) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${op}"/>`;
const line = (x1, y1, x2, y2, op = .5, dash = '') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${MIST}" stroke-width="1.6" opacity="${op}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
const cross = (x, y, s = 13) =>
  `<g stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".95">
     <line x1="${x - s}" y1="${y - s}" x2="${x + s}" y2="${y + s}"/><line x1="${x + s}" y1="${y - s}" x2="${x - s}" y2="${y + s}"/></g>`;

/* --- 1. blocked distribution channels: a trunk fanning into retail, cut off --- */
function blocking() {
  const trunk = [180, 375];
  const tier1 = [[430, 200], [430, 375], [430, 550]];
  const leaves = [];
  tier1.forEach(([x, y], i) => {
    for (let k = -1; k <= 1; k++) leaves.push([720, y + k * 78, i]);
  });
  let g = '';
  tier1.forEach(([x, y]) => { g += line(trunk[0], trunk[1], x, y, .55); });
  leaves.forEach(([x, y], i) => {
    const src = tier1[Math.floor(i / 3)];
    const blocked = i !== 4; // one channel survives, the rest are shut
    g += line(src[0], src[1], x, y, blocked ? .22 : .7, blocked ? '5 7' : '');
  });
  leaves.forEach(([x, y], i) => {
    const blocked = i !== 4;
    g += dot(x, y, blocked ? 5 : 8, MIST, blocked ? .3 : 1);
    if (blocked) g += cross(x + 96, y, 11);
    else g += `<circle cx="${x}" cy="${y}" r="17" fill="none" stroke="${MIST}" stroke-width="1.4" opacity=".55"/>`;
  });
  tier1.forEach(([x, y]) => { g += dot(x, y, 9); });
  g += dot(trunk[0], trunk[1], 13);
  g += `<circle cx="${trunk[0]}" cy="${trunk[1]}" r="26" fill="none" stroke="${MIST}" stroke-width="1.4" opacity=".5"/>`;
  return frame(g);
}

/* --- 2. EAEU: a shipment stopped at successive borders --- */
function eaeu() {
  let g = '';
  const cx = 210, cy = 375;
  // five nested border arcs = the member states it has to cross
  for (let i = 0; i < 5; i++) {
    const r = 190 + i * 96;
    g += `<path d="M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r}" fill="none" stroke="${MIST}" stroke-width="${i === 2 ? 2.6 : 1.3}" opacity="${i === 2 ? .85 : .3}"${i === 2 ? '' : ' stroke-dasharray="6 9"'}/>`;
  }
  // the consignment's path, halted at the third arc
  g += line(cx + 40, cy, cx + 380, cy, .65, '');
  g += `<polygon points="${cx + 372},${cy - 9} ${cx + 396},${cy} ${cx + 372},${cy + 9}" fill="${MIST}" opacity=".8"/>`;
  g += cross(cx + 430, cy, 16);
  g += dot(cx, cy, 12);
  [-1, 1].forEach(s => {
    g += dot(cx + 190 * 0.72, cy + s * 150, 6, MIST, .5);
    g += dot(cx + 286 * 0.8, cy + s * 250, 6, MIST, .4);
  });
  return frame(g);
}

/* --- 3. supply-chain investigation: one route traced back to its origin --- */
function supply() {
  let g = '';
  const chain = [[150, 560], [330, 470], [510, 520], [690, 400], [880, 300], [1050, 210]];
  // the noise: other candidate routes
  const noise = [[330, 300], [510, 250], [690, 600], [880, 560]];
  noise.forEach(([x, y], i) => {
    g += line(chain[i][0], chain[i][1], x, y, .16, '4 8');
    g += dot(x, y, 5, MIST, .26);
  });
  for (let i = 0; i < chain.length - 1; i++) {
    g += line(chain[i][0], chain[i][1], chain[i + 1][0], chain[i + 1][1], .75);
  }
  chain.forEach(([x, y], i) => {
    const last = i === chain.length - 1;
    g += dot(x, y, last ? 12 : 8, last ? '#fff' : MIST, 1);
    if (last) g += `<circle cx="${x}" cy="${y}" r="26" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"/>
      <circle cx="${x}" cy="${y}" r="40" fill="none" stroke="${MIST}" stroke-width="1" opacity=".35"/>`;
  });
  return frame(g);
}

const out = [
  ['blokirovka-kanalov.svg', blocking()],
  ['rabota-eaes.svg', eaeu()],
  ['kanaly-postavok.svg', supply()],
];
for (const [name, svg] of out) {
  const p = path.join(ROOT, 'assets/img/cases', name);
  fs.writeFileSync(p, svg, 'utf8');
  console.log(`  ✓ assets/img/cases/${name} (${(fs.statSync(p).size / 1024).toFixed(1)} KB)`);
}
