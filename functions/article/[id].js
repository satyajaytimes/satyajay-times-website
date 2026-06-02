import {
  buildArticleHeadTags,
  buildArticleNotFoundHeadTags,
  fetchArticleById,
  getSiteOrigin,
  injectHeadMeta,
} from '../../share-meta.mjs';

/** Cloudflare Pages Function: inject article OG/Twitter tags for crawlers. */
export async function onRequestGet(context) {
  const { request, env, params } = context;
  const articleId = params.id;

  if (!articleId) {
    return env.ASSETS.fetch(request);
  }


  const siteOrigin = getSiteOrigin(env.VITE_SITE_URL || 'https://satyajaytimes.com');
  const article = await fetchArticleById(articleId, {
    supabaseUrl: env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://phurlzbppwvlndmewdjq.supabase.co',
    supabaseKey: env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || 'sb_publishable_AFMHgyBqiFPYVNOGXrF64A_TghiK6IG',
  });

  const indexResponse = await env.ASSETS.fetch(new URL('/index.html', request.url));
  if (!indexResponse.ok) {
    return indexResponse;
  }

  let html = await indexResponse.text();
  const meta = article
    ? buildArticleHeadTags({ siteOrigin, articleId, article })
    : buildArticleNotFoundHeadTags({ siteOrigin, articleId });
  html = injectHeadMeta(html, meta);

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}
