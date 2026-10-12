import test from 'node:test';
import assert from 'node:assert/strict';
import { Cart, formatMoney, shippingFor, lineKey, MAX_QTY } from '../public/js/cart.js';
import { PRODUCTS } from '../public/js/products.js';
import { SITE } from '../public/js/config.js';

const memoryStorage = () => {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), raw: data };
};
const first = PRODUCTS[0];
const line = (extra = {}) => ({ productId: first.id, color: first.colors[0].name, size: first.sizes[0], ...extra });

test('adding the same variant merges quantities', () => {
  const cart = new Cart(PRODUCTS);
  cart.add(line());
  cart.add(line({ qty: 2 }));
  assert.equal(cart.items.length, 1);
  assert.equal(cart.count, 3);
});

test('different size or color creates a separate line', () => {
  const cart = new Cart(PRODUCTS);
  cart.add(line());
  cart.add(line({ size: first.sizes[1] }));
  assert.equal(cart.items.length, 2);
});

test('subtotal uses catalog prices', () => {
  const cart = new Cart(PRODUCTS);
  cart.add(line({ qty: 2 }));
  assert.equal(cart.subtotal, first.price * 2);
});

test('quantity is capped and setQty(0) removes the line', () => {
  const cart = new Cart(PRODUCTS);
  cart.add(line({ qty: 99 }));
  assert.equal(cart.count, MAX_QTY);
  cart.setQty(lineKey(first.id, first.colors[0].name, first.sizes[0]), 0);
  assert.equal(cart.items.length, 0);
});

test('unknown product is rejected', () => {
  assert.throws(() => new Cart(PRODUCTS).add({ productId: 'nope', color: 'x', size: 'y' }));
});

test('cart persists to storage and reloads', () => {
  const storage = memoryStorage();
  new Cart(PRODUCTS, storage, 'k').add(line({ qty: 2 }));
  assert.equal(new Cart(PRODUCTS, storage, 'k').count, 2);
});

test('corrupt or stale storage is ignored safely', () => {
  const storage = memoryStorage();
  storage.setItem('k', '{not json');
  assert.equal(new Cart(PRODUCTS, storage, 'k').count, 0);
  storage.setItem('k', JSON.stringify([{ productId: 'deleted-product', color: 'a', size: 'b', qty: 1 }]));
  assert.equal(new Cart(PRODUCTS, storage, 'k').count, 0);
});

test('subscribers are notified on change', () => {
  const cart = new Cart(PRODUCTS);
  let calls = 0;
  cart.subscribe(() => calls++);
  cart.add(line());
  cart.clear();
  assert.equal(calls, 2);
});

test('shipping rules', () => {
  const rules = { freeThreshold: 150, flatRate: 12 };
  assert.deepEqual(shippingFor(0, rules), { cost: 0, free: false, remaining: 150 });
  assert.deepEqual(shippingFor(100, rules), { cost: 12, free: false, remaining: 50 });
  assert.deepEqual(shippingFor(150, rules), { cost: 0, free: true, remaining: 0 });
  assert.equal(shippingFor(10, { freeThreshold: 0, flatRate: 12 }).free, true);
});

test('money formatting uses configured currency', () => {
  assert.equal(formatMoney(285, SITE.currency), 'USh 285');
  assert.equal(formatMoney(12.5, SITE.currency), 'USh 12.50');
});
