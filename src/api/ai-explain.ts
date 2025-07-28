import type { ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// This file is no longer used since the frontend calls Netlify functions directly
// Keeping for reference only
const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY;

async function callOpenRouter(prompt: string, model: string) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('VITE_OPENROUTER_API_KEY not configured for local development. Please add it to your .env file or use the production Netlify functions.');
  }
  const apiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!apiRes.ok) throw new Error(`OpenRouter API error: ${apiRes.status}`);
  const data = await apiRes.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function aiExplainHandler(req: IncomingMessage, res: ServerResponse) {
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
      const { code, language } = JSON.parse(body);
      if (!code) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing code' }));
        return;
      }
      const prompt = `Explain what the following code does in plain English. Include the code in your explanation, but do not use markdown or code fences.\n\nCode:\n${code}`;
      let explanation = '';
      let error = null;
      // Try primary model, retry once if empty, then fallback
      try {
        explanation = await callOpenRouter(prompt, 'qwen/qwen3-coder:free');
        if (!explanation) {
          // Retry once
          explanation = await callOpenRouter(prompt, 'qwen/qwen3-coder:free');
        }
      } catch (e) {
        error = e;
      }
      if (!explanation) {
        // Fallback to gpt-3.5-turbo
        try {
          explanation = await callOpenRouter(prompt, 'gpt-3.5-turbo');
        } catch (e2) {
          error = e2;
        }
      }
      if (!explanation) {
        console.error('AI Explain failed:', error);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ explanation: 'AI service returned no explanation. Please try again later.' }));
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ explanation }));
    } catch (err) {
      console.error('AI Explain error:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'AI explanation failed', details: err?.message || err }));
    }
  });
}

export function aiExplainApiPlugin() {
  return {
    name: 'vite-plugin-ai-explain-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/ai-explain', (req, res, next) => {
        if (req.method === 'POST') {
          aiExplainHandler(req, res);
        } else {
          next();
        }
      });
    },
  };
} 