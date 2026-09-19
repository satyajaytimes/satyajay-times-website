import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildArticleHeadTags,
  fetchAllPublishedArticles,
  getSiteOrigin,
  injectHeadMeta,
  injectArticleContent,
} from '../share-meta.mjs';

const distDir = resolve(process.cwd(), 'dist');
const indexPath = resolve(distDir, 'index.html');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const siteOrigin = getSiteOrigin(process.env.VITE_SITE_URL);

async function main() {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[prerender] Skipping article pages: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set at build time.');
    return;
  }

  const template = readFileSync(indexPath, 'utf8');
  const articles = await fetchAllPublishedArticles({ supabaseUrl, supabaseKey });

  if (!articles.length) {
    console.warn('[prerender] No published articles found.');
    return;
  }

  for (const article of articles) {
    const meta = buildArticleHeadTags({
      siteOrigin,
      articleId: article.id,
      article,
    });
    const html = injectArticleContent(injectHeadMeta(template, meta), { siteOrigin, article });
    const outDir = resolve(distDir, 'article', article.id);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, 'index.html'), html, 'utf8');
  }

  console.log(`[prerender] Generated ${articles.length} article share pages in dist/article/*/index.html`);
}

main().catch((error) => {
  console.error('[prerender] Failed:', error.message);
  process.exit(1);
});
