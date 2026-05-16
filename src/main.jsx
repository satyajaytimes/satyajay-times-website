import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Clock3, Download, Facebook, Instagram, Mail, MapPin, Newspaper, Phone, Search, Twitter, X, Youtube } from 'lucide-react';
import './style.css';

const logo = '/satyajay-logo.jpg';
const categories = ['फरीदाबाद', 'हरियाणा', 'राष्ट्रीय', 'अंतर्राष्ट्रीय', 'क्रिकेट', 'मनोरंजन', 'वीडियो न्यूज़'];

const seedArticles = [
  { id: '1', title: 'फरीदाबाद में विकास कार्यों की समीक्षा, अधिकारियों को समय सीमा में काम पूरा करने के निर्देश', category: 'फरीदाबाद', caption: 'नगर निगम और जिला प्रशासन की संयुक्त बैठक में जनहित के मुद्दों पर तेज कार्रवाई का भरोसा।', image_url: '/news-images/faridabad.svg', author: 'सत्यजय संवाददाता', is_breaking: true, is_featured: true },
  { id: '2', title: 'हरियाणा में शिक्षा सुधार अभियान तेज, सरकारी स्कूलों में नई सुविधाओं पर जोर', category: 'हरियाणा', caption: 'विद्यालयों में डिजिटल कक्षाएं, पुस्तकालय और खेल सुविधाओं को मजबूत करने की तैयारी।', image_url: '/news-images/farmers.svg', author: 'राजेश शर्मा', is_breaking: true },
  { id: '3', title: 'भारत ने रोमांचक मुकाबले में जीत दर्ज की, युवा बल्लेबाज बने हीरो', category: 'क्रिकेट', caption: 'अंतिम ओवर तक चले मुकाबले में टीम इंडिया ने शानदार प्रदर्शन किया।', image_url: '/news-images/cricket.svg', author: 'स्पोर्ट्स डेस्क', is_breaking: true },
  { id: '4', title: 'मनोरंजन जगत में नई फिल्म की घोषणा, हरियाणा के कलाकारों को मिला मौका', category: 'मनोरंजन', caption: 'स्थानीय प्रतिभाओं को बड़े मंच पर लाने की कोशिश को सराहना मिली।', image_url: '/news-images/entertainment.svg', author: 'मनोरंजन ब्यूरो' },
  { id: '5', title: 'वैश्विक बाजारों में हलचल, एशियाई अर्थव्यवस्थाओं पर नजर', category: 'अंतर्राष्ट्रीय', caption: 'विशेषज्ञों ने निवेशकों को सतर्क रणनीति अपनाने की सलाह दी।', image_url: '/news-images/international.svg', author: 'विदेश डेस्क' },
  { id: '6', title: 'दिल्ली-एनसीआर में प्रदूषण नियंत्रण के लिए नई कार्ययोजना लागू', category: 'राष्ट्रीय', caption: 'वाहन, निर्माण और औद्योगिक गतिविधियों की निगरानी के लिए संयुक्त टीमें बनेंगी।', image_url: '/news-images/national.svg', author: 'नेशनल डेस्क' },
];

const seedTickers = [
  'फरीदाबाद में आज सफाई अभियान के लिए विशेष टीमें तैनात',
  'हरियाणा सरकार ने नागरिक सेवाओं की समीक्षा बैठक बुलाई',
  'क्रिकेट में भारत की शानदार जीत पर प्रशंसकों में उत्साह',
];

const defaultEPaper = { title: 'आज का अखबार - 9 मई 2026', image_url: '/epaper-cover.svg', pdf_url: '#', is_active: true };

function readEPaper() {
  const saved = localStorage.getItem('sjt_epapers');
  if (!saved) return defaultEPaper;
  const first = JSON.parse(saved).find((item) => item.is_active) || defaultEPaper;
  return { ...first, image_url: first.image_url?.startsWith('http') ? '/epaper-cover.svg' : first.image_url || '/epaper-cover.svg' };
}
function readArticles() {
  const saved = localStorage.getItem('sjt_articles');
  return saved ? JSON.parse(saved) : seedArticles;
}
function readTickers() {
  const saved = localStorage.getItem('sjt_tickers');
  if (!saved) return seedTickers;
  return JSON.parse(saved).map((item) => typeof item === 'string' ? item : item?.text || '').filter(Boolean);
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function App() {
  const [route, setRoute] = useState(location.pathname);
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(new Date());
  const [popup, setPopup] = useState(false);
  const [epaper, setEPaper] = useState(readEPaper());
  const [siteArticles, setSiteArticles] = useState(readArticles());
  const [tickers, setTickers] = useState(readTickers());
  const isAdmin = route === '/admin';

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    const onPop = () => setRoute(location.pathname);
    addEventListener('popstate', onPop);
    const last = Number(localStorage.getItem('sjt_epaper_popup_seen') || 0);
    if (Date.now() - last > 10 * 60 * 60 * 1000) setTimeout(() => setPopup(true), 600);
    return () => { clearInterval(tick); removeEventListener('popstate', onPop); };
  }, []);

  function go(path) {
    history.pushState(null, '', path);
    setRoute(path);
  }

  if (isAdmin) return <Admin go={go} epaper={epaper} setEPaper={setEPaper} articles={siteArticles} setArticles={setSiteArticles} tickers={tickers} setTickers={setTickers} />;

  return (
    <>
      <Header now={now} query={query} setQuery={setQuery} go={go} />
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
  return (
    <header>
      <div className="topbar"><div><span className="live-dot" /> <b>लाइव</b> <b>सत्य का प्रहरी आपके हाथ</b></div><div><span className="weather">☼ फरीदाबाद 28°C, साफ मौसम</span><Clock3 size={16} /> <b>{time}</b> <b>{date}</b></div></div>
      <div className="masthead"><img src={logo} /><div className="brand"><h1>सत्यजय टाइम्स</h1><p>Satyajay Times</p><strong>➻ हिंदी दैनिक समाचार पत्र</strong></div><form onSubmit={(event) => event.preventDefault()} className="search"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="खोजें..." /><Search /></form><div className="date-box"><b>तारीख {date}</b><b>समय {time}</b></div></div>
      <nav>{['होम', 'फरीदाबाद', 'हरियाणा', 'क्रिकेट', 'मनोरंजन', 'राष्ट्रीय', 'अंतर्राष्ट्रीय', 'वीडियो न्यूज़'].map((item) => <button key={item} onClick={() => item === 'होम' && go('/')}>{item}</button>)}</nav>
    </header>
  );
}
function Ticker({ tickers }) {
  const safeTickers = tickers.map((item) => typeof item === 'string' ? item : item?.text).filter(Boolean);
  return <div className="ticker"><b>🔴 ब्रेकिंग</b><marquee>{safeTickers.join('   •   ')}</marquee></div>;
}
function Lead({ article, large }) {
  return <article className={`lead ${large ? 'large' : ''}`}><img src={article?.image_url} /><div><span>{article?.category}</span><h2>{article?.title}</h2><p>{article?.caption}</p><small>◷ 2 दिन पहले ➻ {article?.author}</small></div></article>;
}
function Card({ article, small }) {
  return <article className={small ? 'small-card' : 'card'}><img src={article.image_url} /><div><h3>{article.title}</h3><p>{article.category}</p></div></article>;
}
function EPaperPopup({ epaper, onClose }) {
  return <div className="modal"><div className="popup"><button className="close" onClick={onClose}><X /></button><h2>{epaper.title}</h2><img src={epaper.image_url || '/epaper-cover.svg'} /><a className="download" href={epaper.pdf_url || '#'}><Download /> PDF डाउनलोड करें</a></div></div>;
}

function Admin({ go, epaper, setEPaper, articles, setArticles, tickers, setTickers }) {
  const [tab, setTab] = useState('dashboard');
  return <main className="admin"><aside><h1>सत्यजय टाइम्स</h1>{['dashboard', 'articles', 'epaper', 'ticker'].map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item === 'dashboard' ? 'Dashboard' : item === 'articles' ? 'Articles' : item === 'epaper' ? 'E-Paper' : 'Ticker'}</button>)}<button onClick={() => go('/')}>Website</button></aside><section>{tab === 'dashboard' && <Dashboard articles={articles} tickers={tickers} />}{tab === 'articles' && <ArticlesAdmin articles={articles} setArticles={setArticles} />}{tab === 'epaper' && <EPaperAdmin epaper={epaper} setEPaper={setEPaper} />}{tab === 'ticker' && <TickerAdmin tickers={tickers} setTickers={setTickers} />}</section></main>;
}
function Dashboard({ articles, tickers }) {
  return <><h2>Dashboard</h2><div className="stats"><div><b>{articles.length}</b><span>Total Articles</span></div><div><b>{articles.filter((item) => item.is_breaking).length}</b><span>Breaking</span></div><div><b>{tickers.length}</b><span>Ticker Messages</span></div></div><h3>Recent Articles</h3><div className="admin-list">{articles.slice(0, 6).map((item) => <p key={item.id}>{item.title}</p>)}</div></>;
}
function ArticlesAdmin({ articles, setArticles }) {
  const empty = { id: '', title: '', category: 'फरीदाबाद', caption: '', image_url: '/news-images/faridabad.svg', author: '', is_breaking: false, is_featured: false };
  const [draft, setDraft] = useState(empty);
  async function save(event) {
    event.preventDefault();
    const nextArticle = { ...draft, id: draft.id || crypto.randomUUID() };
    const next = articles.some((item) => item.id === nextArticle.id) ? articles.map((item) => item.id === nextArticle.id ? nextArticle : item) : [nextArticle, ...articles];
    localStorage.setItem('sjt_articles', JSON.stringify(next));
    setArticles(next);
    setDraft(empty);
  }
  async function pickImage(event) {
    const file = event.target.files?.[0];
    if (file) setDraft({ ...draft, image_url: await fileToDataUrl(file) });
  }
  function remove(id) {
    const next = articles.filter((item) => item.id !== id);
    localStorage.setItem('sjt_articles', JSON.stringify(next));
    setArticles(next);
  }
  return <><h2>Articles</h2><form onSubmit={save} className="admin-form"><label>Title<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required /></label><label>Category<select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{categories.map((cat) => <option key={cat}>{cat}</option>)}</select></label><label>Caption<textarea value={draft.caption} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} /></label><label>Article Image<input type="file" accept="image/*" onChange={pickImage} /></label>{draft.image_url && <img className="admin-preview-img" src={draft.image_url} />}<label>Author<input value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} /></label><label className="check"><input type="checkbox" checked={draft.is_breaking} onChange={(e) => setDraft({ ...draft, is_breaking: e.target.checked })} /> Breaking news</label><label className="check"><input type="checkbox" checked={draft.is_featured} onChange={(e) => setDraft({ ...draft, is_featured: e.target.checked })} /> Featured</label><button>{draft.id ? 'Update Article' : 'Create Article'}</button></form><div className="admin-list">{articles.map((item) => <div key={item.id}><span>{item.title}</span><button onClick={() => setDraft(item)}>Edit</button><button onClick={() => remove(item.id)}>Delete</button></div>)}</div></>;
}
function EPaperAdmin({ epaper, setEPaper }) {
  const [draft, setDraft] = useState(epaper);
  async function save(event) {
    event.preventDefault();
    const next = { ...draft, image_url: draft.image_url || '/epaper-cover.svg', is_active: true };
    localStorage.setItem('sjt_epapers', JSON.stringify([next]));
    localStorage.removeItem('sjt_epaper_popup_seen');
    setEPaper(next);
    alert('E-paper saved');
  }
  async function pickImage(event) {
    const file = event.target.files?.[0];
    if (file) setDraft({ ...draft, image_url: await fileToDataUrl(file) });
  }
  async function pickPdf(event) {
    const file = event.target.files?.[0];
    if (file) setDraft({ ...draft, pdf_url: await fileToDataUrl(file) });
  }
  return <><h2>E-Paper</h2><p>Image और PDF direct attach करें. URL paste करना जरूरी नहीं है.</p><form onSubmit={save} className="admin-form"><label>Title<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label><label>Front Page Image<input type="file" accept="image/*" onChange={pickImage} /></label>{draft.image_url && <img className="admin-preview-img" src={draft.image_url} />}<label>PDF File<input type="file" accept="application/pdf" onChange={pickPdf} /></label>{draft.pdf_url && draft.pdf_url !== '#' && <a className="file-chip" href={draft.pdf_url} target="_blank">Attached PDF preview</a>}<button>Save E-Paper</button></form></>;
}
function TickerAdmin({ tickers, setTickers }) {
  const [text, setText] = useState('');
  const safeTickers = tickers.map((item) => typeof item === 'string' ? item : item?.text).filter(Boolean);
  function add(event) {
    event.preventDefault();
    if (!text.trim()) return;
    const next = [...safeTickers, text.trim()];
    localStorage.setItem('sjt_tickers', JSON.stringify(next));
    setTickers(next);
    setText('');
  }
  function remove(index) {
    const next = safeTickers.filter((_, itemIndex) => itemIndex !== index);
    localStorage.setItem('sjt_tickers', JSON.stringify(next));
    setTickers(next);
  }
  return <><h2>Ticker</h2><form onSubmit={add} className="admin-form ticker-form"><label>Breaking ticker text<input value={text} onChange={(e) => setText(e.target.value)} /></label><button>Add Ticker</button></form><div className="admin-list">{safeTickers.map((item, index) => <div key={`${item}-${index}`}><span>{item}</span><button onClick={() => remove(index)}>Delete</button></div>)}</div></>;
}
function Footer() {
  const socials = [['Facebook', 'https://facebook.com/satyajaytimes', Facebook], ['YouTube', 'https://youtube.com/@SatyajayT', Youtube], ['Instagram', 'https://instagram.com/satyajaytimes', Instagram], ['Twitter', 'https://twitter.com/SatyajayT', Twitter]];
  return <footer><div><h2>सत्यजय टाइम्स</h2><p>सत्य का प्रहरी आपके हाथ</p></div><div><p><MapPin />5 आर-1 (प्रथम तल), HDFC बैंक B.K. चौक NIT, फरीदाबाद</p><p><Phone />9811232533</p><p><Mail />sjtfaridabad@gmail.com</p><div className="socials">{socials.map(([label, href, Icon]) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}><Icon /></a>)}</div></div></footer>;
}

createRoot(document.getElementById('root')).render(<App />);
