const rawOrigin = import.meta.env.VITE_SITE_URL || 'https://satyajaytimes.com';

export const SITE_ORIGIN = String(rawOrigin).replace(/\/$/, '');

export const SITE_NAME = 'सत्यजय टाइम्स';

export const HOME_TITLE = 'सत्यजय टाइम्स';

export const HOME_DESCRIPTION =
  'हिंदी दैनिक समाचार पत्र - Faridabad, Haryana, National and International News';

export function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return `${SITE_ORIGIN}/satyajay-logo.jpg`;
  const s = String(pathOrUrl).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith('/') ? s : `/${s}`;
  return `${SITE_ORIGIN}${path}`;
}

export function homeCanonicalUrl() {
  return `${SITE_ORIGIN}/`;
}

export function articleCanonicalUrl(articleId) {
  return `${SITE_ORIGIN}/article/${articleId}`;
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

export function articleShareImage(article) {
  const url = article?.image_url?.trim();
  if (!url) return absoluteUrl('/satyajay-logo.jpg');
  return absoluteUrl(url);
}
