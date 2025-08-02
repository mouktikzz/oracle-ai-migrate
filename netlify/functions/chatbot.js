const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

// Documentation paths
const DOCS_PATH = path.join(__dirname, '../../docs');

// Documentation structure
const DOCS_STRUCTURE = {
  'architecture.md': 'System architecture and component overview',
  'ai-models.md': 'AI model configuration and usage guidelines',
  'database-schema.md': 'Database schema and table structures',
  'user-guide/quick-start.md': 'Quick start guide for users',
  'user-guide/README.md': 'Complete user guide',
  'developer-guide/README.md': 'Developer documentation and setup',
  'api/README.md': 'API documentation and endpoints',
  'troubleshooting/': 'Troubleshooting guides and solutions',
  'deployment/': 'Deployment instructions and configuration',
  'configuration/': 'System configuration options'
};

const SYSTEM_PROMPT = `You are an expert Oracle database migration assistant for a specific Sybase to Oracle migration project.

PROJECT CONTEXT:
- This is a Sybase to Oracle migration project
- The project uses React/TypeScript frontend with Vite
- Backend uses Netlify Functions for serverless API calls
- Database: Supabase (PostgreSQL-based)
- AI Integration: Google Gemini and OpenRouter APIs
- Migration tools: Custom conversion utilities for stored procedures
- File handling: Supports SQL file uploads and conversions

DOCUMENTATION INTEGRATION:
- You have access to comprehensive project documentation
- When users ask about project features, architecture, or implementation details, search the docs first
- Reference specific documentation sections when providing answers
- Include relevant code examples and configuration details from the docs
- If documentation search doesn't yield relevant results, provide general guidance

RESPONSE GUIDELINES:
- Provide natural, conversational responses without robotic phrases like "Okay, based on the project context..."
- Prioritize project-specific answers when questions relate to this codebase
- Use generic Oracle migration guidance only when questions aren't project-related
- Be concise, practical, and direct
- Start responses naturally without repetitive introductions
- When referencing documentation, mention the specific file or section.`;

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
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
  
  const body = {
    contents: [{
      parts: [{
        text: SYSTEM_PROMPT + '\n\nUser: ' + lastUserMessage
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

// Search through documentation files
async function searchDocs(query) {
  const results = [];
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
  
  try {
    // Search through main documentation files
    for (const [filePath, description] of Object.entries(DOCS_STRUCTURE)) {
      try {
        const fullPath = path.join(DOCS_PATH, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        
        // Check if any search terms match the content
        const matches = searchTerms.filter(term => 
          content.toLowerCase().includes(term) || 
          description.toLowerCase().includes(term)
        );
        
        if (matches.length > 0) {
          // Extract relevant sections
          const relevantSections = extractRelevantSections(content, searchTerms);
          results.push({
            file: filePath,
            description: description,
            relevance: matches.length,
            sections: relevantSections
          });
        }
      } catch (err) {
        // Skip files that can't be read
        continue;
      }
    }
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    return results.slice(0, 3); // Return top 3 most relevant results
  } catch (error) {
    console.error('Error searching docs:', error);
    return [];
  }
}

// Extract relevant sections from documentation
function extractRelevantSections(content, searchTerms) {
  const sections = [];
  const lines = content.split('\n');
  let currentSection = '';
  let inCodeBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for code blocks
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    
    // Skip code blocks for now
    if (inCodeBlock) continue;
    
    // Check for headers
    if (line.startsWith('#')) {
      currentSection = line.replace(/^#+\s*/, '');
      continue;
    }
    
    // Check if line contains search terms
    const hasMatch = searchTerms.some(term => line.toLowerCase().includes(term));
    if (hasMatch && line.trim().length > 10) {
      sections.push({
        section: currentSection,
        content: line.trim(),
        lineNumber: i + 1
      });
    }
  }
  
  return sections.slice(0, 5); // Return top 5 relevant sections
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
    
    // Search documentation for relevant information
    let docsContext = '';
    let docsResults = [];
    try {
      docsResults = await searchDocs(message);
      if (docsResults.length > 0) {
        docsContext = '\n\nRELEVANT DOCUMENTATION:\n';
        docsResults.forEach((result, index) => {
          docsContext += `\n${index + 1}. ${result.file} - ${result.description}\n`;
          result.sections.forEach(section => {
            docsContext += `   Section: ${section.section}\n   Content: ${section.content}\n`;
          });
        });
      }
    } catch (docsError) {
      console.log('Documentation search failed:', docsError);
      // Continue without docs context
    }
    
    // Prepare conversation history for API
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + docsContext },
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
        timestamp: new Date().toISOString(),
        docsContext: docsResults || null
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