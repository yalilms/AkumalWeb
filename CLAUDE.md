# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static marketing website for **Akumal Sport Nutrition** — a B2B sports supplement manufacturer based in Spain. No build system or package manager; all files are served directly.

## Pages

| File | Purpose |
|---|---|
| [index.html](index.html) | Home page |
| [nosotros.html](nosotros.html) | About us |
| [contacto.html](contacto.html) | Contact / online quote form |
| [login.html](login.html) | Login page |

## CSS Architecture

Each page loads four stylesheets in cascade order:

```
css/base.css        ← CSS variables, resets, typography
css/components.css  ← header, footer, buttons, cards, shared UI
css/sections.css    ← page-section overrides (hero, etc.)
css/akumal.css      ← brand overrides — loads last, highest priority
css/pages/*.css     ← page-specific sheet (nosotros, contacto, login)
```

**Cache busting:** All four sheets use `?v=N` query strings. **Increment the version** on any sheet you modify. `akumal.css` is the most frequently changed; its current version is the reference. Page-specific sheets live at `css/pages/nosotros.css`, `css/pages/contacto.css`, `css/pages/login.css`.

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
- Surface/background: `#f0f3f5`
- Logo files: `assets/images/akumal/logoAkumalBlanco.png` (white), `logoAkumalVerde.png` (green), `LOGO TORTUGA.png` (favicon)

## JS Architecture

[js/main.js](js/main.js) bootstraps all page-wide utilities on DOM ready: scroll-to-top button, infinite text slider, live clock, scroll counters, color theme switcher (localStorage), mobile menu open/close, and language selector UI.

[js/gsap-animations.js](js/gsap-animations.js) runs GSAP animations: scroll-driven text color reveal (`.text-color-change`), card flip sequences (`.gsap-anime-2`), and other ScrollTrigger effects.

[js/hero-bottle.js](js/hero-bottle.js) renders an interactive 3D supplement bottle on `<canvas id="hero-bottle-canvas">` using Three.js. Requires Three.js loaded from CDN before this script. The bottle texture is `assets/images/akumal/bote.png`.

[js/scrollsmoother.js](js/scrollsmoother.js) is a standalone smooth-scroll polyfill (not GSAP ScrollSmoother).

[js/vendor/](js/vendor/) contains locally-served vendor scripts: `infinityslide.js` (infinite ticker) and `splittext.min.js` (GSAP text splitting).

**Counter requirement:** `<body class="counter-scroll">` must be present for `.wg-counter` + `.odometer` elements to animate on scroll.

## External Dependencies (CDN)

All libraries are loaded from CDN — no local node_modules. Key ones:

- **Bootstrap 5.3.3** — grid and utilities
- **GSAP 3.12.5** — ScrollTrigger, ScrollToPlugin (loaded before `gsap-animations.js`)
- **Three.js** — required by `hero-bottle.js` (only on pages with the 3D bottle canvas)
- **Swiper 11** — carousels, configured via `data-*` attributes on `.tf-swiper` elements (see [js/carousel.js](js/carousel.js))
- **jQuery** — required by [js/main.js](js/main.js) and [js/carousel.js](js/carousel.js)
- **Odometer.js** — animated counters triggered on scroll (`.wg-counter` + `.odometer` elements)
- **Slick** — secondary carousel plugin
- **Icomoon** — icon font loaded from `wpriverthemes.com` (external host)

## Shared Header/Footer — Use the Tools

The header, footer, and offcanvas mobile menu are duplicated across all HTML files. Instead of editing each file manually, use the scripts in [tools/](tools/):

```bash
# From project root:
python3 tools/update_header.py        # updates logo + contact info in header
python3 tools/update_footer_menu.py   # updates footer block + offcanvas menu
perl tools/replace_menu.pl index.html # updates nav menus in one file
```

`replace_menu.pl` replaces three menu lists simultaneously: `.nav-menu-main` (desktop), `.mb-menu-list` (mobile offcanvas), and `.footer-menu-list`. Run it per-file.

`update_header.py` and `update_footer_menu.py` operate on `index.html`, `nosotros.html`, and `contacto.html` only — **`login.html` is excluded** from both scripts.

When adding a new page, copy the header/footer from an existing page and run the tools to keep them in sync.

## Navigation Items

```
01 / INICIO          → index.html
02 / SOBRE NOSOTROS  → nosotros.html
03 / COTIZA ONLINE   → contacto.html
04 / ÚNETE AL EQUIPO → # (placeholder)
```
