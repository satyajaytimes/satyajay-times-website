import { isSupabaseConfigured, supabase } from './supabase';

function requireSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
}

function fileName(file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
}

async function uploadFile(bucket, file) {
  requireSupabase();
  const path = fileName(file);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function getArticles() {
  requireSupabase();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createArticle(article) {
  requireSupabase();
  const { data, error } = await supabase.from('articles').insert(article).select().single();
  if (error) throw error;
  return data;
}

export async function updateArticle(id, article) {
  requireSupabase();
  const { data, error } = await supabase.from('articles').update(article).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteArticle(id) {
  requireSupabase();
  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) throw error;
}

export const uploadArticleImage = (file) => uploadFile('article-images', file);

export async function getTicker() {
  requireSupabase();
  const { data, error } = await supabase
    .from('ticker')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createTicker(ticker) {
  requireSupabase();
  const { data, error } = await supabase.from('ticker').insert(ticker).select().single();
  if (error) throw error;
  return data;
}

export async function updateTicker(id, ticker) {
  requireSupabase();
  const { data, error } = await supabase.from('ticker').update(ticker).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTicker(id) {
  requireSupabase();
  const { error } = await supabase.from('ticker').delete().eq('id', id);
  if (error) throw error;
}

export async function getEPapers() {
  requireSupabase();
  const { data, error } = await supabase
    .from('epapers')
    .select('*')
    .order('issue_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createEPaper(epaper) {
  requireSupabase();
  const { data, error } = await supabase.from('epapers').insert(epaper).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEPaper(id) {
  requireSupabase();
  const { error } = await supabase.from('epapers').delete().eq('id', id);
  if (error) throw error;
}

export const uploadEPaperImage = (file) => uploadFile('epaper-images', file);
export const uploadEPaperPdf = (file) => uploadFile('epaper-pdfs', file);
