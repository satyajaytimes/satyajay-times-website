import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildArticleHeadTags, buildArticleNotFoundHeadTags, injectHeadMeta, injectArticleContent, articleStructuredData, buildSectionHeadTags, markServerMetadata } from '../share-meta.mjs';
import { createNewsSitemap } from '../functions/news-sitemap.xml.js';
import { onRequestGet as articleRoute } from '../functions/article/[id].js';
import { servePublicPage } from '../page-response.mjs';

const siteOrigin = 'https://satyajaytimes.com';
const id = '00000000-0000-0000-0000-000000000001';
const now = new Date('2026-09-20T12:00:00Z');
const article = { id, title: 'Test & <headline>', content: 'First paragraph\n\nSecond paragraph\nNext line\n</script><script>bad()</script> $&', caption: 'A caption', author: 'Satyajay Times', category: 'हरियाणा', created_at: '2026-09-19T00:00:00Z', image_url: '/photo.jpg' };
const template = '<html><head><title>Home</title><script type="module" crossorigin src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css"></head><body><div id="root"></div></body></html>';

test('article HTML contains escaped readable content and preserves application assets', () => {
  const html = injectArticleContent(injectHeadMeta(template, buildArticleHeadTags({ siteOrigin, articleId: id, article })), { siteOrigin, article });
  assert.match(html, /<h1>Test &amp; &lt;headline&gt;<\/h1>/);
  assert.match(html, /First paragraph/);
  assert.match(html, /Second paragraph/);
  assert.ok(!html.includes('<script>bad()'));
  assert.ok(html.includes('$&'));
  const bootstrap = html.match(/<script id="sjt-article-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
  assert.deepEqual(JSON.parse(bootstrap), article);
  assert.match(html, /src="\/assets\/app.js"/);
  assert.match(html, /href="\/assets\/app.css"/);
  assert.equal((html.match(/<title\b/g) || []).length, 1);
});

test('metadata has explicit ownership, correct section canonical, and organization byline', () => {
  const html = injectHeadMeta(template, buildSectionHeadTags({ siteOrigin, pathname: '/category/haryana' }));
  assert.match(html, /href="https:\/\/satyajaytimes.com\/category\/haryana"/);
  assert.match(html, /<title data-server-meta="true">हरियाणा/);
  assert.equal(markServerMetadata(html), html);
  assert.equal(articleStructuredData({ siteOrigin, articleId: id, article }).author['@type'], 'Organization');
  assert.match(buildArticleNotFoundHeadTags({ siteOrigin, articleId: id }), /noindex, follow/);
});

test('missing article is 404 but database outage is retryable 503', async (t) => {
  const context = { params: { id }, request: new Request(siteOrigin + '/article/' + id), env: { ASSETS: { fetch: async () => new Response(template) } } };
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response('[]'));
  const missing = await articleRoute(context);
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /noindex, follow/);
  fetchMock.mock.mockImplementation(async () => new Response('', { status: 500 }));
  const failure = await articleRoute(context);
  assert.equal(failure.status, 503);
  assert.equal(failure.headers.get('cache-control'), 'no-store');
});

test('information pages expose verified owner and contact in initial HTML', async () => {
  const response = await servePublicPage({ request: new Request(siteOrigin + '/about'), env: { ASSETS: { fetch: async () => new Response(template) } } });
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /Rupesh Kumar Bansal/);
  assert.match(html, /9643311765/);
  assert.match(html, /<h1>हमारे बारे में<\/h1>/);
});

test('news sitemap excludes old/future articles and escapes the headline', async () => {
  const xml = await createNewsSitemap({}, { now, fetcher: async (url) => {
    assert.equal(url.searchParams.get('is_published'), 'eq.true');
    assert.ok(url.searchParams.get('and').includes('2026-09-18T12:00:00.000Z'));
    return new Response(JSON.stringify(url.searchParams.get('offset') === '0' ? [article,
      { ...article, id: '00000000-0000-0000-0000-000000000002', created_at: '2026-09-17T00:00:00Z' },
      { ...article, id: '00000000-0000-0000-0000-000000000003', created_at: '2026-09-21T00:00:00Z' },
    ] : []));
  } });
  assert.equal((xml.match(/<news:news>/g) || []).length, 1);
  assert.match(xml, /Test &amp; &lt;headline&gt;/);
  assert.match(xml, /<news:language>hi<\/news:language>/);
});

test('news sitemap emits an index when more than 1000 news articles exist', async () => {
  const rows = Array.from({ length: 1001 }, (_, i) => ({ ...article, id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}` }));
  const fetcher = async (url) => { const offset = Number(url.searchParams.get('offset')); return new Response(JSON.stringify(rows.slice(offset, offset + 500))); };
  const index = await createNewsSitemap({}, { now, fetcher });
  assert.match(index, /<sitemapindex /);
  assert.equal((index.match(/<sitemap>/g) || []).length, 2);
  const second = await createNewsSitemap({}, { now, fetcher, page: 2 });
  assert.equal((second.match(/<news:news>/g) || []).length, 1);
});

test('news sitemap permits an empty result instead of retaining expired stories', async () => {
  const xml = await createNewsSitemap({}, { now, fetcher: async () => new Response('[]') });
  assert.match(xml, /<urlset /);
  assert.ok(!xml.includes('<url>'));
});

test('popup schedule and close preference remain unchanged', () => {
  const source = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
  assert.match(source, /setTimeout\(\(\) => setPopup\(true\), 600\)/);
  assert.match(source, /Date.now\(\) - last > 10 \* 60 \* 60 \* 1000/);
});
