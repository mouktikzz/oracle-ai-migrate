import type { ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// This file is no longer used since the frontend calls Netlify functions directly
// Keeping for reference only

const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY;

export async function aiRewriteHandler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });
  req.on('end', async () => {
    try {
      const { code, prompt, language } = JSON.parse(body);
      if (!code || !prompt) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing code or prompt' }));
        return;
      }
      if (!OPENROUTER_API_KEY) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'VITE_OPENROUTER_API_KEY not configured for local development. Please add it to your .env file or use the production Netlify functions.' }));
        return;
      }
      const apiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen/qwen3-coder:free',
          messages: [
            {
              role: 'user',
              content: `Rewrite this ${language || 'code'}:\n${code}\n\nInstruction: ${prompt}`,
            },
          ],
        }),
      });
      if (!apiRes.ok) {
        throw new Error('OpenRouter API error');
      }
      const data = await apiRes.json();
      const rewrittenCode = data.choices?.[0]?.message?.content || '';
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ rewrittenCode }));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'AI rewrite failed' }));
    }
  });
}

// Vite plugin to register the API route in dev mode
export function aiRewriteApiPlugin() {
  return {
    name: 'vite-plugin-ai-rewrite-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/ai-rewrite', (req, res, next) => {
        if (req.method === 'POST') {
          aiRewriteHandler(req, res);
        } else {
          next();
        }
      });
    },
  };
} 