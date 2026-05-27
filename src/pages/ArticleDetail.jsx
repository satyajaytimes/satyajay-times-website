import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArticleSocialMetaHelmet } from '../components/SocialShareMeta';
import VideoEmbed, { getArticleVideoUrl } from '../components/VideoEmbed';
import { getArticleById } from '../lib/api';
import { formatRelativeTime, getArticleTimestamp } from '../lib/time';

export default function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);
      setArticle(null);

      try {
        const data = await getArticleById(id);
        if (cancelled) return;
        if (data) setArticle(data);
        else setNotFound(true);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="route-loading">लोड हो रहा है...</div>;
  }

  if (notFound || !article) {
    return (
      <section className="page-grid">
        <p className="empty-state">Article not found</p>
      </section>
    );
  }

  const timestamp = getArticleTimestamp(article);
  const publishDate = timestamp
    ? new Intl.DateTimeFormat('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(timestamp))
    : '';
  const relativeTime = formatRelativeTime(timestamp);
  const videoUrl = getArticleVideoUrl(article);

  return (
    <>
      <ArticleSocialMetaHelmet article={article} articleId={id} key={article?.id || id} />
      <section className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
        <article className="card">
          <img src={article.image_url || '/news-images/faridabad.svg'} alt={article.title} />
          <div>
            <p className="category">{article.category}</p>
            <h1>{article.title}</h1>
            {article.caption ? <p className="story-caption">{article.caption}</p> : null}
            <small>
              {relativeTime ? `◷ ${relativeTime}` : ''}
              {publishDate ? ` • ${publishDate}` : ''}
              {article.author ? ` ➻ ${article.author}` : ''}
            </small>
            {videoUrl ? <VideoEmbed url={videoUrl} /> : null}
            {article.content ? <div>{article.content}</div> : null}
          </div>
        </article>
      </section>
    </>
  );
}
