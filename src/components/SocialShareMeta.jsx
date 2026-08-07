import { Helmet } from 'react-helmet-async';
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
  absoluteUrl,
  articleCanonicalUrl,
  articleShareDescription,
  articleShareImage,
  homeCanonicalUrl,
} from '../lib/siteMeta';

const DEFAULT_OG_IMAGE = absoluteUrl('/favicon-512.png');

export function HomeSocialMetaHelmet() {
  const canonical = homeCanonicalUrl();

  return (
    <Helmet prioritizeSeoTags>
      <title>{HOME_TITLE}</title>
      <meta name="description" content={HOME_DESCRIPTION} />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <meta name="theme-color" content="#c0392b" />
      <link rel="icon" type="image/png" sizes="512x512" href="/favicon-512.png" />
      <link rel="apple-touch-icon" href="/favicon-512.png" />
      <link rel="canonical" href={canonical} />

      <meta property="og:title" content={HOME_TITLE} />
      <meta property="og:description" content={HOME_DESCRIPTION} />
      <meta property="og:image" content={DEFAULT_OG_IMAGE} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={HOME_TITLE} />
      <meta name="twitter:description" content={HOME_DESCRIPTION} />
      <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
    </Helmet>
  );
}

export function ArticleSocialMetaHelmet({ article, articleId }) {
  if (!article) return null;

  const canonical = articleCanonicalUrl(articleId);
  const title = article.title?.trim() || HOME_TITLE;
  const description = articleShareDescription(article);
  const image = articleShareImage(article);

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="article" />
      {article.created_at ? <meta property="article:published_time" content={article.created_at} /> : null}
      {article.updated_at ? <meta property="article:modified_time" content={article.updated_at} /> : null}
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
