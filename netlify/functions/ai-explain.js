const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  const { code, language } = JSON.parse(event.body);
  if (!code) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing code' }) };
  }
  const body = {
    model: 'qwen/qwen3-coder:free',
    messages: [
      { role: 'system', content: 'You are a helpful AI assistant for code explanation.' },
      { role: 'user', content: `Explain what the following code does in plain English. Include the code in your explanation, but do not use markdown or code fences.\n\nCode:\n${code}` }
    ]
  };
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || '';
    return { statusCode: 200, body: JSON.stringify({ explanation }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'AI explanation failed' }) };
  }
}; 