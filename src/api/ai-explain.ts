import type { ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// This file is no longer used since the frontend calls Netlify functions directly
// Keeping for reference only
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

async function callGeminiAPI(prompt: string) {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY not configured for local development. Please add it to your .env file or use the production Netlify functions.');
  }
  const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    }),
  });
  if (!apiRes.ok) throw new Error(`Gemini API error: ${apiRes.status}`);
  const data = await apiRes.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
      const prompt = `You are a helpful AI assistant for code explanation. Explain what the following ${language || ''} code does in plain English. Include the code in your explanation, but do not use markdown or code fences.\n\nCode:\n${code}`;
      let explanation = '';
      let error = null;
      // Try Gemini API, retry once if empty
      try {
        explanation = await callGeminiAPI(prompt);
        if (!explanation) {
          // Retry once
          explanation = await callGeminiAPI(prompt);
        }
      } catch (e) {
        error = e;
      }
      if (!explanation) {
        console.error('AI Explain failed:', error);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        
        let errorMessage = 'No explanation returned. ';
        
        if (error) {
          if (error.message && error.message.includes('API key')) {
            errorMessage += 'This could be due to an API key configuration issue. Please check your Gemini API key.';
          } else if (error.message && error.message.includes('rate limit')) {
            errorMessage += 'This could be due to rate limiting. Please try again later.';
          } else {
            errorMessage += `Error: ${error.message || 'Unknown error'}. Please try again later or contact the administrator.`;
          }
        } else {
          errorMessage += 'This could be due to an API configuration issue or rate limiting. Please check your Gemini API key.';
        }
        
        res.end(JSON.stringify({ explanation: errorMessage }));
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