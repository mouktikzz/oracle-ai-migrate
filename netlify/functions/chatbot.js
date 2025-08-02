const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are an expert Oracle database migration assistant for a specific Sybase to Oracle migration project.

IMPORTANT: You can ONLY use the provided project knowledge to answer questions. Do not use any external knowledge or general Oracle migration information. If the question is not covered in the provided knowledge, say you don't have information about that specific aspect of the project.

RESPONSE GUIDELINES:
- Use ONLY the provided project knowledge to answer questions
- Provide natural, conversational responses without robotic phrases
- Be concise and direct in your responses
- If the question is not covered in the project knowledge, clearly state that
- Do not reference documentation files or sections - just provide the information naturally`;

async function callOpenRouterAPI(messages, model = 'qwen/qwen3-coder:free') {
  const body = {
    model: model,
    messages: messages,
    temperature: 0.7,
    max_tokens: 500
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

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(`OpenRouter API rate limited (429). Please try again in a few minutes or upgrade your plan.`);
      }
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw error;
  }
}

async function callGeminiAPI(messages) {
  // Build the full conversation context including RAG knowledge
  const systemMessage = messages.find(m => m.role === 'system')?.content || SYSTEM_PROMPT;
  const conversationMessages = messages.filter(m => m.role !== 'system');
  
  const body = {
    contents: [{
      parts: [{
        text: systemMessage + '\n\n' + conversationMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')
      }]
    }]
  };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response.';
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// RAG: Retrieve relevant knowledge from external RAG API
async function retrieveRelevantKnowledge(query, event) {
  try {
    // Determine the base URL for the RAG API
    const isLocalhost = process.env.NODE_ENV === 'development' || process.env.NETLIFY_DEV;
    let baseUrl;
    
    if (isLocalhost) {
      // Use the same host as the current request
      const host = event.headers?.host || 'localhost:8080';
      baseUrl = `http://${host}`;
    } else {
      // On Netlify, use the request headers to determine the site URL
      const host = event.headers?.host || process.env.URL || 'your-site.netlify.app';
      baseUrl = `https://${host}`;
    }
    
    const ragApiUrl = `${baseUrl}/.netlify/functions/external-rag`;
    console.log('🌐 RAG API URL:', ragApiUrl);
    
    const response = await fetch(ragApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    console.log('🔍 RAG API response status:', response.status);
    console.log('🔍 RAG API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('External RAG API error:', response.status);
      const errorText = await response.text();
      console.error('External RAG API error body:', errorText);
      return '';
    }

    const data = await response.json();
    console.log('🔍 RAG API response data:', data);
    return data.context || '';
  } catch (error) {
    console.error('Error calling external RAG API:', error);
    return '';
  }
}

function extractIntent(userMessage) {
  const message = userMessage.toLowerCase();
   
  if (message.includes('explain') || message.includes('what does') || message.includes('how does')) {
    return 'code_explanation';
  }
  if (message.includes('migrate') || message.includes('convert') || message.includes('oracle')) {
    return 'migration_help';
  }
  if (message.includes('data type') || message.includes('varchar') || message.includes('int')) {
    return 'data_type_mapping';
  }
  if (message.includes('syntax') || message.includes('error') || message.includes('fix')) {
    return 'syntax_help';
  }
  if (message.includes('performance') || message.includes('optimize') || message.includes('fast')) {
    return 'best_practices';
  }
   
  return 'general_question';
}

function generateSuggestions(intent) {
  const suggestions = {
    code_explanation: [
      "Can you show me the converted Oracle version?",
      "What are the key differences between Sybase and Oracle?",
      "How can I optimize this code for Oracle?"
    ],
    migration_help: [
      "What are the main challenges in Sybase to Oracle migration?",
      "How do I handle stored procedures?",
      "What about triggers and functions?"
    ],
    data_type_mapping: [
      "Show me the complete data type mapping table",
      "How do I handle TEXT and IMAGE types?",
      "What about custom data types?"
    ],
    syntax_help: [
      "How do I convert Sybase date functions?",
      "What's the Oracle equivalent of @@IDENTITY?",
      "How do I handle temporary tables?"
    ],
    best_practices: [
      "What are Oracle performance best practices?",
      "How do I use bulk operations?",
      "What about indexing strategies?"
    ],
    general_question: [
      "How do I start a migration project?",
      "What tools do you recommend?",
      "Can you explain the migration process?"
    ]
  };
   
  return suggestions[intent] || suggestions.general_question;
}

exports.handler = async function(event, context) {
  // Add CORS headers for browser requests
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Add a simple GET endpoint for testing
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Chatbot function is running!',
        status: 'ok',
        timestamp: new Date().toISOString(),
        hasOpenRouterKey: !!OPENROUTER_API_KEY,
        hasGeminiKey: !!GEMINI_API_KEY
      })
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  // Check if API keys are configured
  if (!OPENROUTER_API_KEY && !GEMINI_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'API keys not configured. Please set OPENROUTER_API_KEY or VITE_GEMINI_API_KEY environment variables in Netlify.' 
      })
    };
  }

  try {
    const { message, conversationHistory = [], model = 'gemini' } = JSON.parse(event.body);
     
    if (!message) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Missing message' }) 
      };
    }

    // Extract intent from user message
    const intent = extractIntent(message);
    
    // RAG: Retrieve relevant project knowledge from RAG API
    console.log('🔍 Retrieving RAG knowledge for query:', message);
    console.log('🔍 Event headers:', event.headers);
    console.log('🔍 Event host:', event.headers?.host);
    console.log('🔍 Starting RAG API call...');
    console.log('🔍 About to call retrieveRelevantKnowledge function...');
    
    let relevantKnowledge = '';
    try {
      // Add timeout to RAG call to prevent 504 errors
      const ragPromise = retrieveRelevantKnowledge(message, event);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('RAG timeout')), 7000); // 7 second timeout
      });
      
      relevantKnowledge = await Promise.race([ragPromise, timeoutPromise]);
      console.log('📄 RAG knowledge length:', relevantKnowledge.length);
      if (relevantKnowledge.length > 0) {
        console.log('📝 RAG knowledge preview:', relevantKnowledge.substring(0, 200) + '...');
      } else {
        console.log('⚠️ No RAG knowledge retrieved - this might indicate an issue');
      }
    } catch (error) {
      console.error('❌ Error in retrieveRelevantKnowledge:', error);
      // Continue without RAG knowledge if it times out
      relevantKnowledge = '';
    }
    
    console.log('🔍 RAG API call completed');
    
    // Prepare conversation history for API with RAG context
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + (relevantKnowledge ? '\n\nPROJECT KNOWLEDGE:\n' + relevantKnowledge : '') },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call appropriate API based on model preference
    let response;
    try {
      if (GEMINI_API_KEY) {
        // Use Gemini as primary choice
        response = await callGeminiAPI(messages);
      } else if (OPENROUTER_API_KEY) {
        // Fallback to OpenRouter if Gemini key not available
        response = await callOpenRouterAPI(messages);
      } else {
        throw new Error('No API keys available');
      }
    } catch (error) {
      // If Gemini fails, try OpenRouter as fallback
      if (OPENROUTER_API_KEY && error.message.includes('Gemini API error')) {
        console.log('Gemini failed, falling back to OpenRouter');
        response = await callOpenRouterAPI(messages);
      } else {
        throw error;
      }
    }

    // Generate contextual suggestions
    const suggestions = generateSuggestions(intent);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: response,
        intent: intent,
        suggestions: suggestions,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Chatbot error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process message',
        details: error.message
      })
    };
  }
}; 