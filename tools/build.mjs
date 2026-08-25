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
import crypto from 'crypto';
import { minifyCss, minifyJs } from './minify.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const rd = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

/* Content-hash query on the minified CSS/JS the pages actually load.
   The host serves assets with max-age=604800, so without this a returning
   visitor keeps the previous stylesheet. */
const writeMin = (srcRel, destRel, fn) => {
  const out = fn(fs.readFileSync(path.join(ROOT, srcRel), 'utf8'));
  fs.writeFileSync(path.join(ROOT, destRel), out);
  return destRel;
};
writeMin('assets/css/style.css', 'assets/css/style.min.css', minifyCss);
writeMin('assets/js/main.js', 'assets/js/main.min.js', minifyJs);
const hash = p => crypto.createHash('sha1')
  .update(fs.readFileSync(path.join(ROOT, p))).digest('hex').slice(0, 8);
const V = { css: hash('assets/css/style.min.css'), js: hash('assets/js/main.min.js') };

/* ------------------------------------------------------------- locales
   RU builds to the site root, EN to /en/. Content lives in content/ and
   content/en/; anything the EN files don't override falls back to RU. */
const LOCALE = (process.argv[2] || 'ru').toLowerCase();
const EN = LOCALE === 'en';
const PREFIX = EN ? 'en/' : '';          // where pages are written
const UP = EN ? 1 : 0;                   // extra ../ for assets from /en/

const site = rd('content/site.json');
const news = rd(EN ? 'content/en/news.json' : 'content/news.json');
const cases = rd(EN ? 'content/en/cases.json' : 'content/cases.json');
const O = site.org;
const BASE = O.domain;

/* UI strings. Content strings live in the JSON; these are the chrome. */
const T = {
  ru: {
    nav: [['index.html','Главная'],['services.html','Услуги'],['about.html','О нас'],
          ['cases.html','Кейсы'],['news.html','Новости']],
    contact:'Связаться', menu:'Меню', more:'Подробнее', readOn:'Читать',
    allServices:'Все услуги', allCases:'Все кейсы', allNews:'Все новости',
    caseStudy:'Разбор кейса', home:'Главная',
    nav_services:'Услуги', nav_contacts:'Контакты', nav_cases:'Кейсы', contactBtn:'Свяжитесь с нами', navigation:'Навигация',
    documents:'Документы', info:'Информация', telFax:'Тел./факс',
    themeLabel:'Переключить тёмную тему', openMenu:'Открыть меню', closeMenu:'Закрыть меню',
    toTop:'Наверх', crumbs:'Хлебные крошки', mainNav:'Основная навигация',
    rights:'Все права защищены.', privacy:'Политика конфиденциальности',
    footerAbout:'Используя передовые технологии, опираясь на высокие моральные ценности и постоянно стремясь к успеху, обеспечивать экономическую безопасность бизнеса наших клиентов.',
    ctaKicker:'Контакты', ctaTitle:'Свяжитесь с нами',
    ctaText:'Проведём конфиденциальную консультацию по вашей задаче.',
    cookieTitle:'Файлы cookie',
    cookieText:'Продолжая просмотр настоящего сайта, Вы соглашаетесь с использованием файлов Cookie и иных методов, средств и инструментов интернет-статистики и настройки, применяемых на сайте для повышения удобства использования сайта.',
    cookieMore:'Подробнее', ckReject:'Отклонить всё', ckNeeded:'Только необходимые', ckAll:'Принять всё',
    scrollHint:'листайте', sources:'Источники и упоминания', topics:'Темы кейса',
    newer:'Новее', earlier:'Ранее', related:'По теме', showMore:'Показать ещё',
    roadPrev:'Предыдущий этап', roadNext:'Следующий этап',
    shown:(a,b)=>`Показано ${a} из ${b} материалов`, all:'Все',
    emptyNews:'По выбранной теме материалов пока нет.', emptyCases:'По выбранной категории кейсов пока нет.',
    direction:'Направление', region:'Регион', outcome:'Результат', format:'Формат',
    projectWork:'Проектная работа', regionValue:'Россия · СНГ · ЕАЭС',
    phone:'Телефон', email:'Электронная почта', address:'Адрес', hours:'Часы работы',
    callUs:'Позвонить', writeUs:'Написать письмо',
    weekdays:'Понедельник – Пятница', otherCases:'Другие кейсы', otherNews:'Другие материалы',
  },
  en: {
    nav: [['index.html','Home'],['services.html','Services'],['about.html','About'],
          ['cases.html','Cases'],['news.html','News']],
    contact:'Get in touch', menu:'Menu', more:'Learn more', readOn:'Read',
    allServices:'All services', allCases:'All cases', allNews:'All news',
    caseStudy:'Read the case', home:'Home',
    nav_services:'Services', nav_contacts:'Contact', nav_cases:'Cases', contactBtn:'Get in touch', navigation:'Navigation',
    documents:'Documents', info:'Information', telFax:'Tel./fax',
    themeLabel:'Toggle dark theme', openMenu:'Open menu', closeMenu:'Close menu',
    toTop:'Back to top', crumbs:'Breadcrumb', mainNav:'Main navigation',
    rights:'All rights reserved.', privacy:'Privacy policy',
    footerAbout:'Using the modern approaches, relying on the highest moral standards and continuously striving for success to ensure business security of our Clients.',
    ctaKicker:'Contacts', ctaTitle:'Get in touch',
    ctaText:'We will hold a confidential consultation on your brief.',
    cookieTitle:'Cookies',
    cookieText:'By continuing to view this site, you agree with cookie files and other methods, means and tools of Internet statistics and configuration used on the site to improve the usability of the site.',
    cookieMore:'Learn more', ckReject:'Reject all', ckNeeded:'Necessary only', ckAll:'Accept all',
    scrollHint:'scroll', sources:'Sources and mentions', topics:'Case topics',
    newer:'Newer', earlier:'Earlier', related:'Related', showMore:'Show more',
    roadPrev:'Previous milestone', roadNext:'Next milestone',
    shown:(a,b)=>`Showing ${a} of ${b} articles`, all:'All',
    emptyNews:'Nothing published under this topic yet.', emptyCases:'No cases in this category yet.',
    direction:'Practice', region:'Region', outcome:'Outcome', format:'Format',
    projectWork:'Project engagement', regionValue:'Russia · CIS · EAEU',
    phone:'Phone', email:'Email', address:'Address', hours:'Office hours',
    callUs:'Call us', writeUs:'Send an email',
    weekdays:'Monday – Friday', otherCases:'Other cases', otherNews:'More articles',
  },
}[LOCALE];

/* content-side helper: pick an _en field when building English */
const t = (obj, key) => (EN && obj[key + '_en'] != null ? obj[key + '_en'] : obj[key]);
const tt = t;   // alias, used where a loop variable would shadow `t`
const BUILT = new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------ utils */
const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// body copy may carry inline <a>/<b>/<i>; keep those, escape the rest
const rich = s => String(s ?? '')
  .replace(/&(?!(amp|lt|gt|quot|#\d+|nbsp);)/g, '&amp;')
  .replace(/<(?!\/?(a|b|strong|i|em|u)\b)/gi, '&lt;');
const plain = s => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const j = (...c) => c.filter(Boolean).join('\n');

/* Figure units in a .stat__n: single-glyph marks (+, %) stay slightly stronger,
   word units (год / млрд ₽ / нед) read quieter. Shared by the hero stats row
   and the approach KPI row so both keep one type rhythm. */
const uClass = (str) => (/^[+\-%‰×]$/.test(String(str).trim()) ? 'u u--mark' : 'u u--word');

/* Homepage service card title: optional soft break (desktop-only <br>). */
const svcHomeTitle = (s) => {
  const lines = t(s, 'titleBreak');
  if (Array.isArray(lines) && lines.length > 1) {
    return lines.map(l => esc(l)).join('<br class="br-d">');
  }
  return esc(t(s, 'title'));
};

/* Homepage service bullets → services.html#svc-icon (or svc/icon cross-link). */
const hlHref = (svcId, h) => {
  if (!h || typeof h === 'string' || !h.to) return `services.html#${svcId}`;
  if (String(h.to).includes('/')) {
    const [sid, icon] = String(h.to).split('/');
    return `services.html#${sid}-${icon}`;
  }
  return `services.html#${svcId}-${h.to}`;
};
const hlText = (h) => (typeof h === 'string' ? h : (h.t || h.html || ''));

/* Body entries starting with "• " are list items; consecutive ones become
   one <ul> so enumerations break onto their own lines. */
function renderBody(body) {
  let out = '', open = false;
  for (const raw of body) {
    const t = String(raw);
    if (t.startsWith('• ')) {
      if (!open) { out += '<ul>'; open = true; }
      out += `<li>${rich(t.slice(2))}</li>`;
    } else {
      if (open) { out += '</ul>'; open = false; }
      out += `<p>${rich(t)}</p>`;
    }
  }
  return out + (open ? '</ul>' : '');
}
/* Page links stay inside the locale tree (/en/… or /…). Assets always live at
   the site root, so EN pages need one extra ../ to reach them. */
const pageRel = (depth, p) => '../'.repeat(depth) + p;
const rasterSrc = p => {
  if (!p || typeof p !== 'string') return p;
  const webp = p.replace(/\.(png|jpe?g)$/i, '.webp');
  if (webp !== p && fs.existsSync(path.join(ROOT, webp))) return webp;
  return p;
};
const assetRel = (depth, p) => '../'.repeat(depth + UP) + rasterSrc(p);
const rel = assetRel; // legacy alias — prefer pageRel / assetRel at call sites

function write(rp, html) {
  const abs = path.join(ROOT, PREFIX + rp);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, html.replace(/\n{3,}/g, '\n\n'), 'utf8');
}


/* Page-level marketing copy. Kept beside the templates rather than in the
   content JSON because it is chrome, not data the client edits. */
const C = {
  ru: {
    homeTitle:'Официальный сайт компании Власта Консалтинг | Vlasta Consulting',
    homeDesc:'Защита бренда, корпоративная безопасность, личная безопасность - Власта консалтинг',
    homeKw:'контрафакт, безопасность, защита бренда, интеллектуальная собственность, brand protection, антиконтрафакт',
    heroPill:`С ${O.founded} года · Москва · Россия и ЕАЭС`,
    heroTitle:'Безопасность бизнеса<br>в надёжных руках',
    heroScroll:'Пролистать к описанию',
    intro:'Используя передовые технологии, опираясь на высокие моральные ценности и постоянно стремясь к успеху, обеспечивать экономическую безопасность бизнеса наших клиентов.',
    svcKicker:'Услуги', svcTitle:'Наши услуги',
    svcDesc:'Защита бренда, корпоративная безопасность и личная безопасность — комплексный подход к каждому клиенту.',
    apprKicker:'Подход и практика', apprTitle:'Отделы, собранные в одну систему',
    apprDesc:'Профильные отделы работают совместно — от аналитики и консультаций до правовой поддержки. Координация между ними обеспечивает комплексный подход к задачам клиента в сфере безопасности бизнеса.',
    apprKpiHead:'Ключевые показатели за год',
    apprKpiNote:'Ориентир лучшей практики',
    casesKicker:'Кейсы', casesTitle:'Как мы решаем задачи клиентов',
    histKicker:'История компании',
    histTitle:'<span class="h2__line">Путь, отмеченный</span><span class="h2__line">международным признанием</span>',
    histHint:'От московского старта до международной практики',
    newsKicker:'Новости', newsTitle:'Компания в публичном пространстве',
    marquee:'Нам доверяют ведущие российские и международные бренды',
    svcPageTitle:'Наши услуги — Власта-Консалтинг',
    svcPageDesc:'Восемь направлений в четырёх блоках: анализ compliance, безопасность бизнеса, защита бренда и ИС, стратегический и юридический консалтинг.',
    svcPageKw:'бизнес-разведка, безопасность бизнеса, защита бренда, интеллектуальная собственность, консалтинг, антиконтрафакт',
    svcH1:'Услуги для безопасности бизнеса',
    svcLead:'Восемь направлений в четырёх ключевых блоках — от бизнес-разведки и защиты бренда до стратегического консалтинга и физической безопасности. Единая методология: анализ рисков, предупреждение угроз и сопровождение «под ключ» вплоть до защиты интересов в суде.',
    svcNav:'Блоки услуг',
    svcScenNav:'Сценарии клиентов',
    svcScenTo:'Перейти к разделу',
    aboutTitle:'О нас — Власта-Консалтинг',
    aboutDesc:'Основанная в 2006 году компания Власта-Консалтинг занимает лидирующее место в сфере обеспечения безопасности бизнеса и широко известна в отечественных и иностранных бизнес-кругах.',
    aboutKw:'Власта-Консалтинг, безопасность бизнеса, защита бренда, корпоративная безопасность, интеллектуальная собственность',
    aboutKicker:'О нас', aboutH1:'О нас',
    aboutLead:'Многолетний опыт работы позволяет нашим специалистам анализировать риски, предвидеть неблагоприятные сценарии развития событий и эффективно реагировать на критические ситуации. Мы работаем и оказываем услуги как на территории России, так и в странах СНГ, Европы, Северной и Южной Америки, Африки, Юго-Восточной Азии. Сотрудничество с зарубежными партнерами наряду с членством в профильных международных ассоциациях позволяет нам эффективно представлять в России интересы транснациональных корпораций.',
    whoKicker:'Кто мы', whoTitle:'Надёжный партнёр в вопросах экономической безопасности',
    whoDesc:'Основанная в 2006 году компания Власта-Консалтинг занимает лидирующее место в сфере обеспечения безопасности бизнеса и широко известна в отечественных и иностранных бизнес-кругах. Главный принцип в работе «Власта-Консалтинг» - комплексный подход к каждому клиенту.',
    teamKicker:'Руководство', teamTitle:'Команда, которая отвечает за результат',
    assocKicker:'Партнёрство', assocTitle:'Ассоциации и профессиональные сообщества',
    assocDesc:'Мы состоим в ведущих российских и международных объединениях. Нажмите на карточку, чтобы узнать об участии в каждой ассоциации.',
    assocNav:'Ассоциации — прокрутите по горизонтали',
    assocFounded:'Год основания',
    assocReach:'Охват', assocHq:'Штаб-квартира', assocCountry:'Страна',
    assocRegion:'Регион', assocFocus:'Фокус',
    clientsKicker:'Клиенты', clientsTitle:'Нам доверяют ведущие бренды',
    clientsNote:'и ещё <b>более 80 брендов</b> под нашей защитой',
    lettersKicker:'Отзывы', lettersTitle:'Благодарственные письма',
    lettersDesc:'Нажмите на письмо, чтобы открыть его целиком.',
    letterAlt:'Благодарственное письмо', letterDialog:'Благодарственное письмо',
    casesPageTitle:'Кейсы: борьба с контрафактом, расследования, due diligence — Власта-Консалтинг',
    casesPageDesc:`${cases.length} проектов из практики: блокировка каналов дистрибуции контрафакта, работа по ЕАЭС, рейды на производствах, расследования хищений, проверка контрагентов и сопровождение в суде.`,
    casesPageKw:'кейсы борьба с контрафактом, антиконтрафактный рейд, ЕАЭС контрафакт, due diligence, корпоративное расследование, ТРОИС кейс',
    casesKick:'Из практики', casesH1:'Кейсы: контрафакт, расследования и защита активов',
    casesLead:'Реальные проекты по защите товарных знаков, антиконтрафактным программам, проверкам контрагентов и внутренним расследованиям. Детали обезличены в целях конфиденциальности клиентов.',
    caseFilter:'Фильтр по категориям', caseSuffix:'— кейс «Власта-Консалтинг»',
    newsPageTitle:'Новости: борьба с контрафактом в России и ЕАЭС — Власта-Консалтинг',
    newsPageDesc:`${news.length} материалов: антиконтрафактные операции и изъятия, инициативы на площадках ЕЭК и ФТС, участие в международных форумах по защите интеллектуальной собственности.`,
    newsPageKw:'новости контрафакт, изъятие контрафакта, ЕАЭС, ФТС, ТРОИС, конференции по защите брендов',
    newsKick:'Хроника', newsH1:'Новости борьбы с контрафактом и защиты брендов',
    newsLead:'Антиконтрафактные операции и изъятия, инициативы на площадках ЕЭК и ФТС, участие в международных форумах по защите интеллектуальной собственности.',
    newsFilter:'Фильтр по темам', newsCollection:'Новости Власта-Консалтинг',
    contactsTitle:'Контакты — Власта-Консалтинг',
    contactsDesc:`Свяжитесь с «${O.name}»: ${O.address}. Тел./факс ${O.phone}, e-mail ${O.email}.`,
    contactsKw:'Власта-Консалтинг контакты, Москва, Усачёва',
    contactsKick:'Контакты', contactsH1:'Свяжитесь с нами',
    contactsLead:'119048, город Москва, ул. Усачёва, д. 13, помещ. 4н. Будни: 9:30 - 18:00.',
    mapTitle:'Офис «Власта-Консалтинг» на карте: Москва, ул. Усачёва, 13',
    privacyTitle:'Политика конфиденциальности — Власта-Консалтинг',
    privacyDesc:'Политика в отношении обработки персональных данных ООО «Власта-Консалтинг», согласованная с юридической службой. Полный текст документа — на этой странице.',
    privacyKick:'Правовая информация', privacyH1:'Политика конфиденциальности',
    privacyPageAlt:(i, n) => `Страница ${i} из ${n}`,
    geoMapLabel:'Карта: Россия, страны СНГ и ЕАЭС',
    videoTitle:'Видео к материалу',
  },
  en: {
    homeTitle:'Official website of Vlasta Consulting | Vlasta Consulting',
    homeDesc:'Brand protection, corporate security, personal security - Vlasta consulting',
    homeKw:'counterfeit, security, brand protection, intellectual property, антиконтрафакт',
    heroPill:`Since ${O.founded} · Moscow · Russia and the EAEU`,
    heroTitle:'Business security<br>in reliable hands',
    heroScroll:'Scroll to the introduction',
    intro:'Using the modern approaches, relying on the highest moral standards and continuously striving for success to ensure business security of our Clients.',
    svcKicker:'Services', svcTitle:'Our services',
    svcDesc:'Brand protection, corporate security and personal security — an integrated approach to each client.',
    apprKicker:'Approach and record', apprTitle:'Departments built into one system',
    apprDesc:'Our departments work together — from analytics and advice through to legal support. Coordinating them provides an integrated approach to the client’s business security tasks.',
    apprKpiHead:'Key figures for the year',
    apprKpiNote:'Best practice',
    casesKicker:'Cases', casesTitle:'How we solve client problems',
    histKicker:'Company history',
    histTitle:'<span class="h2__line">A record marked by</span><span class="h2__line">international recognition</span>',
    histHint:'From a Moscow start to an international practice',
    newsKicker:'News', newsTitle:'The company in the public eye',
    marquee:'Trusted by leading Russian and international brands',
    svcPageTitle:'Our services — Vlasta Consulting',
    svcPageDesc:'Eight practice areas in four blocks: compliance analysis, business security, brand and IP protection, strategic and legal consulting.',
    svcPageKw:'compliance analysis, business security, brand protection, intellectual property, consulting, anti-counterfeit',
    svcH1:'Services for business security',
    svcLead:'Eight practice areas in four key blocks — from business intelligence and brand protection to strategic consulting and physical security. One methodology: risk analysis, threat prevention and turnkey support through to defending your interests in court.',
    svcNav:'Service areas',
    svcScenNav:'Client scenarios',
    svcScenTo:'Go to section',
    aboutTitle:'About us — Vlasta Consulting',
    aboutDesc:'Founded in 2006, Vlasta-Consulting is a leader in business security and is widely known in domestic and foreign business circles.',
    aboutKw:'Vlasta Consulting, business security, brand protection, corporate security, intellectual property',
    aboutKicker:'About us', aboutH1:'About us',
    aboutLead:'Many years of experience allow our specialists to analyze risks, anticipate unfavorable scenarios for the development of events and effectively respond to critical situations. We work and provide services both in Russia and in the CIS countries, Europe, North and South America, Africa, and Southeast Asia. Cooperation with foreign partners, as well as membership in specialized international associations enable us to effectively represent the interests of transnational corporations in Russia.',
    whoKicker:'Who we are', whoTitle:'A dependable partner in business security',
    whoDesc:'Founded in 2006, Vlasta-Consulting is a leader in business security and is widely known in domestic and foreign business circles. The main principle in the work of Vlasta-Consulting is an integrated approach to each client.',
    teamKicker:'Leadership', teamTitle:'The team accountable for the result',
    assocKicker:'Partnerships', assocTitle:'Associations and professional bodies',
    assocDesc:'We belong to leading Russian and international bodies. Select a card to read about our involvement in each.',
    assocNav:'Associations — scroll horizontally',
    assocFounded:'Year founded',
    assocReach:'Reach', assocHq:'Headquarters', assocCountry:'Country',
    assocRegion:'Region', assocFocus:'Focus',
    clientsKicker:'Clients', clientsTitle:'Trusted by leading brands',
    clientsNote:'and <b>over 80 more brands</b> under our protection',
    lettersKicker:'References', lettersTitle:'Letters of appreciation',
    lettersDesc:'Select a letter to read it in full.',
    letterAlt:'Letter of appreciation', letterDialog:'Letter of appreciation',
    casesPageTitle:'Cases: anti-counterfeiting, investigations, due diligence — Vlasta Consulting',
    casesPageDesc:`${cases.length} engagements from practice: shutting down counterfeit distribution channels, EAEU programmes, raids on production sites, theft investigations, counterparty screening and litigation support.`,
    casesPageKw:'anti-counterfeiting cases, counterfeit raid, EAEU counterfeit, due diligence, corporate investigation, customs register case',
    casesKick:'From practice', casesH1:'Cases: counterfeiting, investigations and asset protection',
    casesLead:'Real engagements in trademark protection, anti-counterfeiting programmes, counterparty screening and internal investigations. Details are anonymised to protect client confidentiality.',
    caseFilter:'Filter by category', caseSuffix:'— a Vlasta Consulting case',
    newsPageTitle:'News: anti-counterfeiting across Russia and the EAEU — Vlasta Consulting',
    newsPageDesc:`${news.length} articles: anti-counterfeiting operations and seizures, initiatives at the EEC and the Federal Customs Service, and participation in international IP forums.`,
    newsPageKw:'counterfeit news, counterfeit seizure, EAEU, customs, customs register, brand protection conferences',
    newsKick:'Chronicle', newsH1:'News on anti-counterfeiting and brand protection',
    newsLead:'Anti-counterfeiting operations and seizures, initiatives at the EEC and the Federal Customs Service, and participation in international IP forums.',
    newsFilter:'Filter by topic', newsCollection:'Vlasta Consulting news',
    contactsTitle:'Contact — Vlasta Consulting',
    contactsDesc:`Get in touch with Vlasta Consulting: ${O.address_en || O.address}. Tel./fax ${O.phone}, email ${O.email}.`,
    contactsKw:'Vlasta Consulting contact, Moscow, Usacheva',
    contactsKick:'Contacts', contactsH1:'Get in touch',
    contactsLead:'office 4N, 13, Usacheva str., Moscow, 119048. Weekdays: 9:30 a.m. - 6 p.m.',
    mapTitle:'Vlasta Consulting office on the map: Usacheva 13, Moscow',
    privacyTitle:'Privacy policy — Vlasta Consulting',
    privacyDesc:'Personal data processing policy of Vlasta Consulting LLC as approved by counsel. The full document is published on this page.',
    privacyKick:'Legal', privacyH1:'Privacy policy',
    privacyPageAlt:(i, n) => `Page ${i} of ${n}`,
    geoMapLabel:'Map: Russia, the CIS and the EAEU',
    videoTitle:'Video for this article',
  },
}[LOCALE];

/* ------------------------------------------------------------------ icons */
const I = {
  medal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.4 2 3.2 5.5M16.6 2l-3.2 5.5"/><circle cx="12" cy="15" r="6.5"/><path d="m12 11.8 1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2L8.8 14l2.2-.3z"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10v6a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/><path d="M12 14v4M9 21h6M10 18h4"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h11l-1.6 3.5L16 11H5z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.4"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16.5 5.2a3.4 3.4 0 0 1 0 5.6M18 14.4a6.5 6.5 0 0 1 3.5 5.6"/></svg>',
  growth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"/><path d="M6 20v-5M11 20v-9M16 20v-6M21 20V7"/><path d="m14 4 3.4 1.2L16.2 8.6"/></svg>',
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
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3v5.5c0 4.8-3.2 8-7.5 9.5-4.3-1.5-7.5-4.7-7.5-9.5V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  brand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.5 12.5 3.5a2 2 0 0 0-1.4-.6H4.5A1.5 1.5 0 0 0 3 4.4v6.6a2 2 0 0 0 .6 1.4l8 8a1.5 1.5 0 0 0 2.1 0l6.8-6.8a1.5 1.5 0 0 0 0-2.1z"/><circle cx="7.8" cy="7.8" r="1.4"/></svg>',
  scales: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M7 21h10M4 7h16M8 7l-4 6h8zM16 7l4 6h-8z"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5M3 18l9 5 9-5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13l4.5 4.5L20 6"/></svg>',
  trendDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l6.5 6.5 4-4L21 17"/><path d="M15 17h6v-6"/></svg>',
  coins: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6.5" rx="7.5" ry="3.2"/><path d="M4.5 6.5v5c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2v-5"/><path d="M4.5 11.5v5c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2v-5"/></svg>',
  raid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3v5.2c0 4.6-3.1 7.8-7.5 9.3-4.4-1.5-7.5-4.7-7.5-9.3V6z"/><path d="M12 8.4v4.2M12 15.4h.01"/></svg>',
  drag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M15 7l5 5-5 5"/></svg>',
  legal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v12H4z"/><path d="M8 10h8M8 14h5"/></svg>',
  ops: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18"/><path d="M12 3v18"/><path d="M5 5l14 14M19 5 5 19"/></svg>',
  coord: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M3 12h18"/><circle cx="12" cy="12" r="6"/></svg>',
  laptop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16v10H4z"/><path d="M8 11h8M8 15h5"/></svg>',
  cert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13V5H4v11h8"/><path d="M8 9h8M8 12.5h4"/><circle cx="17" cy="18" r="3"/><path d="m15.3 20.3-.5 2.7 2.2-1.2 2.2 1.2-.5-2.7"/></svg>',
  customs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V7"/><circle cx="4" cy="4.5" r="1.6"/><path d="M6.6 9.2 21 6.6v4.2L6.6 13.4z"/><path d="M3 20h18"/></svg>',
  board: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9.5 9v11"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.6a7.5 7.5 0 0 1-7.5 7.4H8.4L4 22v-4.4a7.5 7.5 0 0 1 9-11.4 7.5 7.5 0 0 1 7.5 5.4z"/><path d="M9 12h.01M12.5 12h.01M16 12h.01"/></svg>',
  app: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2.6"/><path d="M10.5 18.6h3"/><path d="M9.6 8.4h4.8M9.6 12h4.8"/></svg>',
  dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 18 18"/><path d="M10.6 5.2A9.7 9.7 0 0 1 12 5c5 0 9 5 9 7 0 .9-.9 2.5-2.5 3.9M6.4 7.6C4.2 9 3 11.1 3 12c0 2 4 7 9 7 1.4 0 2.7-.3 3.8-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 4h2l2.2 11.2a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.55-1.2L21 8H7"/></svg>',
  car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15.4h18M4.8 15.4v2.3M19.2 15.4v2.3"/><path d="m4.9 15.4 1.5-6.6a2 2 0 0 1 2-1.5h7.2a2 2 0 0 1 2 1.5l1.5 6.6"/><circle cx="8" cy="15.4" r="1.5"/><circle cx="16" cy="15.4" r="1.5"/></svg>',
  event: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/><circle cx="12" cy="15.4" r="2.1"/></svg>',
  radar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.8"/><path d="m12 12 5.6-5.6"/><path d="M15.9 8.1a5.5 5.5 0 1 1-7.8 0"/><path d="M19.1 4.9a10 10 0 1 1-14.2 0"/></svg>',
  handshake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>',
  banknote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12.4 2.7 21.3 11.6a2 2 0 0 1 0 2.8l-6.9 6.9a2 2 0 0 1-2.8 0L2.7 12.4A2 2 0 0 1 2 11V4a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.7z"/><circle cx="7.5" cy="7.5" r="1.2"/></svg>',
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
/* Russia and its neighbours, from Natural Earth via tools/make-map.mjs.
   Each country is its own path so it can light up under the cursor. */
function countryMap() {
  const m = rd('content/geo-map.json');
  const paths = m.countries.map(c =>
    `<path class="cm__c${c.home ? ' cm__c--home' : ''}" d="${c.d}" tabindex="${c.home ? 0 : -1}" role="img" aria-label="${esc(t(c,'name'))}" data-name="${esc(t(c,'name'))}"><title>${esc(t(c,'name'))}</title></path>`
  ).join('');
  return `<div class="cmap">
  <svg viewBox="0 0 ${m.width} ${m.height}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="${C.geoMapLabel}">
    <defs><linearGradient id="cmFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000"/>
      <stop offset="14%" stop-color="#666"/>
      <stop offset="34%" stop-color="#fff"/>
      <stop offset="100%" stop-color="#fff"/>
    </linearGradient>
    <mask id="cmMask"><rect x="-20%" y="-40%" width="140%" height="180%" fill="url(#cmFade)"/></mask></defs>
    <g class="cm__g" mask="url(#cmMask)">${paths}</g>
  </svg>
  <span class="cmap__tip" hidden></span>
</div>`;
}

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
const NAV = T.nav;

function head({ title, desc, canonical, keywords, image, depth = 0, jsonld = [], robots, page = '', bodyClass = '' }) {
  const A = p => assetRel(depth, p);
  const altRu = `${BASE}/${page}`;
  const altEn = `${BASE}/en/${page}`;
  const img = `${BASE}/${rasterSrc(image || 'assets/img/og-default.jpg')}`;
  return `<!DOCTYPE html>
<html lang="${EN ? 'en' : 'ru'}" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${keywords ? `<meta name="keywords" content="${esc(keywords)}">` : ''}
<meta name="robots" content="${robots || 'index,follow,max-image-preview:large'}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="ru" href="${altRu}">
<link rel="alternate" hreflang="en" href="${altEn}">
<link rel="alternate" hreflang="x-default" href="${altRu}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(O.name)}">
<meta property="og:locale" content="${EN ? 'en_US' : 'ru_RU'}">
<meta property="og:locale:alternate" content="${EN ? 'ru_RU' : 'en_US'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${img}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${img}">
<meta name="theme-color" content="#141428">
<script>(function(){var r=document.documentElement;r.classList.add('js');try{var t=localStorage.getItem('vlasta-theme');if(!t)t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';r.setAttribute('data-theme',t)}catch(e){}try{var K='vlasta-lang';var lang=(r.getAttribute('lang')||'ru').slice(0,2);if(lang!=='en')lang='ru';var pref=localStorage.getItem(K);if(pref!=='en'&&pref!=='ru'){localStorage.setItem(K,lang);document.cookie=K+'='+lang+';path=/;max-age=31536000;SameSite=Lax';return}if(pref===lang)return;var link=document.querySelector('link[rel="alternate"][hreflang="'+pref+'"]');if(!link)return;var href=link.getAttribute('href');if(!href)return;var dest=new URL(href,'https://vlasta-s.com');var leaf=(dest.pathname||'/').replace(/^\\/en\\//,'').replace(/^\\//,'');if(!leaf||leaf.charAt(leaf.length-1)==='/')leaf='index.html';var cur=location.pathname.replace(/\\\\/g,'/');if(cur.slice(-1)==='/')cur+='index.html';else if(cur.slice(-3)==='/en')cur+='/index.html';var next;if(lang==='en'){var i=cur.lastIndexOf('/en/');if(i<0)return;next=cur.slice(0,i+1)+(pref==='en'?'en/'+leaf:leaf)}else{var j=cur.lastIndexOf('/'+leaf);if(j<0)return;next=cur.slice(0,j+1)+(pref==='en'?'en/'+leaf:leaf)}if(!next||next===cur)return;location.replace((location.protocol==='file:'?'file://':'')+next+location.search+location.hash)}catch(e){}})();</script>
<link rel="preload" href="${A('assets/fonts/montserrat-latin.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${A('assets/fonts/montserrat-cyrillic.woff2')}" as="font" type="font/woff2" crossorigin>
${bodyClass && bodyClass.includes('over-hero') ? `<link rel="preload" href="${A('assets/img/hero-tower.jpg')}" as="image">` : ''}
<link rel="stylesheet" href="${A('assets/css/style.min.css')}?v=${V.css}">
<link rel="icon" href="${A('assets/img/logo-dark.svg')}" type="image/svg+xml">
${jsonld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<div class="progress" aria-hidden="true"></div>`;
}

const orgLd = {
  '@context': 'https://schema.org', '@type': 'Organization',
  name: O.name, alternateName: 'Vlasta Consulting', url: `${BASE}/`,
  logo: `${BASE}/assets/img/logo-dark.svg`, foundingDate: String(O.founded),
  telephone: O.phoneHref, email: O.email,
  address: { '@type': 'PostalAddress', streetAddress: O.addressStreet, addressLocality: O.addressCity, postalCode: O.addressZip, addressCountry: 'RU' },
  areaServed: ['RU', 'BY', 'KZ', 'UZ', 'KG', 'AM', 'GE'],
  contactPoint: { '@type': 'ContactPoint', telephone: O.phoneHref, contactType: 'customer service', availableLanguage: ['Russian', 'English'] },
};
const crumbLd = items => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it[0], item: `${BASE}/${it[1]}` })),
});

function chrome(active, depth = 0, pagePath = active) {
  const P = p => pageRel(depth, p);
  const A = p => assetRel(depth, p);
  /* Lang switch: same page in the other tree, resolved from site root (assets
     depth). pagePath is the real file (e.g. cases/slug.html); active is nav. */
  const toRoot = '../'.repeat(depth + UP);
  const leaf = pagePath || 'index.html';
  const ruHref = toRoot + leaf;
  const enHref = toRoot + 'en/' + leaf;
  const links = NAV.map(([h, t]) =>
    `<a href="${P(h)}"${h === active ? ' class="is-on" aria-current="page"' : ''}>${t}</a>`).join('');
  const mnavItems = [...NAV, ['contacts.html', T.nav_contacts]];
  const mlinks = mnavItems.map(([h, t]) =>
    `<a class="mnav__l${h === active ? ' is-on' : ''}" href="${P(h)}"${h === active ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  const tt = `<button class="tt" type="button" aria-label="${T.themeLabel}" aria-pressed="false">${I.moon}${I.sun}</button>`;
  const lang = `<div class="lang"><a href="${ruHref}"${EN ? '' : ' class="is-on" aria-current="true"'} hreflang="ru">RU</a><a href="${enHref}"${EN ? ' class="is-on" aria-current="true"' : ''} hreflang="en">EN</a></div>`;
  /* Scrolled header: only the other locale — never both side by side. */
  const langAlt = EN
    ? `<div class="lang"><a href="${ruHref}" hreflang="ru">RU</a></div>`
    : `<div class="lang"><a href="${enHref}" hreflang="en">EN</a></div>`;
  /* Wordmark stacks without the hyphen so the mark can sit larger beside it. */
  const brandLines = EN ? ['VLASTA', 'CONSULTING'] : ['ВЛАСТА', 'КОНСАЛТИНГ'];
  const brand = (light, mod = '') => `<a class="brand${mod ? ` ${mod}` : ''}" href="${P('index.html')}" aria-label="${esc(O.name)} — на главную">
      <img class="brand__mark" src="${A(light ? 'assets/img/logo-light.svg' : 'assets/img/logo-dark.svg')}" alt="" width="48" height="56">
      <span class="brand__txt">
        <span class="brand__name">${brandLines.map(l => `<span class="brand__line">${esc(l)}</span>`).join('')}</span>
        ${mod === 'brand--ft' ? '' : `<span class="brand__sub">${esc(O.tagline)}</span>`}
      </span>
    </a>`;
  const ftH = (label) => `<h4 class="ft__h">${esc(label)}</h4>`;
  const ftCases = cases.slice(0, 9);

  return {
    header: `<div class="topbar">
  <div class="wrap">
    <div class="topbar__l">
      <a class="tb" href="tel:${O.phoneHref}">${I.phone}${esc(O.phone)}</a>
      <a class="tb" href="mailto:${O.email}">${I.mail}${esc(O.email)}</a>
      <span class="tb">${I.clock}${esc(t(O,'hours'))}</span>
    </div>
    <div class="topbar__r">
      ${lang}
      ${tt}
    </div>
  </div>
</div>
<header class="hdr">
  <div class="wrap">
    ${brand(false)}
    <nav class="nav" aria-label="${T.mainNav}">${links}</nav>
    <div class="hdr__cta">
      <div class="hdr__contact">
        <div class="hdr__tools">
          ${langAlt}
          ${tt}
        </div>
        <a href="${P('contacts.html')}" class="hdr__talk">${T.contactBtn}</a>
      </div>
      <button class="burger" type="button" aria-label="${T.openMenu}" aria-expanded="false" aria-controls="mnav"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>`,

    footer: `<footer class="ft">
  <div class="wrap">
    <div class="ft__top">
      <div class="ft__about">
        ${brand(true, 'brand--ft')}
        <p>${T.footerAbout}</p>
      </div>
      <div class="ft__col">
        ${ftH(T.nav_services)}
        <div class="ft__ls">${site.services.map(s => `<a href="${P('services.html')}#${s.id}">${esc(t(s,'title'))}</a>`).join('')}</div>
        ${ftH(T.documents)}
        <div class="ft__ls"><a href="${P('privacy.html')}">${T.privacy}</a></div>
      </div>
      <div class="ft__col">
        ${ftH(T.nav_cases)}
        <div class="ft__ls">${ftCases.map(c => `<a href="${P(`cases/${c.slug}.html`)}">${esc(t(c,'title'))}</a>`).join('')}</div>
      </div>
      <div class="ft__col">
        ${ftH(T.info)}
        <dl class="ft__info">
          <div><dt>${T.hours}</dt><dd>${esc(t(O,'hours'))}</dd></div>
          <div><dt>${T.address}</dt><dd>${esc(t(O,'address'))}</dd></div>
          <div><dt>${T.telFax}</dt><dd><a href="tel:${O.phoneHref}">${esc(O.phone)}</a></dd></div>
          <div><dt>${T.email}</dt><dd><a href="mailto:${O.email}">${esc(O.email)}</a></dd></div>
        </dl>
      </div>
    </div>
  </div>
  <div class="ft__bot">
    <div class="wrap">
      <span>${T.rights} © ${esc(O.legal)}, <span id="yr">${new Date().getFullYear()}</span></span>
    </div>
  </div>
</footer>
<div class="overlay"></div>
<aside class="mnav" id="mnav" aria-label="${T.menu}" aria-hidden="true">
  <div class="mnav__h">
    <span class="brand__name" style="color:#fff">${T.menu}</span>
    <button class="mnav__x" type="button" aria-label="${T.closeMenu}">&times;</button>
  </div>
  <nav>${mlinks}</nav>
  <div class="mnav__extra">
    ${lang}
    ${tt}
  </div>
  <div class="mnav__f">
    <a href="tel:${O.phoneHref}">${esc(O.phone)}</a>
    <a href="mailto:${O.email}">${esc(O.email)}</a>
  </div>
</aside>
<div class="cookie" id="cookie" role="dialog" aria-labelledby="ckT" aria-describedby="ckD" hidden>
  <div class="cookie__c">
    <div class="cookie__txt">
      <h4 id="ckT">${T.cookieTitle}</h4>
      <p id="ckD">${T.cookieText} <a href="${P('privacy.html')}">${T.cookieMore}</a></p>
    </div>
    <div class="cookie__btns">
      <button class="btn btn--ghostline" type="button" data-ck="reject">${T.ckReject}</button>
      <button class="btn btn--ghostline" type="button" data-ck="necessary">${T.ckNeeded}</button>
      <button class="btn btn--primary" type="button" data-ck="all">${T.ckAll}</button>
    </div>
  </div>
</div>
<button class="totop" type="button" aria-label="${T.toTop}">${I.up}</button>
<script src="${A('assets/js/main.min.js')}?v=${V.js}" defer></script>
</body>
</html>`,
  };
}

/* ------------------------------------------------------------ components */
const kick = t => `<span class="kick">${esc(t)}</span>`;

function shead({ k, h, d, extra, mod = 'split', tag = 'h2', richH = false }) {
  const heading = `<${tag} class="h2">${richH ? h : esc(h)}</${tag}>`;
  const lead = d ? `<p class="shead__d lead">${esc(d)}</p>` : '';
  const cta = extra ? `<div class="shead__x">${extra}</div>` : '';
  /* Stack + lead + CTA: share a horizontal band under the title so the pill
     can bottom-align with the last line of the lead (homepage services). */
  if (mod === 'stack' && lead && cta) {
    return `<div class="shead shead--${mod} shead--cta reveal">
      <div class="shead__t">${kick(k)}${heading}</div>
      <div class="shead__row">
        ${lead}
        ${cta}
      </div>
    </div>`;
  }
  /* Title + CTA, no lead (homepage cases/news): kicker → title → see-all.
     Mobile stacks left; desktop CSS places the pill on the title row. */
  if (cta && !lead) {
    return `<div class="shead shead--${mod} shead--cta shead--banner reveal">
      <div class="shead__t">${kick(k)}${heading}</div>
      ${cta}
    </div>`;
  }
  const title = `<div class="shead__t">${kick(k)}${heading}</div>`;
  return `<div class="shead shead--${mod}${extra ? ' shead--cta' : ''} reveal">
      ${[title, lead, cta].filter(Boolean).join('\n      ')}
    </div>`;
}

const seeall = (href, label) =>
  `<a href="${href}" class="seeall"><span class="seeall__l">${label}</span><span class="seeall__r">${I.arrow}</span></a>`;

/* Contact close — fabric mesh of plain circle nodes + title fade (see main.js). */
const ctaBand = (depth = 0) => `<section class="sec sec--cta">
  <canvas class="cta__field" aria-hidden="true"></canvas>
  <div class="cta__blur" aria-hidden="true"></div>
  <div class="wrap">
    <div class="cta" data-cta>
      <div class="cta__copy">
        <h2 class="cta__title">${esc(T.ctaTitle)}</h2>
        <p class="cta__lead">${esc(T.ctaText)}</p>
      </div>
      <div class="cta__aside">
        <a class="cta__fact" href="tel:${O.phoneHref}">
          <span class="cta__lbl">${T.phone}</span>
          <span class="cta__val">${esc(O.phone)}</span>
        </a>
        <a class="cta__fact" href="mailto:${O.email}">
          <span class="cta__lbl">${T.email}</span>
          <span class="cta__val">${esc(O.email)}</span>
        </a>
        <a class="cta__go" href="${pageRel(depth, 'contacts.html')}">${T.nav_contacts} ${I.arrow}</a>
      </div>
    </div>
  </div>
</section>`;

const clientsGrid = () => site.clients.map(c =>
  `<div class="client"><img src="${rel(0, c.l)}" alt="${esc(c.n)}" loading="lazy" decoding="async"${c.scale ? ` style="--logo-scale:${c.scale}"` : ''}></div>`).join('');

const marquee = () => {
  const item = c =>
    `<span class="mq__i"><img src="${rel(0, c.l)}" alt="${esc(c.n)}" loading="lazy" decoding="async"${c.scale ? ` style="--logo-scale:${c.scale}"` : ''}></span>`;
  /* Two brick rows (even / odd). Pad the shorter row from the *other* row so we
     never repeat a logo inside the same track (e.g. double P&G). */
  const list = site.clients;
  let a = list.filter((_, i) => i % 2 === 0);
  let b = list.filter((_, i) => i % 2 === 1);
  if (!a.length) a = b.slice();
  if (!b.length) b = a.slice();
  const n = Math.max(a.length, b.length);
  const pad = (row, donor) => {
    const out = row.slice();
    const pool = donor.length ? donor : row;
    let i = 0;
    while (out.length < n) { out.push(pool[i % pool.length]); i++; }
    return out;
  };
  a = pad(a, b); b = pad(b, a);
  const rowA = a.map(item).join('');
  const rowB = b.map(item).join('');
  return `<section class="mq" aria-label="Клиенты">
  <div class="mq__l">${C.marquee}</div>
  <div class="mq__vp">
    <div class="mq__band">
      <div class="mq__tr mq__tr--a">${rowA}${rowA}</div>
      <div class="mq__tr mq__tr--b">${rowB}${rowB}</div>
    </div>
  </div>
</section>`;
};

/* Approach: six department cards in a staggered wide/narrow grid, each one a
   disclosure that starts closed (icon + title + plus). WIDE drives the zigzag
   rhythm on the 3-column desktop grid: wide+narrow / narrow+wide / wide+narrow
   — each row fills, none repeat. A photo layer per card is aligned in grid
   coordinates by JS (--cx/--cy) so all six clip one shared backdrop shot;
   data-portrait-travel tunes the shared phero scroll pan down to a drift.
   The empty .appr__wire <li> is the connector-network overlay — it paints
   under the cards, so it is emitted first; JS fills it (see initApprWire).
   The KPI figures below reuse the hero .stats row verbatim. */
const APPR_WIDE = [true, false, false, true, true, false];
const approachBlock = () => {
  const deptsLabel = EN ? 'Departments' : 'Отделы';
  const cards = site.departments.map((d, i) => {
    const cls = ['appr__dept', 'reveal'];
    if (APPR_WIDE[i]) cls.push('appr__dept--wide');
    if (i === 0) cls.push('appr__dept--lead');
    const delay = Math.min(i, 4);
    return `<li class="${cls.join(' ')}"${delay ? ` data-d="${delay}"` : ''}>
        <span class="appr__shot" aria-hidden="true"></span>
        <h3 class="appr__dept-h">
          <button type="button" class="appr__toggle" id="appr-t-${i}"
            aria-expanded="false" aria-controls="appr-p-${i}">
            <span class="ico appr__ico">${I[d.icon] || I.search}</span>
            <span class="appr__dept-t">${esc(t(d, 'title'))}</span>
            <span class="appr__pm" aria-hidden="true"></span>
          </button>
        </h3>
        <div class="appr__body" id="appr-p-${i}" role="region" aria-labelledby="appr-t-${i}">
          <div class="appr__body-in">
            <p class="appr__dept-d">${esc(t(d, 'text'))}</p>
          </div>
        </div>
      </li>`;
  }).join('');
  /* Same atom as the hero figures row (#intro .stats) — plain white, one type
     scale — so the KPIs read as company figures, not as a second card system. */
  const figs = site.results.map(r => {
    const unit = t(r, 'unit') || '';
    const pre = r.prefix || '';
    return `<div class="stat">
        <div class="stat__n" data-count="${esc(r.count)}"${r.decimals ? ` data-decimals="${r.decimals}"` : ''}>${
          pre ? `<span class="${uClass(pre)}">${esc(pre)}</span>` : ''
        }<span class="stat__v">${esc(r.value)}</span>${
          unit ? `<span class="${uClass(unit)}">${esc(unit)}</span>` : ''
        }</div>
        <div class="stat__l">${rich(t(r, 'label'))}</div>
      </div>`;
  }).join('');
  return `<div class="appr reveal" id="appr">
  <div class="appr__shell">
    <div class="appr__inner">
    <header class="appr__head">
      <div class="appr__intro">
        ${kick(C.apprKicker)}
        <h2 class="h2">${C.apprTitle}</h2>
      </div>
      <p class="lead appr__lead">${esc(C.apprDesc)}</p>
    </header>
    <ul class="appr__grid" role="list" aria-label="${deptsLabel}" data-portrait-travel="0.42"><li class="appr__wire" aria-hidden="true"><svg class="appr__wire-svg" focusable="false" aria-hidden="true"></svg></li>${cards}</ul>
    <div class="appr__figs">
      <div class="stats stats--appr reveal reveal--fade">${figs}</div>
      <p class="appr__kpi-cap">${esc(C.apprKpiHead)} · ${esc(C.apprKpiNote)}</p>
    </div>
    </div>
  </div>
</div>`;
};

/* ------------------------------------------------------- company roadmap */
/* Horizontal story trail: gently rising left→right (oldest→newest).
   Marker --yh and the SVG path share arcYH(), so marks sit on the stroke.
   SVG y grows downward, so a falling y% reads as continuous upward progress.
   Mobile (≤640px) keeps a shallower rise (data-d-flat + --yhm), not a flat rail.
   The path keeps a short runway past the last mark (ROAD_AHEAD). */
const ARC_H = { y0: 78, y1: 32 }; // y% of the rail; start low, end high on screen
const ARC_M = { y0: 58, y1: 44 }; // slight upward vector on narrow viewports
const arcYH = f => {
  const t = Math.min(1, Math.max(0, f));
  return ARC_H.y0 + (ARC_H.y1 - ARC_H.y0) * t;
};
const arcYM = f => {
  const t = Math.min(1, Math.max(0, f));
  return ARC_M.y0 + (ARC_M.y1 - ARC_M.y0) * t;
};
const arcPathH = (steps = 96) =>
  'M' + Array.from({ length: steps + 1 }, (_, i) => {
    const g = i / steps;
    return `${(g * 1000).toFixed(1)},${arcYH(g).toFixed(2)}`;
  }).join('L');
const arcPathMobile = (steps = 96) =>
  'M' + Array.from({ length: steps + 1 }, (_, i) => {
    const g = i / steps;
    return `${(g * 1000).toFixed(1)},${arcYM(g).toFixed(2)}`;
  }).join('L');

/* Newest end of the ramp is deepest; oldest is quieter. */
const TONES_L = ['#141428', '#1E1E38', '#282844', '#343454', '#404068', '#4C4C7A', '#535D86', '#646E96'];
const TONES_D = ['#C6C8DA', '#B8BAD0', '#AAACC6', '#9C9EBC', '#8E90B2', '#8082A8', '#72749E', '#646694'];
const relLum = hex => {
  const ch = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4)));
  return .2126 * ch[0] + .7152 * ch[1] + .0722 * ch[2];
};
const ctr = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
const glyphOn = hex => {
  const l = relLum(hex);
  return ctr(l, 1) >= ctr(l, relLum('#141428')) ? '#FFFFFF' : '#141428';
};

/* Ahead spacer in tile units — keep in sync with .road__ahead in CSS.
   Short runway past the last year (~0.15×tile) so the trail does not look endless. */
const ROAD_AHEAD = 0.15;

const roadmap = () => {
  /* Story reads left→right: founding to present. Source JSON is newest-first.
     Marks + SVG path share arcYH() over the full track (list + ahead). A
     trailing ahead span lets the stroke + tip continue a little past the newest year. */
  const items = [...site.timeline].reverse();
  const n = items.length;
  const dRise = arcPathH();
  const dFlat = arcPathMobile();
  const gid = 'roadGrad';
  /* Mark centers sit at (i+.5) tile units; path spans n + ROAD_AHEAD tiles. */
  const track = n + ROAD_AHEAD;
  const pathAttrs = `d="${dRise}" data-d-rise="${dRise}" data-d-flat="${dFlat}"`;
  /* data-road-drive=arrows: prev/next + horizontal swipe/drag own progress.
     Flip to "scroll" for page-scroll pin/scrub (CSS/JS still support it). */
  return `<div class="road" data-road-drive="arrows" style="--yh0:${ARC_H.y0};--yh1:${ARC_H.y1};--ahead:${ROAD_AHEAD}">
      <button class="road__nav road__nav--prev" type="button" aria-label="${esc(T.roadPrev)}">${I.arrow}</button>
      <button class="road__nav road__nav--next" type="button" aria-label="${esc(T.roadNext)}">${I.arrow}</button>
      <div class="road__body" tabindex="0" role="region" aria-label="${esc(C.histTitle.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())}">
        <div class="road__htrack">
          <div class="road__arcWrap" aria-hidden="true">
            <svg class="road__arcH" viewBox="0 0 1000 100" preserveAspectRatio="none" focusable="false">
              <defs>
                <linearGradient id="${gid}" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#8A90B8"/>
                  <stop offset="55%" stop-color="#535D86"/>
                  <stop offset="100%" stop-color="#141428"/>
                </linearGradient>
              </defs>
              <path class="road__arcGlow" ${pathAttrs}/>
              <path class="road__arcBase" ${pathAttrs}/>
              <path class="road__arcDone" ${pathAttrs}/>
              <ellipse class="road__arcTip" cx="0" cy="${ARC_H.y0}" rx="3.2" ry="3.2"/>
            </svg>
          </div>
          <ol class="road__list" style="--n:${n}">
            ${items.map((x, i) => {
              const k = Math.round((n - 1 - i) * (TONES_L.length - 1) / Math.max(1, n - 1));
              const tone = TONES_L[k], toneD = TONES_D[k];
              const mid = (i + .5) / track;
              return `<li class="road__i${x.highlight ? ' road__i--hi' : ''} reveal reveal--fade"
                style="--yh:${arcYH(mid).toFixed(2)};--yhm:${arcYM(mid).toFixed(2)};--tone:${tone};--fg:${glyphOn(tone)};--tone-d:${toneD};--fg-d:${glyphOn(toneD)}">
              <span class="road__peg">
                <b class="road__yr">${esc(tt(x,'year'))}</b>
                <span class="road__mark" aria-hidden="true">${
                  x.mark === 'logo'
                    ? `<img class="road__logo" src="${rel(0, 'assets/img/logo-mark.svg')}" alt="" decoding="async">`
                    : (I[x.icon] || I.check)
                }</span>
              </span>
              <div class="road__c"><p>${esc(tt(x,'text'))}</p></div>
            </li>`;
            }).join('')}
          </ol>
          <span class="road__ahead" aria-hidden="true"></span>
        </div>
      </div>
    </div>`;
};

/* Associations and letters ride the same continuous belt as the client logos.
   The list is emitted twice so the loop is seamless; the duplicate carries
   aria-hidden so screen readers hear each association once. Unlike the client
   strip these tiles are interactive, so the belt pauses on hover — otherwise
   the target slides out from under the cursor. */
function belt(items, cls, label) {
  const row = h => items.map(h).join('');
  return `<div class="belt ${cls}" role="group" aria-label="${esc(label)}">
  <div class="belt__vp">
    <div class="belt__track">
      ${row(i => i(false))}<span class="belt__dup" aria-hidden="true">${row(i => i(true))}</span>
    </div>
  </div>
</div>`;
}

const assocMarquee = () => belt(
  site.associations.map((a, i) => dup =>
    `<button class="belt__i assoc" type="button" data-assoc="${i}" aria-haspopup="dialog"${dup ? ' tabindex="-1"' : ''}>
      <span class="assoc__logo"><img src="${rel(0, a.logo)}" alt="${dup ? '' : esc(a.abbr)}" loading="lazy" decoding="async"${a.logoScale ? ` style="--logo-scale:${a.logoScale}"` : ''}></span>
      <span class="assoc__n">${esc(t(a, 'name'))}</span>
      <span class="assoc__meta">${esc(t(a, 'meta'))}</span>
    </button>`),
  'belt--assoc', C.assocTitle);

const lettersMarquee = () => belt(
  site.letters.map(l => dup =>
    `<button class="belt__i letter" type="button" data-letter${dup ? ' tabindex="-1"' : ''}>
      <span class="letter__th"><img src="${rel(0, l.img)}" alt="${dup ? '' : C.letterAlt + ' — ' + esc(l.name)}" loading="lazy" decoding="async"></span>
      <span class="letter__n">${esc(l.name)}</span>
    </button>`),
  'belt--letters', C.lettersTitle);

/* Split "1925 · 75+ стран" into year + scope; label the scope sensibly. */
const assocScopeLabel = (scope) => {
  const s = String(scope || '').trim();
  if (!s) return '';
  if (/\d+\+?\s*(стран|countries|регион)/i.test(s) || /ЕАЭС|EAEU/i.test(s)) return C.assocReach;
  if (/Лондон|London|Нью-Йорк|New York|Александри|Alexandria|Вирджини/i.test(s)) return C.assocHq;
  if (/^Россия$|^Russia$/i.test(s)) return C.assocCountry;
  if (/FMCG|ритейл|retail/i.test(s)) return C.assocFocus;
  if (/регион/i.test(s)) return C.assocRegion;
  return C.assocReach;
};
const assocParts = a => {
  const meta = t(a, 'meta');
  const raw = String(meta || '').trim();
  const m = /^(\d{4})\s*[·•]\s*(.+)$/.exec(raw);
  if (m) return { year: m[1], meta: m[2], metaLabel: assocScopeLabel(m[2]) };
  /* e.g. RusBrand "Россия · FMCG" — show the whole line under a fitting label */
  const label = /FMCG/i.test(raw) ? C.assocFocus
    : /Россия|Russia/i.test(raw) ? C.assocCountry
    : C.assocReach;
  return { year: '', meta: raw, metaLabel: raw ? label : '' };
};

const assocModal = () => `<div class="modal" id="assocModal" role="dialog" aria-modal="true" aria-labelledby="amTitle" hidden>
      <div class="modal__bd" data-close></div>
      <div class="modal__c">
        <button class="modal__x" type="button" aria-label="${EN ? 'Close' : 'Закрыть'}" data-close>${I.x}</button>
        <div class="modal__top">
          <div class="modal__head">
            <img class="modal__logo" id="amLogo" src="" alt="">
          </div>
          <div class="modal__facts">
            <div class="modal__fact" id="amYearWrap" hidden>
              <span class="modal__fact-l">${esc(C.assocFounded)}</span>
              <span class="modal__fact-v" id="amYear"></span>
            </div>
            <div class="modal__fact" id="amMetaWrap" hidden>
              <span class="modal__fact-l" id="amMetaL"></span>
              <span class="modal__fact-v" id="amMeta"></span>
            </div>
          </div>
        </div>
        <h3 id="amTitle"></h3>
        <p id="amDesc"></p>
        <a class="modal__link" id="amLink" href="#" target="_blank" rel="noopener noreferrer"><span></span> ${I.ext}</a>
      </div>
    </div>
    <script id="assocData" type="application/json">${JSON.stringify(site.associations.map(a => {
      const p = assocParts(a);
      return { logo: rasterSrc(a.logo), name: t(a,'name'), year: p.year, meta: p.meta, metaLabel: p.metaLabel, desc: t(a,'desc'), url: a.url, site: a.site };
    }))}</script>`;

const newsCard = (n, depth = 0, d = 0, { eager = false } = {}) => `<a class="card ncard reveal" href="${pageRel(depth, `news/${n.slug}.html`)}"${d ? ` data-d="${d}"` : ''}>
        ${n.img ? `<div class="ncard__img"><img src="${assetRel(depth, n.img)}" alt="${esc(n.title)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"></div>` : ''}
        <div class="ncard__b">
          <div class="ncard__meta"><time datetime="${n.dateIso}">${esc(n.dateDisp)}</time><span class="dot"></span><span class="cl">${esc(n.cluster)}</span></div>
          <h3>${esc(n.title)}</h3>
          <span class="ncard__more arrow-link">${T.readOn} ${I.arrow}</span>
        </div>
      </a>`;

const caseCard = (c, depth = 0, d = 0) => `<a class="card case reveal" href="${pageRel(depth, `cases/${c.slug}.html`)}"${d ? ` data-d="${d}"` : ''}>
        ${c.img ? `<div class="case__img"><img src="${assetRel(depth, c.img)}" alt="${esc(c.title)}" loading="lazy" decoding="async"></div>` : ''}
        <div class="case__b">
          <span class="case__cat">${esc(c.category)}</span>
          <h3>${esc(c.title)}</h3>
          ${c.metric ? `<span class="case__win">${esc(c.metric)}</span>` : ''}
          <p>${esc(c.outcome || c.intro)}</p>
          <div class="case__f">
            <span class="case__more arrow-link">${T.caseStudy}</span>
            <span class="case__go" aria-hidden="true">${I.arrow}</span>
          </div>
        </div>
      </a>`;

/* ================================================================== pages */

/* ---------------------------------------------------------------- HOME */
function buildHome() {
  const c = chrome('index.html', 0);
  /* The rail carries the whole catalogue so it can be swiped end to end; the six
     strongest lead and the rest follow. Photos past the first screen only load
     when they are scrolled to. */
  const railLead = [10, 12, 8, 7, 5, 11];
  const railLeadSet = new Set(railLead);
  const railCases = railLead.map(n => cases.find(x => x.n === n)).filter(Boolean)
    .concat(cases.filter(x => !railLeadSet.has(x.n)));
  /* Full catalogue in a swipe rail; images past the first screen stay lazy. */

  const html = j(
    head({
      title: C.homeTitle,
      desc: C.homeDesc,
      keywords: C.homeKw,
      canonical: EN ? `${BASE}/en/` : `${BASE}/`, page: '', bodyClass: 'over-hero',
      jsonld: [orgLd, {
        '@context': 'https://schema.org', '@type': 'WebSite', name: O.name, url: `${BASE}/`,
        inLanguage: 'ru-RU',
        potentialAction: { '@type': 'SearchAction', target: `${BASE}/news.html?q={q}`, 'query-input': 'required name=q' },
      }],
    }),
    c.header,
    `<main>

<!-- the tower photo is a fixed layer: sections in the glass zone below let it
     show through, so scrolling shifts what sits behind the frosted tiles -->
<div class="skyline" aria-hidden="true">
  <img src="${rel(0, 'assets/img/hero-tower.jpg')}" alt="" width="1920" height="1281" fetchpriority="high" decoding="async">
</div>

<div class="glasszone">
<section class="hero">
  <!-- Soft V flare: same PNG + ~10% opacity approach as vlasta-s.com .flare -->
  <div class="hero__flare" aria-hidden="true"></div>
  <div class="wrap hero__inner">
    <h1 class="hero__t rise">${C.heroTitle}</h1>
    <a class="scrollcue rise" data-d="2" href="#intro" aria-label="${C.heroScroll}">
      <span class="scrollcue__l"></span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
    </a>
  </div>
</section>

<section class="sec" id="intro">
  <img class="intro__mark" src="${rel(0, 'assets/img/logo-dark.svg')}" alt="" aria-hidden="true" decoding="async">
  <div class="wrap">
    <p class="intro reveal">${C.intro}</p>
    <div class="stats reveal reveal--fade" data-d="1">
      ${site.stats.map(s => {
        const suffix = t(s, 'suffix');
        const unit = t(s, 'unit');
        const countAttr = s.count != null
          ? ` data-count="${esc(String(s.count))}"${s.decimals ? ` data-decimals="${s.decimals}"` : ''}`
          : '';
        const appear = s.appear ? ' stat--appear' : '';
        return `<div class="stat${appear}">
        <div class="stat__n"${countAttr}><span class="stat__v">${esc(s.n)}</span>${suffix ? `<span class="${uClass(suffix)}">${esc(suffix)}</span>` : ''}${unit ? `<span class="${uClass(unit)}">${esc(unit)}</span>` : ''}</div>
        <div class="stat__l">${esc(t(s, 'label'))}</div>
      </div>`;
      }).join('')}
    </div>
  </div>
</section>
</div><!-- /glasszone -->

<section class="sec" id="services">
  <div class="wrap">
    ${shead({
      k: C.svcKicker, h: C.svcTitle,
      d: C.svcDesc,
      mod: 'stack',
      extra: seeall('services.html', T.allServices),
    })}
    <div class="rail-fade">
    <div class="svc-rail reveal" tabindex="0" role="group" aria-label="${esc(C.svcTitle)}">
      ${site.services.map((s) => `<article class="svc-card" data-svc-bg="${esc(s.id)}">
        <div class="svc-card__media" aria-hidden="true">
          ${s.tabImg
            ? `<img class="svc-card__shot" src="${rel(0, s.tabImg)}" alt="" width="1600" height="900" loading="lazy" decoding="async">`
            : '<div class="svc-card__ph"></div>'}
          <div class="svc-card__wash"></div>
          <div class="svc-card__wash svc-card__wash--reveal"></div>
          ${s.tabImg
            ? `<img class="svc-card__shot svc-card__shot--lit" src="${rel(0, s.tabImg)}" alt="" width="1600" height="900" loading="lazy" decoding="async">`
            : ''}
          <div class="svc-card__chrome">
            <span class="svc-card__n">${esc(s.num)}</span>
            <span class="svc-card__mark">${I[s.icon]}</span>
          </div>
        </div>
        <div class="svc-card__body">
          <div class="svc-card__copy">
            <div class="svc-card__main">
              <h3 class="svc-card__title">${svcHomeTitle(s)}</h3>
              <p class="svc-card__tag">${esc(plain(t(s, 'tagline')))}</p>
              <a class="svc-card__more arrow-link" href="services.html#${s.id}">
                <span class="svc-card__more-l">${T.more}</span> ${I.arrow}
              </a>
            </div>
            <ul class="svc-card__hl">${(t(s, 'highlights') || []).map(h =>
              `<li><a href="${hlHref(s.id, h)}">${rich(hlText(h))}</a></li>`).join('')}</ul>
          </div>
        </div>
      </article>`).join('')}
    </div>
    </div>
  </div>
</section>

${marquee()}

<section class="sec" id="approach">
  <div class="wrap">
    ${approachBlock()}
  </div>
</section>

<section class="sec" id="cases">
  <div class="wrap">
    ${shead({
      k: C.casesKicker, h: C.casesTitle,
      extra: seeall('cases.html', T.allCases),
    })}
    <div class="rail-fade"><div class="case-rail" tabindex="0" role="group" aria-label="${C.casesTitle}">${railCases.map(x => caseCard(x, 0, 0)).join('')}</div></div>
  </div>
</section>

<section class="sec sec--dark" id="geography">
  <div class="wrap geo">
    <div class="reveal">
      ${kick(t(site.geography,'kicker'))}
      <h2 class="h2" style="margin-top:15px">${esc(t(site.geography,'title'))}</h2>
      <p class="lead" style="margin-top:18px">${esc(t(site.geography,'lead'))}</p>
      <div class="geo__bar">${t(site.geography,'bar').map((b, gi) => {
        // "80+" splits into a number the counter can run to and a suffix it keeps
        const m = String(b.n).match(/^(\D*)(\d[\d.,]*)(.*)$/);
        const pre = m ? m[1] : '', num = m ? m[2] : '', suf = m ? m[3] : String(b.n);
        return `<div class="geo__t" style="--i:${gi}">
          <b class="geo__n"${num ? ` data-count="${esc(num.replace(',', '.'))}"` : ''}>${
            pre ? `<span class="geo__suf">${esc(pre)}</span>` : ''
          }<span class="geo__v">${esc(num || b.n)}</span>${
            suf ? `<span class="geo__suf">${esc(suf)}</span>` : ''
          }</b>
          <span class="geo__lb">${esc(b.label)}</span>
        </div>`;
      }).join('')}</div>
    </div>
    <div class="reveal" data-d="1">${countryMap()}</div>
  </div>
</section>

<section class="sec sec--alt" id="history">
  ${engrave('bl', 'tlh')}
  <div class="wrap">
    ${shead({ k: C.histKicker, h: C.histTitle, richH: true })}
  </div>
  ${roadmap()}
</section>

<section class="sec" id="news">
  <div class="wrap">
    ${shead({
      k: C.newsKicker, h: C.newsTitle,
      extra: seeall('news.html', T.allNews),
    })}
    <div class="rail-fade"><div class="news-rail" tabindex="0" role="group" aria-label="${esc(C.newsTitle)}">${
      news.map((n, i) => newsCard(n, 0, 0, { eager: i < 3 })).join('')
    }</div></div>
  </div>
</section>

${ctaBand(0)}
</main>`,
    c.footer);
  write('index.html', html);
}

/* ------------------------------------------------------------- SERVICES */
/* --------------------------------------------------- service detail parts */
/* Where the material is a procedure rather than a description it is set as a
   numbered run of steps, and where it is a set of watched channels, as an icon
   grid. Direction cards and process strips start expanded; the plus still
   lets a visitor fold a block shut. */
const dirCard = (x, i, svcId) => `<details class="fold" id="${svcId}-${x.icon}" open>
        <summary class="fold__sum">
          <span class="ico ico--sm">${I[x.icon] || I.check}</span>
          <span class="fold__t">${esc(tt(x, 'title'))}</span>
          <span class="fold__plus" aria-hidden="true"></span>
        </summary>
        <div class="fold__body">
          <p>${esc(tt(x, 'text'))}</p>
          ${(tt(x, 'bullets') || []).length ? `<ul class="dir__l">${tt(x, 'bullets').map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
        </div>
      </details>`;

const chanGrid = (c) => `<div class="chan">
        <h3 class="chan__t">${esc(tt(c, 'title'))}</h3>
        <div class="chan__g">
          ${c.items.map(x => `<div class="chan__c">
            <span class="chan__i">${I[x.icon] || I.search}</span>
            <b>${esc(tt(x, 'h'))}</b><span>${esc(tt(x, 'p'))}</span>
          </div>`).join('')}
        </div>
      </div>`;

const flowBlock = (f) => `<details class="fold fold--flow" open>
        <summary class="fold__sum">
          <span class="ico ico--sm">${I[f.icon] || I.layers}</span>
          <span class="fold__t">${esc(tt(f, 'title'))}</span>
          <span class="fold__plus" aria-hidden="true"></span>
        </summary>
        <div class="fold__body">
          ${f.note ? `<p class="flow__note">${esc(tt(f, 'note'))}</p>` : ''}
          <ol class="flow__l">
            ${f.steps.map((s, i) => `<li class="flow__s">
              <span class="flow__n">${String(i + 1).padStart(2, '0')}</span>
              <h4>${esc(tt(s, 'h'))}</h4>
              <p>${esc(tt(s, 'p'))}</p>
            </li>`).join('')}
          </ol>
        </div>
      </details>`;

/* Client scenarios: situation → linked service blocks (from site.serviceScenarios). */
const svcById = Object.fromEntries(site.services.map(s => [s.id, s]));
const svcShort = {
  brand: EN ? 'Brand & IP' : 'Защита бренда',
  security: EN ? 'Business security' : 'Безопасность бизнеса',
  compliance: EN ? 'Compliance analysis' : 'Анализ compliance',
  consulting: EN ? 'Consulting' : 'Консалтинг',
};

function scenariosBlock() {
  const sc = site.serviceScenarios;
  if (!sc?.groups?.length) return '';
  let n = 0;
  const groups = sc.groups.map(g => {
    const items = g.items.map(it => {
      n += 1;
      const hint = tt(it, 'hint');
      const offers = (it.offers || []).map(o => {
        const svc = svcById[o.to];
        const label = svcShort[o.to] || (svc ? t(svc, 'title') : o.to);
        return `<li class="scen__offer">
            <a class="scen__link" href="#${esc(o.to)}" aria-label="${esc(C.svcScenTo)}: ${esc(label)}">
              <span class="scen__svc">${esc(label)}</span>
              <span class="scen__go" aria-hidden="true">${I.arrow}</span>
            </a>
            <p class="scen__how">${esc(tt(o, 'text'))}</p>
          </li>`;
      }).join('');
      return `<li class="scen__item reveal">
          <span class="scen__n" aria-hidden="true">${String(n).padStart(2, '0')}</span>
          <div class="scen__body">
            <h4 class="scen__t">${esc(tt(it, 'trigger'))}${hint ? ` <span class="scen__hint">(${esc(hint)})</span>` : ''}</h4>
            <ul class="scen__offers">${offers}</ul>
          </div>
        </li>`;
    }).join('');
    return `<div class="scen__group">
        <h3 class="scen__g">${esc(tt(g, 'title'))}</h3>
        <ol class="scen__list">${items}</ol>
      </div>`;
  }).join('');
  return `<section class="sec sec--alt" id="scenarios" aria-label="${esc(C.svcScenNav)}">
  <div class="wrap">
    ${shead({ k: t(sc, 'kicker'), h: t(sc, 'title'), d: t(sc, 'lead'), mod: 'split' })}
    <div class="scen">${groups}</div>
  </div>
</section>`;
}

function buildServices() {
  const c = chrome('services.html', 0);
  const html = j(
    head({
      title: C.svcPageTitle,
      desc: C.svcPageDesc,
      keywords: C.svcPageKw,
      canonical: EN ? `${BASE}/en/services.html` : `${BASE}/services.html`, page: 'services.html',
      bodyClass: 'page-services',
      jsonld: [orgLd, crumbLd([['Главная', ''], ['Услуги', 'services.html']]), {
        '@context': 'https://schema.org', '@type': 'ItemList',
        itemListElement: site.services.map((s, i) => ({
          '@type': 'ListItem', position: i + 1,
          item: { '@type': 'Service', name: t(s, 'title'), description: plain(t(s, 'tagline')), provider: { '@type': 'Organization', name: O.name }, url: `${BASE}/services.html#${s.id}` },
        })),
      }],
    }),
    c.header,
    `<main>
<section class="phero">
  ${engrave('tr', 'ph')}
  <div class="wrap">
    <nav class="crumbs" aria-label="${T.crumbs}"><a href="index.html">${T.home}</a> / <span>Услуги</span></nav>
    <h1 class="h1">${C.svcH1}</h1>
    <p class="lead">${C.svcLead}</p>
  </div>
</section>

<nav class="svc-jump" aria-label="${C.svcNav}">
  <div class="wrap">
    <div class="svc-tabs">
      <a class="svc-tabs__tab" href="#scenarios">
        <span class="svc-tabs__fill" aria-hidden="true"></span>
        <span class="svc-tabs__txt">${esc(C.svcScenNav)}</span>
      </a>${site.services.map(s => `<a class="svc-tabs__tab" href="#${s.id}">
        <span class="svc-tabs__fill" aria-hidden="true"></span>
        <span class="svc-tabs__txt"><b>${esc(s.num)}</b>${esc(t(s,'titleNav') || t(s,'title'))}</span>
      </a>`).join('')}
    </div>
  </div>
</nav>

${scenariosBlock()}

<section class="sec">
  <div class="wrap">
    ${site.services.map(s => `<article class="svc-detail reveal" id="${s.id}">
      <figure class="svc-detail__hero">
        <div class="svc-detail__frame">
          <div class="ncard__img">
            <img src="${rel(0, s.img)}" alt="" loading="lazy" decoding="async">
          </div>
          <span class="svc-detail__n" aria-hidden="true">${esc(s.num)}</span>
          <h2 class="svc-detail__title">${esc(t(s,'title'))}</h2>
        </div>
        <figcaption class="svc-detail__intro">${esc(t(s,'intro'))}</figcaption>
      </figure>
      <div class="fold-list">
        ${s.directions.map((d, i) => dirCard(d, i, s.id)).join('')}
      </div>
      ${s.channels ? chanGrid(s.channels) : ''}
      ${(s.flows || []).length ? `<div class="fold-list fold-list--flows">${s.flows.map(flowBlock).join('')}</div>` : ''}
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
      title: C.aboutTitle,
      desc: C.aboutDesc,
      keywords: C.aboutKw,
      canonical: EN ? `${BASE}/en/about.html` : `${BASE}/about.html`, page: 'about.html',
      jsonld: [orgLd, crumbLd([['Главная', ''], ['О нас', 'about.html']])],
    }),
    c.header,
    `<main>
<section class="phero">
  ${engrave('tr', 'ph')}
  <div class="wrap">
    <nav class="crumbs" aria-label="${T.crumbs}"><a href="index.html">${T.home}</a> / <span>О нас</span></nav>
    <h1 class="h1">${C.aboutH1}</h1>
    <p class="lead">${C.aboutLead}</p>
  </div>
</section>

<section class="sec" id="team">
  <div class="wrap">
    ${shead({ k: C.teamKicker, h: C.teamTitle, mod: 'center' })}
    <div class="team">
      ${site.team.map((m, i) => `<figure class="person reveal"${i ? ` data-d="${i}"` : ''}>
        <div class="person__ph"><img src="${rel(0, m.img)}" alt="${esc(tt(m,'name'))} — ${esc(tt(m,'role'))}" loading="lazy" decoding="async"></div>
        <figcaption class="person__c">
          <h3>${esc(tt(m,'name'))}</h3>
          <div class="person__role">${esc(tt(m,'role'))}</div>
          <p>${esc(tt(m,'note'))}</p>
        </figcaption>
      </figure>`).join('')}
    </div>
  </div>
</section>

<section class="sec sec--alt" id="associations">
  ${engrave('tr', 'as')}
  <div class="wrap">
    ${shead({ k: C.assocKicker, h: C.assocTitle, d: C.assocDesc })}
  </div>
  ${assocMarquee()}
  ${assocModal()}
</section>

<section class="sec" id="letters">
  <div class="wrap">
    ${shead({ k: C.lettersKicker, h: C.lettersTitle, d: C.lettersDesc })}
  </div>
  ${lettersMarquee()}
  <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="${C.letterDialog}" hidden>
    <div class="lightbox__p">
      <div class="lightbox__h">
        <span class="lightbox__t"></span>
        <button class="lightbox__x" type="button" aria-label="Закрыть" data-close>${I.x}</button>
      </div>
      <div class="lightbox__b"><img src="" alt=""></div>
    </div>
  </div>
</section>

<section class="sec sec--alt" id="who">
  <div class="wrap">
    ${shead({ k: C.whoKicker, h: C.whoTitle, d: C.whoDesc, mod: 'stack' })}
    <div class="values reveal" role="list">
      ${site.values.map(v => `<div class="value" role="listitem"><span class="value__n">${esc(v.num)}</span><h3>${esc(t(v,'title'))}</h3><p>${esc(t(v,'text'))}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="sec sec--alt" id="history">
  ${engrave('bl', 'tl')}
  <div class="wrap">
    ${shead({ k: C.histKicker, h: C.histTitle, richH: true })}
  </div>
  ${roadmap()}
</section>

<section class="sec sec--alt" id="clients">
  <div class="wrap">
    ${shead({ k: C.clientsKicker, h: C.clientsTitle, mod: 'center' })}
    <div class="clients reveal">${clientsGrid()}</div>
    <p class="clients-note">${C.clientsNote}</p>
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
  const html = j(
    head({
      title: C.casesPageTitle,
      desc: C.casesPageDesc,
      keywords: C.casesPageKw,
      canonical: EN ? `${BASE}/en/cases.html` : `${BASE}/cases.html`, page: 'cases.html',
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
    <nav class="crumbs" aria-label="${T.crumbs}"><a href="index.html">${T.home}</a> / <span>Кейсы</span></nav>
    ${kick(C.casesKick)}
    <h1 class="h1">${C.casesH1}</h1>
    <p class="lead">${C.casesLead}</p>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="case-grid" id="caseGrid">
      ${cases.map((x, i) => `<a class="card case reveal" href="cases/${x.slug}.html" data-cat="${esc(x.category)}"${i % 3 ? ` data-d="${i % 3}"` : ''}>
        ${x.img ? `<div class="case__img"><img src="${rel(0, x.img)}" alt="${esc(x.title)}" loading="lazy" decoding="async"></div>` : ''}
        <div class="case__b">
          <span class="case__cat">${esc(x.category)}</span>
          <h2 class="h3">${esc(x.title)}</h2>
          ${x.metric ? `<span class="case__win">${esc(x.metric)}</span>` : ''}
          <p>${esc(x.outcome || x.intro)}</p>
          <div class="case__f">
            <span class="case__more arrow-link">${T.caseStudy}</span>
            <span class="case__go" aria-hidden="true">${I.arrow}</span>
          </div>
        </div>
      </a>`).join('')}
    </div>
    <p class="empty" id="caseEmpty" hidden>${T.emptyCases}</p>
  </div>
</section>

${ctaBand(0)}
</main>`,
    c.footer);
  write('cases.html', html);

  // ---- detail pages
  cases.forEach((x, idx) => {
    const cc = chrome('cases.html', 1, `cases/${x.slug}.html`);
    const prev = cases[idx - 1], next = cases[idx + 1];
    const desc = x.intro.length > 300 ? x.intro.slice(0, 297) + '…' : x.intro;
    const page = j(
      head({
        title: `${x.title} ${C.caseSuffix}`,
        desc,
        keywords: x.tags.join(', '),
        canonical: EN ? `${BASE}/en/cases/${x.slug}.html` : `${BASE}/cases/${x.slug}.html`, page: `cases/${x.slug}.html`,
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
<section class="case-hero${x.img ? ' phero--photo' : ''}"${x.img ? ` style="background-image:url('${rel(1, x.img)}')"` : ''}>
  ${x.img ? '' : engrave('tr', 'ch')}
  <span class="case-hero__n" aria-hidden="true">${String(x.n).padStart(2, '0')}</span>
  <div class="wrap">
    <nav class="crumbs" aria-label="${T.crumbs}"><a href="../index.html">${T.home}</a> / <a href="../cases.html">Кейсы</a> / <span>${esc(x.title)}</span></nav>
    ${kick(x.category)}
    <h1 class="h1">${esc(x.title)}</h1>
    <p class="lead">${esc(x.intro)}</p>
    <div class="facts facts--hero">
      <div class="fact"><span>${T.direction}</span><strong>${esc(x.category)}</strong></div>
      <div class="fact"><span>${T.region}</span><strong>${T.regionValue}</strong></div>
      <div class="fact"><span>${x.metric ? T.outcome : T.format}</span><strong>${esc(x.metric || T.projectWork)}</strong></div>
    </div>
    ${x.outcome ? `<p class="case-outcome">${esc(x.outcome)}</p>` : ''}
  </div>
</section>

<section class="sec">
  <div class="wrap wrap--article">
    <div class="prose reveal">
      ${x.sections.map((s, i) => `<h2><span class="step">${String(i + 1).padStart(2, '0')}</span>${esc(s.h)}</h2>
      ${s.p.map(p => `<p>${esc(p)}</p>`).join('')}`).join('')}
    </div>
    <div class="taglist">
      <h4>${T.topics}</h4>
      <div class="tags">${x.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    </div>
    <nav class="pager" aria-label="${T.otherCases}">
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
  const INITIAL = 12;

  const html = j(
    head({
      title: C.newsPageTitle,
      desc: C.newsPageDesc,
      keywords: C.newsPageKw,
      canonical: EN ? `${BASE}/en/news.html` : `${BASE}/news.html`, page: 'news.html',
      image: news[0]?.img,
      jsonld: [orgLd, crumbLd([['Главная', ''], ['Новости', 'news.html']]), {
        '@context': 'https://schema.org', '@type': 'CollectionPage',
        name: C.newsCollection, url: `${BASE}/${PREFIX}news.html`, inLanguage: 'ru-RU',
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
    <nav class="crumbs" aria-label="${T.crumbs}"><a href="index.html">${T.home}</a> / <span>Новости</span></nav>
    <h1 class="h1">${C.newsH1}</h1>
    <p class="lead">${C.newsLead}</p>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <p class="count" id="newsCount">${T.shown(INITIAL, news.length)}</p>
    <div class="news-grid" id="newsGrid" data-initial="${INITIAL}">
      ${news.map((n, i) => `<a class="card ncard reveal" href="news/${n.slug}.html" data-cat="${esc(n.cluster)}"${i >= INITIAL ? ' hidden' : ''}${i % 3 && i < INITIAL ? ` data-d="${i % 3}"` : ''}>
        ${n.img ? `<div class="ncard__img"><img src="${rel(0, n.img)}" alt="${esc(n.title)}" loading="lazy" decoding="async"></div>` : ''}
        <div class="ncard__b">
          <div class="ncard__meta"><time datetime="${n.dateIso}">${esc(n.dateDisp)}</time><span class="dot"></span><span class="cl">${esc(n.cluster)}</span></div>
          <h2 class="h3" style="font-size:16.5px">${esc(n.title)}</h2>
          <span class="ncard__more arrow-link">${T.readOn} ${I.arrow}</span>
        </div>
      </a>`).join('')}
    </div>
    <p class="empty" id="newsEmpty" hidden>${T.emptyNews}</p>
    <div class="center" style="text-align:center;margin-top:38px">
      <button class="btn btn--outline" type="button" id="newsMore">${T.showMore} ${I.arrow}</button>
    </div>
  </div>
</section>
</main>`,
    c.footer);
  write('news.html', html);

  // ---- article pages
  news.forEach((n, idx) => {
    const cc = chrome('news.html', 1, `news/${n.slug}.html`);
    const prev = news[idx - 1], next = news[idx + 1];
    const related = news.filter(r => r.cluster === n.cluster && r.slug !== n.slug).slice(0, 3);
    const videoBlock = n.video
      ? (n.video.type === 'mp4'
        ? `<div class="video"><video controls preload="metadata"><source src="${esc(n.video.src)}" type="video/mp4">Ваш браузер не поддерживает видео.</video></div>`
        : `<div class="video"><iframe src="${esc(n.video.src)}" title="${C.videoTitle}: ${esc(n.title)}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`)
      : '';

    const page = j(
      head({
        title: n.metaTitle.length > 65 ? `${n.metaTitle.slice(0, 62)}…` : n.metaTitle,
        desc: n.metaDesc,
        keywords: n.keywords.join(', '),
        canonical: EN ? `${BASE}/en/news/${n.slug}.html` : `${BASE}/news/${n.slug}.html`, page: `news/${n.slug}.html`,
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
<section class="phero${n.img ? ' phero--photo' : ''}"${n.img ? ` style="background-image:url('${rel(1, n.img)}')"` : ''}>
  ${n.img ? '' : engrave('tr', 'ph')}
  <div class="wrap wrap--article">
    <nav class="crumbs" aria-label="${T.crumbs}"><a href="../index.html">${T.home}</a> / <a href="../news.html">${NAV[4][1]}</a> / <span><time datetime="${n.dateIso}">${esc(n.dateDisp)}</time></span></nav>
    <div class="article__meta"><span class="cl">${esc(n.cluster)}</span></div>
    <h1 class="h1 rise" style="margin-top:14px">${esc(n.h1)}</h1>
  </div>
</section>

<section class="sec">
  <div class="wrap wrap--article">
    ${videoBlock}
    ${n.subtitle ? `<h2 class="article__subtitle${videoBlock ? '' : ' reveal'}">${esc(n.subtitle)}</h2>` : ''}
    <article class="prose reveal">
      ${renderBody(n.body)}
    </article>
    ${n.links.length ? `<div class="srcs">
      <h4>${T.sources}</h4>
      <ul>${n.links.map(l => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${I.ext}${esc(l.text)}</a></li>`).join('')}</ul>
    </div>` : ''}
    <nav class="pager" aria-label="${T.otherNews}">
      ${prev ? `<a class="arrow-link" href="${prev.slug}.html">${I.arrow} ${T.newer}</a>` : '<span></span>'}
      ${next ? `<a class="arrow-link" href="${next.slug}.html">${T.earlier} ${I.arrow}</a>` : '<span></span>'}
    </nav>
  </div>
</section>

${related.length ? `<section class="sec sec--alt">
  <div class="wrap">
    ${shead({ k: T.related, h: esc(n.cluster), mod: 'split' })}
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
      title: C.contactsTitle,
      desc: C.contactsDesc,
      keywords: C.contactsKw,
      canonical: EN ? `${BASE}/en/contacts.html` : `${BASE}/contacts.html`, page: 'contacts.html',
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
    <nav class="crumbs" aria-label="${T.crumbs}"><a href="index.html">${T.home}</a> / <span>Контакты</span></nav>
    <h1 class="h1">${C.contactsH1}</h1>
    <p class="lead">${C.contactsLead}</p>
  </div>
</section>

<section class="sec">
  <div class="wrap contact-grid">
    <div class="reveal">
      <div class="ci">
        <div class="ci__i"><span class="ci__ico">${I.phone}</span><div><h4>${T.phone}</h4><a href="tel:${O.phoneHref}">${esc(O.phone)}</a></div></div>
        <div class="ci__i"><span class="ci__ico">${I.mail}</span><div><h4>${T.email}</h4><a href="mailto:${O.email}">${esc(O.email)}</a></div></div>
        <div class="ci__i"><span class="ci__ico">${I.pin}</span><div><h4>${T.address}</h4><p>${esc(t(O,'address'))}</p></div></div>
        <div class="ci__i"><span class="ci__ico">${I.clock}</span><div><h4>${T.hours}</h4><p>${esc(t(O,'hours'))}</p></div></div>
      </div>
      <div class="ci-actions">
        <a href="tel:${O.phoneHref}" class="btn btn--primary">${T.callUs} ${I.arrow}</a>
        <a href="mailto:${O.email}" class="btn btn--outline">${T.writeUs}</a>
      </div>
    </div>
    <div class="reveal" data-d="1">
      <div class="map-embed map-embed--tall">
        <iframe title="${C.mapTitle}" loading="lazy" src="https://yandex.ru/map-widget/v1/?ll=37.566%2C55.728&z=16&text=${encodeURIComponent(O.address)}"></iframe>
      </div>
    </div>
  </div>
</section>
</main>`,
    c.footer);
  write('contacts.html', html);
}

/* -------------------------------------------------------------- PRIVACY */
function privacyPageFiles(dirRel) {
  const abs = path.join(ROOT, dirRel);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs)
    .filter(f => /^page-\d+\.(webp|png|jpe?g)$/i.test(f))
    .sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10))
    .map(f => `${dirRel}/${f}`);
}

function buildPrivacy() {
  const c = chrome('', 0, 'privacy.html');
  const pol = site.privacy || {};
  const pagesDir = pol.pagesDir || 'assets/legal/privacy';
  const pages = privacyPageFiles(pagesDir);
  const viewerTitle = esc(t(pol, 'viewerTitle') || C.privacyH1);
  const total = pages.length;
  const stack = pages.map((src, i) => {
    const n = i + 1;
    const eager = i === 0;
    return `<img src="${esc(assetRel(0, src))}" alt="${esc(C.privacyPageAlt(n, total))}" width="1240" height="1754" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  }).join('\n      ');
  const html = j(
    head({
      title: C.privacyTitle,
      desc: C.privacyDesc,
      canonical: EN ? `${BASE}/en/privacy.html` : `${BASE}/privacy.html`, page: 'privacy.html',
      robots: 'index,follow',
      jsonld: [orgLd, crumbLd([[T.home, ''], [T.privacy, 'privacy.html']])],
    }),
    c.header,
    `<main>
<section class="phero">
  ${engrave('tr', 'ph')}
  <div class="wrap">
    <nav class="crumbs" aria-label="${T.crumbs}"><a href="index.html">${T.home}</a> / <span>${T.privacy}</span></nav>
    ${kick(C.privacyKick)}
    <h1 class="h1">${C.privacyH1}</h1>
  </div>
</section>
<section class="sec">
  <div class="wrap wrap--narrow">
    <div class="prose">
      <p>${rich(t(pol, 'intro'))}</p>
    </div>
    <figure class="policy-pages" role="region" aria-label="${viewerTitle}">
      ${stack}
    </figure>
  </div>
</section>
</main>`,
    c.footer);
  write('privacy.html', html);
}

/* ------------------------------------------------------- sitemap + robots */
function buildSitemap() {
  const pre = PREFIX;   // '' for RU, 'en/' for EN
  const urls = [
    { u: pre, p: EN ? '0.9' : '1.0', f: 'weekly' },
    { u: pre + 'services.html', p: '0.9', f: 'monthly' },
    { u: pre + 'about.html', p: '0.8', f: 'monthly' },
    { u: pre + 'cases.html', p: '0.9', f: 'weekly' },
    { u: pre + 'news.html', p: '0.9', f: 'daily' },
    { u: pre + 'contacts.html', p: '0.7', f: 'yearly' },
    { u: pre + 'privacy.html', p: '0.2', f: 'yearly' },
    ...cases.map(c => ({ u: pre + `cases/${c.slug}.html`, p: '0.7', f: 'monthly' })),
    ...news.map(n => ({ u: pre + `news/${n.slug}.html`, p: '0.6', f: 'monthly', d: n.dateIso, img: n.img })),
  ];
  const body = urls.map(x => `  <url>
    <loc>${BASE}/${x.u}</loc>
    <lastmod>${x.d || BUILT}</lastmod>
    <changefreq>${x.f}</changefreq>
    <priority>${x.p}</priority>${x.img ? `
    <image:image><image:loc>${BASE}/${x.img}</image:loc></image:image>` : ''}
  </url>`).join('\n');
  // each locale drops its fragment; the RU pass stitches them together
  fs.mkdirSync(path.join(ROOT, '.build'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, `.build/sitemap-${LOCALE}.xml`), body, 'utf8');
  const frags = ['ru', 'en']
    .map(l => path.join(ROOT, `.build/sitemap-${l}.xml`))
    .filter(f => fs.existsSync(f))
    .map(f => fs.readFileSync(f, 'utf8'));
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${frags.join('\n')}
</urlset>
`, 'utf8');
  if (!EN) fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /_boss-preview/
Disallow: /content/legal/

Sitemap: ${BASE}/sitemap.xml
`, 'utf8');
  return urls.length;
}

/* ------------------------------------------------------------------- run */
console.log(`Власта-Консалтинг — сборка (${LOCALE.toUpperCase()})\n`);
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
