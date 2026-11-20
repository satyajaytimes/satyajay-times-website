import { buildSectionHeadTags, getSiteOrigin, injectHeadMeta, markServerMetadata } from './share-meta.mjs';
import { fetchListingArticles, injectListingContent } from './listing-seo.mjs';

export async function servePublicPage({ request, env }, fetcher = fetch) {
  const pathname = new URL(request.url).pathname.replace(/\/$/, '');
  const siteOrigin = getSiteOrigin(env.VITE_SITE_URL);
  const meta = buildSectionHeadTags({ siteOrigin, pathname });
  // Retain the removed information-page handlers so old URLs return a real 404.
  if (!meta && pathname !== '') return new Response('Page not found', { status: 404 });
  const template = await env.ASSETS.fetch(new URL('/index.html', request.url));
  if (!template.ok) return template;
  const source = await template.text();
  let html = meta ? injectHeadMeta(source, meta) : markServerMetadata(source);
  if (pathname !== '/videos') {
    try {
      const articles = await fetchListingArticles(env, pathname, fetcher);
      html = injectListingContent(html, { pathname, articles });
    } catch {
      return new Response('News temporarily unavailable. Please retry later.', {
        status: 503, headers: { 'cache-control': 'no-store', 'retry-after': '60' },
      });
    }
  }
  return new Response(html, { headers: {
    'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, must-revalidate',
  } });
}
