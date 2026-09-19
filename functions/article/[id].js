import {
  buildArticleHeadTags,
  buildArticleNotFoundHeadTags,
  fetchArticleById,
  getSiteOrigin,
  injectHeadMeta,
  injectArticleContent,
  injectMissingArticle,
} from '../../share-meta.mjs';

/** Cloudflare Pages Function: inject article OG/Twitter tags for crawlers. */
export async function onRequestGet(context) {
  const { request, env, params } = context;
  const articleId = params.id;

  if (!articleId) {
    return env.ASSETS.fetch(request);
  }


  const siteOrigin = getSiteOrigin(env.VITE_SITE_URL || 'https://satyajaytimes.com');
  let article;
  try {
    article = await fetchArticleById(articleId, {
    supabaseUrl: env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://phurlzbppwvlndmewdjq.supabase.co',
    supabaseKey: env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || 'sb_publishable_AFMHgyBqiFPYVNOGXrF64A_TghiK6IG',
    });
  } catch {
    return new Response('खबर अभी लोड नहीं हो सकी। कृपया थोड़ी देर बाद दोबारा खोलें।', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '60' },
    });
  }

  const indexResponse = await env.ASSETS.fetch(new URL('/index.html', request.url));
  if (!indexResponse.ok) {
    return indexResponse;
  }

  let html = await indexResponse.text();
  const meta = article
    ? buildArticleHeadTags({ siteOrigin, articleId, article })
    : buildArticleNotFoundHeadTags({ siteOrigin, articleId });
  html = injectHeadMeta(html, meta);
  html = article ? injectArticleContent(html, { siteOrigin, article }) : injectMissingArticle(html);

  return new Response(html, {
    status: article ? 200 : 404,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}
