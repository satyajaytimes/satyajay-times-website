import {
  buildArticleHeadTags,
  buildArticleNotFoundHeadTags,
  fetchArticleById,
  getSiteOrigin,
  injectHeadMeta,
  injectArticleContent,
  injectMissingArticle,
} from '../../share-meta.mjs';

export default async (request, context) => {
  const requestUrl = new URL(request.url);
  const match = requestUrl.pathname.match(/^\/article\/([^/]+)\/?$/);
  if (!match) {
    return context.next();
  }

  const articleId = decodeURIComponent(match[1]);
  const siteOrigin = getSiteOrigin(Deno.env.get('VITE_SITE_URL') || Deno.env.get('URL'));
  const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
  const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');

  let article;
  try {
    article = await fetchArticleById(articleId, { supabaseUrl, supabaseKey });
  } catch {
    return new Response('खबर अभी लोड नहीं हो सकी। कृपया थोड़ी देर बाद दोबारा खोलें।', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '60' },
    });
  }

  const indexUrl = new URL(request.url);
  indexUrl.pathname = '/index.html';
  indexUrl.search = '';

  const indexResponse = await fetch(indexUrl.toString(), {
    headers: { Accept: 'text/html' },
  });

  if (!indexResponse.ok) {
    return context.next();
  }

  let html = await indexResponse.text();

  if (article) {
    const meta = buildArticleHeadTags({ siteOrigin, articleId, article });
    html = injectArticleContent(injectHeadMeta(html, meta), { siteOrigin, article });
  } else {
    const meta = buildArticleNotFoundHeadTags({ siteOrigin, articleId });
    html = injectMissingArticle(injectHeadMeta(html, meta));
  }

  return new Response(html, {
    status: article ? 200 : 404,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
};
