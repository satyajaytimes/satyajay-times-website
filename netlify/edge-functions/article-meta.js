import {
  buildArticleHeadTags,
  buildArticleNotFoundHeadTags,
  fetchArticleById,
  getSiteOrigin,
  injectHeadMeta,
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

  const article = await fetchArticleById(articleId, { supabaseUrl, supabaseKey });

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
    html = injectHeadMeta(html, meta);
  } else {
    const meta = buildArticleNotFoundHeadTags({ siteOrigin, articleId });
    html = injectHeadMeta(html, meta);
  }

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
};
