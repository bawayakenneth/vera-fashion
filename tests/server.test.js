import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';

async function withServer(fn) {
  const server = createServer();
  await new Promise((r) => server.listen(0, r));
  try { await fn(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((r) => server.close(r)); }
}

test('serves index, assets and correct MIME types', () => withServer(async (base) => {
  const home = await fetch(base + '/');
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type'), /text\/html/);
  assert.match(await home.text(), /<title>/);
  const js = await fetch(base + '/js/app.js');
  assert.match(js.headers.get('content-type'), /javascript/);
  const img = await fetch(base + '/images/hero.svg');
  assert.match(img.headers.get('content-type'), /svg/);
}));

test('404 for missing files, no path traversal', () => withServer(async (base) => {
  assert.equal((await fetch(base + '/nope.html')).status, 404);
  const res = await fetch(base + '/..%2fserver.js');
  assert.ok([403, 404].includes(res.status), `status ${res.status}`);
  assert.doesNotMatch(await res.text(), /createServer/);
}));
