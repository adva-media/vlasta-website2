VLASTA WEBSITE2 — DEPLOY NOTES
================================

WHAT THIS IS
  A bilingual (RU root + /en/) static build of the Vlasta Consulting site,
  based on the boss's design with: original SVG brand logos, active-tab
  navigation states (desktop + mobile), day/night theme toggle, working
  RU/EN language switch, Russia + CIS geography map, and SEO-reworked
  news/case content with full meta tags, Open Graph, JSON-LD and sitemap.

HOW TO DEPLOY TO adva.media/vlasta/website2 (Hostinger via GitHub)
  1. Copy the CONTENTS of this folder into the repo path that maps to
     /vlasta/website2/ (e.g. public_html/vlasta/website2/).
  2. Commit + push. Hostinger's Git deployment will publish it.
  3. Open https://adva.media/vlasta/website2/index.html

IMPORTANT — CANONICAL URLS
  All <link rel="canonical">, hreflang, Open Graph URLs and sitemap.xml
  point to https://vlasta-s.com/ (the future production domain), NOT to
  adva.media. This is deliberate: the staging copy on adva.media will not
  compete with (or be indexed instead of) the production site. When you
  later move the site to vlasta-s.com, nothing needs to change.
  If you want the staging copy fully hidden from Google, additionally add
  an X-Robots-Tag: noindex header for the /vlasta/ path on adva.media.

SWAPPING IN THE ORIGINAL MAP
  The geography map is a stylized inline SVG recreation (the original
  russia-map.svg could not be pulled from the live site). A standalone
  copy sits at assets/img/russia-map.svg. If you have the original file,
  you can either (a) replace the inline SVG in index/about pages, or
  (b) just keep the inline version — it is legend-compatible
  ("Регионы работы" / "Соседние регионы") with the current live site.

THEME & LANGUAGE
  - Theme choice is saved in localStorage (key: vlasta-theme) and follows
    the OS dark-mode preference until the user picks manually.
  - RU/EN switch links always land on the same page in the other language.

CONTACT FORM
  The form is front-end only (same as the boss's version). Wire it to a
  backend/email service before production, or keep server.js as a base.
