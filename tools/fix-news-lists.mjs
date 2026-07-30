#!/usr/bin/env node
/* Split bullet runs that the source CMS had crammed into single paragraphs.

   A body entry beginning with "• " is rendered as a list item by the builder,
   and consecutive ones group into one <ul>. Run once:
       node tools/fix-news-lists.mjs                                        */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const P = path.join(ROOT, 'content/news.json');
const news = JSON.parse(fs.readFileSync(P, 'utf8'));

const BULLET = /^\s*(?:[●•‣▪·]|[-–—](?=\s)|\d+[.)])\s*/;

let touched = 0, items = 0;
for (const n of news) {
  const out = [];
  for (const para of n.body) {
    // the CMS stored list items as newline-separated lines inside one paragraph
    const lines = String(para).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 1) { out.push(lines[0]); continue; }
    let hit = false;
    for (const line of lines) {
      if (BULLET.test(line)) {
        out.push('• ' + line.replace(BULLET, '').replace(/^\t+/, '').trim());
        hit = true; items++;
      } else {
        out.push(line);
      }
    }
    if (hit) touched++;
  }
  n.body = out;
}

fs.writeFileSync(P, JSON.stringify(news, null, 1), 'utf8');
console.log(`Разбито списков: ${touched}, пунктов: ${items}`);
