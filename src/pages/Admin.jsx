import { useEffect, useState } from 'react';
import {
  createArticle,
  createEPaper,
  createTicker,
  deleteArticle,
  deleteEPaper,
  deleteTicker,
  getArticles,
  getEPapers,
  getTicker,
  updateArticle,
  updateTicker,
  uploadArticleImage,
  uploadEPaperImage,
  uploadEPaperPdf,
} from '../lib/api';
import { supabase } from '../lib/supabase';

const categories = ['फरीदाबाद', 'हरियाणा', 'राष्ट्रीय', 'अंतर्राष्ट्रीय', 'क्रिकेट', 'मनोरंजन', 'वीडियो न्यूज़'];

const emptyArticle = {
  title: '',
  category: 'फरीदाबाद',
  content: '',
  caption: '',
  image_url: '',
  video_url: '',
  is_breaking: false,
  is_featured: false,
  is_published: true,
  author: '',
  tags: '',
};

export default function Admin({ navigate }) {
  const [tab, setTab] = useState('articles');

  async function logout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <main className="admin">
      <aside>
        <h1>सत्यजय टाइम्स</h1>
        {[
          ['articles', 'Articles'],
          ['ticker', 'Breaking News Ticker'],
          ['epaper', 'E-Paper'],
        ].map(([id, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
        <button onClick={() => navigate('/')}>Website</button>
        <button onClick={logout}>Logout</button>
      </aside>
      <section>
        {tab === 'articles' && <ArticlesSection />}
        {tab === 'ticker' && <TickerSection />}
        {tab === 'epaper' && <EPaperSection />}
      </section>
    </main>
  );
}

function ArticlesSection() {
  const [articles, setArticles] = useState([]);
  const [draft, setDraft] = useState(emptyArticle);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setArticles(await getArticles());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function pickImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const imageUrl = await uploadArticleImage(file);
      setDraft((value) => ({ ...value, image_url: imageUrl }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingId) {
        await updateArticle(editingId, draft);
      } else {
        await createArticle(draft);
      }
      setDraft(emptyArticle);
      setEditingId('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this article?')) return;
    try {
      await deleteArticle(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function edit(article) {
    setEditingId(article.id);
    setDraft({
      title: article.title || '',
      category: article.category || 'फरीदाबाद',
      content: article.content || '',
      caption: article.caption || '',
      image_url: article.image_url || '',
      video_url: article.video_url || '',
      is_breaking: Boolean(article.is_breaking),
      is_featured: Boolean(article.is_featured),
      is_published: article.is_published !== false,
      author: article.author || '',
      tags: article.tags || '',
    });
  }

  return (
    <>
      <h2>Articles</h2>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={submit} className="admin-form">
        <label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required /></label>
        <label>Category<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{categories.map((cat) => <option key={cat}>{cat}</option>)}</select></label>
        <label>Caption<textarea value={draft.caption} onChange={(event) => setDraft({ ...draft, caption: event.target.value })} /></label>
        <label>Content<textarea value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} /></label>
        <label>Article image<input type="file" accept="image/*" onChange={pickImage} /></label>
        {draft.image_url && <img className="admin-preview-img" src={draft.image_url} alt="" />}
        <label>Video URL<input value={draft.video_url} onChange={(event) => setDraft({ ...draft, video_url: event.target.value })} /></label>
        <label>Author<input value={draft.author} onChange={(event) => setDraft({ ...draft, author: event.target.value })} /></label>
        <label>Tags<input value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} /></label>
        <label className="check"><input type="checkbox" checked={draft.is_breaking} onChange={(event) => setDraft({ ...draft, is_breaking: event.target.checked })} /> Breaking</label>
        <label className="check"><input type="checkbox" checked={draft.is_featured} onChange={(event) => setDraft({ ...draft, is_featured: event.target.checked })} /> Featured</label>
        <label className="check"><input type="checkbox" checked={draft.is_published} onChange={(event) => setDraft({ ...draft, is_published: event.target.checked })} /> Published</label>
        <button disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Article' : 'Create Article'}</button>
      </form>
      {loading ? <p>Loading articles...</p> : (
        <div className="admin-list">
          {articles.map((article) => (
            <div key={article.id}>
              <span>{article.title}</span>
              <button onClick={() => edit(article)}>Edit</button>
              <button onClick={() => remove(article.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function TickerSection() {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({ text: '', is_active: true, display_order: 0 });
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setItems(await getTicker());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      if (editingId) await updateTicker(editingId, draft);
      else await createTicker(draft);
      setDraft({ text: '', is_active: true, display_order: 0 });
      setEditingId('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this ticker item?')) return;
    try {
      await deleteTicker(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h2>Breaking News Ticker</h2>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={submit} className="admin-form ticker-form">
        <label>Text<input value={draft.text} onChange={(event) => setDraft({ ...draft, text: event.target.value })} required /></label>
        <label>Display order<input type="number" value={draft.display_order} onChange={(event) => setDraft({ ...draft, display_order: Number(event.target.value) })} /></label>
        <label className="check"><input type="checkbox" checked={draft.is_active} onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })} /> Active</label>
        <button>{editingId ? 'Update Ticker' : 'Add Ticker'}</button>
      </form>
      {loading ? <p>Loading ticker...</p> : (
        <div className="admin-list">
          {items.map((item) => (
            <div key={item.id}>
              <span>{item.text} {item.is_active ? '' : '(disabled)'}</span>
              <button onClick={() => { setEditingId(item.id); setDraft({ text: item.text, is_active: item.is_active, display_order: item.display_order || 0 }); }}>Edit</button>
              <button onClick={() => updateTicker(item.id, { is_active: !item.is_active }).then(load).catch((err) => setError(err.message))}>{item.is_active ? 'Disable' : 'Enable'}</button>
              <button onClick={() => remove(item.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function EPaperSection() {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({ title: '', issue_date: new Date().toISOString().slice(0, 10), image_url: '', pdf_url: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setItems(await getEPapers());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function pickImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const imageUrl = await uploadEPaperImage(file);
      setDraft((value) => ({ ...value, image_url: imageUrl }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function pickPdf(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const pdfUrl = await uploadEPaperPdf(file);
      setDraft((value) => ({ ...value, pdf_url: pdfUrl }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await createEPaper(draft);
      setDraft({ title: '', issue_date: new Date().toISOString().slice(0, 10), image_url: '', pdf_url: '', is_active: true });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this e-paper?')) return;
    try {
      await deleteEPaper(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h2>E-Paper</h2>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={submit} className="admin-form">
        <label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required /></label>
        <label>Issue date<input type="date" value={draft.issue_date} onChange={(event) => setDraft({ ...draft, issue_date: event.target.value })} required /></label>
        <label>Cover image<input type="file" accept="image/*" onChange={pickImage} /></label>
        {draft.image_url && <img className="admin-preview-img" src={draft.image_url} alt="" />}
        <label>PDF file<input type="file" accept="application/pdf" onChange={pickPdf} /></label>
        {draft.pdf_url && <a className="file-chip" href={draft.pdf_url} target="_blank" rel="noreferrer">PDF uploaded</a>}
        <label className="check"><input type="checkbox" checked={draft.is_active} onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })} /> Active</label>
        <button disabled={saving}>{saving ? 'Saving...' : 'Save E-Paper'}</button>
      </form>
      {loading ? <p>Loading e-papers...</p> : (
        <div className="admin-list">
          {items.map((item) => (
            <div key={item.id}>
              <span>{item.title} - {item.issue_date}</span>
              <button onClick={() => remove(item.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
