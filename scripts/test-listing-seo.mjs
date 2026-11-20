import test from 'node:test';
import assert from 'node:assert/strict';
import { servePublicPage } from '../page-response.mjs';
import { onRequestGet } from '../functions/index.js';

const id = '00000000-0000-0000-0000-000000000001';
const template = '<html lang="hi"><head><title>Home</title><script type="application/ld+json">{"@type":"NewsMediaOrganization"}</script><script type="module" src="/app.js"></script></head><body><div id="root"></div></body></html>';
const context = (path) => ({ request: new Request('https://satyajaytimes.com' + path), env: { ASSETS: { fetch: async () => new Response(template) } } });

test('home and category expose escaped article links before JavaScript runs', async () => {
  for (const path of ['/', '/category/faridabad', '/category/haryana/']) {
    const response = await servePublicPage(context(path), async (url) => {
      assert.equal(url.searchParams.get('is_published'), 'eq.true');
      assert.equal(url.searchParams.get('limit'), '30');
      assert.equal(url.searchParams.get('category'), path === '/' ? null : path.includes('faridabad') ? 'eq.फरीदाबाद' : 'eq.हरियाणा');
      return new Response(JSON.stringify([{ id, title: 'News <script>bad()</script> $&', caption: '<b>Caption</b>', category: 'हरियाणा' }]));
    });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.ok(html.includes(`href="/article/${id}"`));
    assert.ok(html.includes('News &lt;script&gt;bad()&lt;/script&gt; $&'));
    assert.ok(!html.includes('<b>Caption</b>'));
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.ok(html.includes('/app.js'));
    if (path === '/') assert.ok(html.includes('NewsMediaOrganization'));
  }
  assert.equal(onRequestGet, servePublicPage);
});

test('empty listings remain usable, upstream errors are retryable', async () => {
  const empty = await servePublicPage(context('/'), async () => new Response('[]'));
  assert.equal(empty.status, 200);
  assert.ok((await empty.text()).includes('href="/category/faridabad"'));
  for (const fetcher of [async () => new Response('', { status: 500 }), async () => new Response('{}'), async () => new Response('[{"id":"../invalid","title":"bad"}]'), async () => { throw new Error('timeout'); }]) {
    const response = await servePublicPage(context('/'), fetcher);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('retry-after'), '60');
  }
});
