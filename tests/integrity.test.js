import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCTS } from '../public/js/products.js';
import { SITE } from '../public/js/config.js';

const pub = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const exists = (rel) => access(path.join(pub, rel)).then(() => true, () => false);

test('product data is valid', () => {
  const ids = new Set();
  for (const p of PRODUCTS) {
    assert.ok(!ids.has(p.id), `duplicate id ${p.id}`);
    ids.add(p.id);
    assert.match(p.id, /^[a-z0-9-]+$/, `bad id ${p.id}`);
    assert.ok(p.name && p.category && typeof p.price === 'number' && p.price > 0, p.id);
    assert.ok(p.colors.length > 0 && p.sizes.length > 0 && p.images.length > 0, p.id);
    p.colors.forEach((c) => assert.match(c.hex, /^#[0-9a-f]{6}$/i, `${p.id} color ${c.name}`));
  }
});

test('every referenced image exists', async () => {
  const files = [
    ...PRODUCTS.flatMap((p) => p.images),
    SITE.hero.image,
    ...SITE.lookbook.map((l) => l.image),
  ];
  for (const f of files) {
    if (/^https:\/\//i.test(f)) assert.match(f, /^https:\/\/images\.unsplash\.com\//, `unapproved remote image: ${f}`);
    else assert.ok(await exists(f), `missing image: ${f}`);
  }
});

test('theme defines every color the CSS uses', () => {
  for (const k of ['bg', 'surface', 'ink', 'muted', 'line', 'accent', 'blush']) {
    assert.match(SITE.theme[k], /^#[0-9a-f]{6}$/i, k);
  }
});

test('every element id used by app.js exists in index.html', async () => {
  const html = await readFile(path.join(pub, 'index.html'), 'utf8');
  const js = await readFile(path.join(pub, 'js', 'app.js'), 'utf8');
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  // ids that app.js creates itself inside templates
  const dynamic = new Set(['qv-main', 'qv-color-name', 'qv-error', 'qv-qty', 'qv-title']);
  const used = new Set([...js.matchAll(/\$\('([^']+)'\)/g)].map((m) => m[1]));
  for (const id of used) assert.ok(htmlIds.has(id) || dynamic.has(id), `app.js uses #${id} but it is not in index.html`);
  // error paragraphs are addressed as `${id}-err`
  for (const id of ['c-name', 'c-email', 'c-message']) assert.ok(htmlIds.has(`${id}-err`), `${id}-err missing`);
});

test('html has unique ids', async () => {
  const html = await readFile(path.join(pub, 'index.html'), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size, 'duplicate ids in index.html');
});
