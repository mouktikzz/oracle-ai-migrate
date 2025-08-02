const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

// Comprehensive embedded documentation knowledge base
const PROJECT_KNOWLEDGE = {
  // Admin Panel - Complete information from README-ADMIN.md
  admin: `
    Admin Panel Setup and Usage:
    
    The admin panel provides comprehensive system administration capabilities for the Oracle AI Migration application. It includes user management, system monitoring, activity logging, and configuration management.
    
    Features:
    1. Overview Dashboard: Real-time system statistics, user activity metrics, migration success rates, system health indicators
    2. User Management: View all registered users, update user roles (user, moderator, admin), delete user accounts, monitor user activity
    3. System Settings: Configure AI models, set file size limits, toggle cache settings, enable/disable maintenance mode
    4. Activity Logs: Track all administrative actions, monitor system events, audit trail for compliance
    5. System Monitoring: Real-time performance metrics, CPU, memory, and disk usage, application-specific metrics, queue monitoring
    
    User Roles:
    - Admin: Full system access, user management, system configuration, activity monitoring
    - Moderator: Limited admin access, user management (no deletion), view activity logs, basic system monitoring
    - User: Standard application access, no admin capabilities
    
    Security Features: Role-based access control (RBAC), Row-level security (RLS) policies, activity logging for all admin actions, secure API endpoints
    
    API Endpoints: The admin panel uses Supabase tables including profiles (user information and roles), admin_logs (activity logging), system_settings (configuration management), migrations (migration tracking), migration_files (file conversion tracking)
    
    Monitoring and Alerts: Real-time monitoring for system resource usage, active conversions, queue lengths, cache performance, response times
  `,
  
  // History Section - From user guide documentation
  history: `
    History Section and Comments:
    
    The History section provides comprehensive tracking of all migration activities and user interactions. Users can view their complete migration history with detailed information about each conversion.
    
    History Features:
    - Complete migration history with timestamps and status
    - File conversion tracking with before/after comparisons
    - Conversion status indicators (success, warning, failed, pending)
    - Detailed conversion reports and analytics
    - Performance metrics for each conversion
    - Download links for converted files
    
    Comments and Notes:
    - Users can add comments to specific conversions
    - Conversion notes and warnings are displayed
    - Manual review requirements are tracked
    - Performance recommendations and optimization suggestions
    - Oracle-specific migration notes and explanations
    
    History Interface:
    - Chronological list of all migrations
    - Filtering by status, date range, and file type
    - Search functionality for finding specific conversions
    - Export capabilities for migration reports
    - Integration with the code editor for detailed review
    
    Comments System:
    - Add comments to individual file conversions
    - Track manual review requirements
    - Note Oracle-specific changes needed
    - Document performance optimizations
    - Flag issues requiring attention
  `,
  
  // Migration workflow and getting started
  migration: `
    Migration Workflow and Getting Started:
    
    Getting Started:
    1. Account Setup: Create an account using email or social login, verify your email, complete profile with organization details
    2. Initial Configuration: Choose AI model (Default or Gemini), set preferences for file size limits and notifications, test Oracle database connection
    3. First Login: Access the migration dashboard to start your first migration
    
    Migration Workflow:
    Step 1: Upload Files
    - Single File Upload: Click "Upload Files" button, select .sql/.sp/.ddl files, choose AI model, click "Start Upload"
    - Batch Upload: Click "Upload Folder" button, select directory with Sybase files, review file list, configure batch options
    - Supported Types: Stored Procedures (.sp, .proc), SQL Scripts (.sql), DDL Scripts (.ddl), Functions (.func), Triggers (.trg)
    
    Step 2: Review Conversions
    - Conversion Results: Successful (converted without issues), With Warnings (minor issues), Failed (couldn't convert), Pending (waiting)
    - Code Review: Select file from results, review side-by-side comparison, check differences, review notes and warnings
    - Understanding Issues: Syntax differences, function mappings, data type changes, performance optimizations
    
    Step 3: Generate Reports
    - Detailed analytics and performance metrics
    - Code quality analysis and recommendations
    - Manual review requirements and optimization suggestions
    
    User Interface:
    - Main Dashboard: File upload area, conversion status, recent activity, settings
    - Navigation: Home, History, Reports, Profile, Admin
    - Code Editor: Source panel (original Sybase), conversion panel (Oracle), diff viewer, issues panel
    
    Best Practices:
    - Test conversions on small files first
    - Review all warnings and conversion notes
    - Use appropriate AI model for complexity level
    - Validate converted code in Oracle environment
  `,
  
  // Performance metrics and code quality analysis
  performance: `
    Performance Metrics and Code Quality Analysis:
    
    The Sybase to Oracle Migration Tool includes comprehensive performance monitoring, metrics collection, and code quality analysis to ensure optimal system performance and maintainable code.
    
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
    
    History Section: Complete migration history with timestamps, conversion status tracking, file comparison tools, performance metrics, download capabilities, comment system for tracking manual review requirements and Oracle-specific notes.
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

// Advanced semantic search with fuzzy matching
function semanticSearch(query, knowledgeBase) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
  
  const results = [];
  
  for (const [key, content] of Object.entries(knowledgeBase)) {
    const contentLower = content.toLowerCase();
    let score = 0;
    let matches = [];
    
    // Exact phrase matching (highest priority)
    if (contentLower.includes(queryLower)) {
      score += 100;
      matches.push('exact_phrase');
    }
    
    // Word matching with context
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        score += 10;
        matches.push(word);
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
          score += 5;
          matches.push(`semantic_${semanticKey}`);
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
          score += 3;
          matches.push(`context_${contextKey}`);
        }
      }
    }
    
    if (score > 0) {
      results.push({
        key,
        content,
        score,
        matches
      });
    }
  }
  
  // Sort by score and return top results
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 3); // Return top 3 most relevant
}

// RAG: Retrieve relevant knowledge based on user query
function retrieveRelevantKnowledge(query) {
  const searchResults = semanticSearch(query, PROJECT_KNOWLEDGE);
  
  if (searchResults.length === 0) {
    return '';
  }
  
  let relevantKnowledge = '';
  
  searchResults.forEach((result, index) => {
    relevantKnowledge += `${result.content}\n\n`;
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
    
    // Advanced RAG: Retrieve relevant project knowledge using semantic search
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