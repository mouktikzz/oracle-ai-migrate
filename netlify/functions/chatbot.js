const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

// Project documentation knowledge base
const PROJECT_KNOWLEDGE = {
  // Performance metrics and code quality analysis
  performance: `
    The Sybase to Oracle Migration Tool includes comprehensive performance monitoring and code quality analysis.
    
    Code Quality Metrics:
    - Cyclomatic Complexity: Measures code complexity based on decision points (1-10=Good, 11-20=Moderate, 21-50=Complex, 50+=Refactor needed)
    - Lines of Code Analysis: Total lines, effective lines, comment ratio, change impact
    - Loop Analysis: FOR, WHILE, CURSOR loops, nested loops, performance impact
    - Comment Ratio: Comments per function, documentation quality, Oracle-specific notes
    - Maintainability Index: 0-100 scale based on complexity, lines, and comments
    - Bulk Operations Analysis: BULK COLLECT usage, BULK INSERT/UPDATE, performance gains
    - Scalability Assessment: Resource usage, concurrent access, growth projections
    - Modern Features Detection: Oracle 12c+ features, JSON, LISTAGG, LATERAL joins
    - Overall Performance Score: Weighted average of all metrics
    - Manual Edit Requirements: Critical issues, optimizations, Oracle-specific changes
    
    Database Schema includes: code_quality_metrics, loop_analysis, performance_recommendations tables.
    Implementation uses TypeScript interfaces and analysis functions for SQL content evaluation.
  `,
  
  // System architecture
  architecture: `
    System Architecture:
    - Frontend: React 18 with TypeScript, Vite build tool, shadcn/ui components with Tailwind CSS
    - Backend: Netlify Functions for serverless API calls
    - Database: Supabase (PostgreSQL-based) for authentication and data storage
    - AI Integration: Google Gemini (primary) and OpenRouter (fallback) APIs
    - Migration Tools: Custom conversion utilities for stored procedures
    - File Handling: Supports SQL file uploads (.sql, .sp, .ddl, .func, .trg) and conversions
    
    Data Flow: User uploads SQL files → AI conversion engine processes → Results stored in Supabase → User views/downloads converted code → Performance metrics collected throughout
  `,
  
  // AI model configuration
  aiModels: `
    AI Model Configuration:
    - Gemini Pro: 95%+ accuracy, Fast, Medium cost - Complex procedures, production use
    - Default: 85%+ accuracy, Very Fast, Free - Simple conversions, testing
    - Custom: Variable accuracy/speed/cost - Specialized requirements
    
    Google Gemini Configuration:
    - API Key: VITE_GEMINI_API_KEY environment variable
    - Model: gemini-pro for production, gemini-2.0-flash-exp for speed
    - Temperature: 0.1 for consistent code generation
    - Max Output Tokens: 8192 for comprehensive responses
    - Safety Settings: Configured for code generation tasks
    
    Prompt Engineering: Base template for Sybase to Oracle conversion, conversion rules for parameter syntax, data types, functions, result sets, error handling, comment preservation, Oracle-specific optimizations.
    
    Model Selection: Use Gemini Pro for complex stored procedures, Default for simple scripts, Custom for specialized requirements, optimize based on file size and complexity.
  `,
  
  // Database schema
  database: `
    Database Schema (PostgreSQL via Supabase):
    - Authentication: auth.users, auth.sessions
    - Core Tables: profiles, migrations, migration_files, migration_reports, deployment_logs
    - Admin: admin_logs, system_settings
    
    Core Tables:
    - profiles: Extends user info with application data (id, email, full_name, organization, role, avatar_url, metadata), roles: user, moderator, admin
    - migrations: Stores migration session info, status: pending/processing/completed/failed/cancelled, AI model tracking, file processing statistics
    - migration_files: Individual file conversion tracking, original and converted content storage, conversion status and error tracking
    - migration_reports: Generated reports and analytics, performance metrics, quality scores, manual review requirements
    
    Security: Row Level Security (RLS) policies, user-based access control, admin role restrictions, audit logging
  `,
  
  // User guide
  userGuide: `
    User Guide:
    Getting Started: Account setup (registration, email verification, profile setup), initial configuration (AI model selection, preferences, test connection), first login access to migration dashboard.
    
    User Interface: Main dashboard (file upload, conversion status, recent activity, settings), navigation (Home, History, Reports, Profile, Admin), code editor (source panel, conversion panel, diff viewer, issues panel).
    
    Migration Workflow: Upload files (single or batch, supported types .sql/.sp/.ddl/.func/.trg), review conversions (success/warning/failed status, side-by-side comparison), generate reports (detailed analytics, performance metrics, recommendations).
    
    Advanced Features: Batch processing for multiple files, real-time conversion progress tracking, code quality analysis and optimization suggestions, integration with Oracle deployment tools.
    
    Best Practices: Test conversions on small files first, review all warnings and conversion notes, use appropriate AI model for complexity level, validate converted code in Oracle environment.
  `,
  
  // Developer guide
  developer: `
    Developer Guide:
    Development Setup: Prerequisites (Node.js v18+, npm/bun, Git, Docker optional, VS Code), environment setup (clone repo, install dependencies, configure .env.local), IDE configuration.
    
    Project Structure: src/components/ (reusable UI components), src/pages/ (application pages and routing), src/api/ (API integration), src/contexts/ (React context providers), src/hooks/ (custom React hooks), src/utils/ (utility functions).
    
    Contributing: Code style (TypeScript, ESLint, Prettier), component development (shadcn/ui patterns), testing (unit tests, integration tests), documentation (JSDoc comments, README updates).
    
    API Reference: Netlify Functions (serverless endpoints), Supabase Client (database operations, authentication), AI Integration (Gemini and OpenRouter API calls), File Processing (upload, conversion, download).
    
    Testing: Unit tests with Vitest, component testing with React Testing Library, E2E testing with Playwright, API testing with Postman/Thunder Client.
    
    Deployment: Netlify for frontend and functions, Supabase for database and authentication, environment variable configuration, CI/CD pipeline setup.
  `,
  
  // API documentation
  api: `
    API Documentation:
    Netlify Functions: /api/ai-convert (main conversion endpoint), /api/ai-explain (code explanation endpoint), /api/chatbot (AI assistant endpoint), /api/upload (file upload handling), /api/reports (report generation).
    
    Supabase Integration: Authentication (sign up, sign in, session management), Database (CRUD operations for migrations, files, reports), Storage (file upload and download), Real-time (live updates for conversion progress).
    
    AI Services Integration: Google Gemini (primary conversion engine), OpenRouter (fallback AI service), model selection and configuration, error handling and retry logic.
    
    File Processing: Upload validation and processing, conversion pipeline management, result storage and retrieval, download and export functionality.
  `,
  
  // Configuration
  configuration: `
    Configuration Guide:
    Environment Variables: VITE_SUPABASE_URL (Supabase project URL), VITE_SUPABASE_ANON_KEY (Supabase anonymous key), VITE_GEMINI_API_KEY (Google Gemini API key), OPENROUTER_API_KEY (OpenRouter API key fallback), ORACLE_CONNECTION_STRING (Oracle database connection).
    
    AI Model Configuration: Model selection (Gemini Pro, Default, Custom), temperature and token limits, safety settings and prompt templates, performance optimization settings.
    
    Database Configuration: Supabase project setup, table creation and schema management, Row Level Security policies, backup and recovery procedures.
    
    Application Settings: File size limits and upload restrictions, conversion timeout settings, notification preferences, user interface customization.
  `,
  
  // Deployment
  deployment: `
    Deployment Guide:
    Netlify Deployment: Frontend build and deployment, Netlify Functions configuration, environment variable setup, custom domain configuration.
    
    Supabase Setup: Project creation and configuration, database schema deployment, authentication setup, storage bucket configuration.
    
    Production Configuration: SSL certificate setup, CDN configuration, monitoring and logging, performance optimization.
    
    CI/CD Pipeline: GitHub Actions workflow, automated testing, deployment automation, rollback procedures.
    
    Monitoring and Maintenance: Error tracking and alerting, performance monitoring, database maintenance, security updates.
  `,
  
  // Troubleshooting
  troubleshooting: `
    Troubleshooting Guide:
    Common Issues:
    - Conversion Failures: Check file format and syntax, verify AI model availability, review error logs, test with smaller files first
    - Authentication Problems: Verify Supabase configuration, check environment variables, clear browser cache, review user permissions
    - Performance Issues: Monitor API response times, check database query performance, review file size limits, optimize AI model settings
    - Deployment Issues: Verify environment variables, check Netlify function logs, review build configuration, test local development setup
    
    Debug Tools: Browser developer tools, Netlify function logs, Supabase dashboard, AI service monitoring.
    
    Support Resources: Documentation and guides, community forums, issue tracking system, direct support channels.
  `
};

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

// RAG: Retrieve relevant knowledge based on user query
function retrieveRelevantKnowledge(query) {
  const queryLower = query.toLowerCase();
  let relevantKnowledge = '';
  
  // Check each knowledge area and add relevant content
  if (queryLower.includes('performance') || queryLower.includes('metrics') || queryLower.includes('quality') || 
      queryLower.includes('cyclomatic') || queryLower.includes('complexity') || queryLower.includes('bulk') ||
      queryLower.includes('maintainability') || queryLower.includes('analysis')) {
    relevantKnowledge += PROJECT_KNOWLEDGE.performance + '\n\n';
  }
  
  if (queryLower.includes('architecture') || queryLower.includes('system') || queryLower.includes('frontend') || 
      queryLower.includes('backend') || queryLower.includes('data flow') || queryLower.includes('structure')) {
    relevantKnowledge += PROJECT_KNOWLEDGE.architecture + '\n\n';
  }
  
  if (queryLower.includes('ai model') || queryLower.includes('gemini') || queryLower.includes('openrouter') || 
      queryLower.includes('model configuration') || queryLower.includes('prompt')) {
    relevantKnowledge += PROJECT_KNOWLEDGE.aiModels + '\n\n';
  }
  
  if (queryLower.includes('database') || queryLower.includes('schema') || queryLower.includes('tables') || 
      queryLower.includes('supabase') || queryLower.includes('profiles') || queryLower.includes('migrations')) {
    relevantKnowledge += PROJECT_KNOWLEDGE.database + '\n\n';
  }
  
  if (queryLower.includes('user guide') || queryLower.includes('getting started') || queryLower.includes('workflow') || 
      queryLower.includes('upload') || queryLower.includes('conversion') || queryLower.includes('interface')) {
    relevantKnowledge += PROJECT_KNOWLEDGE.userGuide + '\n\n';
  }
  
  if (queryLower.includes('developer') || queryLower.includes('development') || queryLower.includes('setup') || 
      queryLower.includes('contributing') || queryLower.includes('testing') || queryLower.includes('deployment')) {
    relevantKnowledge += PROJECT_KNOWLEDGE.developer + '\n\n';
  }
  
  if (queryLower.includes('api') || queryLower.includes('endpoints') || queryLower.includes('functions') || 
      queryLower.includes('integration') || queryLower.includes('supabase client')) {
    relevantKnowledge += PROJECT_KNOWLEDGE.api + '\n\n';
  }
  
  if (queryLower.includes('configuration') || queryLower.includes('environment variables') || 
      queryLower.includes('settings') || queryLower.includes('setup') || queryLower.includes('config')) {
    relevantKnowledge += PROJECT_KNOWLEDGE.configuration + '\n\n';
  }
  
  if (queryLower.includes('deployment') || queryLower.includes('netlify') || queryLower.includes('production') || 
      queryLower.includes('ci/cd') || queryLower.includes('monitoring')) {
    relevantKnowledge += PROJECT_KNOWLEDGE.deployment + '\n\n';
  }
  
  if (queryLower.includes('troubleshooting') || queryLower.includes('debug') || queryLower.includes('issues') || 
      queryLower.includes('problems') || queryLower.includes('errors') || queryLower.includes('support')) {
    relevantKnowledge += PROJECT_KNOWLEDGE.troubleshooting + '\n\n';
  }
  
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
    
    // RAG: Retrieve relevant project knowledge
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