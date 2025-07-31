const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Enable CORS
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    const { code, language } = JSON.parse(event.body);
    if (!code) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Missing code' }) 
      };
    }

    console.log('AI Explain function called with language:', language);
    console.log('Code length:', code.length);
    console.log('API key present:', !!OPENROUTER_API_KEY);
    console.log('API key length:', OPENROUTER_API_KEY.length);

    // Use a better model for code analysis
    const model = 'qwen/qwen3-coder:free';

    const body = {
      model: model,
      messages: [
        { 
          role: 'system', 
          content: `You are an expert code analyst and technical writer. Your task is to provide comprehensive, well-structured explanations of code.

IMPORTANT REQUIREMENTS:
1. Use proper markdown formatting with clear headings and sections
2. Include the original code in a code block with proper syntax highlighting
3. Provide detailed analysis with proper indentation and structure
4. Break down complex code into logical sections
5. Explain the purpose, functionality, and implementation details
6. Use bullet points and numbered lists for better readability
7. Highlight important concepts, patterns, and best practices
8. Provide context about the technology/language being used

Your response should be structured as follows:
- **Code Overview**: Brief summary of what the code does
- **Original Code**: The code in a properly formatted code block
- **Detailed Analysis**: Section-by-section breakdown
- **Key Components**: Important functions, variables, and their purposes
- **Technical Details**: Implementation patterns, algorithms, or techniques used
- **Use Cases**: When and why this code would be used
- **Best Practices**: Any relevant coding standards or recommendations` 
        },
        { 
          role: 'user', 
          content: `Please provide a comprehensive analysis of the following ${language || 'code'}:

\`\`\`${language || 'text'}
${code}
\`\`\`

Analyze this code thoroughly and provide a detailed explanation with proper formatting, indentation, and structure. Focus on:
- What the code accomplishes
- How it works step by step
- Important functions and their purposes
- Variables and their roles
- Any patterns or techniques used
- Potential applications or use cases
- Technical considerations and best practices` 
        }
      ],
      temperature: 0.2,
      max_tokens: 3000
    };

    console.log('Sending request to OpenRouter API with model:', model);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    console.log('OpenRouter response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', errorData);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('OpenRouter response data keys:', Object.keys(data));
    
    if (data.error) {
      console.error('OpenRouter API returned error:', data.error);
      throw new Error(`OpenRouter API error: ${data.error.message || data.error}`);
    }

    const explanation = data.choices?.[0]?.message?.content || '';
    
    console.log('Explanation generated, length:', explanation.length);
    console.log('Explanation preview:', explanation.substring(0, 200) + '...');

    if (!explanation || explanation.trim().length === 0) {
      console.error('Empty explanation from AI model');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'AI model returned empty explanation. Please try again.',
          timestamp: new Date().toISOString()
        })
      };
    }

    // Ensure the explanation has proper formatting
    let formattedExplanation = explanation;
    
    // If the explanation doesn't start with proper markdown, add structure
    if (!explanation.includes('##') && !explanation.includes('**')) {
      formattedExplanation = `## Code Analysis

**Language**: ${language || 'Unknown'}

${explanation}

---
*Analysis provided by AI Code Analyzer*`;
    }
    
    return { 
      statusCode: 200, 
      headers,
      body: JSON.stringify({ 
        explanation: formattedExplanation,
        timestamp: new Date().toISOString()
      }) 
    };
  } catch (error) {
    console.error('AI explain error:', error);
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