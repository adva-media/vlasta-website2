#!/usr/bin/env node
/* Convert raster images to WebP (cwebp) so pages ship a leaner payload.
   Keeps the original only when WebP is not smaller. Run from repo root:
       node tools/opt-images.mjs
   Does not rewrite HTML — tools/build.mjs prefers a sibling .webp when present. */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CWEBP = process.env.CWEBP || 'cwebp';
const SKIP = new Set([
  'assets/img/og-default.jpg',
]);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'live-scrape') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(png|jpe?g)$/i.test(e.name)) out.push(p);
  }
  return out;
}

function maxEdge(rel) {
  if (/\/(hero-tower|approach-bg|roadmap-bg|services-bg|flare)/.test(rel)) return 1920;
  if (/\/team\//.test(rel)) return 900;
  if (/\/(clients|assoc)\//.test(rel)) return 640;
  if (/\/thanks\//.test(rel)) return 1200;
  if (/\/legal\//.test(rel)) return 1400;
  return 1600;
}

function quality(rel) {
  if (/\/(clients|assoc|logo)/.test(rel)) return 85;
  if (/\.png$/i.test(rel) && /news\//.test(rel)) return 78;
  return 80;
}

const files = walk(path.join(ROOT, 'assets/img'));
let made = 0, kept = 0, skipped = 0, bytesIn = 0, bytesOut = 0;

for (const abs of files) {
  const rel = path.relative(ROOT, abs).split(path.sep).join('/');
  if (SKIP.has(rel)) { skipped++; continue; }
  const webpAbs = abs.replace(/\.(png|jpe?g)$/i, '.webp');
  const srcSize = fs.statSync(abs).size;
  bytesIn += srcSize;
  const q = String(quality(rel));
  const edge = String(maxEdge(rel));
  const args = ['-quiet', '-mt', '-m', '6', '-q', q, '-resize', edge, '0', abs, '-o', webpAbs];
  const r = spawnSync(CWEBP, args, { encoding: 'utf8' });
  if (r.status !== 0) {
    console.log('  fail', rel, r.stderr || r.error);
    if (fs.existsSync(webpAbs)) fs.unlinkSync(webpAbs);
    skipped++;
    continue;
  }
  const outSize = fs.statSync(webpAbs).size;
  if (outSize >= srcSize * 0.97) {
    fs.unlinkSync(webpAbs);
    kept++;
    bytesOut += srcSize;
    continue;
  }
  bytesOut += outSize;
  made++;
  const pct = Math.round((1 - outSize / srcSize) * 100);
  if (srcSize > 200000) console.log(`  ${pct}%  ${(srcSize/1024|0)}k → ${(outSize/1024|0)}k  ${rel}`);
}

console.log(`\nwebp: ${made}  kept original: ${kept}  skip/fail: ${skipped}`);
console.log(`payload: ${(bytesIn/1048576).toFixed(1)} MB → ${(bytesOut/1048576).toFixed(1)} MB`);
