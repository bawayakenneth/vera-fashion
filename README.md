# Verra — fashion store website prototype

A complete, working storefront prototype: collection with filters and sorting, product quick-view
(color, size, quantity), a persistent shopping bag with free-shipping progress, lookbook, about page,
contact form with validation, newsletter signup, and a responsive, keyboard-accessible layout.

It has **zero runtime dependencies** — plain HTML, CSS and ES modules served by a tiny Node script —
so there is nothing to compile and nothing that breaks when a package updates.

## Run it locally

Requires [Node.js](https://nodejs.org) 18 or newer (`node --version` to check).

```bash
cd verra-store
npm install      # optional: there are no packages to download
npm start        # serves the site
```

Open **http://localhost:3000**. To use another port:

```bash
PORT=8080 npm start            # macOS / Linux
$env:PORT=8080; npm start      # Windows PowerShell
```

## Run the tests

```bash
npm test                 # 17 unit/integration tests (cart logic, data integrity, server)
python3 tests/e2e.py     # optional: 45 real-browser checks (needs: pip install playwright && playwright install chromium)
```

## Customize for a client

| To change | Edit |
|---|---|
| Brand name, tagline, hero text, about copy, lookbook, shipping rules, currency, contact details, **theme colors** | `public/js/config.js` |
| Products, prices, sizes, colors, descriptions, tags, image paths | `public/js/products.js` |
| Images | drop files in `public/images/` and update the paths (JPG, PNG, WebP and SVG all work; portrait 4:5 suits products) |
| Fonts, spacing, layout | `public/css/styles.css` (fonts load from Google Fonts in `public/index.html`) |

Rebranding checklist:
1. Edit `config.js` (name, colors, contact, copy).
2. Replace the catalog in `products.js` and add real photos to `public/images/`.
3. Regenerate placeholders any time with `npm run images` (only needed while you have no photography).
4. Update the favicon line in `index.html`.

Categories and filter buttons are generated from the products' `category` field — add a product with a
new category and a new filter appears automatically.

## Taking it live

- **Hosting:** the `public/` folder is a static site. Upload it as-is to Netlify, Vercel, Cloudflare Pages
  or GitHub Pages (publish directory: `public`).
- **Contact form:** set `contact.formEndpoint` in `config.js` to a form-backend URL (e.g. Formspree).
  While it is empty, the form validates and confirms but sends nothing (demo mode).
- **Checkout:** the "Check out" button is intentionally a stub. Connect Stripe Checkout, Shopify Buy Button
  or the client's payment provider by replacing the handler in `initCart()` in `public/js/app.js`.
- **Newsletter:** the form is demo-only; wire it to Mailchimp/Klaviyo/etc. in `initNewsletter()`.

## Project layout

```
verra-store/
├─ package.json
├─ server.js                      static server (no dependencies)
├─ scripts/generate-placeholders.mjs
├─ public/
│  ├─ index.html                  page structure
│  ├─ css/styles.css
│  ├─ js/config.js                brand, copy, colors, shipping, contact
│  ├─ js/products.js              catalog
│  ├─ js/cart.js                  cart logic (pure, unit-tested)
│  ├─ js/app.js                   rendering and interactions
│  └─ images/                     placeholder SVGs
└─ tests/                         unit tests + browser e2e
```


## Portfolio demonstration notes

Verra is a fictional fashion concept. Product names, prices, address, email and phone details are placeholders for demonstration only. Replace them before using the project for a real business.

Product and editorial photography currently loads from Unsplash image URLs, so the browser needs an internet connection to display those photos. The existing local SVG illustrations are only a fallback if an image cannot load. Review each image URL and its usage terms before publishing commercially.

Prices are sample values in Ugandan shillings (UGX). Checkout is deliberately non-transactional; no payment information is collected.
