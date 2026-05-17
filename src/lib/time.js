export function formatRelativeTime(date) {
  if (!date) return '';

  const then = new Date(date);
  if (Number.isNaN(then.getTime())) return '';

  const diffMs = Date.now() - then.getTime();
  if (diffMs < 0) return 'अभी';

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'अभी';
  if (diffMinutes < 60) return `${diffMinutes} मिनट पहले`;
  if (diffHours < 24) return `${diffHours} घंटे पहले`;
  return `${diffDays} दिन पहले`;
}

export function getArticleTimestamp(article) {
  return article?.published_at || article?.created_at || null;
}
