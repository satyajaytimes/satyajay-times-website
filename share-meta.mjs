export const SITE_NAME = 'सत्यजय टाइम्स';

export const HOME_TITLE = 'सत्यजय टाइम्स';

export const HOME_DESCRIPTION =
  'हिंदी दैनिक समाचार पत्र - Faridabad, Haryana, National and International News';

export const DEFAULT_SITE_ORIGIN = 'https://satyajaytimes.com';

export function getSiteOrigin(envSiteUrl) {
  const raw = envSiteUrl || DEFAULT_SITE_ORIGIN;
  return String(raw).replace(/\/$/, '');
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function absoluteUrl(siteOrigin, pathOrUrl) {
  if (!pathOrUrl) return `${siteOrigin}/satyajay-logo.jpg`;
  const s = String(pathOrUrl).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith('/') ? s : `/${s}`;
  return `${siteOrigin}${path}`;
}

export function articleShareDescription(article) {
  const caption = article?.caption?.trim();
  if (caption) {
    return caption.length > 200 ? `${caption.slice(0, 197)}...` : caption;
  }
  const text = String(article?.content || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return HOME_DESCRIPTION;
  return text.length > 200 ? `${text.slice(0, 197)}...` : text;
}

export function articleShareImage(siteOrigin, article) {
  const url = article?.image_url?.trim();
  if (!url) return absoluteUrl(siteOrigin, '/satyajay-logo.jpg');
  return absoluteUrl(siteOrigin, url);
}

export function buildArticleHeadTags({ siteOrigin, articleId, article }) {
  const canonical = `${siteOrigin}/article/${articleId}`;
  const title = article?.title?.trim() || HOME_TITLE;
  const description = article ? articleShareDescription(article) : HOME_DESCRIPTION;
  const image = article ? articleShareImage(siteOrigin, article) : absoluteUrl(siteOrigin, '/satyajay-logo.jpg');

  return buildShareHeadTags({
    title,
    description,
    canonical,
    image,
    type: 'article',
  });
}

export function buildArticleNotFoundHeadTags({ siteOrigin, articleId }) {
  const canonical = `${siteOrigin}/article/${articleId}`;
  const title = `लेख नहीं मिला | ${SITE_NAME}`;
  const description = 'यह लेख उपलब्ध नहीं है।';
  const image = absoluteUrl(siteOrigin, '/satyajay-logo.jpg');

  return buildShareHeadTags({
    title,
    description,
    canonical,
    image,
    type: 'article',
  });
}

function buildShareHeadTags({ title, description, canonical, image, type }) {
  const e = escapeHtml;

  return `    <title>${e(title)}</title>
    <meta name="description" content="${e(description)}" />
    <link rel="canonical" href="${e(canonical)}" />
    <meta property="og:title" content="${e(title)}" />
    <meta property="og:description" content="${e(description)}" />
    <meta property="og:image" content="${e(image)}" />
    <meta property="og:url" content="${e(canonical)}" />
    <meta property="og:type" content="${e(type)}" />
    <meta property="og:site_name" content="${e(SITE_NAME)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${e(title)}" />
    <meta name="twitter:description" content="${e(description)}" />
    <meta name="twitter:image" content="${e(image)}" />`;
}

export function buildHomeHeadTags(siteOrigin) {
  const canonical = `${siteOrigin}/`;
  const image = absoluteUrl(siteOrigin, '/satyajay-logo.jpg');

  return buildShareHeadTags({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    canonical,
    image,
    type: 'website',
  });
}

export function injectHeadMeta(html, metaHeadInner) {
  const head = `<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
${metaHeadInner}
  </head>`;
  return html.replace(/<head[\s\S]*?<\/head>/i, head);
}

export async function fetchArticleById(articleId, { supabaseUrl, supabaseKey }) {
  if (!supabaseUrl || !supabaseKey || !articleId) return null;

  const url = new URL(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/articles`);
  url.searchParams.set('id', `eq.${articleId}`);
  url.searchParams.set('is_published', 'eq.true');
  url.searchParams.set('select', 'id,title,caption,content,image_url');

  const response = await fetch(url.toString(), {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!response.ok) return null;
  const rows = await response.json();
  return rows?.[0] || null;
}

export async function buildArticleHtmlFromTemplate(html, { siteOrigin, articleId, article }) {
  const meta = buildArticleHeadTags({ siteOrigin, articleId, article });
  return injectHeadMeta(html, meta);
}
