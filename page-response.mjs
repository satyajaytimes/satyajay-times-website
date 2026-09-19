import { buildPageHeadTags, buildSectionHeadTags, escapeHtml, getSiteOrigin, injectHeadMeta } from './share-meta.mjs';
import { publicationPages, publicationContact } from './publication-info.mjs';

export function injectPublicationContent(html, page) {
  const e = escapeHtml;
  const sections = page.sections.map(([heading, text]) => `<section><h2>${e(heading)}</h2><p>${e(text)}</p></section>`).join('');
  return html.replace(/<div id="root"><\/div>/, () => `<div id="root"><main><section class="page-grid" style="grid-template-columns:1fr"><article class="card"><div><a href="/">सत्यजय टाइम्स</a><h1>${e(page.heading)}</h1>${sections}<h2>सार्वजनिक संपर्क</h2><p><a href="${e(publicationContact.phoneHref)}">${e(publicationContact.phone)}</a></p><p><a href="mailto:${e(publicationContact.email)}">${e(publicationContact.email)}</a></p><p>${e(publicationContact.address)}</p></div></article></section></main></div>`);
}

export async function servePublicPage({ request, env }) {
  const pathname = new URL(request.url).pathname.replace(/\/$/, '');
  const siteOrigin = getSiteOrigin(env.VITE_SITE_URL);
  const page = publicationPages[pathname];
  const meta = page ? buildPageHeadTags({ siteOrigin, pathname, ...page }) : buildSectionHeadTags({ siteOrigin, pathname });
  if (!meta) return new Response('Page not found', { status: 404 });
  const template = await env.ASSETS.fetch(new URL('/index.html', request.url));
  if (!template.ok) return template;
  let html = injectHeadMeta(await template.text(), meta);
  if (page) html = injectPublicationContent(html, page);
  return new Response(html, { headers: {
    'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, must-revalidate',
  } });
}
