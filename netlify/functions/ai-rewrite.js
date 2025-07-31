const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Enable CORS
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

async function fetchWithRetry(body, maxRetries = 3) {
  let lastError = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`AI Rewrite attempt ${attempt + 1}/${maxRetries}`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      console.log(`Attempt ${attempt + 1} response status:`, response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Attempt ${attempt + 1} API error:`, errorData);
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      
      if (data.error) {
        console.error(`Attempt ${attempt + 1} API returned error:`, data.error);
        throw new Error(`OpenRouter API error: ${data.error.message || data.error}`);
      }

      const text = data.choices?.[0]?.message?.content || '';
      
      console.log(`Attempt ${attempt + 1} response length:`, text.length);
      console.log(`Attempt ${attempt + 1} response preview:`, text.substring(0, 200) + '...');
      
      if (text && text.trim().length > 0) {
        return { success: true, text };
      }
      lastError = 'AI did not return a result.';
    } catch (err) {
      lastError = err.message || 'AI rewrite failed';
      console.error(`Attempt ${attempt + 1} failed:`, err.message);
    }
    // Wait 500ms before retrying
    if (attempt < maxRetries - 1) {
      await new Promise(res => setTimeout(res, 500));
    }
  }
  return { success: false, error: lastError };
}

exports.handler = async function(event, context) {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  // Check if API key is configured
  if (!OPENROUTER_API_KEY) {
    console.error('OpenRouter API key not configured');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable.' 
      })
    };
  }

  try {
    const { code, prompt, language } = JSON.parse(event.body);
    if (!code || !prompt) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Missing code or prompt' }) 
      };
    }

    console.log('AI Rewrite function called with language:', language);
    console.log('Code length:', code.length);
    console.log('Prompt:', prompt);
    console.log('API key present:', !!OPENROUTER_API_KEY);
    console.log('API key length:', OPENROUTER_API_KEY.length);

    const body = {
      model: 'qwen/qwen3-coder:free',
      messages: [
        { 
          role: 'system', 
          content: 'You are a code rewriting assistant. Your task is to rewrite code according to the user\'s instructions. Return ONLY the rewritten code without any explanations, comments, or markdown formatting. The response should be clean, executable code.' 
        },
        { 
          role: 'user', 
          content: `Rewrite the following ${language || 'code'} according to this instruction: ${prompt}

Original code:
\`\`\`${language || 'text'}
${code}
\`\`\`

IMPORTANT: Return ONLY the rewritten code. Do not include any explanations, comments, or markdown formatting. Just the clean, rewritten code.` 
        }
      ],
      temperature: 0.1,
      max_tokens: 3000
    };

    console.log('Sending request to OpenRouter API...');

    const result = await fetchWithRetry(body, 3);
    if (result.success) {
      console.log('AI Rewrite successful, returning rewritten code');
      return { 
        statusCode: 200, 
        headers,
        body: JSON.stringify({ 
          rewrittenCode: result.text,
          timestamp: new Date().toISOString()
        }) 
      };
    } else {
      console.error('AI Rewrite failed after all attempts:', result.error);
      return { 
        statusCode: 500, 
        headers,
        body: JSON.stringify({ 
          error: result.error || 'AI rewrite failed after multiple attempts',
          timestamp: new Date().toISOString()
        }) 
      };
    }
  } catch (error) {
    console.error('AI rewrite error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      apiKey: OPENROUTER_API_KEY ? 'Present' : 'Missing'
    });
    
    // Return a more specific error message
    let errorMessage = 'An error occurred while processing your request. Please try again.';
    
    if (error.message.includes('API key')) {
      errorMessage = 'API key configuration error. Please check your OPENROUTER_API_KEY.';
    } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
      errorMessage = 'API rate limit exceeded. Please try again later.';
    } else if (error.message.includes('OpenRouter')) {
      errorMessage = 'AI service error. Please try again.';
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      })
    };
  }
}; 