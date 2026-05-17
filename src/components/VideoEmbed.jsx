function normalizeInput(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
}

export function getArticleVideoUrl(article) {
  if (!article) return null;
  return article.video_url || article.embed_url || article.facebook_video_url || null;
}

export function resolveVideoEmbedUrl(raw) {
  const input = normalizeInput(raw);
  if (!input) return null;

  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    const fromQuery = parsed.searchParams.get('v');
    if (fromQuery && /^[\w-]{6,}$/.test(fromQuery)) {
      return `https://www.youtube.com/embed/${fromQuery}`;
    }

    const pathMatch = parsed.pathname.match(/\/(?:embed|shorts|live)\/([^/?#]+)/);
    if (pathMatch?.[1]) {
      return `https://www.youtube.com/embed/${pathMatch[1]}`;
    }

    return null;
  }

  if (host === 'youtu.be') {
    const id = parsed.pathname.split('/').filter(Boolean)[0];
    if (id && /^[\w-]{6,}$/.test(id)) {
      return `https://www.youtube.com/embed/${id}`;
    }
    return null;
  }

  if (
    host === 'facebook.com' ||
    host === 'fb.com' ||
    host === 'm.facebook.com' ||
    host === 'fb.watch'
  ) {
    if (parsed.pathname.includes('/plugins/video.php')) {
      return parsed.toString();
    }

    const href = encodeURIComponent(parsed.toString());
    return `https://www.facebook.com/plugins/video.php?href=${href}&show_text=false&width=500`;
  }

  if (host === 'instagram.com') {
    if (parsed.pathname.includes('/embed')) {
      return parsed.toString();
    }

    const match = parsed.pathname.match(/\/(reel|p|tv)\/([A-Za-z0-9_-]+)/);
    if (match) {
      return `https://www.instagram.com/${match[1]}/${match[2]}/embed`;
    }

    return null;
  }

  return null;
}

export default function VideoEmbed({ url }) {
  const embedUrl = resolveVideoEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <div
      className="article-video-embed"
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        margin: '16px 0',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      <iframe
        src={embedUrl}
        title="वीडियो"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
