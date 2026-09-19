import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fetchAllPublishedArticles, getSiteOrigin } from '../share-meta.mjs';
import { publicationPages } from '../publication-info.mjs';

const siteOrigin = getSiteOrigin(process.env.VITE_SITE_URL);
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, lastmod, priority = '0.8') {
  const lastmodTag = lastmod ? '\n    <lastmod>' + escapeXml(lastmod) + '</lastmod>' : '';
  return '  <url>\n    <loc>' + escapeXml(loc) + '</loc>' + lastmodTag + '\n    <priority>' + priority + '</priority>\n  </url>';
}

const staticPaths = [
  ['/', '1.0'],
  ['/category/faridabad', '0.8'],
  ['/category/haryana', '0.8'],
  ['/category/cricket', '0.8'],
  ['/category/manoranjan', '0.8'],
  ['/category/rashtriya', '0.8'],
  ['/category/antarrashtriya', '0.8'],
  ['/videos', '0.7'],
  ...Object.keys(publicationPages).map((path) => [path, '0.5']),
];

const entries = staticPaths.map(([pathname, priority]) => urlEntry(siteOrigin + pathname, null, priority));

if (supabaseUrl && supabaseKey) {
  const articles = await fetchAllPublishedArticles({ supabaseUrl, supabaseKey });
  for (const article of articles) {
    entries.push(urlEntry(siteOrigin + '/article/' + article.id, article.updated_at || article.created_at, '0.9'));
  }
} else {
  console.warn('[sitemap] Article URLs skipped: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set at build time.');
}

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries.join('\n') + '\n</urlset>\n';
writeFileSync(resolve(process.cwd(), 'dist', 'sitemap.xml'), xml, 'utf8');
console.log('[sitemap] Generated sitemap.xml with ' + entries.length + ' URLs');
