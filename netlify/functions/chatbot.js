const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

// Path to master documentation file
const MASTER_DOCS_PATH = path.join(__dirname, '../docs/master-documentation.json');

// Load master documentation
function loadMasterDocumentation() {
  try {
    const docsPath = path.join(__dirname, '../docs/master-documentation.json');
    const docsContent = fs.readFileSync(docsPath, 'utf8');
    return JSON.parse(docsContent);
  } catch (error) {
    console.error('Error loading master documentation:', error);
    // Fallback to minimal documentation if file can't be read
    return {
      sections: {
        'getting-started': {
          title: 'Getting Started',
          keywords: ['start', 'begin', 'first', 'initial', 'setup'],
          content: {
            'account-setup': {
              title: 'Account Setup',
              content: 'Create an account using email or social login, verify your email, complete profile with organization details'
            }
          }
        }
      }
    };
  }
}

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

// Advanced semantic search with fuzzy matching using master documentation
function semanticSearch(query, masterDocs) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
  
  const results = [];
  
  // Search through all sections
  for (const [sectionKey, section] of Object.entries(masterDocs.sections)) {
    const sectionLower = section.title.toLowerCase();
    let sectionScore = 0;
    let sectionMatches = [];
    
    // Check section title
    if (sectionLower.includes(queryLower)) {
      sectionScore += 50;
      sectionMatches.push('section_title_exact');
    }
    
    // Check section keywords
    for (const keyword of section.keywords) {
      if (queryLower.includes(keyword.toLowerCase())) {
        sectionScore += 20;
        sectionMatches.push(`keyword_${keyword}`);
      }
    }
    
    // Check individual words against section title and keywords
    for (const word of queryWords) {
      if (sectionLower.includes(word)) {
        sectionScore += 10;
        sectionMatches.push(`word_${word}`);
      }
      if (section.keywords.some(k => k.toLowerCase().includes(word))) {
        sectionScore += 8;
        sectionMatches.push(`keyword_word_${word}`);
      }
    }
    
    // Search through section content
    for (const [contentKey, contentItem] of Object.entries(section.content)) {
      const contentLower = contentItem.content.toLowerCase();
      const titleLower = contentItem.title.toLowerCase();
      let contentScore = sectionScore; // Inherit section score
      let contentMatches = [...sectionMatches];
      
      // Check content title
      if (titleLower.includes(queryLower)) {
        contentScore += 30;
        contentMatches.push('content_title_exact');
      }
      
      // Check content body
      if (contentLower.includes(queryLower)) {
        contentScore += 25;
        contentMatches.push('content_body_exact');
      }
      
      // Check individual words in content
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          contentScore += 5;
          contentMatches.push(`content_word_${word}`);
        }
        if (titleLower.includes(word)) {
          contentScore += 8;
          contentMatches.push(`title_word_${word}`);
        }
      }
      
      // Semantic similarity matching
      const semanticMatches = {
        'start': ['begin', 'start', 'first', 'initial', 'setup', 'getting started', 'workflow'],
        'migration': ['migrate', 'convert', 'conversion', 'oracle', 'sybase', 'workflow', 'process'],
        'admin': ['administrator', 'management', 'user management', 'system', 'dashboard'],
        'history': ['history', 'comment', 'tracking', 'log', 'previous', 'past'],
        'performance': ['metrics', 'quality', 'analysis', 'optimization', 'speed'],
        'upload': ['file', 'upload', 'import', 'add', 'submit'],
        'convert': ['migration', 'conversion', 'transform', 'change', 'oracle'],
        'report': ['report', 'analytics', 'metrics', 'results', 'summary'],
        'settings': ['config', 'configuration', 'setup', 'preferences', 'options'],
        'help': ['guide', 'documentation', 'support', 'troubleshooting', 'how to']
      };
      
      for (const [semanticKey, synonyms] of Object.entries(semanticMatches)) {
        if (queryWords.some(word => synonyms.includes(word))) {
          if (contentLower.includes(semanticKey) || synonyms.some(syn => contentLower.includes(syn))) {
            contentScore += 3;
            contentMatches.push(`semantic_${semanticKey}`);
          }
        }
      }
      
      // Context-based matching
      const contextMatches = {
        'how do i': ['getting started', 'workflow', 'step', 'process', 'guide'],
        'what is': ['overview', 'description', 'features', 'capabilities'],
        'where can i': ['interface', 'dashboard', 'navigation', 'menu'],
        'can i': ['features', 'capabilities', 'permissions', 'access'],
        'why': ['explanation', 'reason', 'purpose', 'benefit']
      };
      
      for (const [contextKey, contexts] of Object.entries(contextMatches)) {
        if (queryLower.includes(contextKey)) {
          if (contexts.some(ctx => contentLower.includes(ctx))) {
            contentScore += 2;
            contentMatches.push(`context_${contextKey}`);
          }
        }
      }
      
      if (contentScore > 0) {
        results.push({
          section: section.title,
          sectionKey,
          contentKey,
          title: contentItem.title,
          content: contentItem.content,
          score: contentScore,
          matches: contentMatches
        });
      }
    }
  }
  
  // Sort by score and return top results
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 5); // Return top 5 most relevant
}

// RAG: Retrieve relevant knowledge based on user query
function retrieveRelevantKnowledge(query) {
  const masterDocs = loadMasterDocumentation();
  const searchResults = semanticSearch(query, masterDocs);
  
  if (searchResults.length === 0) {
    return '';
  }
  
  let relevantKnowledge = '';
  
  searchResults.forEach((result, index) => {
    relevantKnowledge += `${result.section} - ${result.title}:\n${result.content}\n\n`;
  });
  
  return relevantKnowledge.trim();
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
    
    // Advanced RAG: Retrieve relevant project knowledge using semantic search from master docs
    const relevantKnowledge = retrieveRelevantKnowledge(message);
    
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