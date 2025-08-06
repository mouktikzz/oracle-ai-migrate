import type { ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// This file is no longer used since the frontend calls Netlify functions directly
// Keeping for reference only

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

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
      if (!GEMINI_API_KEY) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'VITE_GEMINI_API_KEY not configured for local development. Please add it to your .env file or use the production Netlify functions.' }));
        return;
      }
      const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a code rewriting assistant. CRITICAL: Return ONLY the rewritten code. NO explanations, NO comments, NO markdown, NO text before or after. ONLY the code.\n\nRewrite this ${language || 'code'}:\n${code}\n\nInstruction: ${prompt}\n\nIMPORTANT: Return ONLY the rewritten code, nothing else.`
            }]
          }],
          generationConfig: {
            temperature: 0.1
          }
        }),
      });
      if (!apiRes.ok) {
        throw new Error('Gemini API error');
      }
      const data = await apiRes.json();
      const rewrittenCode = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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