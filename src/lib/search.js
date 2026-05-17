const EN_TO_HI = {
  faridabad: 'फरीदाबाद',
  cricket: 'क्रिकेट',
  haryana: 'हरियाणा',
  india: 'भारत',
  national: 'राष्ट्रीय',
  international: ['अंतरराष्ट्रीय', 'अंतर्राष्ट्रीय'],
  entertainment: 'मनोरंजन',
  videos: 'वीडियो',
  manoranjan: 'मनोरंजन',
  rashtriya: 'राष्ट्रीय',
  antarrashtriya: 'अंतर्राष्ट्रीय',
};

function addTerm(terms, value) {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((item) => terms.add(item.toLowerCase()));
    return;
  }
  terms.add(value.toLowerCase());
}

export function buildSearchTerms(query) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const lower = trimmed.toLowerCase();
  const terms = new Set([lower]);

  addTerm(terms, EN_TO_HI[lower]);

  lower.split(/\s+/).forEach((word) => {
    if (EN_TO_HI[word]) addTerm(terms, EN_TO_HI[word]);
  });

  return [...terms];
}

function getArticleHaystack(article) {
  return [article.title, article.caption, article.content, article.category, article.tags]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function searchArticles(articles, query) {
  const terms = buildSearchTerms(query);
  if (!terms.length) return [];

  return articles.filter((article) => {
    const haystack = getArticleHaystack(article);
    return terms.some((term) => haystack.includes(term));
  });
}
