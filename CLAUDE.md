# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static marketing website for **Akumal Sport Nutrition** — a B2B sports supplement manufacturer based in Spain. Pure HTML/CSS/JS served directly; no build system.

Backend (out of repo) is **Odoo CRM**: contact-form leads, job postings, and user login all hit Odoo via the proxy in [api/](api/).

## Pages

EN pages live at the root and in [pages/](pages/), ES mirror under [es/](es/). Blog posts under [blog/](blog/) (EN) and [es/blog/](es/blog/) (ES). Legal pages: privacy/cookies/legal-notice in both languages.

## CSS Architecture

Each page loads this cascade (last wins):

```
css/base.css        ← variables, resets, typography
css/components.css  ← header, footer, buttons, cards
css/sections.css    ← page-section overrides (hero, etc.)
css/akumal.css      ← brand overrides
css/pages/*.css     ← page-specific
```

**Cache busting:** All sheets use `?v=N`. **Increment the version on any sheet you modify.**

## CSS Color Variables — Inverted Naming

The CSS variables use **semantically inverted names** (inherited from a dark-theme template, adapted to a light theme):

```css
--white: #212529   /* actually dark/near-black — used for text */
--black: #ffffff   /* actually white — used for backgrounds */
--primary: #607561 /* sage green — Akumal brand color */
```

Do not rename these variables; the entire stylesheet depends on this convention.

The color switcher writes `data-color-primary="color-primary-{1|2|3}"` on `<body>` to swap `--primary`. This persists via `localStorage` key `selectedColorIndex`.

## Brand Colors

- Primary: `#607561` (sage green dark)
- Secondary: `#A2B3A3` (sage green light)
- Surface/background: `#f0f3f5` / `#f5f4f0` (light theme)
- Logo files (all under `assets/images/akumal/logos/`):
  - `logoAkumalBlanco.png` (white)
  - `logoAkumalVerde.png` (green)
  - `logo-tortuga.png` (favicon)
  - `logo-akumal-nutrition-10.png` (header word-mark, default)
  - `logo-akumal-nutrition-08.png` (header word-mark on sticky scroll)

## JS Architecture

- [js/main.js](js/main.js) — page-wide utilities: scroll-top, infinite slider, clock, counters, color theme switcher, mobile menu, language selector. Also swaps the header logo to `logo-akumal-nutrition-08.png` on sticky scroll (regex match).
- [js/gsap-animations.js](js/gsap-animations.js) — GSAP ScrollTrigger animations (`.text-color-change`, `.gsap-anime-2`, etc.).
- [js/carousel.js](js/carousel.js) — Swiper + Slick carousels (`.tf-swiper`, `.slick-for`, `.slick-nav`).
- [js/scrollsmoother.js](js/scrollsmoother.js) — standalone smooth-scroll polyfill.
- [js/configurador.js](js/configurador.js) — Three.js packaging configurator on `pages/online-quote.html` and `es/configurador.html`. POSTs to API for leads.
- [js/config.js](js/config.js) — defines `window.AKUMAL_CONFIG.API_URL` for the Odoo proxy. Change URL for production.
- [js/odoo-jobs.js](js/odoo-jobs.js) — fetches published jobs from Odoo Recruitment. Currently dormant (`OdooJobs.init()` commented at file end). Activate when Odoo is wired.
- [js/vendor/](js/vendor/) — locally-served `infinityslide.js` and `splittext.min.js`.

**Counter requirement:** `<body class="counter-scroll">` must be present for `.wg-counter` + `.odometer` elements to animate on scroll.

## Backend Proxy — [api/](api/)

Express server on `localhost:3001` that forwards contact-form submissions to **Odoo CRM** as leads (`/api/lead` endpoint).

```bash
cd api && npm install
cp .env.example .env   # set ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY
npm start
```

Forms fail gracefully (alert with email fallback) if the proxy is down.

## External Dependencies (CDN)

- **Bootstrap 5.3.3** — grid and utilities
- **GSAP 3.12.5** — ScrollTrigger + ScrollToPlugin
- **Three.js 0.160** — required by [js/configurador.js](js/configurador.js) (only on configurador/online-quote)
- **Swiper 11** — carousels via `data-*` attributes on `.tf-swiper`
- **Slick 1.8.1** — only loaded on `index.html` and `es/index.html` (the only pages using `.slick-for` / `.slick-nav`)
- **jQuery 3.7.1** — required by `main.js` and `carousel.js`
- **jQuery nice-select** — styled `<select>` for forms
- **Odometer.js** — animated counters

## Shared Header/Footer — Use the Tools

The header, footer, and offcanvas mobile menu are duplicated across HTML files. Use scripts in [tools/](tools/) to keep them in sync:

```bash
python3 tools/update_header.py        # updates logo + contact info
python3 tools/update_footer_menu.py   # updates footer block + offcanvas menu
perl tools/replace_menu.pl <file>     # updates nav menus in one file
```

`replace_menu.pl` replaces three menu lists simultaneously: `.nav-menu-main` (desktop), `.mb-menu-list` (mobile offcanvas), and `.footer-menu-list`. Run it per-file.

## Navigation Items

```
01 / INICIO          → index.html / es/index.html
02 / SOBRE NOSOTROS  → pages/about-us.html / es/nosotros.html
03 / COTIZA ONLINE   → pages/contact.html / es/contacto.html
04 / ÚNETE AL EQUIPO → pages/join-the-team.html / es/equipo.html
```
