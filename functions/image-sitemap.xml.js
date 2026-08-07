import { fetchAllPublishedArticles, getSiteOrigin } from '../share-meta.mjs';
import { buildImageSitemapXml } from '../sitemap-utils.mjs';

export async function onRequestGet({ env }) {
  const siteOrigin = getSiteOrigin(env.VITE_SITE_URL || 'https://satyajaytimes.com');
  const articles = await fetchAllPublishedArticles({
    supabaseUrl: env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://phurlzbppwvlndmewdjq.supabase.co',
    supabaseKey: env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || 'sb_publishable_AFMHgyBqiFPYVNOGXrF64A_TghiK6IG',
  });

  return new Response(buildImageSitemapXml({ siteOrigin, articles }), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
