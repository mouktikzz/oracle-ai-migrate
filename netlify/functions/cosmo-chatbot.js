const fetch = require('node-fetch');

const CHATBOT_GEMINI_API_KEY = process.env.CHATBOT_GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are Cosmo Agents, an expert AI assistant specializing in database technologies and development tools. You can only answer questions about:

1. Oracle Database and PL/SQL
2. SQL (all dialects)
3. Sybase Database
4. Supabase
5. Git and GitHub
6. The Cosmo Agents website and its features

For any questions outside these topics, politely redirect users to ask about the supported technologies. Keep your answers concise, accurate, and helpful. Always maintain a professional and friendly tone.

Your responses should be:
- Technical but accessible
- Practical with code examples when relevant
- Focused on the user's specific question
- Helpful for developers working with these technologies`;

async function fetchWithRetry(body, maxRetries = 3) {
  let lastError = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${CHATBOT_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (text && text.trim().length > 0) {
        return { success: true, text: text.trim() };
      }
      lastError = data.error?.message || 'AI did not return a result.';
    } catch (err) {
      lastError = err.message || 'Chatbot request failed';
    }
    
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  return { success: false, error: lastError };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  console.log('Cosmo Agents Chatbot function called');

  if (!CHATBOT_GEMINI_API_KEY) {
    console.error('CHATBOT_GEMINI_API_KEY not found in environment variables');
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        message: "Hi! I'm Cosmo Agents. I'm currently being configured. Please set up the CHATBOT_GEMINI_API_KEY environment variable in your Netlify dashboard to enable AI chat functionality. You can get a free API key from https://makersuite.google.com/app/apikey",
        success: true 
      }) 
    };
  }

  try {
    const { message, conversationHistory = [] } = JSON.parse(event.body);
    
    if (!message || message.trim() === '') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing message' }) };
    }

    // Build conversation context
    const conversationContext = conversationHistory.length > 0 
      ? `\n\nPrevious conversation:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
      : '';

    const body = {
      contents: [{
        parts: [{
          text: `${SYSTEM_PROMPT}${conversationContext}\n\nUser: ${message}\n\nCosmo Agents:`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    const result = await fetchWithRetry(body, 3);
    
    if (result.success) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          message: result.text,
          success: true 
        }) 
      };
    } else {
      console.error('Chatbot error:', result.error);
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          message: "I'm having trouble processing your request right now. Please try again in a moment.",
          success: false 
        }) 
      };
    }
  } catch (error) {
    console.error('Chatbot function error:', error);
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        message: "I encountered an error while processing your message. Please try again.",
        success: false 
      }) 
    };
  }
}; 