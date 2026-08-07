import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fetchAllPublishedArticles, getSiteOrigin } from '../share-meta.mjs';
import { buildImageSitemapXml, buildNewsSitemapXml, buildSitemapXml } from '../sitemap-utils.mjs';

const siteOrigin = getSiteOrigin(process.env.VITE_SITE_URL);
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

let articles = [];

if (supabaseUrl && supabaseKey) {
  articles = await fetchAllPublishedArticles({ supabaseUrl, supabaseKey });
} else {
  console.warn('[sitemap] Article URLs skipped: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set at build time.');
}

writeFileSync(resolve(process.cwd(), 'dist', 'sitemap.xml'), buildSitemapXml({ siteOrigin, articles }), 'utf8');
writeFileSync(resolve(process.cwd(), 'dist', 'news-sitemap.xml'), buildNewsSitemapXml({ siteOrigin, articles }), 'utf8');
writeFileSync(resolve(process.cwd(), 'dist', 'image-sitemap.xml'), buildImageSitemapXml({ siteOrigin, articles }), 'utf8');

console.log('[sitemap] Generated sitemap.xml, news-sitemap.xml, and image-sitemap.xml with ' + articles.length + ' article URLs available.');
