import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArticleSocialMetaHelmet } from '../components/SocialShareMeta';
import VideoEmbed, { getArticleVideoUrl } from '../components/VideoEmbed';
import { getArticleById, getRelatedArticles } from '../lib/api';
import { formatRelativeTime, getArticleTimestamp } from '../lib/time';
import ManagedMeta from '../components/ManagedMeta';

function initialArticle(id) {
  try {
    const article = JSON.parse(document.getElementById('sjt-article-data')?.textContent || 'null');
    return article?.id === id ? article : null;
  } catch {
    return null;
  }
}

export default function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(() => initialArticle(id));
  const [loading, setLoading] = useState(() => !initialArticle(id));
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const initial = initialArticle(id);
      setLoading(!initial);
      setNotFound(false);
      setLoadError(false);
      setArticle(initial);
      setRelatedArticles([]);

      try {
        const data = await getArticleById(id);
        if (cancelled) return;
        if (data) {
          setArticle(data);
          setLoading(false);
          try {
            const related = await getRelatedArticles({ articleId: id, category: data.category, limit: 4 });
            if (!cancelled) setRelatedArticles(related);
          } catch {
            if (!cancelled) setRelatedArticles([]);
          }
        } else {
          setNotFound(true);
        }
      } catch {
        if (!cancelled) {
          setLoadError(true);
          setNotFound(true);
        }
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
        <ManagedMeta robots={loadError ? 'index, follow' : 'noindex, follow'}>
          <title>{loadError ? 'खबर लोड नहीं हो सकी | सत्यजय टाइम्स' : 'लेख नहीं मिला | सत्यजय टाइम्स'}</title>
        </ManagedMeta>
        <p className="empty-state">
          {loadError ? 'खबर लोड नहीं हो सकी, कृपया दोबारा खोलें।' : 'यह खबर उपलब्ध नहीं है।'}
        </p>
      </section>
    );
  }

  const timestamp = getArticleTimestamp(article);
  const publishDate = timestamp
    ? new Intl.DateTimeFormat('hi-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(timestamp))
    : '';
  const relativeTime = formatRelativeTime(timestamp);
  const videoUrl = getArticleVideoUrl(article);

  async function copyArticleLink() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

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
              {publishDate ? <> • <time dateTime={timestamp}>{publishDate} IST</time></> : null}
              {article.author ? ` ➻ ${article.author}` : ''}
            </small>
            <div className="article-actions">
              <button type="button" onClick={copyArticleLink}>{copied ? 'लिंक कॉपी हो गया' : 'लिंक कॉपी करें'}</button>
            </div>
            {videoUrl ? <VideoEmbed url={videoUrl} /> : null}
            {article.content ? <div className="article-content">{String(article.content).replace(/\r\n?/g, '\n').split(/\n{2,}/).filter((paragraph) => paragraph.trim()).map((paragraph, index) => <p key={index} style={{ whiteSpace: 'pre-line' }}>{paragraph}</p>)}</div> : null}
          </div>
        </article>
        {relatedArticles.length ? (
          <section className="related-news">
            <h2>संबंधित खबरें</h2>
            <div className="cards">
              {relatedArticles.map((item) => (
                <Link key={item.id} to={`/article/${item.id}`} className="related-card-link">
                  <article className="card">
                    <img src={item.image_url || '/news-images/faridabad.svg'} alt={item.title} />
                    <div>
                      <h3>{item.title}</h3>
                      {item.caption ? <p className="caption">{item.caption}</p> : null}
                      <p className="category">{item.category}</p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </>
  );
}
