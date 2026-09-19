import assert from 'node:assert/strict';
import test from 'node:test';
import { createSitemap, onRequestGet } from '../functions/sitemap.xml.js';

const firstId = '00000000-0000-0000-0000-000000000001';
const secondId = '00000000-0000-0000-0000-000000000002';
const response = (data) => new Response(JSON.stringify(data));

test('paginates past an upstream row cap and requests only published articles', async () => {
  const offsets = [];
  const xml = await createSitemap({}, async (url) => {
    assert.equal(url.searchParams.get('is_published'), 'eq.true');
    assert.equal(url.searchParams.get('select'), 'id,created_at');
    const offset = Number(url.searchParams.get('offset'));
    offsets.push(offset);
    return response(offset === 0 ? [{ id: firstId }] : offset === 1 ? [{ id: secondId }] : []);
  });
  assert.deepEqual(offsets, [0, 1, 2]);
  assert.ok(xml.includes(`/article/${firstId}`));
  assert.ok(xml.includes(`/article/${secondId}`));
  assert.equal((xml.match(/<loc>/g) || []).length, 14);
  assert.ok(!xml.includes('<lastmod>'));
});

test('reflects newly published articles on the next request', async () => {
  let articles = [{ id: firstId }];
  const fetcher = async (url) => response(Number(url.searchParams.get('offset')) === 0 ? articles : []);
  const before = await onRequestGet({ env: {} }, fetcher);
  assert.equal(before.status, 200);
  assert.match(before.headers.get('content-type'), /application\/xml/);
  assert.ok(!(await before.text()).includes(secondId));
  articles = [...articles, { id: secondId }];
  assert.ok((await (await onRequestGet({ env: {} }, fetcher)).text()).includes(secondId));
});

test('returns a retryable failure instead of a partial sitemap', async () => {
  const result = await onRequestGet({ env: {} }, async (url) => (
    Number(url.searchParams.get('offset')) === 0 ? response([{ id: firstId }]) : new Response('', { status: 500 })
  ));
  assert.equal(result.status, 503);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.equal(result.headers.get('retry-after'), '60');
});

test('handles an empty publication and rejects invalid upstream data', async () => {
  const empty = await createSitemap({}, async () => response([]));
  assert.equal((empty.match(/<loc>/g) || []).length, 12);
  for (const invalid of [{ error: 'bad response' }, [{ id: '../bad' }]]) {
    const result = await onRequestGet({ env: {} }, async () => response(invalid));
    assert.equal(result.status, 503);
  }
});
