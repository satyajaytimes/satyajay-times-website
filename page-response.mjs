import { buildSectionHeadTags, getSiteOrigin, injectHeadMeta } from './share-meta.mjs';

export async function servePublicPage({ request, env }) {
  const pathname = new URL(request.url).pathname.replace(/\/$/, '');
  const siteOrigin = getSiteOrigin(env.VITE_SITE_URL);
  const meta = buildSectionHeadTags({ siteOrigin, pathname });
  // Retain the removed information-page handlers so old URLs return a real 404.
  if (!meta) return new Response('Page not found', { status: 404 });
  const template = await env.ASSETS.fetch(new URL('/index.html', request.url));
  if (!template.ok) return template;
  const html = injectHeadMeta(await template.text(), meta);
  return new Response(html, { headers: {
    'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, must-revalidate',
  } });
}
