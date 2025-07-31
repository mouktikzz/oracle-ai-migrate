const fetch = require('node-fetch');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Enable CORS
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

exports.handler = async function(event, context) {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      apiKeys: {
        chatbot: {
          present: !!process.env.CHATBOT_GEMINI_API_KEY,
          length: process.env.CHATBOT_GEMINI_API_KEY ? process.env.CHATBOT_GEMINI_API_KEY.length : 0,
          startsWith: process.env.CHATBOT_GEMINI_API_KEY ? process.env.CHATBOT_GEMINI_API_KEY.substring(0, 10) : 'N/A'
        },
        openrouter: {
          present: !!process.env.OPENROUTER_API_KEY,
          length: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.length : 0,
          startsWith: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.substring(0, 10) : 'N/A'
        }
      },
      tests: {}
    };

    // Test Chatbot (Gemini)
    if (process.env.CHATBOT_GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.CHATBOT_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent("Hello, this is a test message.");
        const response = await result.response;
        const text = response.text();
        
        results.tests.chatbot = {
          success: true,
          responseLength: text.length,
          model: "gemini-1.5-flash"
        };
      } catch (error) {
        results.tests.chatbot = {
          success: false,
          error: error.message
        };
      }
    } else {
      results.tests.chatbot = {
        success: false,
        error: "API key not configured"
      };
    }

    // Test OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'qwen/qwen3-coder:free',
            messages: [
              { role: 'user', content: 'Hello, this is a test message.' }
            ]
          })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
          results.tests.openrouter = {
            success: true,
            responseLength: data.choices[0].message.content.length,
            model: 'qwen/qwen3-coder:free'
          };
        } else {
          results.tests.openrouter = {
            success: false,
            error: data.error || 'No response from API'
          };
        }
      } catch (error) {
        results.tests.openrouter = {
          success: false,
          error: error.message
        };
      }
    } else {
      results.tests.openrouter = {
        success: false,
        error: "API key not configured"
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(results)
    };

  } catch (error) {
    console.error('Test function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Test function failed',
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
}; 