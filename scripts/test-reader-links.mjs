import test from 'node:test';
import assert from 'node:assert/strict';
import { articleShareLinks, categoryPath, injectArticleContent } from '../share-meta.mjs';

test('sharing preserves Hindi titles and uses the canonical URL without tracking parameters', () => {
  const title = 'फरीदाबाद: पानी & सड़क #खबर';
  const links = articleShareLinks('https://satyajaytimes.com', '123', title);
  assert.equal(links.canonical, 'https://satyajaytimes.com/article/123');
  assert.equal(new URL(links.whatsapp).searchParams.get('text'), `${title}\n${links.canonical}`);
});

test('server article links to its real category and escapes article text', () => {
  const article = { id: '123', title: '<unsafe>', category: 'फरीदाबाद', content: 'Report', created_at: '2026-11-20T05:00:00Z' };
  const html = injectArticleContent('<div id="root"></div>', { siteOrigin: 'https://satyajaytimes.com', article });
  assert.equal((html.match(/href="\/category\/faridabad"/g) || []).length, 2);
  assert.ok(html.includes('&lt;unsafe&gt;'));
  assert.equal(categoryPath('वीडियो न्यूज़'), '/videos');
  assert.equal(categoryPath('Unknown'), null);
  assert.ok(!injectArticleContent('<div id="root"></div>', { siteOrigin: 'https://satyajaytimes.com', article: { ...article, category: 'Unknown' } }).includes('/category/undefined'));
});
