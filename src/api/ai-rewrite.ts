<<<<<<< HEAD
// Simple API route for /api/ai-rewrite
import type { NextApiRequest, NextApiResponse } from 'next';

const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { code, prompt } = req.body;
  if (!code || !prompt) {
    res.status(400).json({ error: 'Missing code or prompt' });
    return;
  }
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-coder:free',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant for code rewriting and explanation.' },
          { role: 'user', content: `${prompt}\n\n${code}` }
        ]
      })
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    res.status(200).json({ rewrittenCode: text });
  } catch (err) {
    res.status(500).json({ error: err.message || 'AI rewrite failed' });
  }
=======
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
>>>>>>> 71985dc3a7b1d56ab2ab9c63463807d7eb1f2fbe
} 