import {
  HOME_DESCRIPTION as HOME_DESCRIPTION_BASE,
  HOME_TITLE as HOME_TITLE_BASE,
  SITE_NAME as SITE_NAME_BASE,
  absoluteUrl as absoluteUrlBase,
  articleShareDescription as articleShareDescriptionBase,
  articleShareImage as articleShareImageBase,
  getSiteOrigin,
} from '../../share-meta.mjs';

const rawOrigin = import.meta.env.VITE_SITE_URL;

export const SITE_ORIGIN = getSiteOrigin(rawOrigin);
export const SITE_NAME = SITE_NAME_BASE;
export const HOME_TITLE = HOME_TITLE_BASE;
export const HOME_DESCRIPTION = HOME_DESCRIPTION_BASE;

export function absoluteUrl(pathOrUrl) {
  return absoluteUrlBase(SITE_ORIGIN, pathOrUrl);
}

export function homeCanonicalUrl() {
  return `${SITE_ORIGIN}/`;
}

export function articleCanonicalUrl(articleId) {
  return `${SITE_ORIGIN}/article/${articleId}`;
}

export function articleShareDescription(article) {
  return articleShareDescriptionBase(article);
}

export function articleShareImage(article) {
  return articleShareImageBase(SITE_ORIGIN, article);
}
