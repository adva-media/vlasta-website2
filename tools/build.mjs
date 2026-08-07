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

const ROOT = path.resolve(import.meta.dirname, '..');
const rd = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

/* Content-hash query on CSS/JS. The host serves assets with max-age=604800,
   so without this a returning visitor keeps the previous stylesheet. */
const hash = p => crypto.createHash('sha1')
  .update(fs.readFileSync(path.join(ROOT, p))).digest('hex').slice(0, 8);
const V = { css: hash('assets/css/style.css'), js: hash('assets/js/main.js') };

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
    nav: [['index.html','Главная'],['services.html','Услуги'],['about.html','О компании'],
          ['cases.html','Кейсы'],['news.html','Новости']],
    contact:'Связаться', menu:'Меню', more:'Подробнее', readOn:'Читать',
    allServices:'Все услуги', allCases:'Все кейсы', allNews:'Все новости',
    caseStudy:'Разбор кейса', home:'Главная',
    nav_services:'Услуги', nav_contacts:'Контакты', nav_cases:'Кейсы', contactBtn:'Контакт', navigation:'Навигация',
    documents:'Документы', info:'Информация', telFax:'Тел./факс',
    themeLabel:'Переключить тёмную тему', openMenu:'Открыть меню', closeMenu:'Закрыть меню',
    toTop:'Наверх', crumbs:'Хлебные крошки', mainNav:'Основная навигация',
    rights:'Все права защищены.', privacy:'Политика конфиденциальности',
    footerAbout:`Обеспечиваем экономическую безопасность бизнеса и защиту брендов от контрафакта с ${O.founded} года — на передовых технологиях и высоких моральных ценностях.`,
    ctaKicker:'Начнём сотрудничество', ctaTitle:'Обсудим, как защитить ваш бизнес',
    ctaText:'Проведём конфиденциальную консультацию, оценим риски и предложим решение под вашу задачу.',
    cookieTitle:'Файлы cookie',
    cookieText:'Мы используем cookie, чтобы сайт работал корректно и чтобы понимать, какие материалы вам полезны. Аналитику можно отключить — на работу сайта это не повлияет.',
    cookieMore:'Подробнее', ckReject:'Отклонить всё', ckNeeded:'Только необходимые', ckAll:'Принять всё',
    scrollHint:'листайте', sources:'Источники и упоминания', topics:'Темы кейса',
    newer:'Новее', earlier:'Ранее', related:'По теме', showMore:'Показать ещё',
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
    nav_services:'Services', nav_contacts:'Contact', nav_cases:'Cases', contactBtn:'Contact', navigation:'Navigation',
    documents:'Documents', info:'Information', telFax:'Tel./fax',
    themeLabel:'Toggle dark theme', openMenu:'Open menu', closeMenu:'Close menu',
    toTop:'Back to top', crumbs:'Breadcrumb', mainNav:'Main navigation',
    rights:'All rights reserved.', privacy:'Privacy policy',
    footerAbout:`Protecting brands from counterfeiting and securing business operations since ${O.founded} — on advanced technology and high ethical standards.`,
    ctaKicker:'Start a conversation', ctaTitle:'Let us discuss protecting your business',
    ctaText:'We will hold a confidential consultation, assess the risks and propose a solution for your situation.',
    cookieTitle:'Cookies',
    cookieText:'We use cookies so the site works properly and so we can see which material is useful to you. Analytics can be switched off — the site will work either way.',
    cookieMore:'Learn more', ckReject:'Reject all', ckNeeded:'Necessary only', ckAll:'Accept all',
    scrollHint:'scroll', sources:'Sources and mentions', topics:'Case topics',
    newer:'Newer', earlier:'Earlier', related:'Related', showMore:'Show more',
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
// assets live at the site root; from /en/ pages that is one level further up
const rel = (depth, p) => '../'.repeat(depth + UP) + p;

function write(rp, html) {
  const abs = path.join(ROOT, PREFIX + rp);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, html.replace(/\n{3,}/g, '\n\n'), 'utf8');
}


/* Page-level marketing copy. Kept beside the templates rather than in the
   content JSON because it is chrome, not data the client edits. */
const C = {
  ru: {
    homeTitle:`${O.name} — защита брендов и экономическая безопасность бизнеса`,
    homeDesc:`«${O.name}» с ${O.founded} года защищает товарные знаки от контрафакта и обеспечивает экономическую безопасность бизнеса в России, СНГ и странах ЕАЭС: ТРОИС, рейды, проверки контрагентов, сопровождение в суде.`,
    homeKw:'защита бренда, борьба с контрафактом, ТРОИС, экономическая безопасность бизнеса, проверка контрагентов, бизнес-разведка, Власта-Консалтинг',
    heroPill:`С ${O.founded} года · Москва · Россия и ЕАЭС`,
    heroTitle:'Безопасность бизнеса<br>в надёжных руках',
    heroScroll:'Пролистать к описанию',
    intro:'Защищаем бренды от контрафакта и обеспечиваем экономическую безопасность компаний в России, СНГ и странах ЕАЭС — опираясь на передовые технологии и высокие моральные ценности.',
    svcKicker:'Услуги', svcTitle:'Наши направления',
    svcDesc:'Единая методология — от анализа рисков до сопровождения «под ключ» в суде. Каждое направление работает самостоятельно и усиливает остальные.',
    apprKicker:'Подход и практика', apprTitle:'Все отделы — одна система',
    apprDesc:'Профильные отделы работают в одном контуре — от аналитики и полевых мероприятий до права и цифровой среды. Координация между ними обеспечивает правообладателям измеримый эффект наших программ защиты брендов.',
    casesKicker:'Кейсы', casesTitle:'Как мы решаем задачи клиентов',
    histKicker:'История компании',
    histTitle:'<span class="h2__line">Путь, отмеченный</span><span class="h2__line">международным признанием</span>',
    histHint:'От московского старта до международной практики',
    newsKicker:'Новости', newsTitle:'Компания в публичном пространстве',
    marquee:'Нам доверяют ведущие российские и международные бренды',
    svcPageTitle:'Услуги: защита бренда, ТРОИС, проверки контрагентов, бизнес-разведка — Власта-Консалтинг',
    svcPageDesc:'Восемь направлений в четырёх блоках: разведка и анализ, безопасность бизнеса, защита бренда и ИС, консалтинг. Регистрация в ТРОИС, рейды с полицией и таможней, комплаенс, сопровождение в суде.',
    svcPageKw:'защита интеллектуальной собственности, ТРОИС, бизнес-разведка, проверка контрагентов, комплаенс KYC AML, физическая безопасность, юридический консалтинг',
    svcH1:'Услуги по защите бренда и безопасности бизнеса',
    svcLead:'Единая методология: анализ рисков, предупреждение угроз и сопровождение клиента вплоть до защиты интересов в суде — в России, СНГ и странах ЕАЭС.',
    svcNav:'Блоки услуг',
    aboutTitle:'О компании Власта-Консалтинг — эксперты по защите брендов с 2006 года',
    aboutDesc:'История, команда и партнёрства «Власта-Консалтинг»: 20 лет на рынке, членство в WAD, INTA, ASIS, AEB и «Антиконтрафакт», защита интересов международных корпораций в России и ЕАЭС.',
    aboutKw:'Власта-Консалтинг о компании, WAD, INTA, ASIS, история компании, команда, ассоциации безопасности',
    aboutKicker:'О нас', aboutH1:`Эксперты по защите брендов и безопасности бизнеса с ${O.founded} года`,
    aboutLead:'Мы помогаем компаниям расти спокойно — анализируем риски, предвидим неблагоприятные сценарии и выстраиваем системы защиты, которые работают на опережение.',
    whoKicker:'Кто мы', whoTitle:'Надёжный партнёр в вопросах экономической безопасности',
    whoDesc:'Основанная в 2006 году, компания занимает лидирующее место в сфере обеспечения безопасности бизнеса и защиты интеллектуальной собственности в России.',
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
    contactsTitle:'Контакты — Власта-Консалтинг, Москва',
    contactsDesc:`Свяжитесь с «${O.name}»: ${O.address}. Телефон ${O.phone}, e-mail ${O.email}. Конфиденциальная консультация по защите бренда и безопасности бизнеса.`,
    contactsKw:'Власта-Консалтинг контакты, консультация по защите бренда, безопасность бизнеса Москва',
    contactsKick:'Свяжитесь с нами', contactsH1:'Обсудим безопасность вашего бизнеса',
    contactsLead:'Проведём конфиденциальную консультацию и предложим решение под вашу задачу.',
    mapTitle:'Офис «Власта-Консалтинг» на карте: Москва, ул. Усачёва, 13',
    privacyTitle:'Политика конфиденциальности — Власта-Консалтинг',
    privacyDesc:'Политика обработки персональных данных ООО «Власта-Консалтинг»: какие данные мы собираем, цели и правовые основания обработки, сроки хранения и ваши права.',
    privacyKick:'Правовая информация', privacyH1:'Политика конфиденциальности',
    privacyEdition:'Редакция от',
    geoMapLabel:'Карта: Россия, страны СНГ и ЕАЭС',
    videoTitle:'Видео к материалу',
  },
  en: {
    homeTitle:'Vlasta Consulting — brand protection and business security',
    homeDesc:`Since ${O.founded}, Vlasta Consulting has protected trademarks from counterfeiting and secured business operations across Russia, the CIS and the EAEU: customs registers, raids, counterparty screening and litigation support.`,
    homeKw:'brand protection, anti-counterfeiting, customs register, business security, counterparty screening, business intelligence, Vlasta Consulting',
    heroPill:`Since ${O.founded} · Moscow · Russia and the EAEU`,
    heroTitle:'Business security<br>in trusted hands',
    heroScroll:'Scroll to the introduction',
    intro:'We protect brands from counterfeiting and secure the operations of companies across Russia, the CIS and the EAEU — on advanced technology and high ethical standards.',
    svcKicker:'Services', svcTitle:'Our practice areas',
    svcDesc:'One methodology — from risk analysis through to representation in court. Each area stands on its own and reinforces the others.',
    apprKicker:'Approach and record', apprTitle:'All departments — one system',
    apprDesc:'Our departments work as a single loop — from analytics and field operations to legal and online work. Coordinating them delivers a measurable effect for rights holders across our brand protection programmes.',
    casesKicker:'Cases', casesTitle:'How we solve client problems',
    histKicker:'Company history',
    histTitle:'<span class="h2__line">A record marked by</span><span class="h2__line">international recognition</span>',
    histHint:'From a Moscow start to an international practice',
    newsKicker:'News', newsTitle:'The company in the public eye',
    marquee:'Trusted by leading Russian and international brands',
    svcPageTitle:'Services: brand protection, customs registers, screening, intelligence — Vlasta Consulting',
    svcPageDesc:'Eight directions across four areas: intelligence and analysis, business security, brand and IP protection, consulting. Customs register filings, raids with police and customs, compliance and litigation support.',
    svcPageKw:'intellectual property protection, customs register, business intelligence, counterparty screening, KYC AML compliance, physical security, legal consulting',
    svcH1:'Brand protection and business security services',
    svcLead:'One methodology: risk analysis, threat prevention and support all the way to representing your interests in court — across Russia, the CIS and the EAEU.',
    svcNav:'Service areas',
    aboutTitle:'About Vlasta Consulting — brand protection experts since 2006',
    aboutDesc:'History, team and partnerships of Vlasta Consulting: 20 years in the market, membership of WAD, INTA, ASIS, AEB and AntiCounterfeit, representing international corporations across Russia and the EAEU.',
    aboutKw:'Vlasta Consulting about, WAD, INTA, ASIS, company history, team, security associations',
    aboutKicker:'About us', aboutH1:`Brand protection and business security experts since ${O.founded}`,
    aboutLead:'We help companies grow without surprises — analysing risk, anticipating adverse scenarios and building protection that works ahead of the threat.',
    whoKicker:'Who we are', whoTitle:'A dependable partner in business security',
    whoDesc:'Founded in 2006, the company holds a leading position in business security and intellectual property protection in Russia.',
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
    contactsTitle:'Contact — Vlasta Consulting, Moscow',
    contactsDesc:`Get in touch with Vlasta Consulting: ${O.address}. Phone ${O.phone}, email ${O.email}. Confidential consultation on brand protection and business security.`,
    contactsKw:'Vlasta Consulting contact, brand protection consultation, business security Moscow',
    contactsKick:'Get in touch', contactsH1:'Let us discuss your business security',
    contactsLead:'We will hold a confidential consultation and propose a solution for your situation.',
    mapTitle:'Vlasta Consulting office on the map: Usacheva 13, Moscow',
    privacyTitle:'Privacy policy — Vlasta Consulting',
    privacyDesc:'Personal data processing policy of Vlasta Consulting LLC: what we collect, the purposes and legal basis for processing, retention periods and your rights.',
    privacyKick:'Legal', privacyH1:'Privacy policy',
    privacyEdition:'Revised',
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
  const R = p => rel(depth, p);
  const altRu = `${BASE}/${page}`;
  const altEn = `${BASE}/en/${page}`;
  const img = `${BASE}/${image || 'assets/img/og-default.jpg'}`;
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
<script>(function(){var r=document.documentElement;r.classList.add('js');try{var t=localStorage.getItem('vlasta-theme');if(!t)t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';r.setAttribute('data-theme',t)}catch(e){}})();</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,200..800;1,300..600&display=swap">
<link rel="stylesheet" href="${R('assets/css/style.css')}?v=${V.css}">
<link rel="icon" href="${R('assets/img/logo-dark.svg')}" type="image/svg+xml">
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

function chrome(active, depth = 0) {
  const R = p => rel(depth, p);
  /* the switch always points at the same page in the other language, resolved
     from this page's depth and from whichever locale tree we are in */
  const toRoot = '../'.repeat(depth + UP);
  const ruHref = toRoot + active;
  const enHref = toRoot + 'en/' + active;
  const links = NAV.map(([h, t]) =>
    `<a href="${R(h)}"${h === active ? ' class="is-on" aria-current="page"' : ''}>${t}</a>`).join('');
  const mnavItems = [...NAV, ['contacts.html', T.nav_contacts]];
  const mlinks = mnavItems.map(([h, t]) =>
    `<a class="mnav__l${h === active ? ' is-on' : ''}" href="${R(h)}"${h === active ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  const tt = `<button class="tt" type="button" aria-label="${T.themeLabel}" aria-pressed="false">${I.moon}${I.sun}</button>`;
  const lang = `<div class="lang"><a href="${ruHref}"${EN ? '' : ' class="is-on" aria-current="true"'} hreflang="ru">RU</a><a href="${enHref}"${EN ? ' class="is-on" aria-current="true"' : ''} hreflang="en">EN</a></div>`;
  /* Scrolled header: only the other locale — never both side by side. */
  const langAlt = EN
    ? `<div class="lang"><a href="${ruHref}" hreflang="ru">RU</a></div>`
    : `<div class="lang"><a href="${enHref}" hreflang="en">EN</a></div>`;
  /* Wordmark stacks without the hyphen so the mark can sit larger beside it. */
  const brandLines = EN ? ['VLASTA', 'CONSULTING'] : ['ВЛАСТА', 'КОНСАЛТИНГ'];
  const brand = (light, mod = '') => `<a class="brand${mod ? ` ${mod}` : ''}" href="${R('index.html')}" aria-label="${esc(O.name)} — на главную">
      <img class="brand__mark" src="${R(light ? 'assets/img/logo-light.svg' : 'assets/img/logo-dark.svg')}" alt="" width="48" height="56">
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
        <a href="${R('contacts.html')}" class="btn btn--glass">${T.contactBtn}</a>
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
        <div class="ft__ls">${site.services.map(s => `<a href="${R('services.html')}#${s.id}">${esc(t(s,'title'))}</a>`).join('')}</div>
        ${ftH(T.documents)}
        <div class="ft__ls"><a href="${R('privacy.html')}">${T.privacy}</a></div>
      </div>
      <div class="ft__col">
        ${ftH(T.nav_cases)}
        <div class="ft__ls">${ftCases.map(c => `<a href="${R(`cases/${c.slug}.html`)}">${esc(t(c,'title'))}</a>`).join('')}</div>
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
      <p id="ckD">${T.cookieText} <a href="${R('privacy.html')}">${T.cookieMore}</a></p>
    </div>
    <div class="cookie__btns">
      <button class="btn btn--ghostline" type="button" data-ck="reject">${T.ckReject}</button>
      <button class="btn btn--ghostline" type="button" data-ck="necessary">${T.ckNeeded}</button>
      <button class="btn btn--primary" type="button" data-ck="all">${T.ckAll}</button>
    </div>
  </div>
</div>
<button class="totop" type="button" aria-label="${T.toTop}">${I.up}</button>
<script src="${R('assets/js/main.js')}?v=${V.js}" defer></script>
</body>
</html>`,
  };
}

/* ------------------------------------------------------------ components */
const kick = t => `<span class="kick">${esc(t)}</span>`;

function shead({ k, h, d, extra, mod = 'split', tag = 'h2', richH = false }) {
  return `<div class="shead shead--${mod}${extra ? ' shead--cta' : ''} reveal">
      <div class="shead__t">${kick(k)}<${tag} class="h2">${richH ? h : esc(h)}</${tag}></div>
      ${d ? `<p class="shead__d lead">${esc(d)}</p>` : ''}
      ${extra ? `<div class="shead__x">${extra}</div>` : ''}
    </div>`;
}

const seeall = (href, label) =>
  `<a href="${href}" class="seeall"><span class="seeall__l">${label}</span><span class="seeall__r">${I.arrow}</span></a>`;

/* Contact close — fabric glyph field + title fade (see main.js). */
const ctaBand = (depth = 0) => `<section class="sec sec--cta">
  <canvas class="cta__field" aria-hidden="true"></canvas>
  <div class="cta__blur" aria-hidden="true"></div>
  <div class="wrap">
    <div class="cta" data-cta>
      <div class="cta__copy">
        <h2 class="cta__title">${esc(T.ctaKicker)}</h2>
        <p class="cta__sub">${esc(T.ctaTitle)}</p>
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
        <a class="cta__go" href="${rel(depth, 'contacts.html')}">${T.contactBtn} ${I.arrow}</a>
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

/* Idle layout: dense downward triangle of 6 pointy-top hexes (3–2–1).
   Classic open-V arms (Analytics/Legal ↔ IT/Coord → Ops tip) with Offline
   filling the crotch so the silhouette matches the 3–2–1 reference sketch.
   --x/--y → CSS translate; index → HEX_DOCK.
     Analytics (-2,0)  Offline (0,0)  IT (2,0)
          Legal (-1,1)      Coord (1,1)
                     Ops (0,2) */
const HEX_V = [
  { x: -2, y: 0 }, /* Analytics    — top-left       */
  { x: -1, y: 1 }, /* Legal        — mid-left       */
  { x:  0, y: 2 }, /* Operations   — tip            */
  { x:  1, y: 1 }, /* Coordination — mid-right      */
  { x:  2, y: 0 }, /* IT / Online  — top-right      */
  { x:  0, y: 0 }, /* Offline      — top-centre     */
];
/* Open layout: satellites dock on all 6 flat edges of a large pointy-top
   explanation hex. Unit vectors (--sx/--sy) are outward normals in CSS
   y-down space; --d stays on the flat apothem (no vertex docks). */
const HEX_DOCK = [
  { sx: -0.5, sy: -0.8660254, d: 'flat' }, /* NW — Analytics */
  { sx: -1,   sy:  0,         d: 'flat' }, /* W  — Legal */
  { sx: -0.5, sy:  0.8660254, d: 'flat' }, /* SW — Operations */
  { sx:  0.5, sy:  0.8660254, d: 'flat' }, /* SE — Coordination */
  { sx:  1,   sy:  0,         d: 'flat' }, /* E  — IT / Online */
  { sx:  0.5, sy: -0.8660254, d: 'flat' }, /* NE — Offline */
];

/* Pointy-top hex with gently rounded corners. Frost pane uses the same mask
   path + the KPI card glass recipe (white 10% + blur 20px). */
const HEX_D = 'M100.3 8 159.2 42Q173 50 173 66V134Q173 150 159.2 158L100.3 192Q86.5 200 72.7 192L13.8 158Q0 150 0 134V66Q0 50 13.8 42L72.7 8Q86.5 0 100.3 8Z';
const HEX_PLATE = `<span class="appr-hex__frost" aria-hidden="true"></span>
<svg class="appr-hex__plate" viewBox="0 0 173 200" aria-hidden="true" focusable="false">
  <path class="appr-hex__body" d="${HEX_D}" fill="none"/>
</svg>`;

const approachHex = () => {
  const label = EN ? 'Our practice areas' : 'Наши направления работы';
  const cells = site.departments.map((d, i) => {
    const idle = HEX_V[i] || { x: 0, y: 2 };
    const dock = HEX_DOCK[i] || HEX_DOCK[2];
    const dVar = dock.d === 'vert' ? 'var(--d-vert)' : 'var(--d-flat)';
    return `<button type="button" class="appr-hex__cell" data-i="${i}" style="--x:${idle.x};--y:${idle.y};--sx:${dock.sx};--sy:${dock.sy};--d:${dVar}" aria-expanded="false" aria-controls="apprHexPanel">
      <span class="appr-hex__shape">
        ${HEX_PLATE}
        <span class="appr-hex__in">
          <span class="ico appr-hex__ico">${I[d.icon] || I.search}</span>
          <span class="appr-hex__lb">${esc(t(d, 'short'))}</span>
        </span>
      </span>
    </button>`;
  }).join('');
  const panels = site.departments.map((d, i) =>
    `<article class="appr-hex__panel" data-i="${i}" hidden>
      <h3 class="h3">${esc(t(d, 'title'))}</h3>
      <p>${esc(t(d, 'text'))}</p>
    </article>`).join('');
  const kpis = site.results.map((r, i) => `<div class="res__c reveal"${i ? ` data-d="${i}"` : ''}>
        <div class="res__head">
          <span class="res__ico">${I[r.icon] || I.shield}</span>
          <div class="res__n" data-count="${esc(r.count)}"${r.decimals ? ` data-decimals="${r.decimals}"` : ''}>
            <span class="res__pre">${esc(r.prefix || '')}</span><span class="res__v">${esc(r.value)}</span><span class="res__u">${esc(t(r, 'unit') || '')}</span>
          </div>
        </div>
        <p class="res__l">${rich(t(r, 'label'))}</p>
      </div>`).join('');
  return `<div class="appr-hex reveal" id="apprHex" aria-label="${label}">
  <div class="appr-hex__shell">
  <div class="appr-hex__mesh" aria-hidden="true">
    <canvas class="appr-hex__field"></canvas>
    <div class="appr-hex__blur"></div>
  </div>
  <div class="appr-hex__copy">
    ${kick(C.apprKicker)}
    <h2 class="h2">${C.apprTitle}</h2>
    <p class="lead appr-hex__lead">${esc(C.apprDesc)}</p>
    ${C.apprDesc2 ? `<p class="lead appr-hex__lead">${esc(C.apprDesc2)}</p>` : ''}
  </div>
  <div class="appr-hex__stage">
    <div class="appr-hex__pop" id="apprHexPanel">
      <div class="appr-hex__hub">
        ${HEX_PLATE}
        <div class="appr-hex__hub-in">${panels}</div>
      </div>
    </div>
    <div class="appr-hex__grid">${cells}</div>
  </div>
  <div class="appr-hex__mob">${site.departments.map((d, i) =>
    `<details class="appr-hex__acc glass"${i ? ` data-d="${i}"` : ''}>
      <summary><span class="ico">${I[d.icon] || I.search}</span><span>${esc(t(d, 'title'))}</span></summary>
      <p>${esc(t(d, 'text'))}</p>
    </details>`).join('')}</div>
  <div class="appr-hex__kpi res">${kpis}</div>
  </div>
</div>`;
};

/* ------------------------------------------------------- company roadmap */
/* Horizontal story trail: gently rising left→right (oldest→newest).
   Marker --yh and the SVG path share arcYH(), so marks sit on the stroke.
   SVG y grows downward, so a falling y% reads as continuous upward progress.
   The path keeps going past the last mark (tail) so time feels ongoing. */
const ARC_H = { y0: 78, y1: 32 }; // y% of the rail; start low, end high on screen
const arcYH = f => {
  const t = Math.min(1, Math.max(0, f));
  return ARC_H.y0 + (ARC_H.y1 - ARC_H.y0) * t;
};
const arcPathH = (steps = 96) =>
  'M' + Array.from({ length: steps + 1 }, (_, i) => {
    const g = i / steps;
    return `${(g * 1000).toFixed(1)},${arcYH(g).toFixed(2)}`;
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
   ~0.45×tile ≈ 90–110px (~3cm) past the last year so tip/pulse stop early. */
const ROAD_AHEAD = 0.45;

const roadmap = () => {
  /* Story reads left→right: founding to present. Source JSON is newest-first.
     Marks + SVG path share arcYH() over the full track (list + ahead). A
     trailing ahead span lets the stroke + tip continue past the newest year. */
  const items = [...site.timeline].reverse();
  const n = items.length;
  const d = arcPathH();
  const gid = 'roadGrad';
  /* Mark centers sit at (i+.5) tile units; path spans n + ROAD_AHEAD tiles. */
  const track = n + ROAD_AHEAD;
  return `<div class="road" style="--yh0:${ARC_H.y0};--yh1:${ARC_H.y1};--ahead:${ROAD_AHEAD}">
      <div class="road__body" tabindex="0" role="region" aria-label="${esc(C.histTitle.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())}">
        <div class="road__htrack">
          <svg class="road__arcH" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="${gid}" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#8A90B8"/>
                <stop offset="55%" stop-color="#535D86"/>
                <stop offset="100%" stop-color="#141428"/>
              </linearGradient>
            </defs>
            <path class="road__arcGlow" d="${d}"/>
            <path class="road__arcBase" d="${d}"/>
            <path class="road__arcDone" d="${d}"/>
            <circle class="road__arcTip" cx="0" cy="${ARC_H.y0}" r="3.2"/>
          </svg>
          <ol class="road__list" style="--n:${n}">
            ${items.map((x, i) => {
              const k = Math.round((n - 1 - i) * (TONES_L.length - 1) / Math.max(1, n - 1));
              const tone = TONES_L[k], toneD = TONES_D[k];
              const mid = (i + .5) / track;
              return `<li class="road__i${x.highlight ? ' road__i--hi' : ''} reveal reveal--fade"
                style="--yh:${arcYH(mid).toFixed(2)};--tone:${tone};--fg:${glyphOn(tone)};--tone-d:${toneD};--fg-d:${glyphOn(toneD)}">
              <span class="road__peg">
                <b class="road__yr">${esc(x.year)}</b>
                <span class="road__mark" aria-hidden="true">${
                  x.mark === 'logo'
                    ? `<img class="road__logo" src="${rel(0, 'assets/img/logo-mark.svg')}" alt="" decoding="async">`
                    : (I[x.icon] || I.check)
                }</span>
              </span>
              <div class="road__c"><h3>${esc(tt(x,'title'))}</h3><p>${esc(tt(x,'text'))}</p></div>
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
      <span class="assoc__logo"><img src="${rel(0, a.logo)}" alt="${dup ? '' : esc(a.abbr)}" decoding="async"${a.logoScale ? ` style="--logo-scale:${a.logoScale}"` : ''}></span>
      <span class="assoc__n">${esc(t(a, 'name'))}</span>
      <span class="assoc__meta">${esc(t(a, 'meta'))}</span>
    </button>`),
  'belt--assoc', C.assocTitle);

const lettersMarquee = () => belt(
  site.letters.map(l => dup =>
    `<button class="belt__i letter" type="button" data-letter${dup ? ' tabindex="-1"' : ''}>
      <span class="letter__th"><img src="${rel(0, l.img)}" alt="${dup ? '' : C.letterAlt + ' — ' + esc(l.name)}" decoding="async"></span>
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
      return { logo: a.logo, name: t(a,'name'), year: p.year, meta: p.meta, metaLabel: p.metaLabel, desc: t(a,'desc'), url: a.url, site: a.site };
    }))}</script>`;

const newsCard = (n, depth = 0, d = 0, { eager = false } = {}) => `<a class="card ncard reveal" href="${rel(depth, `news/${n.slug}.html`)}"${d ? ` data-d="${d}"` : ''}>
        ${n.img ? `<div class="ncard__img"><img src="${rel(depth, n.img)}" alt="${esc(n.title)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"></div>` : ''}
        <div class="ncard__b">
          <div class="ncard__meta"><time datetime="${n.dateIso}">${esc(n.dateDisp)}</time><span class="dot"></span><span class="cl">${esc(n.cluster)}</span></div>
          <h3>${esc(n.title)}</h3>
          <span class="ncard__more arrow-link">${T.readOn} ${I.arrow}</span>
        </div>
      </a>`;

const caseCard = (c, depth = 0, d = 0) => `<a class="card case reveal" href="${rel(depth, `cases/${c.slug}.html`)}"${d ? ` data-d="${d}"` : ''}>
        ${c.img ? `<div class="case__img"><img src="${rel(depth, c.img)}" alt="${esc(c.title)}" loading="lazy" decoding="async"></div>` : ''}
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
  <img src="${rel(0, 'assets/img/hero-tower.jpg')}" alt="" fetchpriority="high" decoding="async">
</div>

<div class="glasszone">
<section class="hero">
  <div class="wrap hero__inner">
    <h1 class="hero__t rise">${C.heroTitle}</h1>
    <a class="scrollcue rise" data-d="2" href="#intro" aria-label="${C.heroScroll}">
      <span class="scrollcue__l"></span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
    </a>
  </div>
</section>

<section class="sec" id="intro">
  <div class="wrap">
    <p class="intro reveal">${C.intro}</p>
    <div class="stats reveal reveal--fade" data-d="1">
      <img class="stats__mark" src="${rel(0, 'assets/img/logo-dark.svg')}" alt="" aria-hidden="true" decoding="async">
      ${site.stats.map(s => {
        const suffix = t(s, 'suffix');
        const unit = t(s, 'unit');
        const countAttr = s.count != null
          ? ` data-count="${esc(String(s.count))}"${s.decimals ? ` data-decimals="${s.decimals}"` : ''}`
          : '';
        const appear = s.appear ? ' stat--appear' : '';
        return `<div class="stat${appear}">
        <div class="stat__n"${countAttr}><span class="stat__v">${esc(s.n)}</span>${suffix ? `<span class="u">${esc(suffix)}</span>` : ''}${unit ? `<span class="u">${esc(unit)}</span>` : ''}</div>
        <div class="stat__l">${esc(t(s, 'label'))}</div>
      </div>`;
      }).join('')}
    </div>
  </div>
</section>

<section class="sec" id="services">
  <div class="wrap">
    ${shead({
      k: C.svcKicker, h: C.svcTitle,
      d: C.svcDesc,
      extra: seeall('services.html', T.allServices),
    })}
    <div class="svc-grid" role="list" aria-label="${esc(C.svcTitle)}">
      ${site.services.map((s, i) => `<article class="card glass svc reveal"${i ? ` data-d="${i}"` : ''} role="listitem">
        <span class="svc__n" aria-hidden="true">${esc(s.num)}</span>
        <div class="svc__main">
          <div class="svc__top">
            <span class="ico">${I[s.icon]}</span>
            <div class="svc__head">
              <h3 class="h3">${svcHomeTitle(s)}</h3>
            </div>
          </div>
          <p class="svc__tag">${esc(plain(t(s,'tagline')))}</p>
          <a class="svc__more arrow-link" href="services.html#${s.id}"><span class="svc__more-l">${T.more}</span> ${I.arrow}</a>
        </div>
        <ul class="svc__hl">${(t(s,'highlights') || []).map(h =>
          `<li><a href="${hlHref(s.id, h)}">${rich(hlText(h))}</a></li>`).join('')}</ul>
      </article>`).join('')}
    </div>
  </div>
</section>
</div><!-- /glasszone -->

${marquee()}

<div class="glasszone">
<section class="sec" id="approach">
  <div class="wrap">
    ${approachHex()}
  </div>
</section>
</div><!-- /glasszone -->

<section class="sec" id="cases">
  <div class="wrap">
    ${shead({
      k: C.casesKicker, h: C.casesTitle,
      extra: seeall('cases.html', T.allCases),
    })}
    <div class="case-rail" tabindex="0" role="group" aria-label="${C.casesTitle}">${railCases.map(x => caseCard(x, 0, 0)).join('')}</div>
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
    <div class="news-rail" tabindex="0" role="group" aria-label="${esc(C.newsTitle)}">${
      news.map((n, i) => newsCard(n, 0, 0, { eager: i < 3 })).join('')
    }</div>
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
   grid. Direction cards and process strips fold shut so the page is not a wall
   of offerings on arrival — the plus marks that each block opens. */
const dirCard = (x, i, svcId) => `<details class="fold" id="${svcId}-${x.icon}"${i === 0 ? ' open' : ''}>
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

const flowBlock = (f) => `<details class="fold fold--flow">
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

function buildServices() {
  const c = chrome('services.html', 0);
  const html = j(
    head({
      title: C.svcPageTitle,
      desc: C.svcPageDesc,
      keywords: C.svcPageKw,
      canonical: EN ? `${BASE}/en/services.html` : `${BASE}/services.html`, page: 'services.html',
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
    <nav class="crumbs" aria-label="${T.crumbs}"><a href="index.html">${T.home}</a> / <span>Услуги</span></nav>
    ${kick(C.svcKicker)}
    <h1 class="h1">${C.svcH1}</h1>
    <p class="lead">${C.svcLead}</p>
  </div>
</section>

<section class="sec sec--tight sec--alt">
  <div class="wrap">
    <nav class="chips" aria-label="${C.svcNav}">
      ${site.services.map(s => `<a class="chip" href="#${s.id}"><b>${esc(s.num)}</b>${esc(t(s,'title'))}</a>`).join('')}
    </nav>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    ${site.services.map(s => `<article class="svc-detail reveal" id="${s.id}">
      <div class="svc-detail__head">
        <span class="svc-detail__num">${esc(s.num)}</span>
        <h2 class="h2">${esc(t(s,'title'))}</h2>
      </div>
      <figure class="svc-detail__hero">
        <div class="ncard__img">
          <img src="${rel(0, s.img)}" alt="" loading="lazy" decoding="async">
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
      jsonld: [orgLd, crumbLd([['Главная', ''], ['О компании', 'about.html']])],
    }),
    c.header,
    `<main>
<section class="phero">
  ${engrave('tr', 'ph')}
  <div class="wrap">
    <nav class="crumbs" aria-label="${T.crumbs}"><a href="index.html">${T.home}</a> / <span>О компании</span></nav>
    ${kick(C.aboutKicker)}
    <h1 class="h1">${C.aboutH1}</h1>
    <p class="lead">${C.aboutLead}</p>
  </div>
</section>

<section class="sec" id="team">
  <div class="wrap">
    ${shead({ k: C.teamKicker, h: C.teamTitle, mod: 'center' })}
    <div class="team">
      ${site.team.map((m, i) => `<figure class="person reveal"${i ? ` data-d="${i}"` : ''}>
        <div class="person__ph"><img src="${rel(0, m.img)}" alt="${esc(tt(m,'name'))} — ${esc(tt(m,'role'))}" decoding="async"></div>
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

<section class="sec">
  <div class="wrap">
    ${shead({ k: C.whoKicker, h: C.whoTitle, d: C.whoDesc })}
    <div class="values reveal">
      ${site.values.map(v => `<div class="value"><span class="value__n">${esc(v.num)}</span><h3>${esc(t(v,'title'))}</h3><p>${esc(t(v,'text'))}</p></div>`).join('')}
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
    const cc = chrome('cases.html', 1);
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
  <div class="wrap wrap--narrow">
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
    ${kick(C.newsKick)}
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
    const cc = chrome('news.html', 1);
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
  <div class="wrap wrap--narrow">
    <nav class="crumbs" aria-label="${T.crumbs}"><a href="../index.html">${T.home}</a> / <a href="../news.html">${NAV[4][1]}</a> / <span><time datetime="${n.dateIso}">${esc(n.dateDisp)}</time></span></nav>
    <div class="article__meta"><span class="cl">${esc(n.cluster)}</span></div>
    <h1 class="h1 rise" style="margin-top:14px">${esc(n.h1)}</h1>
  </div>
</section>

<section class="sec">
  <div class="wrap wrap--narrow">
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
    ${kick(C.contactsKick)}
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
        <div class="ci__i"><span class="ci__ico">${I.clock}</span><div><h4>${T.hours}</h4><p>${T.weekdays}<br>9:30 – 18:00</p></div></div>
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
function buildPrivacy() {
  const c = chrome('contacts.html', 0);
  const S = EN ? [
    ['General', [`This Policy sets out how ${O.legal} (the Company) processes personal data and the measures taken to keep it secure.`, 'By using the site and contacting us by phone or email, you accept the terms of this Policy.']],
    ['What we process', ['Your name, company, phone number, email address and the content of your enquiry — only as far as you provide it yourself.', 'Technical data: IP address, browser and device type, referral source and on-site activity, in anonymised form, for statistics.']],
    ['Purposes', ['Responding to your enquiry and providing a consultation.', 'Improving the site and the quality of our services.', 'Meeting the requirements of the law of the Russian Federation.']],
    ['Legal basis', ['Processing is carried out on the basis of your consent and in accordance with Federal Law No. 152-FZ of 27 July 2006 “On Personal Data”.']],
    ['Disclosure to third parties', ['The Company does not sell or pass personal data to third parties, except where the law expressly requires it or where it is necessary to act on your enquiry.']],
    ['Retention', ['Personal data is kept no longer than the purposes of processing require, or until you withdraw your consent.']],
    ['Cookies', ['The site uses cookies so the interface works correctly and to collect anonymised statistics. You can disable cookies in your browser settings.']],
    ['Your rights', ['You may request information about the processing of your data, ask for it to be corrected, blocked or deleted, and withdraw your consent to processing.', `To exercise these rights, write to ${O.email}.`]],
    ['Contact', [`${O.legal}, ${O.address}. Phone: ${O.phone}. Email: ${O.email}.`]],
  ] : [

    ['Общие положения', [`Настоящая Политика определяет порядок обработки персональных данных ${O.legal} (далее — Компания) и меры по обеспечению их безопасности.`, 'Используя сайт и обращаясь к нам по телефону или электронной почте, вы соглашаетесь с условиями настоящей Политики.']],
    ['Какие данные мы обрабатываем', ['Имя, название компании, телефон, адрес электронной почты и содержание обращения — в объёме, который вы сообщаете нам сами.', 'Технические данные: IP-адрес, тип браузера и устройства, источник перехода, действия на сайте — в обезличенном виде для статистики.']],
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
      title: C.privacyTitle,
      desc: C.privacyDesc,
      canonical: EN ? `${BASE}/en/privacy.html` : `${BASE}/privacy.html`, page: 'privacy.html',
      robots: 'index,follow',
      jsonld: [orgLd, crumbLd([['Главная', ''], ['Политика конфиденциальности', 'privacy.html']])],
    }),
    c.header,
    `<main>
<section class="phero">
  ${engrave('tr', 'ph')}
  <div class="wrap">
    <nav class="crumbs" aria-label="${T.crumbs}"><a href="index.html">${T.home}</a> / <span>Политика конфиденциальности</span></nav>
    ${kick(C.privacyKick)}
    <h1 class="h1">${C.privacyH1}</h1>
  </div>
</section>
<section class="sec">
  <div class="wrap wrap--narrow">
    <div class="prose">
      ${S.map((s, i) => `<h2><span class="step">${String(i + 1).padStart(2, '0')}</span>${esc(s[0])}</h2>
      ${s[1].map(p => `<p>${esc(p)}</p>`).join('')}`).join('')}
      <p class="muted" style="margin-top:34px;padding-top:20px;border-top:1px solid var(--line);font-size:14px">${C.privacyEdition} ${BUILT}.</p>
    </div>
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
