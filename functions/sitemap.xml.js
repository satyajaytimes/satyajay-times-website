import { publicationPages } from '../publication-info.mjs';

const SITE_ORIGIN = 'https://satyajaytimes.com';
const STATIC_PATHS = [
  '/',
  '/category/faridabad',
  '/category/haryana',
  '/category/cricket',
  '/category/manoranjan',
  '/category/rashtriya',
  '/category/antarrashtriya',
  '/videos',
  ...Object.keys(publicationPages),
];
const PAGE_SIZE = 500;
const MAX_ARTICLES = 50000 - STATIC_PATHS.length;

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[character]);
}

export async function createSitemap(env, fetcher = fetch) {
  // Use the same public read-only configuration as the existing article route.
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://phurlzbppwvlndmewdjq.supabase.co';
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || 'sb_publishable_AFMHgyBqiFPYVNOGXrF64A_TghiK6IG';
  const siteOrigin = (env.VITE_SITE_URL || SITE_ORIGIN).replace(/\/$/, '');
  const entries = STATIC_PATHS.map((path) => `  <url><loc>${escapeXml(siteOrigin + path)}</loc></url>`);
  const seen = new Set();
  const signal = AbortSignal.timeout(15000);
  let offset = 0;

  // Continue until an empty page: Supabase can impose a smaller row limit.
  while (true) {
    const url = new URL(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/articles`);
    url.searchParams.set('select', 'id,created_at');
    url.searchParams.set('is_published', 'eq.true');
    url.searchParams.set('order', 'created_at.asc,id.asc');
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('offset', String(offset));
    const response = await fetcher(url, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      signal,
    });
    if (!response.ok) throw new Error('Published articles could not be fetched');
    const articles = await response.json();
    if (!Array.isArray(articles)) throw new Error('Invalid article response');
    if (!articles.length) break;
    offset += articles.length;
    if (offset > MAX_ARTICLES) throw new Error('Sitemap requires splitting into multiple files');

    for (const article of articles) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(article.id || '')) {
        throw new Error('Invalid article ID');
      }
      if (seen.has(article.id)) continue;
      seen.add(article.id);
      entries.push(`  <url><loc>${escapeXml(`${siteOrigin}/article/${article.id}`)}</loc></url>`);
    }
  }

  // No lastmod: created_at does not tell us when an existing story was edited.
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + entries.join('\n') + '\n</urlset>\n';
}

export async function onRequestGet({ env }, fetcher = fetch) {
  try {
    const xml = await createSitemap(env, fetcher);
    return new Response(xml, {
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, max-age=0, must-revalidate',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch {
    // A temporary outage must not replace the sitemap with an empty success.
    return new Response('Sitemap temporarily unavailable. Please retry later.', {
      status: 503,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
        'retry-after': '60',
      },
    });
  }
}
