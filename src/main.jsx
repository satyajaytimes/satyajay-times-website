import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Clock3, Download, Facebook, Instagram, Mail, MapPin, Newspaper, Phone, Search, Twitter, X, Youtube } from 'lucide-react';
import ProtectedRoute from './components/ProtectedRoute';
import { getArticles, getEPapers, getLatestPublishedArticles, getTicker } from './lib/api';
import Login from './pages/Login';
import AdminPage from './pages/Admin';
import ArticleDetail from './pages/ArticleDetail';
import ManagedMeta from './components/ManagedMeta';
import { sectionMetadata } from '../share-meta.mjs';
import { HomeSocialMetaHelmet } from './components/SocialShareMeta';
import { searchArticles } from './lib/search';
import { HOME_DESCRIPTION, HOME_TITLE, SITE_NAME, SITE_ORIGIN, absoluteUrl } from './lib/siteMeta';
import { formatRelativeTime, getArticleTimestamp } from './lib/time';
import { formatWeatherLabel, useWeather } from './lib/weather';
import './style.css';

const logo = '/satyajay-logo.jpg';

const seedArticles = [
  { id: '1', title: 'फरीदाबाद में विकास कार्यों की समीक्षा, अधिकारियों को समय सीमा में काम पूरा करने के निर्देश', category: 'फरीदाबाद', caption: 'नगर निगम और जिला प्रशासन की संयुक्त बैठक में जनहित के मुद्दों पर तेज कार्रवाई का भरोसा।', image_url: '/news-images/faridabad.svg', author: 'सत्यजय संवाददाता', is_breaking: true, is_featured: true, is_published: true },
  { id: '2', title: 'हरियाणा में शिक्षा सुधार अभियान तेज, सरकारी स्कूलों में नई सुविधाओं पर जोर', category: 'हरियाणा', caption: 'विद्यालयों में डिजिटल कक्षाएं, पुस्तकालय और खेल सुविधाओं को मजबूत करने की तैयारी।', image_url: '/news-images/farmers.svg', author: 'राजेश शर्मा', is_breaking: true, is_published: true },
  { id: '3', title: 'भारत ने रोमांचक मुकाबले में जीत दर्ज की, युवा बल्लेबाज बने हीरो', category: 'क्रिकेट', caption: 'अंतिम ओवर तक चले मुकाबले में टीम इंडिया ने शानदार प्रदर्शन किया।', image_url: '/news-images/cricket.svg', author: 'स्पोर्ट्स डेस्क', is_breaking: true, is_published: true },
  { id: '4', title: 'मनोरंजन जगत में नई फिल्म की घोषणा, हरियाणा के कलाकारों को मिला मौका', category: 'मनोरंजन', caption: 'स्थानीय प्रतिभाओं को बड़े मंच पर लाने की कोशिश को सराहना मिली।', image_url: '/news-images/entertainment.svg', author: 'मनोरंजन ब्यूरो', is_published: true },
  { id: '5', title: 'वैश्विक बाजारों में हलचल, एशियाई अर्थव्यवस्थाओं पर नजर', category: 'अंतर्राष्ट्रीय', caption: 'विशेषज्ञों ने निवेशकों को सतर्क रणनीति अपनाने की सलाह दी।', image_url: '/news-images/international.svg', author: 'विदेश डेस्क', is_published: true },
  { id: '6', title: 'दिल्ली-एनसीआर में प्रदूषण नियंत्रण के लिए नई कार्ययोजना लागू', category: 'राष्ट्रीय', caption: 'वाहन, निर्माण और औद्योगिक गतिविधियों की निगरानी के लिए संयुक्त टीमें बनेंगी।', image_url: '/news-images/national.svg', author: 'नेशनल डेस्क', is_published: true },
];

const seedTickers = [
  { text: 'फरीदाबाद में आज सफाई अभियान के लिए विशेष टीमें तैनात', is_active: true, display_order: 1 },
  { text: 'हरियाणा सरकार ने नागरिक सेवाओं की समीक्षा बैठक बुलाई', is_active: true, display_order: 2 },
  { text: 'क्रिकेट में भारत की शानदार जीत पर प्रशंसकों में उत्साह', is_active: true, display_order: 3 },
];

const defaultEPaper = { title: 'आज का अखबार - 9 मई 2026', issue_date: '2026-05-09', image_url: '/epaper-cover.svg', pdf_url: '#', is_active: true };

const socialLinks = [['Facebook', 'https://facebook.com/satyajaytimes', Facebook], ['YouTube', 'https://youtube.com/@SatyajayT', Youtube], ['Instagram', 'https://instagram.com/satyajaytimes', Instagram], ['Twitter', 'https://twitter.com/SatyajayT', Twitter]];

const navItems = [
  { label: 'होम', to: '/' },
  { label: 'फरीदाबाद', to: '/category/faridabad' },
  { label: 'हरियाणा', to: '/category/haryana' },
  { label: 'क्रिकेट', to: '/category/cricket' },
  { label: 'मनोरंजन', to: '/category/manoranjan' },
  { label: 'राष्ट्रीय', to: '/category/rashtriya' },
  { label: 'अंतर्राष्ट्रीय', to: '/category/antarrashtriya' },
  { label: 'वीडियो न्यूज़', to: '/videos' },
];

const slugToCategory = {
  faridabad: 'फरीदाबाद',
  haryana: 'हरियाणा',
  cricket: 'क्रिकेट',
  manoranjan: 'मनोरंजन',
  rashtriya: 'राष्ट्रीय',
  antarrashtriya: 'अंतर्राष्ट्रीय',
};

function AppShell() {
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(new Date());
  const [popup, setPopup] = useState(false);
  const [epaper, setEPaper] = useState(defaultEPaper);
  const [siteArticles, setSiteArticles] = useState(seedArticles);
  const [latestSidebarArticles, setLatestSidebarArticles] = useState(() =>
    seedArticles.filter((item) => item.is_published !== false).slice(0, 10),
  );
  const [tickers, setTickers] = useState(seedTickers);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    async function loadPublicData() {
      try {
        const [articleRows, tickerRows, epaperRows, latestRows] = await Promise.all([
          getArticles(),
          getTicker(),
          getEPapers(),
          getLatestPublishedArticles(10),
        ]);
        const publishedArticles = articleRows.filter((item) => item.is_published !== false);
        const activeTickers = tickerRows.filter((item) => item.is_active !== false);
        const activeEPaper = epaperRows.find((item) => item.is_active) || epaperRows[0];
        if (publishedArticles.length) setSiteArticles(publishedArticles);
        setLatestSidebarArticles(latestRows);
        if (activeTickers.length) setTickers(activeTickers);
        if (activeEPaper) setEPaper(activeEPaper);
      } catch (error) {
        console.warn(error.message);
      }
    }
    loadPublicData();
  }, []);

  useEffect(() => {
    const last = Number(localStorage.getItem('sjt_epaper_popup_seen') || 0);
    if (Date.now() - last > 10 * 60 * 60 * 1000) {
      const id = setTimeout(() => setPopup(true), 600);
      return () => clearTimeout(id);
    }
  }, []);

  return (
    <>
      <AppShellOtherRoutesMetaHelmet />
      <Header now={now} query={query} setQuery={setQuery} />
      <Ticker tickers={tickers} />
      <main>
        <section className="epaper-strip"><button onClick={() => setPopup(true)}><Newspaper /> 📰 आज का अखबार</button></section>
        <Routes>
          <Route path="/" element={<HomePage articles={siteArticles} latestArticles={latestSidebarArticles} />} />
          <Route path="/category/:slug" element={<CategoryPage articles={siteArticles} latestArticles={latestSidebarArticles} />} />
          <Route path="/videos" element={<VideosPage articles={siteArticles} latestArticles={latestSidebarArticles} />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          <Route path="/search" element={<SearchPage articles={siteArticles} latestArticles={latestSidebarArticles} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      {popup && <EPaperPopup epaper={epaper} onClose={() => { localStorage.setItem('sjt_epaper_popup_seen', String(Date.now())); setPopup(false); }} />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  );
}

function LoginRoute() {
  const navigate = useNavigate();
  return <Login navigate={navigate} />;
}

function AdminRoute() {
  const navigate = useNavigate();
  return <ProtectedRoute navigate={navigate}><AdminPage navigate={navigate} /></ProtectedRoute>;
}

function AppShellOtherRoutesMetaHelmet() {
  const { pathname } = useLocation();
  if (pathname === '/' || pathname.startsWith('/article/')) return null;
  const metadata = sectionMetadata(pathname) || { title: HOME_TITLE, description: HOME_DESCRIPTION };

  const canonical = `${SITE_ORIGIN}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
  const ogImage = absoluteUrl('/favicon-512.png');

  return (
    <ManagedMeta robots={pathname === '/search' ? 'noindex, follow' : undefined}>
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <link rel="canonical" href={canonical} />

      <meta property="og:title" content={metadata.title} />
      <meta property="og:description" content={metadata.description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metadata.title} />
      <meta name="twitter:description" content={metadata.description} />
      <meta name="twitter:image" content={ogImage} />
    </ManagedMeta>
  );
}

function HomePage({ articles, latestArticles }) {
  return (
    <>
      <HomeSocialMetaHelmet />
      <NewsLayout articles={articles} mainArticles={articles} latestArticles={latestArticles} />
    </>
  );
}

function CategoryPage({ articles, latestArticles }) {
  const { slug } = useParams();
  const category = slugToCategory[slug];
  if (!category) return <Navigate to="/" replace />;
  const filtered = articles.filter((item) => item.category === category);
  return <NewsLayout articles={articles} mainArticles={filtered} heading={category} latestArticles={latestArticles} />;
}

function VideosPage({ articles, latestArticles }) {
  const filtered = articles.filter((item) => item.category === 'वीडियो न्यूज़' || item.video_url);
  return <NewsLayout articles={articles} mainArticles={filtered} heading="वीडियो न्यूज़" latestArticles={latestArticles} />;
}

function SearchPage({ articles, latestArticles }) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const results = useMemo(() => searchArticles(articles, query), [articles, query]);

  return (
    <section className="page-grid">
      <div>
        <h1 className="section-title page-heading">
          {query ? `खोज परिणाम: ${query}` : 'खोज परिणाम'}
        </h1>
        {results.length ? (
          <div className="cards">
            {results.map((item) => (
              <Card key={item.id} article={item} />
            ))}
          </div>
        ) : (
          <p className="empty-state">कोई परिणाम नहीं मिला</p>
        )}
      </div>
      <aside className="latest">
        <h2>ताज़ा खबरें</h2>
        {latestArticles.map((item) => (
          <Card key={item.id} article={item} small />
        ))}
      </aside>
    </section>
  );
}

function NewsLayout({ articles, mainArticles, heading, latestArticles }) {
  const visibleArticles = mainArticles.length ? mainArticles : [];
  return (
    <section className="page-grid">
      <div>
        {heading ? <h1 className="section-title page-heading">{heading}</h1> : (
          <section className="lead-grid">
            <Lead article={articles[0]} large />
            <div className="side-leads"><Lead article={articles[1]} /><Lead article={articles[2]} /></div>
          </section>
        )}
        {!heading && <h2 className="section-title">ब्रेकिंग न्यूज़</h2>}
        {!heading && <div className="cards">{articles.filter((item) => item.is_breaking).slice(0, 6).map((item) => <Card key={item.id} article={item} />)}</div>}
        {heading ? (
          visibleArticles.length ? <div className="cards">{visibleArticles.map((item) => <Card key={item.id} article={item} />)}</div> : <p className="empty-state">इस सेक्शन में अभी कोई खबर उपलब्ध नहीं है।</p>
        ) : ['फरीदाबाद', 'हरियाणा', 'राष्ट्रीय', 'अंतर्राष्ट्रीय', 'क्रिकेट', 'मनोरंजन'].map((cat) => (
          <section key={cat}><h2 className="section-title">{cat}</h2><div className="cards">{articles.filter((item) => item.category === cat).slice(0, 6).map((item) => <Card key={item.id} article={item} />)}</div></section>
        ))}
      </div>
      <aside className="latest">
        <h2>ताज़ा खबरें</h2>
        {latestArticles.map((item) => (
          <Card key={item.id} article={item} small />
        ))}
      </aside>
    </section>
  );
}

function Header({ now, query, setQuery }) {
  const date = new Intl.DateTimeFormat('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  const time = new Intl.DateTimeFormat('hi-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
  const navigate = useNavigate();
  const weather = useWeather();
  const weatherLabel = formatWeatherLabel(weather);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return <header><div className="topbar"><div><span className="live-dot" /> <b>लाइव</b> <b>सत्य का प्रहरी आपके हाथ</b></div><div><span className="weather">{weatherLabel}</span><Clock3 size={16} /> <b>{time}</b> <b>{date}</b></div></div><div className="masthead"><img src={logo} /><div className="brand"><h1>सत्यजय टाइम्स</h1><p>Satyajay Times</p><strong>➻ हिंदी दैनिक समाचार पत्र</strong></div><div className="header-actions"><div className="header-socials">{socialLinks.map(([label, href, Icon]) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}><Icon size={22} /></a>)}</div><form onSubmit={handleSearchSubmit} className="search"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="खोजें..." /><Search /></form><a className="header-contact" href="tel:+919643311765"><Phone size={17} /> संपर्क करें: +91 9643311765</a></div><div className="date-box"><b>तारीख {date}</b><b>समय {time}</b></div></div><nav>{navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'}>{item.label}</NavLink>)}</nav></header>;
}

function Ticker({ tickers }) {
  const safeTickers = tickers.map((item) => typeof item === 'string' ? item : item?.text).filter(Boolean);
  return <div className="ticker"><b>🔴 ब्रेकिंग</b><marquee>{safeTickers.join('   •   ')}</marquee></div>;
}
function Lead({ article, large }) {
  if (!article?.id) return null;
  return (
    <Link to={`/article/${article.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article className={`lead ${large ? 'large' : ''}`}>
        <img src={article?.image_url || '/news-images/faridabad.svg'} alt={article?.title || SITE_NAME} />
        <div>
          <span>{article?.category}</span>
          <h2>{article?.title}</h2>
          <p>{article?.caption}</p>
          <small>◷ {formatRelativeTime(getArticleTimestamp(article))} ➻ {article?.author}</small>
        </div>
      </article>
    </Link>
  );
}
function Card({ article, small }) {
  if (!article?.id) return null;
  return (
    <Link to={`/article/${article.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article className={small ? 'small-card' : 'card'}>
        <img src={article.image_url || '/news-images/faridabad.svg'} alt={article.title || SITE_NAME} />
        <div>
          <h3>{article.title}</h3>
          {article.caption ? <p className="caption">{article.caption}</p> : null}
          <p className="category">{article.category}</p>
        </div>
      </article>
    </Link>
  );
}
function EPaperPopup({ epaper, onClose }) {
  return <div className="modal"><div className="popup"><button className="close" onClick={onClose}><X /></button><h2>{epaper.title}</h2><img src={epaper.image_url || '/epaper-cover.svg'} /><a className="download" href={epaper.pdf_url || '#'}><Download /> PDF डाउनलोड करें</a></div></div>;
}
function Footer() {
  return <footer><div><h2>सत्यजय टाइम्स</h2><p>सत्य का प्रहरी आपके हाथ</p></div><div><p><MapPin />5 आर-1 (प्रथम तल), HDFC बैंक B.K. चौक NIT, फरीदाबाद</p><p><Phone />+91 9643311765</p><p><Mail />sjtfaridabad@gmail.com</p><div className="socials">{socialLinks.map(([label, href, Icon]) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}><Icon /></a>)}</div></div></footer>;
}

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);
