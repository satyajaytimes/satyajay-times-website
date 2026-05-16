import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Clock3, Download, Facebook, Instagram, Mail, MapPin, Newspaper, Phone, Search, Twitter, X, Youtube } from 'lucide-react';
import ProtectedRoute from './components/ProtectedRoute';
import { getArticles, getEPapers, getTicker } from './lib/api';
import Login from './pages/Login';
import AdminPage from './pages/Admin';
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

function App() {
  const [route, setRoute] = useState(location.pathname);
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(new Date());
  const [popup, setPopup] = useState(false);
  const [epaper, setEPaper] = useState(defaultEPaper);
  const [siteArticles, setSiteArticles] = useState(seedArticles);
  const [tickers, setTickers] = useState(seedTickers);
  const isAdmin = route === '/admin';
  const isLogin = route === '/login';

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    const onPop = () => setRoute(location.pathname);
    addEventListener('popstate', onPop);
    return () => { clearInterval(tick); removeEventListener('popstate', onPop); };
  }, []);

  useEffect(() => {
    async function loadPublicData() {
      try {
        const [articleRows, tickerRows, epaperRows] = await Promise.all([getArticles(), getTicker(), getEPapers()]);
        const publishedArticles = articleRows.filter((item) => item.is_published !== false);
        const activeTickers = tickerRows.filter((item) => item.is_active !== false);
        const activeEPaper = epaperRows.find((item) => item.is_active) || epaperRows[0];
        if (publishedArticles.length) setSiteArticles(publishedArticles);
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
    if (!isAdmin && !isLogin && Date.now() - last > 10 * 60 * 60 * 1000) {
      const id = setTimeout(() => setPopup(true), 600);
      return () => clearTimeout(id);
    }
  }, [isAdmin, isLogin]);

  function navigate(path) {
    history.pushState(null, '', path);
    setRoute(path);
  }

  if (isLogin) return <Login navigate={navigate} />;
  if (isAdmin) return <ProtectedRoute navigate={navigate}><AdminPage navigate={navigate} /></ProtectedRoute>;

  return (
    <>
      <Header now={now} query={query} setQuery={setQuery} go={navigate} />
      <Ticker tickers={tickers} />
      <main>
        <section className="epaper-strip"><button onClick={() => setPopup(true)}><Newspaper /> 📰 आज का अखबार</button></section>
        <section className="page-grid">
          <div>
            <section className="lead-grid">
              <Lead article={siteArticles[0]} large />
              <div className="side-leads"><Lead article={siteArticles[1]} /><Lead article={siteArticles[2]} /></div>
            </section>
            <h2 className="section-title">ब्रेकिंग न्यूज़</h2>
            <div className="cards">{siteArticles.filter((item) => item.is_breaking).map((item) => <Card key={item.id} article={item} />)}</div>
            {['फरीदाबाद', 'हरियाणा', 'राष्ट्रीय', 'अंतर्राष्ट्रीय', 'क्रिकेट', 'मनोरंजन'].map((cat) => (
              <section key={cat}><h2 className="section-title">{cat}</h2><div className="cards">{siteArticles.filter((item) => item.category === cat).map((item) => <Card key={item.id} article={item} />)}</div></section>
            ))}
          </div>
          <aside className="latest"><h2>ताज़ा खबरें</h2>{siteArticles.map((item) => <Card key={item.id} article={item} small />)}</aside>
        </section>
      </main>
      <Footer />
      {popup && <EPaperPopup epaper={epaper} onClose={() => { localStorage.setItem('sjt_epaper_popup_seen', String(Date.now())); setPopup(false); }} />}
    </>
  );
}

function Header({ now, query, setQuery, go }) {
  const date = new Intl.DateTimeFormat('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  const time = new Intl.DateTimeFormat('hi-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
  return <header><div className="topbar"><div><span className="live-dot" /> <b>लाइव</b> <b>सत्य का प्रहरी आपके हाथ</b></div><div><span className="weather">☼ फरीदाबाद 28°C, साफ मौसम</span><Clock3 size={16} /> <b>{time}</b> <b>{date}</b></div></div><div className="masthead"><img src={logo} /><div className="brand"><h1>सत्यजय टाइम्स</h1><p>Satyajay Times</p><strong>➻ हिंदी दैनिक समाचार पत्र</strong></div><form onSubmit={(event) => event.preventDefault()} className="search"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="खोजें..." /><Search /></form><div className="date-box"><b>तारीख {date}</b><b>समय {time}</b></div></div><nav>{['होम', 'फरीदाबाद', 'हरियाणा', 'क्रिकेट', 'मनोरंजन', 'राष्ट्रीय', 'अंतर्राष्ट्रीय', 'वीडियो न्यूज़'].map((item) => <button key={item} onClick={() => item === 'होम' && go('/')}>{item}</button>)}</nav></header>;
}
function Ticker({ tickers }) {
  const safeTickers = tickers.map((item) => typeof item === 'string' ? item : item?.text).filter(Boolean);
  return <div className="ticker"><b>🔴 ब्रेकिंग</b><marquee>{safeTickers.join('   •   ')}</marquee></div>;
}
function Lead({ article, large }) {
  return <article className={`lead ${large ? 'large' : ''}`}><img src={article?.image_url || '/news-images/faridabad.svg'} /><div><span>{article?.category}</span><h2>{article?.title}</h2><p>{article?.caption}</p><small>◷ 2 दिन पहले ➻ {article?.author}</small></div></article>;
}
function Card({ article, small }) {
  return <article className={small ? 'small-card' : 'card'}><img src={article.image_url || '/news-images/faridabad.svg'} /><div><h3>{article.title}</h3><p>{article.category}</p></div></article>;
}
function EPaperPopup({ epaper, onClose }) {
  return <div className="modal"><div className="popup"><button className="close" onClick={onClose}><X /></button><h2>{epaper.title}</h2><img src={epaper.image_url || '/epaper-cover.svg'} /><a className="download" href={epaper.pdf_url || '#'}><Download /> PDF डाउनलोड करें</a></div></div>;
}
function Footer() {
  const socials = [['Facebook', 'https://facebook.com/satyajaytimes', Facebook], ['YouTube', 'https://youtube.com/@SatyajayT', Youtube], ['Instagram', 'https://instagram.com/satyajaytimes', Instagram], ['Twitter', 'https://twitter.com/SatyajayT', Twitter]];
  return <footer><div><h2>सत्यजय टाइम्स</h2><p>सत्य का प्रहरी आपके हाथ</p></div><div><p><MapPin />5 आर-1 (प्रथम तल), HDFC बैंक B.K. चौक NIT, फरीदाबाद</p><p><Phone />9811232533</p><p><Mail />sjtfaridabad@gmail.com</p><div className="socials">{socials.map(([label, href, Icon]) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}><Icon /></a>)}</div></div></footer>;
}

createRoot(document.getElementById('root')).render(<App />);
