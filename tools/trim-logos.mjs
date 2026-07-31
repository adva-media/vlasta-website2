#!/usr/bin/env node
/* ==========================================================================
   Tightens the viewBox of SVG logos to their actual artwork.

   Several supplier logos ship on a square canvas with the mark occupying only
   part of it. object-fit then scales the *canvas*, so the mark renders small
   however much room the tile gives it — and bumping max-height or transform
   just inflates the empty margin. Measuring the real content bounds with
   getBBox() and rewriting the viewBox fixes it at the source, after which
   every logo fills its box on its own.

       node tools/trim-logos.mjs [--dry]
   ========================================================================== */

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIRS = ['assets/img/clients', 'assets/img/assoc'];
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DRY = process.argv.includes('--dry');
const PAD = 0.02;          // 2% breathing room so strokes are not clipped

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();

let trimmed = 0, skipped = 0;
for (const dir of DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of fs.readdirSync(abs).filter(f => f.endsWith('.svg'))) {
    const p = path.join(abs, file);
    const src = fs.readFileSync(p, 'utf8');

    const box = await page.evaluate(async (svgText) => {
      document.body.innerHTML = svgText;
      const svg = document.body.querySelector('svg');
      if (!svg) return null;
      svg.style.cssText = 'position:absolute;width:1000px;height:1000px';
      const vbAttr = svg.getAttribute('viewBox');
      const vb = vbAttr ? vbAttr.trim().split(/[\s,]+/).map(Number)
                        : [0, 0, svg.width.baseVal.value, svg.height.baseVal.value];
      const [vx, vy, vw, vh] = vb;
      if (!vw || !vh) return null;

      /* Many of these files open with a white plate covering the whole canvas.
         Counting it would report a full-bleed bounding box and hide the fact
         that the mark itself is tiny, so drop near-full-canvas white shapes. */
      const isBackdrop = el => {
        let b; try { b = el.getBBox(); } catch (e) { return false; }
        const covers = (b.width * b.height) / (vw * vh) > 0.92;
        if (!covers) return false;
        const fill = (getComputedStyle(el).fill || '').replace(/\s/g, '').toLowerCase();
        return fill === 'rgb(255,255,255)' || fill === '#fff' || fill === '#ffffff' || fill === 'white';
      };

      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, n = 0;
      for (const el of svg.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line,text,image,use')) {
        if (isBackdrop(el)) continue;
        let b; try { b = el.getBBox(); } catch (e) { continue; }
        if (!b.width && !b.height) continue;
        x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
        x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
        n++;
      }
      if (!n || !isFinite(x0)) return null;
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, viewBox: vbAttr,
               W: svg.width.baseVal.value, H: svg.height.baseVal.value };
    }, src);

    if (!box || !box.w || !box.h) { skipped++; continue; }

    // current canvas, from viewBox when present
    const vb = box.viewBox ? box.viewBox.trim().split(/[\s,]+/).map(Number) : [0, 0, box.W, box.H];
    const [vx, vy, vw, vh] = vb;
    if (!vw || !vh) { skipped++; continue; }

    const fill = (box.w * box.h) / (vw * vh);
    if (fill > 0.72) { skipped++; continue; }      // already fills its canvas

    const px = box.w * PAD, py = box.h * PAD;
    const nx = (box.x - px).toFixed(2), ny = (box.y - py).toFixed(2);
    const nw = (box.w + px * 2).toFixed(2), nh = (box.h + py * 2).toFixed(2);
    const next = `${nx} ${ny} ${nw} ${nh}`;

    console.log(`  ${file.padEnd(20)} fill ${(fill * 100).toFixed(0).padStart(3)}%  ` +
                `viewBox ${vb.join(' ')} → ${next}`);

    if (!DRY) {
      let out = src;
      if (/viewBox="[^"]*"/.test(out)) out = out.replace(/viewBox="[^"]*"/, `viewBox="${next}"`);
      else out = out.replace(/<svg/, `<svg viewBox="${next}"`);
      // width/height attributes would fight the new viewBox
      out = out.replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1').replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1');
      fs.writeFileSync(p, out, 'utf8');
    }
    trimmed++;
  }
}

await browser.close();
console.log(`\nОбрезано: ${trimmed}, оставлено как есть: ${skipped}${DRY ? '  (пробный прогон)' : ''}`);
