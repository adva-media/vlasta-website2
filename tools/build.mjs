#!/usr/bin/env node
/* ==========================================================================
   Власта-Консалтинг — static site generator (zero dependencies)

   Content lives in /content/*.json. Templates live here. Run:
       node tools/build.mjs
   …and every page, the sitemap and robots.txt are regenerated.

   To publish a news article: add an entry to content/news.json and rebuild.
   See README.md → «Публикация новостей».
   ========================================================================== */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const rd = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const site = rd('content/site.json');
const news = rd('content/news.json');
const cases = rd('content/cases.json');
const O = site.org;
const BASE = O.domain;
const BUILT = new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------ utils */
const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// body copy may carry inline <a>/<b>/<i>; keep those, escape the rest
const rich = s => String(s ?? '')
  .replace(/&(?!(amp|lt|gt|quot|#\d+|nbsp);)/g, '&amp;')
  .replace(/<(?!\/?(a|b|strong|i|em|u)\b)/gi, '&lt;');
const j = (...c) => c.filter(Boolean).join('\n');
const rel = (depth, p) => (depth ? '../'.repeat(depth) : '') + p;

function write(rp, html) {
  const abs = path.join(ROOT, rp);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, html.replace(/\n{3,}/g, '\n\n'), 'utf8');
}

/* ------------------------------------------------------------------ icons */
const I = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  moon: '<svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  sun: '<svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.4"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3v5.5c0 4.8-3.2 8-7.5 9.5-4.3-1.5-7.5-4.7-7.5-9.5V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  brand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.5 12.5 3.5a2 2 0 0 0-1.4-.6H4.5A1.5 1.5 0 0 0 3 4.4v6.6a2 2 0 0 0 .6 1.4l8 8a1.5 1.5 0 0 0 2.1 0l6.8-6.8a1.5 1.5 0 0 0 0-2.1z"/><circle cx="7.8" cy="7.8" r="1.4"/></svg>',
  scales: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M7 21h10M4 7h16M8 7l-4 6h8zM16 7l4 6h-8z"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5M3 18l9 5 9-5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13l4.5 4.5L20 6"/></svg>',
  drag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M15 7l5 5-5 5"/></svg>',
};

/* -------------------------------------------------- guilloche (signature) */
/* Rotated concentric ellipses form a rosette — the line-engraving language
   of banknotes, certificates and authentication seals. */
function guilloche(id = 'g1', rings = 26) {
  let p = '';
  for (let i = 0; i < rings; i++) {
    const a = (i * 180) / rings;
    const rx = 300 - i * 2.2;
    const ry = 132 - i * 3.4;
    p += `<ellipse cx="320" cy="320" rx="${rx.toFixed(1)}" ry="${Math.max(ry, 12).toFixed(1)}" transform="rotate(${a.toFixed(1)} 320 320)"/>`;
  }
  return `<svg viewBox="0 0 640 640" aria-hidden="true" focusable="false" fill="none" stroke="var(--mist)" stroke-width=".7">${p}</svg>`;
}
const engrave = (pos = 'tr', id = 'g1') =>
  `<div class="engrave engrave--${pos}" aria-hidden="true">${guilloche(id)}</div>`;

/* ------------------------------------ signature hero: link-analysis netmap */
function netmap(uid = 'a') {
  /* A graticule chart rather than a drawn coastline: nodes sit at their true
     relative lat/long, so the region reads as Eurasia without a fake outline.
     Links join neighbours to each other — deliberately not a hub from Moscow. */
  const X0 = 46, X1 = 714, Y0 = 155, Y1 = 300;
  const LON0 = 20, LON1 = 140, LAT0 = 60, LAT1 = 38;
  const px = lon => X0 + ((lon - LON0) / (LON1 - LON0)) * (X1 - X0);
  const py = lat => Y0 + ((LAT0 - lat) / (LAT0 - LAT1)) * (Y1 - Y0);

  // [lat, lon, label, minor?, anchor, dx, dy]
  const P = {
    by:  [53.9, 27.6, 'Беларусь',     0, 'middle', 0, -14],
    msk: [55.75, 37.6, 'Москва',      0, 'middle', 0, -14],
    ekb: [56.8, 60.6, 'Екатеринбург', 1, 'middle', 0, -11],
    nsk: [55.0, 82.9, 'Новосибирск',  1, 'middle', 0, -11],
    vvo: [43.1, 131.9, 'Владивосток', 1, 'end', -10, 3],
    kz:  [51.2, 71.4, 'Казахстан',    0, 'middle', 0, -14],
    uz:  [41.3, 69.2, 'Узбекистан',   0, 'middle', 2, 22],
    kg:  [42.9, 74.6, 'Кыргызстан',   0, 'start', 11, 4],
    ge:  [41.7, 44.8, 'Грузия',       0, 'end', -12, -6],
    am:  [40.2, 44.5, 'Армения',      0, 'end', -12, 12],
    az:  [40.4, 49.9, 'Азербайджан',  0, 'start', 12, -6],
  };
  const E = [
    ['by', 'msk'], ['msk', 'ekb', 1], ['ekb', 'nsk'], ['nsk', 'vvo'],
    ['ekb', 'kz', 1], ['kz', 'nsk'], ['kz', 'kg'], ['kz', 'uz', 1],
    ['uz', 'kg'], ['az', 'kz'], ['ge', 'am'], ['am', 'az'], ['msk', 'ge'],
  ];

  // graticule: meridians every 20°, parallels every 5°
  let grat = '';
  for (let lon = LON0; lon <= LON1; lon += 20) {
    const x = px(lon).toFixed(1);
    grat += `<line x1="${x}" y1="${(Y0 - 46).toFixed(0)}" x2="${x}" y2="${(Y1 + 46).toFixed(0)}"/>`;
  }
  for (let lat = LAT0; lat >= LAT1; lat -= 5) {
    const y = py(lat).toFixed(1);
    grat += `<line x1="${(X0 - 26).toFixed(0)}" y1="${y}" x2="${(X1 + 26).toFixed(0)}" y2="${y}"/>`;
  }

  const edges = E.map(([a, b, live]) => {
    const x1 = px(P[a][1]), y1 = py(P[a][0]), x2 = px(P[b][1]), y2 = py(P[b][0]);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.09 - 5;
    return `<path class="nm-edge${live ? ' nm-edge--live' : ''}" d="M${x1.toFixed(1)} ${y1.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
  }).join('');

  const nodes = Object.values(P).map(([lat, lon, label, minor, anchor, dx, dy]) => {
    const x = px(lon), y = py(lat), r = minor ? 3.2 : 5;
    const halo = minor ? '' :
      `<circle class="nm-halo nm-pulse" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9"/>` +
      `<circle class="nm-halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9"/>`;
    return `${halo}<circle class="nm-node${minor ? ' nm-node--minor' : ''}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>` +
      `<text class="nm-lbl${minor ? ' nm-lbl--minor' : ''}" x="${(x + dx).toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}">${esc(label)}</text>`;
  }).join('');

  return `<div class="netmap">
  <svg viewBox="0 118 760 232" role="img" aria-labelledby="nmT${uid} nmD${uid}">
    <title id="nmT${uid}">Карта присутствия: Россия, СНГ и страны ЕАЭС</title>
    <desc id="nmD${uid}">Схема связей между странами, где «Власта-Консалтинг» ведёт программы защиты брендов: Россия, Беларусь, Казахстан, Узбекистан, Кыргызстан, Грузия, Армения и Азербайджан.</desc>
    <mask id="nmM${uid}"><rect y="118" width="760" height="232" fill="url(#nmG${uid})"/></mask>
    <radialGradient id="nmG${uid}" cx="50%" cy="52%" r="58%">
      <stop offset="55%" stop-color="#fff"/><stop offset="100%" stop-color="#000"/>
    </radialGradient>
    <g class="nm-grat" mask="url(#nmM${uid})">${grat}</g>
    ${edges}
    ${nodes}
  </svg>
  <div class="nm-chip nm-chip--a"><b>80+ брендов</b><span>под активной защитой</span></div>
  <div class="nm-chip nm-chip--b"><b>5 стран ЕАЭС</b><span>единая программа мониторинга</span></div>
</div>`;
}

/* ------------------------------------------------------------------ chrome */
const NAV = [
  ['index.html', 'Главная'],
  ['services.html', 'Услуги'],
  ['about.html', 'О компании'],
  ['cases.html', 'Кейсы'],
  ['news.html', 'Новости'],
  ['contacts.html', 'Контакты'],
];

function head({ title, desc, canonical, keywords, image, depth = 0, jsonld = [], robots }) {
  const R = p => rel(depth, p);
  const img = `${BASE}/${image || 'assets/img/og-default.jpg'}`;
  return `<!DOCTYPE html>
<html lang="ru" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${keywords ? `<meta name="keywords" content="${esc(keywords)}">` : ''}
<meta name="robots" content="${robots || 'index,follow,max-image-preview:large'}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="ru" href="${canonical}">
<link rel="alternate" hreflang="x-default" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(O.name)}">
<meta property="og:locale" content="ru_RU">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${img}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${img}">
<meta name="theme-color" content="#11192B">
<script>(function(){var r=document.documentElement;r.classList.add('js');try{var t=localStorage.getItem('vlasta-theme');if(!t)t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';r.setAttribute('data-theme',t)}catch(e){}})();</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,200..800;1,300..600&display=swap">
<link rel="stylesheet" href="${R('assets/css/style.css')}">
<link rel="icon" href="${R('assets/img/logo-dark.svg')}" type="image/svg+xml">
${jsonld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
</head>
<body>
<div class="progress" aria-hidden="true"></div>`;
}

const orgLd = {
  '@context': 'https://schema.org', '@type': 'Organization',
  name: O.name, alternateName: 'Vlasta Consulting', url: `${BASE}/`,
  logo: `${BASE}/assets/img/logo-dark.svg`, foundingDate: String(O.founded),
  telephone: O.phoneHref, email: O.email,
  address: { '@type': 'PostalAddress', streetAddress: O.addressStreet, addressLocality: O.addressCity, postalCode: O.addressZip, addressCountry: 'RU' },
  areaServed: ['RU', 'BY', 'KZ', 'UZ', 'KG', 'AM', 'AZ', 'GE'],
  contactPoint: { '@type': 'ContactPoint', telephone: O.phoneHref, contactType: 'customer service', availableLanguage: ['Russian', 'English'] },
};
const crumbLd = items => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it[0], item: `${BASE}/${it[1]}` })),
});

function chrome(active, depth = 0) {
  const R = p => rel(depth, p);
  const links = NAV.map(([h, t]) =>
    `<a href="${R(h)}"${h === active ? ' class="is-on" aria-current="page"' : ''}>${t}</a>`).join('');
  const mlinks = NAV.map(([h, t]) =>
    `<a class="mnav__l${h === active ? ' is-on' : ''}" href="${R(h)}"${h === active ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  const tt = `<button class="tt" type="button" aria-label="Переключить тёмную тему" aria-pressed="false">${I.moon}${I.sun}</button>`;
  const brand = (light) => `<a class="brand" href="${R('index.html')}" aria-label="${esc(O.name)} — на главную">
      <img class="brand__mark" src="${R(light ? 'assets/img/logo-light.svg' : 'assets/img/logo-dark.svg')}" alt="" width="38" height="44">
      <span><span class="brand__name">${esc(O.name)}</span><span class="brand__sub">${esc(O.tagline)}</span></span>
    </a>`;

  return {
    header: `<div class="topbar">
  <div class="wrap">
    <div class="topbar__l">
      <a class="tb" href="tel:${O.phoneHref}">${I.phone}${esc(O.phone)}</a>
      <a class="tb" href="mailto:${O.email}">${I.mail}${esc(O.email)}</a>
      <span class="tb">${I.clock}${esc(O.hours)}</span>
    </div>
    <div class="topbar__r">
      <div class="lang"><a href="${R(active)}" class="is-on" aria-current="true" hreflang="ru">RU</a><span class="lang__soon" aria-disabled="true" title="Английская версия готовится">EN</span></div>
      ${tt}
    </div>
  </div>
</div>
<header class="hdr">
  <div class="wrap">
    ${brand(false)}
    <nav class="nav" aria-label="Основная навигация">${links}</nav>
    <div class="hdr__cta">
      <a href="${R('contacts.html')}" class="btn btn--primary">Консультация</a>
      <button class="burger" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mnav"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>`,

    footer: `<footer class="ft">
  <div class="wrap">
    <div class="ft__top">
      <div class="ft__about">
        ${brand(true)}
        <p>Обеспечиваем экономическую безопасность бизнеса и защиту брендов от контрафакта с ${O.founded} года — на передовых технологиях и высоких моральных ценностях.</p>
      </div>
      <div>
        <h4>Навигация</h4>
        <div class="ft__ls">${NAV.map(([h, t]) => `<a href="${R(h)}">${t}</a>`).join('')}</div>
      </div>
      <div>
        <h4>Направления</h4>
        <div class="ft__ls">${site.services.map(s => `<a href="${R('services.html')}#${s.id}">${esc(s.title)}</a>`).join('')}</div>
      </div>
      <div>
        <h4>Контакты</h4>
        <div class="ft__ls">
          <li>${esc(O.address)}</li>
          <a href="tel:${O.phoneHref}">${esc(O.phone)}</a>
          <a href="mailto:${O.email}">${esc(O.email)}</a>
          <li>${esc(O.hours)}</li>
        </div>
      </div>
    </div>
    <div class="ft__bot">
      <span>© <span id="yr">${new Date().getFullYear()}</span> ${esc(O.legal)}. Все права защищены.</span>
      <a href="${R('privacy.html')}">Политика конфиденциальности</a>
    </div>
  </div>
</footer>
<div class="overlay"></div>
<aside class="mnav" id="mnav" aria-label="Мобильное меню" aria-hidden="true">
  <div class="mnav__h">
    <span class="brand__name" style="color:#fff">Меню</span>
    <button class="mnav__x" type="button" aria-label="Закрыть меню">&times;</button>
  </div>
  <nav>${mlinks}</nav>
  <div class="mnav__extra">
    <div class="lang"><a href="${R(active)}" class="is-on">RU</a><span class="lang__soon" aria-disabled="true" title="Английская версия готовится">EN</span></div>
    ${tt}
  </div>
  <div class="mnav__f">
    <a href="tel:${O.phoneHref}">${esc(O.phone)}</a>
    <a href="mailto:${O.email}">${esc(O.email)}</a>
  </div>
</aside>
<button class="totop" type="button" aria-label="Наверх">${I.up}</button>
<script src="${R('assets/js/main.js')}" defer></script>
</body>
</html>`,
  };
}

/* ------------------------------------------------------------ components */
const kick = t => `<span class="kick">${esc(t)}</span>`;

function shead({ k, h, d, extra, mod = 'split', tag = 'h2' }) {
  return `<div class="shead shead--${mod} reveal">
      <div class="shead__t">${kick(k)}<${tag} class="h2">${esc(h)}</${tag}></div>
      ${d ? `<p class="shead__d lead">${esc(d)}</p>` : ''}${extra || ''}
    </div>`;
}

const ctaBand = (depth = 0) => `<section class="sec">
  <div class="wrap">
    <div class="cta reveal">
      ${engrave('tr', 'cta')}
      <div class="cta__in">
        <span class="pill"><span class="pill__d"></span>Начнём сотрудничество</span>
        <h2 class="h2">Обсудим, как защитить ваш бизнес</h2>
        <p>Оставьте заявку — проведём конфиденциальную консультацию, оценим риски и предложим решение под вашу задачу.</p>
        <div class="cta__btns">
          <a href="${rel(depth, 'contacts.html')}" class="btn btn--light">Получить консультацию ${I.arrow}</a>
          <a href="tel:${O.phoneHref}" class="btn btn--onDark">${esc(O.phone)}</a>
        </div>
      </div>
    </div>
  </div>
</section>`;

const clientsGrid = () => site.clients.map(c =>
  `<div class="client"><img src="${c.l}" alt="${esc(c.n)}" loading="lazy" decoding="async"></div>`).join('');

const marquee = () => {
  const row = site.clients.map(c =>
    `<span class="mq__i"><img src="${c.l}" alt="${esc(c.n)}" loading="lazy" decoding="async"></span>`).join('');
  return `<section class="mq" aria-label="Клиенты">
  <div class="mq__l">Нам доверяют ведущие российские и международные бренды</div>
  <div class="mq__vp"><div class="mq__tr">${row}${row}</div></div>
</section>`;
};

const timeline = () => `<div class="tl">
      <div class="tl__rail" tabindex="0" role="group" aria-label="Хронология компании — прокрутите по горизонтали">
        ${site.timeline.map(t => `<div class="tl__i${t.highlight ? ' tl__i--hi' : ''}">
          <div class="tl__yr">${esc(t.year)}</div>
          <div class="tl__axis"><span class="tl__dot"></span></div>
          <div class="tl__card"><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p></div>
        </div>`).join('')}
      </div>
    </div>`;

const assocGrid = () => `<div class="assoc-grid">
      ${site.associations.map((a, i) => `<button class="card glass assoc reveal" type="button" data-assoc="${i}" aria-haspopup="dialog">
        <span class="assoc__logo"><img src="${a.logo}" alt="${esc(a.abbr)}" loading="lazy" decoding="async"></span>
        <h3>${esc(a.name)}</h3>
        <span class="assoc__meta">${esc(a.meta)}</span>
        <span class="assoc__more">Подробнее ${I.arrow}</span>
      </button>`).join('')}
    </div>
    <div class="modal" id="assocModal" role="dialog" aria-modal="true" aria-labelledby="amTitle" hidden>
      <div class="modal__bd" data-close></div>
      <div class="modal__c">
        <button class="modal__x" type="button" aria-label="Закрыть" data-close>${I.x}</button>
        <img class="modal__logo" id="amLogo" src="" alt="">
        <div class="modal__meta" id="amMeta"></div>
        <h3 id="amTitle"></h3>
        <p id="amDesc"></p>
        <a class="modal__link" id="amLink" href="#" target="_blank" rel="noopener noreferrer"><span></span> ${I.ext}</a>
      </div>
    </div>
    <script id="assocData" type="application/json">${JSON.stringify(site.associations.map(a => ({ logo: a.logo, name: a.name, meta: a.meta, desc: a.desc, url: a.url, site: a.site })))}</script>`;

const newsCard = (n, depth = 0, d = 0) => `<a class="card ncard reveal" href="${rel(depth, `news/${n.slug}.html`)}"${d ? ` data-d="${d}"` : ''}>
        ${n.img ? `<div class="ncard__img"><img src="${rel(depth, n.img)}" alt="${esc(n.title)}" loading="lazy" decoding="async">${n.video ? `<span class="ncard__play" aria-hidden="true">${I.play}</span>` : ''}</div>` : ''}
        <div class="ncard__b">
          <div class="ncard__meta"><time datetime="${n.dateIso}">${esc(n.dateDisp)}</time><span class="dot"></span><span class="cl">${esc(n.cluster)}</span></div>
          <h3>${esc(n.title)}</h3>
          <span class="ncard__more arrow-link">Читать ${I.arrow}</span>
        </div>
      </a>`;

const caseCard = (c, depth = 0, d = 0) => `<a class="card case reveal" href="${rel(depth, `cases/${c.slug}.html`)}"${d ? ` data-d="${d}"` : ''}>
        ${c.img ? `<div class="case__img"><img src="${rel(depth, c.img)}" alt="${esc(c.title)}" loading="lazy" decoding="async"></div>` : ''}
        <div class="case__b">
          <span class="case__cat">${esc(c.category)}</span>
          <h3>${esc(c.title)}</h3>
          <p>${esc(c.intro)}</p>
          <div class="case__f">
            ${c.metric ? `<span class="case__m">${esc(c.metric)}</span>` : '<span></span>'}
            <span class="case__go" aria-hidden="true">${I.arrow}</span>
          </div>
        </div>
      </a>`;

/* ================================================================== pages */

/* ---------------------------------------------------------------- HOME */
function buildHome() {
  const c = chrome('index.html', 0);
  const featCases = cases.filter(x => [5, 10, 11].includes(x.n)).slice(0, 3);
  const featNews = news.slice(0, 3);

  const html = j(
    head({
      title: `${O.name} — защита брендов и экономическая безопасность бизнеса`,
      desc: `«${O.name}» с ${O.founded} года защищает товарные знаки от контрафакта и обеспечивает экономическую безопасность бизнеса в России, СНГ и странах ЕАЭС: ТРОИС, рейды, проверки контрагентов, сопровождение в суде.`,
      keywords: 'защита бренда, борьба с контрафактом, ТРОИС, экономическая безопасность бизнеса, проверка контрагентов, бизнес-разведка, Власта-Консалтинг',
      canonical: `${BASE}/`,
      jsonld: [orgLd, {
        '@context': 'https://schema.org', '@type': 'WebSite', name: O.name, url: `${BASE}/`,
        inLanguage: 'ru-RU',
        potentialAction: { '@type': 'SearchAction', target: `${BASE}/news.html?q={q}`, 'query-input': 'required name=q' },
      }],
    }),
    c.header,
    `<main>

<section class="hero">
  ${engrave('tr', 'hero')}
  <div class="wrap">
    <div class="hero__grid">
      <div>
        <span class="pill rise"><span class="pill__d"></span>С ${O.founded} года · Москва · Россия и ЕАЭС</span>
        <h1 class="display rise" data-d="1">Безопасность бизнеса<br>в <b>надёжных руках</b></h1>
        <p class="hero__lead lead rise" data-d="2">Защищаем бренды от контрафакта и обеспечиваем экономическую безопасность компаний в России, СНГ и странах ЕАЭС — опираясь на передовые технологии и высокие моральные ценности.</p>
        <div class="hero__cta rise" data-d="3">
          <a href="services.html" class="btn btn--primary">Наши услуги ${I.arrow}</a>
          <a href="contacts.html" class="btn btn--outline">Связаться с нами</a>
        </div>
      </div>
      <div class="rise" data-d="3">${netmap("hero")}</div>
    </div>
    <div class="stats rise" data-d="4">
      ${site.stats.map(s => `<div class="stat">
        <div class="stat__n">${esc(s.n)}${s.suffix ? `<span class="u">${esc(s.suffix)}</span>` : ''}${s.unit ? `<span class="u">${esc(s.unit)}</span>` : ''}</div>
        <div class="stat__l">${esc(s.label)}</div>
      </div>`).join('')}
    </div>
  </div>
</section>

${marquee()}

<section class="sec" id="services">
  <div class="wrap">
    ${shead({
      k: 'Направления работы', h: 'Восемь направлений в четырёх блоках',
      d: 'Единая методология — от анализа рисков до сопровождения «под ключ» в суде. Каждый блок работает самостоятельно и усиливает остальные.',
    })}
    <div class="svc-grid">
      ${site.services.map((s, i) => `<a class="card svc reveal" href="services.html#${s.id}"${i ? ` data-d="${i}"` : ''}>
        <div class="svc__top"><span class="ico">${I[s.icon]}</span><span class="svc__blk">${esc(s.block)}</span></div>
        <h3 class="h3">${esc(s.title)}</h3>
        <p class="svc__tag">${esc(s.tagline)}</p>
        <ul class="svc__hl">${s.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
        <span class="svc__more arrow-link">Подробнее ${I.arrow}</span>
      </a>`).join('')}
    </div>
  </div>
</section>

<section class="sec sec--alt" id="approach">
  ${engrave('bl', 'appr')}
  <div class="wrap">
    ${shead({ k: 'Наш подход', h: 'От анализа рисков до устойчивого результата', mod: 'split' })}
    <div class="appr">
      ${site.approach.map((a, i) => `<div class="card appr__c${i === 1 ? ' appr__c--hi' : ''} reveal"${i ? ` data-d="${i}"` : ''}>
        <div class="appr__top"><span class="ico">${I[a.icon]}</span><span class="appr__n">0${a.n}</span></div>
        <h3>${esc(a.title)}</h3><p>${esc(a.text)}</p>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="sec sec--ink" id="results">
  ${engrave('tr', 'res')}
  <div class="wrap">
    ${shead({
      k: 'Наша практика', h: 'Результаты, измеримые в цифрах',
      d: 'Показатели программы защиты брендов от контрафакта и недобросовестной конкуренции — реальный эффект для правообладателей.',
    })}
    <div class="res">
      ${site.results.map((r, i) => {
        const off = (327 * (100 - r.pct) / 100).toFixed(0);
        return `<div class="card glass res__c reveal"${i ? ` data-d="${i}"` : ''}>
        <div class="gauge" style="--off:${off}">
          <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="gauge__tr" cx="60" cy="60" r="52"/><circle class="gauge__fl" cx="60" cy="60" r="52"/></svg>
          <div class="gauge__v">${esc(r.value)}${r.unit ? `<small>${esc(r.unit)}</small>` : ''}</div>
        </div>
        <p class="res__l">${esc(r.label)}</p>
      </div>`;
      }).join('')}
    </div>
  </div>
</section>

<section class="sec sec--dark" id="geography">
  ${engrave('bl', 'geo')}
  <div class="wrap geo">
    <div class="reveal">
      ${kick(site.geography.kicker)}
      <h2 class="h2" style="margin-top:15px">${esc(site.geography.title)}</h2>
      <p class="lead" style="margin-top:18px">${esc(site.geography.lead)}</p>
      <ul class="geo__list">${site.geography.regions.map(r => `<li><span class="geo__d"></span>${esc(r)}</li>`).join('')}</ul>
      <div class="geo__bar">${site.geography.bar.map(b => `<div><b>${esc(b.n)}</b><span>${esc(b.label)}</span></div>`).join('')}</div>
    </div>
    <div class="reveal" data-d="1">${netmap("geo")}</div>
  </div>
</section>

<section class="sec" id="cases">
  <div class="wrap">
    ${shead({
      k: 'Кейсы', h: 'Как мы решаем задачи клиентов',
      extra: `<a href="cases.html" class="seeall"><span class="seeall__l">Все кейсы</span><span class="seeall__r">${I.arrow}</span></a>`,
    })}
    <div class="case-grid">${featCases.map((x, i) => caseCard(x, 0, i)).join('')}</div>
  </div>
</section>

<section class="sec sec--alt">
  <div class="wrap">
    ${shead({
      k: 'Клиенты', h: 'Нам доверяют ведущие бренды', mod: 'center',
    })}
    <div class="clients reveal">${clientsGrid()}</div>
    <p class="clients-note">и ещё <b>более 80 брендов</b> под нашей защитой</p>
  </div>
</section>

<section class="sec" id="news">
  <div class="wrap">
    ${shead({
      k: 'Новости', h: 'Компания в публичном пространстве',
      extra: `<a href="news.html" class="seeall"><span class="seeall__l">Все новости</span><span class="seeall__r">${I.arrow}</span></a>`,
    })}
    <div class="news-grid">${featNews.map((n, i) => newsCard(n, 0, i)).join('')}</div>
  </div>
</section>

${ctaBand(0)}
</main>`,
    c.footer);
  write('index.html', html);
}

/* ------------------------------------------------------------- SERVICES */
function buildServices() {
  const c = chrome('services.html', 0);
  const html = j(
    head({
      title: 'Услуги: защита бренда, ТРОИС, проверки контрагентов, бизнес-разведка — Власта-Консалтинг',
      desc: 'Восемь направлений в четырёх блоках: разведка и анализ, безопасность бизнеса, защита бренда и ИС, консалтинг. Регистрация в ТРОИС, рейды с полицией и таможней, комплаенс, сопровождение в суде.',
      keywords: 'защита интеллектуальной собственности, ТРОИС, бизнес-разведка, проверка контрагентов, комплаенс KYC AML, физическая безопасность, юридический консалтинг',
      canonical: `${BASE}/services.html`,
      jsonld: [orgLd, crumbLd([['Главная', ''], ['Услуги', 'services.html']]), {
        '@context': 'https://schema.org', '@type': 'ItemList',
        itemListElement: site.services.map((s, i) => ({
          '@type': 'ListItem', position: i + 1,
          item: { '@type': 'Service', name: s.title, description: s.tagline, provider: { '@type': 'Organization', name: O.name }, url: `${BASE}/services.html#${s.id}` },
        })),
      }],
    }),
    c.header,
    `<main>
<section class="phero">
  ${engrave('tr', 'ph')}
  <div class="wrap">
    <nav class="crumbs" aria-label="Хлебные крошки"><a href="index.html">Главная</a> / <span>Услуги</span></nav>
    ${kick('Направления работы')}
    <h1 class="h1">Услуги по защите бренда и безопасности бизнеса</h1>
    <p class="lead">Четыре блока, восемь направлений, единая методология: анализ рисков, предупреждение угроз и сопровождение клиента вплоть до защиты интересов в суде — в России, СНГ и странах ЕАЭС.</p>
  </div>
</section>

<section class="sec sec--tight sec--alt">
  <div class="wrap">
    <nav class="chips" aria-label="Блоки услуг">
      ${site.services.map(s => `<a class="chip" href="#${s.id}"><b>${esc(s.num)}</b>${esc(s.title)}</a>`).join('')}
    </nav>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    ${site.services.map(s => `<article class="svc-detail reveal" id="${s.id}">
      <div class="svc-detail__head">
        <span class="svc-detail__num">${esc(s.block)} · ${esc(s.num)}</span>
        <h2 class="h2">${esc(s.title)}</h2>
      </div>
      <p class="lead" style="max-width:70ch">${esc(s.intro)}</p>
      <div class="dir-grid">
        ${s.directions.map(d => `<div class="card dir">
          <h4>${esc(d.title)}</h4>
          <p>${esc(d.text)}</p>
        </div>`).join('')}
      </div>
    </article>`).join('')}
  </div>
</section>

${ctaBand(0)}
</main>`,
    c.footer);
  write('services.html', html);
}

/* ---------------------------------------------------------------- ABOUT */
function buildAbout() {
  const c = chrome('about.html', 0);
  const html = j(
    head({
      title: 'О компании Власта-Консалтинг — эксперты по защите брендов с 2006 года',
      desc: 'История, команда и партнёрства «Власта-Консалтинг»: 20 лет на рынке, членство в WAD, INTA, ASIS, AEB и «Антиконтрафакт», защита интересов международных корпораций в России и ЕАЭС.',
      keywords: 'Власта-Консалтинг о компании, WAD, INTA, ASIS, история компании, команда, ассоциации безопасности',
      canonical: `${BASE}/about.html`,
      jsonld: [orgLd, crumbLd([['Главная', ''], ['О компании', 'about.html']])],
    }),
    c.header,
    `<main>
<section class="phero">
  ${engrave('tr', 'ph')}
  <div class="wrap">
    <nav class="crumbs" aria-label="Хлебные крошки"><a href="index.html">Главная</a> / <span>О компании</span></nav>
    ${kick('О нас')}
    <h1 class="h1">Эксперты по защите брендов и безопасности бизнеса с ${O.founded} года</h1>
    <p class="lead">Мы помогаем компаниям расти спокойно — анализируем риски, предвидим неблагоприятные сценарии и выстраиваем системы защиты, которые работают на опережение.</p>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    ${shead({ k: 'Кто мы', h: 'Надёжный партнёр в вопросах экономической безопасности',
      d: 'Основанная в 2006 году, компания занимает лидирующее место в сфере обеспечения безопасности бизнеса и защиты интеллектуальной собственности в России.' })}
    <div class="values reveal">
      ${site.values.map(v => `<div class="value"><span class="value__n">${esc(v.num)}</span><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="sec sec--alt" id="history">
  ${engrave('bl', 'tl')}
  <div class="wrap">
    ${shead({
      k: 'История компании', h: 'Путь, отмеченный международным признанием',
      extra: `<p class="tl__hint">От московского старта до международной практики ${I.drag} листайте</p>`,
    })}
    ${timeline()}
  </div>
</section>

<section class="sec" id="team">
  <div class="wrap">
    ${shead({ k: 'Руководство', h: 'Команда, которая отвечает за результат', mod: 'center' })}
    <div class="team">
      ${site.team.map((t, i) => `<div class="card person reveal"${i ? ` data-d="${i}"` : ''}>
        <div class="person__ph"><img src="${t.img}" alt="${esc(t.name)} — ${esc(t.role)}" loading="lazy" decoding="async"></div>
        <h3>${esc(t.name)}</h3>
        <div class="person__role">${esc(t.role)}</div>
        <p>${esc(t.note)}</p>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="sec sec--alt" id="associations">
  ${engrave('tr', 'as')}
  <div class="wrap">
    ${shead({
      k: 'Партнёрство', h: 'Ассоциации и профессиональные сообщества',
      d: 'Мы состоим в ведущих российских и международных объединениях. Нажмите на карточку, чтобы узнать об участии в каждой ассоциации.',
    })}
    ${assocGrid()}
  </div>
</section>

<section class="sec" id="clients">
  <div class="wrap">
    ${shead({ k: 'Клиенты', h: 'Нам доверяют ведущие бренды', mod: 'center' })}
    <div class="clients reveal">${clientsGrid()}</div>
    <p class="clients-note">и ещё <b>более 80 брендов</b> под нашей защитой</p>
  </div>
</section>

<section class="sec sec--alt" id="letters">
  <div class="wrap">
    ${shead({ k: 'Отзывы', h: 'Благодарственные письма', d: 'Нажмите на письмо, чтобы открыть его целиком.' })}
    <div class="letters">
      ${site.letters.map((l, i) => `<button class="letter reveal" type="button" data-letter${i ? ` data-d="${i}"` : ''}>
        <span class="letter__th"><img src="${l.img}" alt="Благодарственное письмо — ${esc(l.name)}" loading="lazy" decoding="async"></span>
        <span class="letter__n">${esc(l.name)}</span>
      </button>`).join('')}
    </div>
    <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Благодарственное письмо" hidden>
      <div class="lightbox__p">
        <div class="lightbox__h">
          <span class="lightbox__t"></span>
          <button class="lightbox__x" type="button" aria-label="Закрыть" data-close>${I.x}</button>
        </div>
        <div class="lightbox__b"><img src="" alt=""></div>
      </div>
    </div>
  </div>
</section>

${ctaBand(0)}
</main>`,
    c.footer);
  write('about.html', html);
}

/* ---------------------------------------------------------------- CASES */
function buildCases() {
  const c = chrome('cases.html', 0);
  const cats = [...new Set(cases.map(x => x.category))];
  const html = j(
    head({
      title: 'Кейсы: борьба с контрафактом, расследования, due diligence — Власта-Консалтинг',
      desc: `${cases.length} проектов из практики: блокировка каналов дистрибуции контрафакта, работа по ЕАЭС, рейды на производствах, расследования хищений, проверка контрагентов и сопровождение в суде.`,
      keywords: 'кейсы борьба с контрафактом, антиконтрафактный рейд, ЕАЭС контрафакт, due diligence, корпоративное расследование, ТРОИС кейс',
      canonical: `${BASE}/cases.html`,
      jsonld: [orgLd, crumbLd([['Главная', ''], ['Кейсы', 'cases.html']]), {
        '@context': 'https://schema.org', '@type': 'ItemList',
        numberOfItems: cases.length,
        itemListElement: cases.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.title, url: `${BASE}/cases/${x.slug}.html` })),
      }],
    }),
    c.header,
    `<main>
<section class="phero">
  ${engrave('tr', 'ph')}
  <div class="wrap">
    <nav class="crumbs" aria-label="Хлебные крошки"><a href="index.html">Главная</a> / <span>Кейсы</span></nav>
    ${kick('Из практики')}
    <h1 class="h1">Кейсы: контрафакт, расследования и защита активов</h1>
    <p class="lead">Реальные проекты по защите товарных знаков, антиконтрафактным программам, проверкам контрагентов и внутренним расследованиям. Детали обезличены в целях конфиденциальности клиентов.</p>
  </div>
</section>

<section class="sec sec--tight sec--alt">
  <div class="wrap">
    <nav class="chips" aria-label="Фильтр по категориям">
      <button class="chip is-on" type="button" data-filter="all">Все <b>${cases.length}</b></button>
      ${cats.map(cat => `<button class="chip" type="button" data-filter="${esc(cat)}">${esc(cat)} <b>${cases.filter(x => x.category === cat).length}</b></button>`).join('')}
    </nav>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="case-grid" id="caseGrid">
      ${cases.map((x, i) => `<a class="card case reveal" href="cases/${x.slug}.html" data-cat="${esc(x.category)}"${i % 3 ? ` data-d="${i % 3}"` : ''}>
        ${x.img ? `<div class="case__img"><img src="${x.img}" alt="${esc(x.title)}" loading="lazy" decoding="async"></div>` : ''}
        <div class="case__b">
          <span class="case__cat">${esc(x.category)}</span>
          <h2 class="h3">${esc(x.title)}</h2>
          <p>${esc(x.intro)}</p>
          <div class="case__f">
            ${x.metric ? `<span class="case__m">${esc(x.metric)}</span>` : '<span></span>'}
            <span class="case__go" aria-hidden="true">${I.arrow}</span>
          </div>
        </div>
      </a>`).join('')}
    </div>
    <p class="empty" id="caseEmpty" hidden>По выбранной категории кейсов пока нет.</p>
  </div>
</section>

${ctaBand(0)}
</main>`,
    c.footer);
  write('cases.html', html);

  // ---- detail pages
  cases.forEach((x, idx) => {
    const cc = chrome('cases.html', 1);
    const prev = cases[idx - 1], next = cases[idx + 1];
    const desc = x.intro.length > 300 ? x.intro.slice(0, 297) + '…' : x.intro;
    const page = j(
      head({
        title: `${x.title} — кейс «Власта-Консалтинг»`,
        desc,
        keywords: x.tags.join(', '),
        canonical: `${BASE}/cases/${x.slug}.html`,
        image: x.img || undefined,
        depth: 1,
        jsonld: [orgLd, crumbLd([['Главная', ''], ['Кейсы', 'cases.html'], [x.title, `cases/${x.slug}.html`]]), {
          '@context': 'https://schema.org', '@type': 'Article',
          headline: x.title, description: desc, articleSection: x.category,
          keywords: x.tags.join(', '),
          image: x.img ? `${BASE}/${x.img}` : undefined,
          author: { '@type': 'Organization', name: O.name },
          publisher: { '@type': 'Organization', name: O.name, logo: { '@type': 'ImageObject', url: `${BASE}/assets/img/logo-dark.svg` } },
          inLanguage: 'ru-RU',
        }],
      }),
      cc.header,
      `<main>
<section class="case-hero">
  ${engrave('tr', 'ch')}
  <span class="case-hero__n" aria-hidden="true">${String(x.n).padStart(2, '0')}</span>
  <div class="wrap">
    <nav class="crumbs" aria-label="Хлебные крошки"><a href="../index.html">Главная</a> / <a href="../cases.html">Кейсы</a> / <span>${esc(x.title)}</span></nav>
    ${kick(x.category)}
    <h1 class="h1">${esc(x.title)}</h1>
    <p class="lead">${esc(x.intro)}</p>
    <div class="tags">${x.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
  </div>
</section>

<section class="sec">
  <div class="wrap wrap--narrow">
    <div class="facts reveal">
      <div class="fact"><span>Направление</span><strong>${esc(x.category)}</strong></div>
      <div class="fact"><span>Регион</span><strong>Россия · СНГ · ЕАЭС</strong></div>
      <div class="fact"><span>${x.metric ? 'Результат' : 'Формат'}</span><strong>${esc(x.metric || 'Проектная работа')}</strong></div>
    </div>
    ${x.img ? `<div class="article__hero reveal"><img src="../${x.img}" alt="${esc(x.title)}" loading="lazy" decoding="async"></div>` : ''}
    <div class="prose reveal">
      ${x.sections.map((s, i) => `<h2><span class="step">${String(i + 1).padStart(2, '0')}</span>${esc(s.h)}</h2>
      ${s.p.map(p => `<p>${esc(p)}</p>`).join('')}`).join('')}
    </div>
    <nav class="pager" aria-label="Другие кейсы">
      ${prev ? `<a class="arrow-link" href="${prev.slug}.html" style="transform:scaleX(1)">${I.arrow} ${esc(prev.title)}</a>` : '<span></span>'}
      ${next ? `<a class="arrow-link" href="${next.slug}.html">${esc(next.title)} ${I.arrow}</a>` : '<span></span>'}
    </nav>
  </div>
</section>

${ctaBand(1)}
</main>`,
      cc.footer);
    write(`cases/${x.slug}.html`, page);
  });
}

/* ----------------------------------------------------------------- NEWS */
function buildNews() {
  const c = chrome('news.html', 0);
  const clusters = [...new Set(news.map(n => n.cluster))];
  const INITIAL = 12;

  const html = j(
    head({
      title: 'Новости: борьба с контрафактом в России и ЕАЭС — Власта-Консалтинг',
      desc: `${news.length} материалов: антиконтрафактные операции и изъятия, инициативы на площадках ЕЭК и ФТС, участие в международных форумах по защите интеллектуальной собственности.`,
      keywords: 'новости контрафакт, изъятие контрафакта, ЕАЭС, ФТС, ТРОИС, конференции по защите брендов',
      canonical: `${BASE}/news.html`,
      image: news[0]?.img,
      jsonld: [orgLd, crumbLd([['Главная', ''], ['Новости', 'news.html']]), {
        '@context': 'https://schema.org', '@type': 'CollectionPage',
        name: 'Новости Власта-Консалтинг', url: `${BASE}/news.html`, inLanguage: 'ru-RU',
        mainEntity: {
          '@type': 'ItemList', numberOfItems: news.length,
          itemListElement: news.slice(0, 30).map((n, i) => ({ '@type': 'ListItem', position: i + 1, name: n.title, url: `${BASE}/news/${n.slug}.html` })),
        },
      }],
    }),
    c.header,
    `<main>
<section class="phero">
  ${engrave('tr', 'ph')}
  <div class="wrap">
    <nav class="crumbs" aria-label="Хлебные крошки"><a href="index.html">Главная</a> / <span>Новости</span></nav>
    ${kick('Хроника')}
    <h1 class="h1">Новости борьбы с контрафактом и защиты брендов</h1>
    <p class="lead">Антиконтрафактные операции и изъятия, инициативы на площадках ЕЭК и ФТС, участие в международных форумах по защите интеллектуальной собственности.</p>
  </div>
</section>

<section class="sec sec--tight sec--alt">
  <div class="wrap">
    <nav class="chips" aria-label="Фильтр по темам">
      <button class="chip is-on" type="button" data-filter="all">Все <b>${news.length}</b></button>
      ${clusters.map(cl => `<button class="chip" type="button" data-filter="${esc(cl)}">${esc(cl)} <b>${news.filter(n => n.cluster === cl).length}</b></button>`).join('')}
    </nav>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <p class="count" id="newsCount">Показано ${INITIAL} из ${news.length} материалов</p>
    <div class="news-grid" id="newsGrid" data-initial="${INITIAL}">
      ${news.map((n, i) => `<a class="card ncard reveal" href="news/${n.slug}.html" data-cat="${esc(n.cluster)}"${i >= INITIAL ? ' hidden' : ''}${i % 3 && i < INITIAL ? ` data-d="${i % 3}"` : ''}>
        ${n.img ? `<div class="ncard__img"><img src="${n.img}" alt="${esc(n.title)}" loading="lazy" decoding="async">${n.video ? `<span class="ncard__play" aria-hidden="true">${I.play}</span>` : ''}</div>` : ''}
        <div class="ncard__b">
          <div class="ncard__meta"><time datetime="${n.dateIso}">${esc(n.dateDisp)}</time><span class="dot"></span><span class="cl">${esc(n.cluster)}</span></div>
          <h2 class="h3" style="font-size:16.5px">${esc(n.title)}</h2>
          <span class="ncard__more arrow-link">Читать ${I.arrow}</span>
        </div>
      </a>`).join('')}
    </div>
    <p class="empty" id="newsEmpty" hidden>По выбранной теме материалов пока нет.</p>
    <div class="center" style="text-align:center;margin-top:38px">
      <button class="btn btn--outline" type="button" id="newsMore">Показать ещё ${I.arrow}</button>
    </div>
  </div>
</section>
</main>`,
    c.footer);
  write('news.html', html);

  // ---- article pages
  news.forEach((n, idx) => {
    const cc = chrome('news.html', 1);
    const prev = news[idx - 1], next = news[idx + 1];
    const related = news.filter(r => r.cluster === n.cluster && r.slug !== n.slug).slice(0, 3);
    const videoBlock = n.video
      ? (n.video.type === 'mp4'
        ? `<div class="video"><video controls preload="none"${n.img ? ` poster="../${n.img}"` : ''}><source src="${esc(n.video.src)}" type="video/mp4">Ваш браузер не поддерживает видео.</video></div>`
        : `<div class="video"><iframe src="${esc(n.video.src)}" title="Видео к материалу: ${esc(n.title)}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`)
      : '';

    const page = j(
      head({
        title: n.metaTitle.length > 65 ? `${n.metaTitle.slice(0, 62)}…` : n.metaTitle,
        desc: n.metaDesc,
        keywords: n.keywords.join(', '),
        canonical: `${BASE}/news/${n.slug}.html`,
        image: n.img || undefined,
        depth: 1,
        jsonld: [orgLd, crumbLd([['Главная', ''], ['Новости', 'news.html'], [n.title, `news/${n.slug}.html`]]), {
          '@context': 'https://schema.org', '@type': 'NewsArticle',
          headline: n.h1.length > 110 ? n.h1.slice(0, 107) + '…' : n.h1,
          description: n.metaDesc,
          datePublished: n.dateIso, dateModified: n.dateIso,
          articleSection: n.cluster, keywords: n.keywords.join(', '),
          image: n.img ? [`${BASE}/${n.img}`] : undefined,
          author: { '@type': 'Organization', name: O.name, url: `${BASE}/` },
          publisher: { '@type': 'Organization', name: O.name, logo: { '@type': 'ImageObject', url: `${BASE}/assets/img/logo-dark.svg` } },
          mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE}/news/${n.slug}.html` },
          inLanguage: 'ru-RU',
        }],
      }),
      cc.header,
      `<main>
<section class="phero">
  ${engrave('tr', 'ph')}
  <div class="wrap wrap--narrow">
    <nav class="crumbs" aria-label="Хлебные крошки"><a href="../index.html">Главная</a> / <a href="../news.html">Новости</a> / <span>${esc(n.dateDisp)}</span></nav>
    <div class="article__meta"><time datetime="${n.dateIso}">${esc(n.dateDisp)}</time><span>·</span><span class="cl">${esc(n.cluster)}</span></div>
    <h1 class="h1 rise" style="margin-top:14px">${esc(n.h1)}</h1>
  </div>
</section>

<section class="sec">
  <div class="wrap wrap--narrow">
    ${n.img ? `<div class="article__hero reveal"><img src="../${n.img}" alt="${esc(n.title)}" width="1200" height="514" decoding="async"></div>` : ''}
    ${videoBlock}
    <article class="prose reveal">
      ${n.body.map(p => `<p>${rich(p)}</p>`).join('')}
    </article>
    ${n.links.length ? `<div class="srcs">
      <h4>Источники и упоминания</h4>
      <ul>${n.links.map(l => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${I.ext}${esc(l.text)}</a></li>`).join('')}</ul>
    </div>` : ''}
    <nav class="pager" aria-label="Другие материалы">
      ${prev ? `<a class="arrow-link" href="${prev.slug}.html">${I.arrow} Новее</a>` : '<span></span>'}
      ${next ? `<a class="arrow-link" href="${next.slug}.html">Ранее ${I.arrow}</a>` : '<span></span>'}
    </nav>
  </div>
</section>

${related.length ? `<section class="sec sec--alt">
  <div class="wrap">
    ${shead({ k: 'По теме', h: esc(n.cluster), mod: 'split' })}
    <div class="news-grid">${related.map((r, i) => newsCard(r, 1, i)).join('')}</div>
  </div>
</section>` : ''}

${ctaBand(1)}
</main>`,
      cc.footer);
    write(`news/${n.slug}.html`, page);
  });
}

/* ------------------------------------------------------------- CONTACTS */
function buildContacts() {
  const c = chrome('contacts.html', 0);
  const html = j(
    head({
      title: 'Контакты — Власта-Консалтинг, Москва',
      desc: `Свяжитесь с «${O.name}»: ${O.address}. Телефон ${O.phone}, e-mail ${O.email}. Конфиденциальная консультация по защите бренда и безопасности бизнеса.`,
      keywords: 'Власта-Консалтинг контакты, консультация по защите бренда, безопасность бизнеса Москва',
      canonical: `${BASE}/contacts.html`,
      jsonld: [orgLd, crumbLd([['Главная', ''], ['Контакты', 'contacts.html']]), {
        '@context': 'https://schema.org', '@type': 'LocalBusiness',
        name: O.legal, url: `${BASE}/contacts.html`, telephone: O.phoneHref, email: O.email,
        address: { '@type': 'PostalAddress', streetAddress: O.addressStreet, addressLocality: O.addressCity, postalCode: O.addressZip, addressCountry: 'RU' },
        openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:30', closes: '18:00' }],
      }],
    }),
    c.header,
    `<main>
<section class="phero">
  ${engrave('tr', 'ph')}
  <div class="wrap">
    <nav class="crumbs" aria-label="Хлебные крошки"><a href="index.html">Главная</a> / <span>Контакты</span></nav>
    ${kick('Свяжитесь с нами')}
    <h1 class="h1">Обсудим безопасность вашего бизнеса</h1>
    <p class="lead">Оставьте заявку или свяжитесь напрямую — проведём конфиденциальную консультацию и предложим решение под вашу задачу.</p>
  </div>
</section>

<section class="sec">
  <div class="wrap contact-grid">
    <div class="reveal">
      <div class="ci">
        <div class="ci__i"><span class="ci__ico">${I.pin}</span><div><h4>Адрес</h4><p>${esc(O.addressZip)}, ${esc(O.addressCity)},<br>${esc(O.addressStreet)}</p></div></div>
        <div class="ci__i"><span class="ci__ico">${I.phone}</span><div><h4>Телефон</h4><a href="tel:${O.phoneHref}">${esc(O.phone)}</a></div></div>
        <div class="ci__i"><span class="ci__ico">${I.mail}</span><div><h4>Электронная почта</h4><a href="mailto:${O.email}">${esc(O.email)}</a></div></div>
        <div class="ci__i"><span class="ci__ico">${I.clock}</span><div><h4>Часы работы</h4><p>Понедельник – Пятница<br>9:30 – 18:00</p></div></div>
      </div>
      <div class="map-embed" style="margin-top:26px">
        <iframe title="Офис «Власта-Консалтинг» на карте: Москва, ул. Усачёва, 13" loading="lazy" src="https://yandex.ru/map-widget/v1/?ll=37.566%2C55.728&z=16&text=${encodeURIComponent(O.address)}"></iframe>
      </div>
    </div>

    <div class="reveal" data-d="1">
      <form class="form" id="contactForm" novalidate>
        <div class="form__ok" id="formOk" role="status">Заявка отправлена. Мы свяжемся с вами в рабочее время.</div>
        <h2 class="h3">Оставить заявку</h2>
        <p class="muted" style="font-size:15px;margin:8px 0 22px">Заполните форму — специалист свяжется с вами для конфиденциальной консультации.</p>
        <div class="row">
          <div class="field"><label for="name">Имя *</label><input id="name" name="name" type="text" placeholder="Ваше имя" required autocomplete="name"></div>
          <div class="field"><label for="company">Компания</label><input id="company" name="company" type="text" placeholder="Название компании" autocomplete="organization"></div>
        </div>
        <div class="row">
          <div class="field"><label for="phone">Телефон *</label><input id="phone" name="phone" type="tel" placeholder="+7 (___) ___-__-__" required autocomplete="tel"></div>
          <div class="field"><label for="email">E-mail</label><input id="email" name="email" type="email" placeholder="you@company.com" autocomplete="email"></div>
        </div>
        <div class="field">
          <label for="topic">Направление</label>
          <select id="topic" name="topic">
            <option value="">Выберите направление</option>
            ${site.services.map(s => `<option>${esc(s.title)}</option>`).join('')}
            <option>Другое</option>
          </select>
        </div>
        <div class="field"><label for="message">Сообщение</label><textarea id="message" name="message" placeholder="Кратко опишите задачу"></textarea></div>
        <button class="btn btn--primary btn--wide" type="submit">Отправить заявку ${I.arrow}</button>
        <p class="form__note">Нажимая «Отправить», вы соглашаетесь с <a href="privacy.html" style="color:var(--accent)">обработкой персональных данных</a>. Гарантируем конфиденциальность.</p>
      </form>
    </div>
  </div>
</section>
</main>`,
    c.footer);
  write('contacts.html', html);
}

/* -------------------------------------------------------------- PRIVACY */
function buildPrivacy() {
  const c = chrome('contacts.html', 0);
  const S = [
    ['Общие положения', [`Настоящая Политика определяет порядок обработки персональных данных ${O.legal} (далее — Компания) и меры по обеспечению их безопасности.`, 'Используя сайт и отправляя данные через формы обратной связи, вы соглашаетесь с условиями настоящей Политики.']],
    ['Какие данные мы обрабатываем', ['Имя, название компании, телефон, адрес электронной почты и текст обращения — в объёме, который вы указываете в форме обратной связи.', 'Технические данные: IP-адрес, тип браузера и устройства, источник перехода, действия на сайте — в обезличенном виде для статистики.']],
    ['Цели обработки', ['Ответ на ваше обращение и проведение консультации.', 'Улучшение работы сайта и качества услуг.', 'Исполнение требований законодательства Российской Федерации.']],
    ['Правовые основания', ['Обработка осуществляется на основании вашего согласия, а также в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».']],
    ['Передача третьим лицам', ['Компания не продаёт и не передаёт персональные данные третьим лицам, за исключением случаев, прямо предусмотренных законодательством, либо когда это необходимо для исполнения вашего обращения.']],
    ['Срок хранения', ['Персональные данные хранятся не дольше, чем это необходимо для целей обработки, либо до отзыва вашего согласия.']],
    ['Файлы cookie', ['Сайт использует файлы cookie для корректной работы интерфейса и сбора обезличенной статистики. Вы можете отключить cookie в настройках браузера.']],
    ['Ваши права', ['Вы вправе запросить сведения об обработке ваших данных, потребовать их уточнения, блокирования или удаления, а также отозвать согласие на обработку.', `Для реализации прав направьте обращение на ${O.email}.`]],
    ['Контакты', [`${O.legal}, ${O.address}. Телефон: ${O.phone}. E-mail: ${O.email}.`]],
  ];
  const html = j(
    head({
      title: 'Политика конфиденциальности — Власта-Консалтинг',
      desc: 'Политика обработки персональных данных ООО «Власта-Консалтинг»: какие данные мы собираем, цели и правовые основания обработки, сроки хранения и ваши права.',
      canonical: `${BASE}/privacy.html`,
      robots: 'index,follow',
      jsonld: [orgLd, crumbLd([['Главная', ''], ['Политика конфиденциальности', 'privacy.html']])],
    }),
    c.header,
    `<main>
<section class="phero">
  ${engrave('tr', 'ph')}
  <div class="wrap">
    <nav class="crumbs" aria-label="Хлебные крошки"><a href="index.html">Главная</a> / <span>Политика конфиденциальности</span></nav>
    ${kick('Правовая информация')}
    <h1 class="h1">Политика конфиденциальности</h1>
  </div>
</section>
<section class="sec">
  <div class="wrap wrap--narrow">
    <div class="prose">
      ${S.map((s, i) => `<h2><span class="step">${String(i + 1).padStart(2, '0')}</span>${esc(s[0])}</h2>
      ${s[1].map(p => `<p>${esc(p)}</p>`).join('')}`).join('')}
      <p class="muted" style="margin-top:34px;padding-top:20px;border-top:1px solid var(--line);font-size:14px">Редакция от ${BUILT}.</p>
    </div>
  </div>
</section>
</main>`,
    c.footer);
  write('privacy.html', html);
}

/* ------------------------------------------------------- sitemap + robots */
function buildSitemap() {
  const urls = [
    { u: '', p: '1.0', f: 'weekly' },
    { u: 'services.html', p: '0.9', f: 'monthly' },
    { u: 'about.html', p: '0.8', f: 'monthly' },
    { u: 'cases.html', p: '0.9', f: 'weekly' },
    { u: 'news.html', p: '0.9', f: 'daily' },
    { u: 'contacts.html', p: '0.7', f: 'yearly' },
    { u: 'privacy.html', p: '0.2', f: 'yearly' },
    ...cases.map(c => ({ u: `cases/${c.slug}.html`, p: '0.7', f: 'monthly' })),
    ...news.map(n => ({ u: `news/${n.slug}.html`, p: '0.6', f: 'monthly', d: n.dateIso, img: n.img })),
  ];
  const body = urls.map(x => `  <url>
    <loc>${BASE}/${x.u}</loc>
    <lastmod>${x.d || BUILT}</lastmod>
    <changefreq>${x.f}</changefreq>
    <priority>${x.p}</priority>${x.img ? `
    <image:image><image:loc>${BASE}/${x.img}</image:loc></image:image>` : ''}
  </url>`).join('\n');
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${body}
</urlset>
`);
  write('robots.txt', `User-agent: *
Allow: /
Disallow: /_boss-preview/

Sitemap: ${BASE}/sitemap.xml
`);
  return urls.length;
}

/* ------------------------------------------------------------------- run */
console.log('Власта-Консалтинг — сборка сайта\n');
buildHome();      console.log('  ✓ index.html');
buildServices();  console.log('  ✓ services.html');
buildAbout();     console.log('  ✓ about.html');
buildCases();     console.log(`  ✓ cases.html + ${cases.length} кейсов`);
buildNews();      console.log(`  ✓ news.html + ${news.length} материалов`);
buildContacts();  console.log('  ✓ contacts.html');
buildPrivacy();   console.log('  ✓ privacy.html');
const n = buildSitemap();
console.log(`  ✓ sitemap.xml (${n} URL) + robots.txt`);
console.log(`\nГотово: ${7 + cases.length + news.length} страниц.`);
