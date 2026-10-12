import { SITE } from './config.js';
import { PRODUCTS } from './products.js';
import { Cart, formatMoney, shippingFor, MAX_QTY } from './cart.js';

/* ---------- helpers ---------- */
document.addEventListener('error', (event) => {
  const img = event.target;
  if (img instanceof HTMLImageElement && img.src.includes('images.unsplash.com') && !img.dataset.fallbackTried) {
    img.dataset.fallbackTried = 'true';
    img.src = 'images/hero.svg';
  }
}, true);

const $ = (id) => document.getElementById(id);
const money = (n) => formatMoney(n, SITE.currency);
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const byId = new Map(PRODUCTS.map((p) => [p.id, p]));

let storage = null;
try { storage = window.localStorage; } catch { /* storage blocked: cart is session-only */ }
const cart = new Cart(PRODUCTS, storage, `${slug(SITE.brand.name)}-cart-v1`);

/* ---------- theme + static content ---------- */
function applyTheme() {
  for (const [name, value] of Object.entries(SITE.theme)) {
    document.documentElement.style.setProperty(`--${name}`, value);
  }
}

function renderStatic() {
  document.title = `${SITE.brand.name} — ${SITE.brand.tagline}`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', SITE.brand.tagline);
  document.querySelectorAll('[data-bind]').forEach((el) => {
    el.textContent = getPath(SITE, el.dataset.bind) ?? '';
  });

  const { freeThreshold, returnsDays } = SITE.shipping;
  $('announce').textContent = freeThreshold === 0
    ? `Free shipping on every order. Returns within ${returnsDays} days.`
    : `Free shipping over ${money(freeThreshold)}. Returns within ${returnsDays} days.`;

  $('hero-headline').textContent = SITE.hero.headline;
  $('hero-sub').textContent = SITE.hero.subline;
  $('hero-cta').textContent = SITE.hero.cta;
  $('hero-img').src = SITE.hero.image;
  $('hero-img').alt = SITE.hero.imageAlt;

  $('lookbook-grid').innerHTML = SITE.lookbook.map((l) => `
    <figure class="look">
      <img src="${esc(l.image)}" alt="${esc(l.alt)}" loading="lazy" width="800" height="1000">
      <figcaption>${esc(l.caption)}</figcaption>
    </figure>`).join('');

  $('about-title').textContent = SITE.about.title;
  $('about-copy').innerHTML = SITE.about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('');
  $('about-facts').innerHTML = SITE.about.facts.map((f) =>
    `<div><dt>${esc(f.value)}</dt><dd>${esc(f.label)}</dd></div>`).join('');

  const c = SITE.contact;
  const tel = c.phone.replace(/[^\d+]/g, '');
  $('contact-details').innerHTML = `
    <p>${esc(c.address)}<br>${esc(c.hours)}</p>
    <p><a href="mailto:${esc(c.email)}">${esc(c.email)}</a><br>
       <a href="tel:${esc(tel)}">${esc(c.phone)}</a></p>
    <p><a href="${esc(c.instagram.url)}" target="_blank" rel="noopener noreferrer">${esc(c.instagram.label)}</a></p>`;

  $('footer-note').textContent = SITE.footer.note;
  $('year').textContent = new Date().getFullYear();
}

/* ---------- shop: filters, sort, grid ---------- */
const view = { category: 'All', sort: 'featured' };
const categories = ['All', ...new Set(PRODUCTS.map((p) => p.category))];

function renderFilters() {
  $('filters').innerHTML = categories.map((c) =>
    `<button type="button" class="chip" data-category="${esc(c)}" aria-pressed="${c === view.category}">${esc(c)}</button>`).join('');
}

function visibleProducts() {
  const list = PRODUCTS.filter((p) => view.category === 'All' || p.category === view.category);
  const sorters = {
    featured: null,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
  };
  const fn = sorters[view.sort];
  return fn ? [...list].sort(fn) : list;
}

function cardHTML(p) {
  const colorNames = p.colors.map((c) => c.name).join(', ');
  return `
  <article class="card">
    <button type="button" class="card-media" data-open="${esc(p.id)}" aria-label="View ${esc(p.name)}, ${money(p.price)}">
      <img class="img-main" src="${esc(p.images[0])}" alt="" loading="lazy" width="800" height="1000">
      ${p.images[1] ? `<img class="img-alt" src="${esc(p.images[1])}" alt="" loading="lazy" width="800" height="1000">` : ''}
      ${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}
    </button>
    <div class="card-info">
      <h3>${esc(p.name)}</h3>
      <p class="price">${money(p.price)}</p>
    </div>
    <span class="dots" role="img" aria-label="Available in ${esc(colorNames)}">
      ${p.colors.map((c) => `<span style="background:${esc(c.hex)}"></span>`).join('')}
    </span>
  </article>`;
}

function renderGrid() {
  const list = visibleProducts();
  $('product-grid').innerHTML = list.map(cardHTML).join('');
  $('empty-state').hidden = list.length > 0;
  $('result-count').textContent = `${list.length} ${list.length === 1 ? 'piece' : 'pieces'}`;
}

function initShop() {
  renderFilters();
  renderGrid();
  $('filters').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-category]');
    if (!btn) return;
    view.category = btn.dataset.category;
    renderFilters();
    renderGrid();
  });
  $('sort').addEventListener('change', (e) => {
    view.sort = e.target.value;
    renderGrid();
  });
  $('product-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open]');
    if (btn) openQuickView(btn.dataset.open);
  });
}

/* ---------- quick view dialog ---------- */
const qvDialog = $('quickview');
const qv = { product: null, color: null, size: null, qty: 1 };

function openQuickView(id) {
  const p = byId.get(id);
  if (!p) return;
  Object.assign(qv, { product: p, color: p.colors[0].name, size: p.sizes.length === 1 ? p.sizes[0] : null, qty: 1 });

  $('quickview-body').innerHTML = `
  <div class="qv">
    <div class="qv-gallery">
      <img class="qv-main" id="qv-main" src="${esc(p.images[0])}" alt="${esc(p.name)}" width="800" height="1000">
      ${p.images.length > 1 ? `<div class="qv-thumbs">${p.images.map((src, i) => `
        <button type="button" data-thumb="${esc(src)}" aria-label="Show view ${i + 1}" aria-current="${i === 0}">
          <img src="${esc(src)}" alt="" width="80" height="100"></button>`).join('')}</div>` : ''}
    </div>
    <div class="qv-info">
      <p class="muted">${esc(p.category)}</p>
      <h2 id="qv-title">${esc(p.name)}</h2>
      <p class="price">${money(p.price)}</p>
      <p class="qv-desc">${esc(p.description)}</p>

      <fieldset class="opt">
        <legend>Color: <span id="qv-color-name">${esc(qv.color)}</span></legend>
        <div class="opt-row">
          ${p.colors.map((c, i) => `
            <label class="swatch" title="${esc(c.name)}">
              <input type="radio" name="qv-color" value="${esc(c.name)}" ${i === 0 ? 'checked' : ''}>
              <span style="background:${esc(c.hex)}"></span>
              <span class="sr-only">${esc(c.name)}</span>
            </label>`).join('')}
        </div>
      </fieldset>

      <fieldset class="opt">
        <legend>Size</legend>
        <div class="opt-row">
          ${p.sizes.map((s) => `
            <label class="size">
              <input type="radio" name="qv-size" value="${esc(s)}" ${qv.size === s ? 'checked' : ''}>
              <span>${esc(s)}</span>
            </label>`).join('')}
        </div>
      </fieldset>
      <p class="error" id="qv-error" role="alert"></p>

      <div class="qty" role="group" aria-label="Quantity">
        <button type="button" class="icon-btn" data-qv-step="-1" aria-label="Decrease quantity">&minus;</button>
        <output id="qv-qty" aria-live="polite">1</output>
        <button type="button" class="icon-btn" data-qv-step="1" aria-label="Increase quantity">+</button>
      </div>
      <button type="button" class="btn btn-block" data-qv-add>Add to bag</button>

      <ul class="details">${p.details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
    </div>
  </div>`;

  qvDialog.showModal();
  document.body.classList.add('no-scroll');
}

function initQuickView() {
  qvDialog.addEventListener('click', (e) => {
    if (e.target === qvDialog) qvDialog.close(); // backdrop click
  });
  $('quickview-close').addEventListener('click', () => qvDialog.close());
  qvDialog.addEventListener('close', () => {
    if (!drawerOpen) document.body.classList.remove('no-scroll');
  });

  $('quickview-body').addEventListener('change', (e) => {
    if (e.target.name === 'qv-color') {
      qv.color = e.target.value;
      $('qv-color-name').textContent = qv.color;
    }
    if (e.target.name === 'qv-size') {
      qv.size = e.target.value;
      $('qv-error').textContent = '';
    }
  });

  $('quickview-body').addEventListener('click', (e) => {
    const thumb = e.target.closest('[data-thumb]');
    if (thumb) {
      $('qv-main').src = thumb.dataset.thumb;
      document.querySelectorAll('[data-thumb]').forEach((b) => b.setAttribute('aria-current', String(b === thumb)));
      return;
    }
    const step = e.target.closest('[data-qv-step]');
    if (step) {
      qv.qty = Math.min(MAX_QTY, Math.max(1, qv.qty + Number(step.dataset.qvStep)));
      $('qv-qty').textContent = qv.qty;
      return;
    }
    if (e.target.closest('[data-qv-add]')) {
      if (!qv.size) {
        $('qv-error').textContent = 'Choose a size to add this to your bag.';
        return;
      }
      cart.add({ productId: qv.product.id, color: qv.color, size: qv.size, qty: qv.qty });
      qvDialog.close();
      openDrawer();
    }
  });
}

/* ---------- cart drawer ---------- */
const drawer = $('cart-drawer');
const overlay = $('cart-overlay');
let drawerOpen = false;
let lastFocus = null;

function openDrawer() {
  if (drawerOpen) return;
  drawerOpen = true;
  lastFocus = document.activeElement;
  drawer.removeAttribute('inert');
  drawer.setAttribute('aria-hidden', 'false');
  drawer.classList.add('open');
  overlay.hidden = false;
  document.body.classList.add('no-scroll');
  $('cart-open').setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => $('cart-close').focus());
}

function closeDrawer() {
  if (!drawerOpen) return;
  drawerOpen = false;
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  drawer.setAttribute('inert', '');
  overlay.hidden = true;
  document.body.classList.remove('no-scroll');
  $('cart-open').setAttribute('aria-expanded', 'false');
  (lastFocus && document.contains(lastFocus) ? lastFocus : $('cart-open')).focus();
}

function renderCart() {
  const n = cart.count;
  $('cart-count').textContent = n;
  $('cart-count').setAttribute('aria-label', `${n} ${n === 1 ? 'item' : 'items'} in bag`);
  $('cart-count').classList.toggle('has-items', n > 0);

  const empty = cart.items.length === 0;
  $('cart-empty').hidden = !empty;
  $('cart-summary').hidden = empty;

  $('cart-items').innerHTML = cart.items.map((i) => {
    const p = byId.get(i.productId);
    return `
    <li class="cart-item">
      <img src="${esc(p.images[0])}" alt="" width="80" height="100">
      <div class="ci-body">
        <h3>${esc(p.name)}</h3>
        <p class="muted small">${esc(i.color)}, ${esc(i.size)}</p>
        <div class="qty qty-sm" role="group" aria-label="Quantity for ${esc(p.name)}">
          <button type="button" class="icon-btn" data-act="dec" data-key="${esc(i.key)}" aria-label="Decrease quantity">&minus;</button>
          <output>${i.qty}</output>
          <button type="button" class="icon-btn" data-act="inc" data-key="${esc(i.key)}" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="ci-side">
        <p class="price">${money(p.price * i.qty)}</p>
        <button type="button" class="link-btn" data-act="remove" data-key="${esc(i.key)}" aria-label="Remove ${esc(p.name)}">Remove</button>
      </div>
    </li>`;
  }).join('');

  if (empty) return;
  const sub = cart.subtotal;
  const ship = shippingFor(sub, SITE.shipping);
  $('cart-subtotal').textContent = money(sub);
  $('cart-shipping').textContent = ship.free ? 'Free' : money(ship.cost);
  $('cart-total').textContent = money(sub + ship.cost);
  $('ship-msg').textContent = ship.free
    ? 'You have unlocked free shipping.'
    : `Add ${money(ship.remaining)} more for free shipping.`;
  const pct = SITE.shipping.freeThreshold === 0 ? 100 : Math.min(100, (sub / SITE.shipping.freeThreshold) * 100);
  $('ship-bar').style.width = `${pct}%`;
}

function initCart() {
  cart.subscribe(renderCart);
  renderCart();

  $('cart-open').addEventListener('click', () => (drawerOpen ? closeDrawer() : openDrawer()));
  $('cart-close').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  $('cart-items').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const item = cart.items.find((i) => i.key === btn.dataset.key);
    if (!item) return;
    if (btn.dataset.act === 'inc') cart.setQty(item.key, item.qty + 1);
    if (btn.dataset.act === 'dec') cart.setQty(item.key, item.qty - 1);
    if (btn.dataset.act === 'remove') cart.remove(item.key);
  });

  $('checkout-btn').addEventListener('click', () => {
    toast('Demo checkout only. Add the real business WhatsApp number before launch.');
  });

  document.addEventListener('keydown', (e) => {
    if (!drawerOpen) return;
    if (e.key === 'Escape') { closeDrawer(); return; }
    if (e.key === 'Tab') { // keep focus inside the open drawer
      const focusable = [...drawer.querySelectorAll('button:not([disabled]), a[href]')].filter((el) => !el.closest('[hidden]'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/* ---------- toast ---------- */
let toastTimer;
function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4000);
}

/* ---------- forms ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setError(inputId, message) {
  const input = $(inputId);
  $(`${inputId}-err`).textContent = message;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (message) input.setAttribute('aria-describedby', `${inputId}-err`);
  return !message;
}

function initContactForm() {
  const form = $('contact-form');
  const status = $('form-status');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    const data = {
      name: $('c-name').value.trim(),
      email: $('c-email').value.trim(),
      message: $('c-message').value.trim(),
    };
    const checks = [
      ['c-name', data.name ? '' : 'Enter your name.'],
      ['c-email', EMAIL_RE.test(data.email) ? '' : 'Enter a valid email address, like name@example.com.'],
      ['c-message', data.message.length >= 10 ? '' : 'Write at least 10 characters so we can help.'],
    ];
    const results = checks.map(([id, msg]) => [id, setError(id, msg)]);
    const firstBad = results.find(([, ok]) => !ok);
    if (firstBad) { $(firstBad[0]).focus(); return; }

    const endpoint = SITE.contact.formEndpoint;
    if (endpoint) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(String(res.status));
      } catch {
        status.textContent = `We could not send your message. Email us at ${SITE.contact.email} instead.`;
        return;
      }
    }
    form.reset();
    status.textContent = `Thanks, ${data.name}. We will reply within two working days.`;
  });
}

function initNewsletter() {
  const form = $('newsletter-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('n-email').value.trim();
    const status = $('newsletter-status');
    if (!EMAIL_RE.test(email)) {
      status.textContent = 'Enter a valid email address.';
      $('n-email').setAttribute('aria-invalid', 'true');
      return;
    }
    $('n-email').setAttribute('aria-invalid', 'false');
    form.reset();
    status.textContent = 'You are on the list. New arrivals will reach you first.';
  });
}

/* ---------- mobile nav ---------- */
function initNav() {
  const nav = $('site-nav');
  const toggle = $('nav-toggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ---------- start ---------- */
applyTheme();
renderStatic();
initShop();
initQuickView();
initCart();
initContactForm();
initNewsletter();
initNav();
