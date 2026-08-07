export const SITE_NAME = 'सत्यजय टाइम्स';

export const HOME_TITLE = 'सत्यजय टाइम्स - ताज़ा हिंदी समाचार';

export const HOME_DESCRIPTION =
  'सत्यजय टाइम्स पर फरीदाबाद, हरियाणा, राष्ट्रीय, अंतर्राष्ट्रीय, क्रिकेट और मनोरंजन की ताज़ा हिंदी खबरें पढ़ें।';

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
  if (!pathOrUrl) return `${siteOrigin}/favicon-512.png`;
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

export function extractVideoThumbnail(videoUrl) {
  if (!videoUrl || typeof videoUrl !== 'string') return null;
  
  const url = videoUrl.trim();
  if (!url) return null;

  // YouTube URLs
  const youtubePatterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    /youtube\.com\/shorts\/([^"&?\/\s]{11})/,
    /youtube\.com\/live\/([^"&?\/\s]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
    }
  }

  // Facebook videos don't have a reliable public thumbnail API
  // Instagram videos don't have a reliable public thumbnail API
  // For other platforms, we return null and fall back to default image
  
  return null;
}

export function articleShareImage(siteOrigin, article) {
  const imageUrl = article?.image_url?.trim();
  if (imageUrl) return absoluteUrl(siteOrigin, imageUrl);
  
  // If no image, try video thumbnail
  const videoUrl = article?.video_url?.trim();
  if (videoUrl) {
    const videoThumbnail = extractVideoThumbnail(videoUrl);
    if (videoThumbnail) return videoThumbnail;
  }
  
  return absoluteUrl(siteOrigin, '/favicon-512.png');
}

export function buildArticleHeadTags({ siteOrigin, articleId, article }) {
  const canonical = `${siteOrigin}/article/${articleId}`;
  const title = article?.title?.trim() || HOME_TITLE;
  const description = article ? articleShareDescription(article) : HOME_DESCRIPTION;
  const image = article ? articleShareImage(siteOrigin, article) : absoluteUrl(siteOrigin, '/favicon-512.png');

  return buildShareHeadTags({
    title,
    description,
    canonical,
    image,
    type: 'article',
    publishedTime: article?.created_at,
    modifiedTime: article?.updated_at,
    article,
  });
}

export function buildArticleNotFoundHeadTags({ siteOrigin, articleId }) {
  const canonical = `${siteOrigin}/article/${articleId}`;
  const title = `लेख नहीं मिला | ${SITE_NAME}`;
  const description = 'यह लेख उपलब्ध नहीं है।';
  const image = absoluteUrl(siteOrigin, '/favicon-512.png');

  return buildShareHeadTags({
    title,
    description,
    canonical,
    image,
    type: 'article',
  });
}

function buildGoogleBasicSubscriptionsTags() {
  return `
    <script async type="application/javascript" src="https://news.google.com/swg/js/v1/swg-basic.js"></script>
    <script>
      (self.SWG_BASIC = self.SWG_BASIC || []).push((basicSubscriptions) => {
        basicSubscriptions.init({
          type: "NewsArticle",
          isPartOfType: ["Product"],
          isPartOfProductId: "CAow6PjGDA:openaccess",
          clientOptions: { theme: "light", lang: "hi" },
        });
      });
    </script>`;
}

function buildShareHeadTags({ title, description, canonical, image, type, publishedTime, modifiedTime, article }) {
  const e = escapeHtml;

  const articleDateTags = type === 'article' && publishedTime
    ? `
    <meta property="article:published_time" content="${e(publishedTime)}" />${modifiedTime ? `
    <meta property="article:modified_time" content="${e(modifiedTime)}" />` : ''}`
    : '';
  const articleJsonLd = type === 'article' && article
    ? `
    <script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: title,
      description,
      image: [image],
      datePublished: publishedTime || undefined,
      dateModified: modifiedTime || publishedTime || undefined,
      author: { '@type': 'Person', name: article.author || SITE_NAME },
      publisher: {
        '@type': 'NewsMediaOrganization',
        name: SITE_NAME,
        logo: { '@type': 'ImageObject', url: absoluteUrl(DEFAULT_SITE_ORIGIN, '/favicon-512.png') },
      },
      mainEntityOfPage: canonical,
    }).replace(/</g, '\\u003c')}</script>`
    : '';

  return `    <title>${e(title)}</title>
    <meta name="description" content="${e(description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="theme-color" content="#c0392b" />
    <link rel="icon" type="image/png" sizes="512x512" href="${e(absoluteUrl(DEFAULT_SITE_ORIGIN, '/favicon-512.png'))}" />
    <link rel="apple-touch-icon" href="${e(absoluteUrl(DEFAULT_SITE_ORIGIN, '/favicon-512.png'))}" />
    <link rel="canonical" href="${e(canonical)}" />
    <meta property="og:title" content="${e(title)}" />
    <meta property="og:description" content="${e(description)}" />
    <meta property="og:image" content="${e(image)}" />
    <meta property="og:url" content="${e(canonical)}" />
    <meta property="og:type" content="${e(type)}" />${articleDateTags}
    <meta property="og:site_name" content="${e(SITE_NAME)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${e(title)}" />
    <meta name="twitter:description" content="${e(description)}" />
    <meta name="twitter:image" content="${e(image)}" />${buildGoogleBasicSubscriptionsTags()}${articleJsonLd}`;
}

export function buildHomeHeadTags(siteOrigin) {
  const canonical = `${siteOrigin}/`;
  const image = absoluteUrl(siteOrigin, '/favicon-512.png');

  return buildShareHeadTags({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    canonical,
    image,
    type: 'website',
  });
}

export function injectHeadMeta(html, metaHeadInner) {
  const existingHead = html.match(/<head[\s\S]*?<\/head>/i)?.[0] || '';
  const moduleScripts = existingHead.match(/<script\b[^>]*type=["\']module["\'][^>]*><\/script>/gi) || [];
  const stylesheets = existingHead.match(/<link\b[^>]*rel=["\']stylesheet["\'][^>]*>/gi) || [];
  const modulePreloads = existingHead.match(/<link\b[^>]*rel=["\']modulepreload["\'][^>]*>/gi) || [];
  const assetTags = [...modulePreloads, ...moduleScripts, ...stylesheets].join('\n');

  const head = `<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
${metaHeadInner}
${assetTags ? `\n${assetTags}` : ''}
  </head>`;
  return html.replace(/<head[\s\S]*?<\/head>/i, head);
}

export async function fetchArticleById(articleId, { supabaseUrl, supabaseKey }) {
  if (!supabaseUrl || !supabaseKey || !articleId) return null;

  const url = new URL(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/articles`);
  url.searchParams.set('id', `eq.${articleId}`);
  url.searchParams.set('is_published', 'eq.true');
  url.searchParams.set('select', 'id,title,caption,content,image_url,video_url,author,category,created_at');

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

export async function fetchAllPublishedArticles({ supabaseUrl, supabaseKey }) {
  if (!supabaseUrl || !supabaseKey) return [];

  const url = new URL(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/articles`);
  url.searchParams.set('is_published', 'eq.true');
  url.searchParams.set('select', 'id,title,caption,content,image_url,video_url,author,category,created_at');
  url.searchParams.set('order', 'created_at.desc');

  const response = await fetch(url.toString(), {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!response.ok) return [];
  return response.json();
}

export async function buildArticleHtmlFromTemplate(html, { siteOrigin, articleId, article }) {
  const meta = buildArticleHeadTags({ siteOrigin, articleId, article });
  return injectHeadMeta(html, meta);
}
