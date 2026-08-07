import { SITE_NAME, absoluteUrl, articleShareImage, escapeHtml } from './share-meta.mjs';

export const STATIC_PATHS = [
  ['/', '1.0'],
  ['/category/faridabad', '0.8'],
  ['/category/haryana', '0.8'],
  ['/category/cricket', '0.8'],
  ['/category/manoranjan', '0.8'],
  ['/category/rashtriya', '0.8'],
  ['/category/antarrashtriya', '0.8'],
  ['/videos', '0.7'],
];

export function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function articleUrl(siteOrigin, article) {
  return siteOrigin + '/article/' + article.id;
}

function articleDate(article) {
  return article.updated_at || article.created_at || new Date().toISOString();
}

function isRecentNewsArticle(article, now = new Date()) {
  if (!article?.created_at) return false;
  const created = new Date(article.created_at).getTime();
  if (!Number.isFinite(created)) return false;
  return now.getTime() - created <= 48 * 60 * 60 * 1000;
}

export function buildSitemapXml({ siteOrigin, articles = [] }) {
  const entries = STATIC_PATHS.map(([pathname, priority]) => {
    return '  <url>\n    <loc>' + escapeXml(siteOrigin + pathname) + '</loc>\n    <priority>' + priority + '</priority>\n  </url>';
  });

  for (const article of articles) {
    const imageUrl = articleShareImage(siteOrigin, article);
    const imageTag = imageUrl
      ? '\n    <image:image>\n      <image:loc>' + escapeXml(imageUrl) + '</image:loc>\n      <image:title>' + escapeXml(article.title || SITE_NAME) + '</image:title>' + (article.caption ? '\n      <image:caption>' + escapeXml(article.caption) + '</image:caption>' : '') + '\n    </image:image>'
      : '';
    entries.push('  <url>\n    <loc>' + escapeXml(articleUrl(siteOrigin, article)) + '</loc>\n    <lastmod>' + escapeXml(articleDate(article)) + '</lastmod>\n    <priority>0.9</priority>' + imageTag + '\n  </url>');
  }

  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + entries.join('\n') + '\n</urlset>\n';
}

export function buildNewsSitemapXml({ siteOrigin, articles = [], now = new Date() }) {
  const recent = articles
    .filter((article) => article?.id && article?.title && isRecentNewsArticle(article, now))
    .slice(0, 1000);

  const entries = recent.map((article) => {
    return '  <url>\n    <loc>' + escapeXml(articleUrl(siteOrigin, article)) + '</loc>\n    <news:news>\n      <news:publication>\n        <news:name>' + escapeXml(SITE_NAME) + '</news:name>\n        <news:language>hi</news:language>\n      </news:publication>\n      <news:publication_date>' + escapeXml(article.created_at) + '</news:publication_date>\n      <news:title>' + escapeXml(article.title) + '</news:title>\n    </news:news>\n  </url>';
  });

  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n' + entries.join('\n') + '\n</urlset>\n';
}

export function buildImageSitemapXml({ siteOrigin, articles = [] }) {
  const entries = articles
    .filter((article) => article?.id && article?.image_url)
    .map((article) => {
      const imageUrl = absoluteUrl(siteOrigin, article.image_url);
      return '  <url>\n    <loc>' + escapeXml(articleUrl(siteOrigin, article)) + '</loc>\n    <image:image>\n      <image:loc>' + escapeXml(imageUrl) + '</image:loc>\n      <image:title>' + escapeXml(article.title || SITE_NAME) + '</image:title>' + (article.caption ? '\n      <image:caption>' + escapeXml(article.caption) + '</image:caption>' : '') + '\n    </image:image>\n  </url>';
    });

  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + entries.join('\n') + '\n</urlset>\n';
}
