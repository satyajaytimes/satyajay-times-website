import { getSiteOrigin, SITE_NAME } from '../share-meta.mjs';

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[character]);
}

export async function createNewsSitemap(env, { fetcher = fetch, now = new Date(), page = null } = {}) {
  const origin = getSiteOrigin(env.VITE_SITE_URL);
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://phurlzbppwvlndmewdjq.supabase.co';
  const key = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || 'sb_publishable_AFMHgyBqiFPYVNOGXrF64A_TghiK6IG';
  const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const articles = [];
  const signal = AbortSignal.timeout(15000);
  let offset = 0;
  while (true) {
    const url = new URL(supabaseUrl.replace(/\/$/, '') + '/rest/v1/articles');
    url.searchParams.set('select', 'id,title,created_at');
    url.searchParams.set('is_published', 'eq.true');
    url.searchParams.set('and', `(created_at.gte.${cutoff.toISOString()},created_at.lte.${now.toISOString()})`);
    url.searchParams.set('order', 'created_at.asc,id.asc');
    url.searchParams.set('limit', '500');
    url.searchParams.set('offset', String(offset));
    const response = await fetcher(url, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal });
    if (!response.ok) throw new Error('News sitemap data unavailable');
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('Invalid article data');
    if (!rows.length) break;
    offset += rows.length;
    if (offset > 50000) throw new Error('News sitemap limit exceeded');
    for (const row of rows) {
      const date = new Date(row.created_at);
      if (!/^[0-9a-f-]{36}$/i.test(row.id || '') || typeof row.title !== 'string' || Number.isNaN(date.getTime())) throw new Error('Invalid article data');
      if (date >= cutoff && date <= now) articles.push(row);
    }
  }
  const unique = [...new Map(articles.map((article) => [article.id, article])).values()];
  const header = '<?xml version="1.0" encoding="UTF-8"?>\n';
  if (page === null && unique.length > 1000) {
    const entries = Array.from({ length: Math.ceil(unique.length / 1000) }, (_, i) => `<sitemap><loc>${escapeXml(origin + '/news-sitemap.xml?page=' + (i + 1))}</loc></sitemap>`);
    return header + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries.join('\n') + '</sitemapindex>\n';
  }
  const selected = page === null ? unique : unique.slice((page - 1) * 1000, page * 1000);
  const entries = selected.map((article) => `<url><loc>${escapeXml(origin + '/article/' + article.id)}</loc><news:news><news:publication><news:name>${escapeXml(SITE_NAME)}</news:name><news:language>hi</news:language></news:publication><news:publication_date>${escapeXml(new Date(article.created_at).toISOString())}</news:publication_date><news:title>${escapeXml(article.title)}</news:title></news:news></url>`);
  return header + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n' + entries.join('\n') + '\n</urlset>\n';
}

export async function onRequestGet({ request, env }) {
  const pageValue = new URL(request.url).searchParams.get('page');
  if (pageValue !== null && !/^[1-9]\d{0,2}$/.test(pageValue)) return new Response('Invalid sitemap page', { status: 400 });
  try {
    const xml = await createNewsSitemap(env, { page: pageValue === null ? null : Number(pageValue) });
    return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=0, must-revalidate' } });
  } catch {
    return new Response('News sitemap temporarily unavailable.', { status: 503, headers: { 'cache-control': 'no-store', 'retry-after': '60' } });
  }
}
