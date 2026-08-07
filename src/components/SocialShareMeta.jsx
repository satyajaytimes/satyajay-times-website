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
      <script type="application/ld+json">{JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'NewsMediaOrganization',
            name: SITE_NAME,
            alternateName: 'Satyajay Times',
            url: homeCanonicalUrl(),
            logo: {
              '@type': 'ImageObject',
              url: DEFAULT_OG_IMAGE,
              width: 512,
              height: 512,
            },
          },
          {
            '@type': 'WebSite',
            name: SITE_NAME,
            url: homeCanonicalUrl(),
            potentialAction: {
              '@type': 'SearchAction',
              target: `${homeCanonicalUrl()}search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          },
        ],
      })}</script>
    </Helmet>
  );
}

export function ArticleSocialMetaHelmet({ article, articleId }) {
  if (!article) return null;

  const canonical = articleCanonicalUrl(articleId);
  const title = article.title?.trim() || HOME_TITLE;
  const description = articleShareDescription(article);
  const image = articleShareImage(article);
  const datePublished = article.created_at || undefined;
  const dateModified = article.updated_at || article.created_at || undefined;
  const articleBody = String(article.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        headline: title,
        description,
        image: [image],
        datePublished,
        dateModified,
        author: { '@type': 'Organization', name: article.author || SITE_NAME },
        publisher: {
          '@type': 'NewsMediaOrganization',
          name: SITE_NAME,
          logo: {
            '@type': 'ImageObject',
            url: DEFAULT_OG_IMAGE,
            width: 512,
            height: 512,
          },
        },
        articleSection: article.category || undefined,
        keywords: article.tags || undefined,
        articleBody: articleBody || undefined,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE_NAME, item: homeCanonicalUrl() },
          article.category ? { '@type': 'ListItem', position: 2, name: article.category } : undefined,
          { '@type': 'ListItem', position: article.category ? 3 : 2, name: title, item: canonical },
        ].filter(Boolean),
      },
    ],
  };

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
      <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
    </Helmet>
  );
}
