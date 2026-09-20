export const SITE_NAME = 'सत्यजय टाइम्स';

export const HOME_TITLE = 'सत्यजय टाइम्स - ताज़ा हिंदी समाचार';

export const HOME_DESCRIPTION =
  'सत्यजय टाइम्स पर फरीदाबाद, हरियाणा, राष्ट्रीय, अंतर्राष्ट्रीय, क्रिकेट और मनोरंजन की ताज़ा हिंदी खबरें पढ़ें।';

export const DEFAULT_SITE_ORIGIN = 'https://satyajaytimes.com';

const SECTION_NAMES = {
  faridabad: 'फरीदाबाद', haryana: 'हरियाणा', cricket: 'क्रिकेट',
  manoranjan: 'मनोरंजन', rashtriya: 'राष्ट्रीय', antarrashtriya: 'अंतर्राष्ट्रीय',
};

export function sectionMetadata(pathname) {
  const name = pathname === '/videos' ? 'वीडियो न्यूज़' : SECTION_NAMES[pathname.replace(/^\/category\//, '')];
  return name ? {
    title: `${name} की ताज़ा खबरें | ${SITE_NAME}`,
    description: `${SITE_NAME} पर ${name} की ताज़ा हिंदी खबरें और समाचार पढ़ें।`,
  } : null;
}

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
    robots: 'noindex, follow',
  });
}

export function articleStructuredData({ siteOrigin, articleId, article }) {
  const authorName = article.author?.trim() || SITE_NAME;
  const organization = /^(satyajay\s*times|सत्यजय टाइम्स)$/i.test(authorName);
  return {
    '@context': 'https://schema.org', '@type': 'NewsArticle',
    headline: article.title?.trim() || HOME_TITLE,
    description: articleShareDescription(article),
    image: [articleShareImage(siteOrigin, article)],
    datePublished: article.created_at || undefined,
    dateModified: article.updated_at || article.created_at || undefined,
    author: { '@type': organization ? 'Organization' : 'Person', name: authorName,
      ...(organization ? { url: siteOrigin } : {}) },
    publisher: {
      '@type': 'NewsMediaOrganization', name: SITE_NAME, url: siteOrigin,
      logo: { '@type': 'ImageObject', url: absoluteUrl(siteOrigin, '/favicon-512.png') },
    },
    isAccessibleForFree: true, inLanguage: 'hi',
    mainEntityOfPage: `${siteOrigin}/article/${articleId}`,
  };
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

function buildShareHeadTags({ title, description, canonical, image, type, publishedTime, modifiedTime, article, robots = 'index, follow, max-image-preview:large' }) {
  const e = escapeHtml;

  const articleDateTags = type === 'article' && publishedTime
    ? `
    <meta property="article:published_time" content="${e(publishedTime)}" />${modifiedTime ? `
    <meta property="article:modified_time" content="${e(modifiedTime)}" />` : ''}`
    : '';
  const articleJsonLd = type === 'article' && article
    ? `
    <script data-server-meta="true" type="application/ld+json">${JSON.stringify(articleStructuredData({
      siteOrigin: new URL(canonical).origin, articleId: article.id, article,
    })).replace(/</g, '\\u003c')}</script>`
    : '';

  return `    <title>${e(title)}</title>
    <meta name="description" content="${e(description)}" />
    <meta name="robots" content="${e(robots)}" />
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
  const adsenseTag = existingHead.match(/<meta\b[^>]*\bname=["']google-adsense-account["'][^>]*>/i)?.[0] || '';

  const head = `<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
${metaHeadInner}
${adsenseTag}
${assetTags ? `\n${assetTags}` : ''}
  </head>`;
  return html.replace(/<head[\s\S]*?<\/head>/i, () => markServerMetadata(head));
}

export function buildSectionHeadTags({ siteOrigin, pathname }) {
  const metadata = sectionMetadata(pathname);
  if (!metadata) return null;
  return buildShareHeadTags({ ...metadata, canonical: siteOrigin + pathname,
    image: absoluteUrl(siteOrigin, '/favicon-512.png'), type: 'website' });
}

export function buildPageHeadTags({ siteOrigin, pathname, title, description }) {
  return buildShareHeadTags({ title, description, canonical: siteOrigin + pathname,
    image: absoluteUrl(siteOrigin, '/favicon-512.png'), type: 'website' });
}

export function markServerMetadata(html) {
  return html.replace(/<(title|meta|link)\b[^>]*>/gi, (tag, name) => {
    const managed = name.toLowerCase() === 'title'
      || /\bname=["'](?:description|robots|twitter:[^"']+)["']/i.test(tag)
      || /\bproperty=["'](?:og:|article:)[^"']+["']/i.test(tag)
      || /\brel=["']canonical["']/i.test(tag);
    return managed && !tag.includes('data-server-meta')
      ? tag.replace(/^<\w+/, '$& data-server-meta="true"') : tag;
  });
}

export async function fetchArticleById(articleId, { supabaseUrl, supabaseKey }) {
  if (!articleId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(articleId)) return null;
  if (!supabaseUrl || !supabaseKey) throw new Error('Article service is not configured');

  const url = new URL(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/articles`);
  url.searchParams.set('id', `eq.${articleId}`);
  url.searchParams.set('is_published', 'eq.true');
  url.searchParams.set('select', 'id,title,caption,content,image_url,video_url,author,category,created_at');

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(10000),
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!response.ok) throw new Error('Article service is unavailable');
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Invalid article response');
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
  return injectArticleContent(injectHeadMeta(html, meta), { siteOrigin, article });
}

export function injectArticleContent(html, { siteOrigin, article }) {
  const e = escapeHtml;
  const date = new Date(article.created_at);
  const published = Number.isNaN(date.getTime()) ? '' : `<time datetime="${e(date.toISOString())}">${e(new Intl.DateTimeFormat('hi-IN', {
    day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata',
  }).format(date))} IST</time>`;
  const paragraphs = String(article.content || '').replace(/\r\n?/g, '\n').split(/\n{2,}/)
    .filter((paragraph) => paragraph.trim()).map((paragraph) => `<p style="white-space:pre-line">${e(paragraph)}</p>`).join('\n');
  const content = `<main><section class="page-grid" style="grid-template-columns:1fr"><article class="card article-detail">
    <img src="${e(articleShareImage(siteOrigin, article))}" alt="${e(article.title)}" />
    <div class="article-reading"><a href="/">${e(SITE_NAME)}</a><p class="category">${e(article.category || '')}</p>
    <h1>${e(article.title)}</h1>${article.caption ? `<p class="story-caption">${e(article.caption)}</p>` : ''}
    <small>${published}${article.author ? ` · ${e(article.author)}` : ''}</small>
    <div class="article-content">${paragraphs}</div></div>
    </article></section></main>`;
  const bootstrap = JSON.stringify(article).replace(/</g, '\\u003c');
  return html.replace(/<div id="root"><\/div>/, () => `<div id="root">${content}</div><script id="sjt-article-data" type="application/json">${bootstrap}</script>`);
}

export function injectMissingArticle(html) {
  return html.replace(/<div id="root"><\/div>/, '<div id="root"><main><p>यह खबर उपलब्ध नहीं है।</p><a href="/">होम पेज पर जाएँ</a></main></div>');
}
