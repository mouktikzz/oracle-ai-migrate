const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  const { code, language } = JSON.parse(event.body);
  if (!code) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing code' }) };
  }
  const body = {
    contents: [{
      parts: [{
        text: `You are a helpful AI assistant for code explanation. Explain what the following ${language || ''} code does in plain English. Include the code in your explanation, but do not use markdown or code fences.\n\nCode:\n${code}`
      }]
    }]
  };
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    
    // Check if there's an error in the API response
    if (data.error) {
      console.error('Gemini API error:', data.error);
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          explanation: `AI service error: ${data.error.message || 'Unknown error'}. Please check your Gemini API key configuration.` 
        }) 
      };
    }
    
    const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // If no explanation was returned but no error occurred
    if (!explanation) {
      console.warn('Gemini API returned empty explanation');
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          explanation: 'No explanation returned. This could be due to an API configuration issue or rate limiting. Please check your Gemini API key.' 
        }) 
      };
    }
    
    return { statusCode: 200, body: JSON.stringify({ explanation }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'AI explanation failed' }) };
  }
};