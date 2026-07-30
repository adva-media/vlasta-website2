#!/usr/bin/env node
/* Link + asset integrity check across every generated page. */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const pages = [];
(function walk(dir, depth = 0) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === '_boss-preview'
      || e.name === 'assets' || e.name === 'content' || e.name === 'tools') continue;
    const rp = dir ? `${dir}/${e.name}` : e.name;
    if (e.isDirectory()) walk(rp, depth + 1);
    else if (e.name.endsWith('.html')) pages.push(rp);
  }
})('');

let badLinks = 0, badAssets = 0, noAlt = 0, checked = 0;
const seen = new Set();

for (const p of pages) {
  const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
  const dir = path.dirname(p);
  const resolve = href => path.normalize(path.join(dir === '.' ? '' : dir, href));

  // internal links
  for (const m of html.matchAll(/href="([^"#?][^"]*?)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:|#|\/\/)/.test(href)) continue;
    const target = resolve(href.split('#')[0].split('?')[0]);
    checked++;
    if (!fs.existsSync(path.join(ROOT, target))) {
      console.log(`  ✗ LINK  ${p} → ${href}`);
      badLinks++;
    }
  }
  // assets: img/src, css, js, video
  for (const m of html.matchAll(/(?:src|href)="([^"]+\.(?:png|jpe?g|webp|svg|css|js|mp4|ico))(?:\?[^"]*)?"/gi)) {
    const src = m[1];
    if (/^(https?:|\/\/|data:)/.test(src)) continue;
    const target = resolve(src);
    const key = target;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!fs.existsSync(path.join(ROOT, target))) {
      console.log(`  ✗ ASSET ${p} → ${src}`);
      badAssets++;
    }
  }
  // images must carry alt
  for (const m of html.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/gi)) {
    console.log(`  ✗ ALT   ${p} → ${m[0].slice(0, 76)}`);
    noAlt++;
  }
  // stray unrendered template literals
  if (/\$\{/.test(html)) {
    console.log(`  ✗ TMPL  ${p} contains an unrendered \${...}`);
  }
}

console.log(`\nСтраниц: ${pages.length} | ссылок проверено: ${checked}`);
console.log(`Битые ссылки: ${badLinks} | отсутствующие файлы: ${badAssets} | img без alt: ${noAlt}`);
process.exit(badLinks + badAssets + noAlt ? 1 : 0);
