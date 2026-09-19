import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import {
  buildArticleHeadTags,
  fetchArticleById,
  getSiteOrigin,
  injectHeadMeta,
  injectArticleContent,
  markServerMetadata,
} from './share-meta.mjs';

function articleMetaDevPlugin(env) {
  const indexPath = resolve(process.cwd(), 'index.html');

  return {
    name: 'article-meta-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();

        const pathname = req.url?.split('?')[0] || '';
        const match = pathname.match(/^\/article\/([^/]+)\/?$/);
        if (!match) return next();

        const accept = req.headers.accept || '';
        if (accept && !accept.includes('text/html') && !accept.includes('*/*')) return next();

        try {
          const articleId = decodeURIComponent(match[1]);
          const article = await fetchArticleById(articleId, {
            supabaseUrl: env.VITE_SUPABASE_URL,
            supabaseKey: env.VITE_SUPABASE_ANON_KEY,
          });

          if (!article) return next();

          const siteOrigin = getSiteOrigin(env.VITE_SITE_URL);
          let html = readFileSync(indexPath, 'utf8');
          const meta = buildArticleHeadTags({ siteOrigin, articleId, article });
          html = injectHeadMeta(html, meta);
          html = injectArticleContent(html, { siteOrigin, article });

          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(req.method === 'HEAD' ? '' : html);
        } catch {
          next();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), articleMetaDevPlugin(env), { name: 'server-meta-ownership', transformIndexHtml: markServerMetadata }],
  };
});
