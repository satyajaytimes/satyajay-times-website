import { SECTION_NAMES, SITE_NAME, escapeHtml } from './share-meta.mjs';

export async function fetchListingArticles(env, pathname, fetcher = fetch) {
  const origin = env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://phurlzbppwvlndmewdjq.supabase.co';
  const key = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || 'sb_publishable_AFMHgyBqiFPYVNOGXrF64A_TghiK6IG';
  const url = new URL(`${origin.replace(/\/$/, '')}/rest/v1/articles`);
  url.searchParams.set('select', 'id,title,caption,category');
  url.searchParams.set('is_published', 'eq.true');
  url.searchParams.set('order', 'created_at.desc,id.desc');
  url.searchParams.set('limit', '30');
  const category = SECTION_NAMES[pathname.replace(/^\/category\//, '')];
  if (category) url.searchParams.set('category', `eq.${category}`);
  const response = await fetcher(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('News unavailable');
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.some((row) => !row ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id || '') ||
    typeof row.title !== 'string')) throw new Error('Invalid news response');
  return rows;
}

export function injectListingContent(html, { pathname, articles }) {
  const e = escapeHtml;
  const category = SECTION_NAMES[pathname.replace(/^\/category\//, '')];
  const heading = category ? `${category} की ताज़ा खबरें` : `${SITE_NAME} — ताज़ा हिंदी समाचार`;
  const navigation = Object.entries(SECTION_NAMES).map(([slug, name]) =>
    `<a href="/category/${slug}">${e(name)}</a>`).join(' · ');
  const stories = articles.map((article) => `<article class="card"><div>
    <h2><a href="/article/${e(article.id)}">${e(article.title)}</a></h2>
    ${article.caption ? `<p>${e(article.caption)}</p>` : ''}
    <p class="category">${e(article.category || '')}</p>
    </div></article>`).join('\n');
  const content = `<main><a href="/">${e(SITE_NAME)}</a>
    <nav aria-label="समाचार श्रेणियाँ">${navigation}</nav>
    <h1>${e(heading)}</h1><section class="cards">${stories || '<p>अभी कोई खबर उपलब्ध नहीं है।</p>'}</section></main>`;
  // Visible to every visitor before React takes over; no crawler-specific content.
  return html.replace(/<div id="root"><\/div>/, () => `<div id="root">${content}</div>`);
}
