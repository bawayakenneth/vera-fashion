// Cart logic with no DOM access, so it can be unit-tested in Node (npm test).

export const MAX_QTY = 10;

export const lineKey = (productId, color, size) => [productId, color, size].join('|');

export function formatMoney(amount, { code, locale }) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

/** Returns { cost, free, remaining } for a given subtotal. */
export function shippingFor(subtotal, { freeThreshold, flatRate }) {
  if (subtotal <= 0) return { cost: 0, free: false, remaining: freeThreshold };
  const free = freeThreshold === 0 || subtotal >= freeThreshold;
  return { cost: free ? 0 : flatRate, free, remaining: free ? 0 : freeThreshold - subtotal };
}

export class Cart {
  /**
   * @param {Array} catalog  product list (for prices)
   * @param {Storage|null} storage  e.g. window.localStorage (optional)
   */
  constructor(catalog, storage = null, storageKey = 'store-cart-v1') {
    this.catalog = new Map(catalog.map((p) => [p.id, p]));
    this.storage = storage;
    this.storageKey = storageKey;
    this.listeners = new Set();
    this.items = this.#load();
  }

  #load() {
    try {
      const raw = this.storage?.getItem(this.storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((i) => i && this.catalog.has(i.productId) && Number.isInteger(i.qty) && i.qty > 0)
        .map((i) => ({ ...i, key: lineKey(i.productId, i.color, i.size), qty: Math.min(i.qty, MAX_QTY) }));
    } catch {
      return []; // corrupted or blocked storage: start with an empty cart
    }
  }

  #commit() {
    try {
      this.storage?.setItem(this.storageKey, JSON.stringify(this.items));
    } catch {
      /* storage full or unavailable: cart still works for this session */
    }
    this.listeners.forEach((fn) => fn(this));
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  add({ productId, color, size, qty = 1 }) {
    if (!this.catalog.has(productId)) throw new Error(`Unknown product: ${productId}`);
    const key = lineKey(productId, color, size);
    const existing = this.items.find((i) => i.key === key);
    if (existing) existing.qty = Math.min(existing.qty + qty, MAX_QTY);
    else this.items.push({ key, productId, color, size, qty: Math.min(qty, MAX_QTY) });
    this.#commit();
  }

  setQty(key, qty) {
    const item = this.items.find((i) => i.key === key);
    if (!item) return;
    if (qty <= 0) this.items = this.items.filter((i) => i.key !== key);
    else item.qty = Math.min(qty, MAX_QTY);
    this.#commit();
  }

  remove(key) {
    this.setQty(key, 0);
  }

  clear() {
    this.items = [];
    this.#commit();
  }

  get count() {
    return this.items.reduce((n, i) => n + i.qty, 0);
  }

  get subtotal() {
    return this.items.reduce((sum, i) => sum + this.catalog.get(i.productId).price * i.qty, 0);
  }
}
