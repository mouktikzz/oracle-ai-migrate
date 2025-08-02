const fetch = require('node-fetch');

// Comprehensive project knowledge base embedded in the function
const PROJECT_KNOWLEDGE_BASE = {
  documents: [
    {
      id: "getting-started",
      title: "Getting Started Guide",
      content: `Getting Started with Oracle AI Migration Tool:

Account Setup:
1. Create an account using email or social login
2. Verify your email address
3. Complete profile with organization details

Initial Configuration:
1. Choose AI model (Default or Gemini)
2. Set preferences for file size limits and notifications
3. Test Oracle database connection

First Login:
- Access the migration dashboard to start your first migration

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
- Validate converted code in Oracle environment`,
      keywords: ["start", "begin", "first", "initial", "setup", "getting started", "workflow", "how to", "beginner", "account", "configuration", "upload", "migration"]
    },
    {
      id: "admin-panel",
      title: "Admin Panel Documentation",
      content: `Admin Panel Setup and Usage:

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

Monitoring and Alerts: Real-time monitoring for system resource usage, active conversions, queue lengths, cache performance, response times`,
      keywords: ["admin", "administrator", "management", "user management", "system", "dashboard", "admin panel", "roles", "security", "monitoring"]
    },
    {
      id: "history-section",
      title: "History Section and Comments",
      content: `History Section and Comments:

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
- Flag issues requiring attention`,
      keywords: ["history", "comment", "tracking", "log", "previous", "past", "comments", "history tab", "conversion history", "migration history"]
    },
    {
      id: "performance-metrics",
      title: "Performance Metrics and Code Quality",
      content: `Performance Metrics and Code Quality Analysis:

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
Implementation uses TypeScript interfaces and analysis functions for SQL content evaluation.`,
      keywords: ["performance", "metrics", "quality", "analysis", "optimization", "speed", "cyclomatic", "complexity", "bulk", "maintainability", "code quality"]
    },
    {
      id: "system-architecture",
      title: "System Architecture",
      content: `System Architecture:

Frontend: React 18 with TypeScript, Vite build tool, shadcn/ui components with Tailwind CSS
Backend: Netlify Functions for serverless API calls
Database: Supabase (PostgreSQL-based) for authentication and data storage
AI Integration: Google Gemini (primary) and OpenRouter (fallback) APIs
Migration Tools: Custom conversion utilities for stored procedures
File Handling: Supports SQL file uploads (.sql, .sp, .ddl, .func, .trg) and conversions

Data Flow: User uploads SQL files → AI conversion engine processes → Results stored in Supabase → User views/downloads converted code → Performance metrics collected throughout

Database Schema (PostgreSQL via Supabase):
- Authentication: auth.users, auth.sessions
- Core Tables: profiles, migrations, migration_files, migration_reports, deployment_logs
- Admin: admin_logs, system_settings

Core Tables:
- profiles: Extends user info with application data (id, email, full_name, organization, role, avatar_url, metadata), roles: user, moderator, admin
- migrations: Stores migration session info, status: pending/processing/completed/failed/cancelled, AI model tracking, file processing statistics
- migration_files: Individual file conversion tracking, original and converted content storage, conversion status and error tracking
- migration_reports: Generated reports and analytics, performance metrics, quality scores, manual review requirements

Security: Row Level Security (RLS) policies, user-based access control, admin role restrictions, audit logging`,
      keywords: ["architecture", "system", "frontend", "backend", "data flow", "structure", "database", "schema", "supabase"]
    },
    {
      id: "ai-models",
      title: "AI Model Configuration",
      content: `AI Model Configuration:

Available Models:
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

Model Selection: Use Gemini Pro for complex stored procedures, Default for simple scripts, Custom for specialized requirements, optimize based on file size and complexity.`,
      keywords: ["ai model", "gemini", "openrouter", "model configuration", "prompt", "conversion", "oracle", "sybase"]
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting Guide",
      content: `Troubleshooting Guide:

Common Issues:
- Conversion Failures: Check file format and syntax, verify AI model availability, review error logs, test with smaller files first
- Authentication Problems: Verify Supabase configuration, check environment variables, clear browser cache, review user permissions
- Performance Issues: Monitor API response times, check database query performance, review file size limits, optimize AI model settings
- Deployment Issues: Verify environment variables, check Netlify function logs, review build configuration, test local development setup

Debug Tools: Browser developer tools, Netlify function logs, Supabase dashboard, AI service monitoring.

Support Resources: Documentation and guides, community forums, issue tracking system, direct support channels.

Best Practices:
- Test conversions on small files first
- Review all warnings and conversion notes
- Use appropriate AI model for complexity level
- Validate converted code in Oracle environment
- Use bulk operations for large datasets
- Optimize queries with proper indexing
- Leverage Oracle-specific features
- Monitor resource usage during conversions`,
      keywords: ["troubleshooting", "debug", "issues", "problems", "errors", "support", "best practices", "recommendations"]
    }
  ]
};

// Semantic search function with advanced matching
function semanticSearch(query, documents) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
  
  const results = [];
  
  for (const doc of documents) {
    const docLower = doc.content.toLowerCase();
    const titleLower = doc.title.toLowerCase();
    let score = 0;
    let matches = [];
    
    // Exact phrase matching (highest priority)
    if (docLower.includes(queryLower)) {
      score += 100;
      matches.push('exact_phrase');
    }
    
    if (titleLower.includes(queryLower)) {
      score += 80;
      matches.push('exact_title');
    }
    
    // Keyword matching
    for (const keyword of doc.keywords) {
      if (queryLower.includes(keyword.toLowerCase())) {
        score += 20;
        matches.push(`keyword_${keyword}`);
      }
    }
    
    // Word matching
    for (const word of queryWords) {
      if (docLower.includes(word)) {
        score += 10;
        matches.push(`word_${word}`);
      }
      if (titleLower.includes(word)) {
        score += 15;
        matches.push(`title_word_${word}`);
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
        if (docLower.includes(semanticKey) || synonyms.some(syn => docLower.includes(syn))) {
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
        if (contexts.some(ctx => docLower.includes(ctx))) {
          score += 3;
          matches.push(`context_${contextKey}`);
        }
      }
    }
    
    if (score > 0) {
      results.push({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        score,
        matches
      });
    }
  }
  
  // Sort by score and return top results
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 3); // Return top 3 most relevant
}

// Extract relevant context from search results
function extractContext(searchResults) {
  if (searchResults.length === 0) {
    return '';
  }
  
  let context = '';
  searchResults.forEach((result, index) => {
    context += `${result.title}:\n${result.content}\n\n`;
  });
  
  return context.trim();
}

exports.handler = async function(event, context) {
  // Add CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // GET endpoint for testing
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'RAG API is running!',
        status: 'ok',
        timestamp: new Date().toISOString(),
        documentCount: PROJECT_KNOWLEDGE_BASE.documents.length
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

  try {
    const { query } = JSON.parse(event.body);
    
    if (!query) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Missing query parameter' }) 
      };
    }

    // Perform semantic search
    const searchResults = semanticSearch(query, PROJECT_KNOWLEDGE_BASE.documents);
    
    // Extract relevant context
    const context = extractContext(searchResults);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        query,
        context,
        searchResults: searchResults.map(result => ({
          id: result.id,
          title: result.title,
          score: result.score,
          matches: result.matches
        })),
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('RAG API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process query',
        details: error.message
      })
    };
  }
}; 