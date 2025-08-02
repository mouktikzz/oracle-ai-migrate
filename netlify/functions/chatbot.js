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

RESPONSE GUIDELINES:
- Provide natural, conversational responses without robotic phrases
- Use the project context information to give specific, relevant answers
- Focus on practical, actionable advice for Sybase to Oracle migration
- Be concise and direct in your responses
- Don't mention documentation files or sections - just provide the information naturally
- If the project context doesn't have specific information, provide general Oracle migration guidance
- Always relate answers back to the migration context when possible`;

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
  
  // Embedded documentation content for performance metrics and code quality analysis
  const performanceMetricsContent = `
# Performance Metrics and Code Quality Analysis

## Overview
The Sybase to Oracle Migration Tool includes comprehensive performance monitoring, metrics collection, and code quality analysis to ensure optimal system performance and maintainable code.

## Code Quality Metrics

### 1. Cyclomatic Complexity
- **Definition**: Measures code complexity based on decision points
- **Calculation**: Count of conditional statements, loops, and logical operators
- **Thresholds**: 
  - Low: 1-10 (Good)
  - Medium: 11-20 (Moderate)
  - High: 21-50 (Complex)
  - Very High: 50+ (Refactor needed)

### 2. Lines of Code Analysis
- **Total Lines**: Raw line count including comments and whitespace
- **Effective Lines**: Code lines excluding comments and empty lines
- **Comment Ratio**: Percentage of comment lines vs code lines
- **Change Impact**: Lines added/removed during conversion

### 3. Loop Analysis
- **Loop Types**: FOR, WHILE, CURSOR loops identified
- **Nested Loops**: Depth of loop nesting
- **Performance Impact**: Loop complexity and iteration count
- **Optimization Opportunities**: Bulk operations vs row-by-row processing

### 4. Comment Ratio and Quality
- **Comment Density**: Comments per function/procedure
- **Documentation Quality**: Meaningful vs redundant comments
- **Oracle-Specific Comments**: Migration notes and explanations
- **Maintenance Notes**: Areas requiring manual review

### 5. Maintainability Index
- **Formula**: Based on cyclomatic complexity, lines of code, and comment ratio
- **Scoring**: 0-100 scale (higher = more maintainable)
- **Categories**:
  - Excellent: 85-100
  - Good: 65-84
  - Fair: 45-64
  - Poor: 0-44

### 6. Bulk Operations Analysis
- **BULK COLLECT Usage**: Oracle bulk collection patterns
- **BULK INSERT/UPDATE**: Batch processing opportunities
- **Performance Gains**: Estimated performance improvements
- **Memory Considerations**: Batch size optimization

### 7. Scalability Assessment
- **Resource Usage**: CPU, memory, and I/O patterns
- **Concurrent Access**: Multi-user performance impact
- **Growth Projections**: Scalability under increased load
- **Bottleneck Identification**: Performance limiting factors

### 8. Modern Features Detection
- **Oracle 12c+ Features**: JSON, LISTAGG, LATERAL joins
- **Performance Features**: Result caching, adaptive plans
- **Security Features**: VPD, encryption, audit trails
- **Maintenance Features**: Online DDL, partitioning

### 9. Overall Performance Score
- **Composite Score**: Weighted average of all metrics
- **Scoring Factors**:
  - Code Complexity: 25%
  - Performance Patterns: 25%
  - Modern Features: 20%
  - Maintainability: 15%
  - Documentation: 15%

### 10. Manual Edit Requirements
- **Critical Issues**: Must-fix problems
- **Performance Optimizations**: Recommended improvements
- **Oracle-Specific Changes**: Platform-specific modifications
- **Testing Requirements**: Areas needing validation

## Implementation Details

### Database Schema for Code Quality Metrics
\`\`\`sql
-- Code quality metrics table
CREATE TABLE code_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES migration_files(id),
  cyclomatic_complexity INTEGER,
  total_lines INTEGER,
  effective_lines INTEGER,
  comment_ratio DECIMAL(5,2),
  maintainability_index INTEGER,
  bulk_operations_count INTEGER,
  modern_features_count INTEGER,
  scalability_score INTEGER,
  performance_score INTEGER,
  manual_edits_required TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loop analysis table
CREATE TABLE loop_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES migration_files(id),
  loop_type VARCHAR(20),
  nesting_level INTEGER,
  iteration_estimate INTEGER,
  optimization_potential TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance recommendations table
CREATE TABLE performance_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES migration_files(id),
  recommendation_type VARCHAR(50),
  priority VARCHAR(20),
  description TEXT,
  estimated_impact VARCHAR(50),
  implementation_effort VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

### Code Analysis Implementation
\`\`\`typescript
// Code quality analyzer
interface CodeQualityMetrics {
  cyclomaticComplexity: number;
  totalLines: number;
  effectiveLines: number;
  commentRatio: number;
  maintainabilityIndex: number;
  bulkOperationsCount: number;
  modernFeaturesCount: number;
  scalabilityScore: number;
  performanceScore: number;
  manualEditsRequired: string[];
}

async function analyzeCodeQuality(sqlContent: string): Promise<CodeQualityMetrics> {
  const lines = sqlContent.split('\\n');
  const effectiveLines = lines.filter(line => 
    line.trim().length > 0 && !line.trim().startsWith('--')
  );
  
  // Calculate cyclomatic complexity
  const complexity = calculateCyclomaticComplexity(sqlContent);
  
  // Analyze loops and bulk operations
  const loopAnalysis = analyzeLoops(sqlContent);
  const bulkOps = countBulkOperations(sqlContent);
  
  // Detect modern Oracle features
  const modernFeatures = detectModernFeatures(sqlContent);
  
  // Calculate maintainability index
  const maintainabilityIndex = calculateMaintainabilityIndex(
    complexity, effectiveLines.length, commentRatio
  );
  
  // Generate performance score
  const performanceScore = calculatePerformanceScore({
    complexity,
    bulkOps,
    modernFeatures,
    maintainabilityIndex
  });
  
  return {
    cyclomaticComplexity: complexity,
    totalLines: lines.length,
    effectiveLines: effectiveLines.length,
    commentRatio: calculateCommentRatio(lines),
    maintainabilityIndex,
    bulkOperationsCount: bulkOps,
    modernFeaturesCount: modernFeatures.length,
    scalabilityScore: calculateScalabilityScore(sqlContent),
    performanceScore,
    manualEditsRequired: generateManualEditRecommendations(sqlContent)
  };
}
\`\`\`

## Reporting and Visualization

### 1. Code Quality Dashboard
- **Metrics Overview**: All quality metrics in one view
- **Trend Analysis**: Quality improvements over time
- **Comparison Charts**: Before/after conversion metrics
- **Risk Assessment**: High-complexity code identification

### 2. Performance Recommendations
- **Priority Ranking**: Critical to nice-to-have improvements
- **Implementation Guide**: Step-by-step optimization steps
- **Impact Estimation**: Expected performance gains
- **Effort Assessment**: Implementation complexity

### 3. Manual Review Checklist
- **Critical Issues**: Must-review items
- **Performance Optimizations**: Recommended changes
- **Oracle-Specific Modifications**: Platform requirements
- **Testing Requirements**: Validation needs

## Integration with Conversion Process

### 1. Pre-Conversion Analysis
- **Baseline Metrics**: Original code quality assessment
- **Risk Identification**: Potential conversion challenges
- **Resource Planning**: Estimated conversion effort

### 2. Post-Conversion Analysis
- **Quality Comparison**: Before/after metrics
- **Improvement Tracking**: Quality enhancement measurement
- **Validation Requirements**: Areas needing manual review

### 3. Continuous Monitoring
- **Quality Trends**: Long-term quality tracking
- **Performance Impact**: Quality vs performance correlation
- **Optimization Opportunities**: Ongoing improvement identification
`;

  // Check if query is related to performance metrics or code quality analysis
  const performanceKeywords = [
    'performance', 'metrics', 'monitoring', 'reporting', 'analytics', 'dashboard', 'tracking',
    'cyclomatic', 'complexity', 'lines of code', 'loops', 'comment ratio', 'maintainability',
    'bulk operations', 'bulk collect', 'scalability', 'modern features', 'performance score',
    'manual edits', 'code quality', 'analysis', 'assessment', 'optimization'
  ];
  const isPerformanceQuery = performanceKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );

  if (isPerformanceQuery) {
    const relevantSections = extractRelevantSections(performanceMetricsContent, searchTerms);
    results.push({
      file: 'performance-metrics.md',
      description: 'Performance metrics collection and reporting system',
      relevance: searchTerms.length,
      sections: relevantSections
    });
  }

  // Comprehensive embedded documentation content
  const architectureContent = `
# System Architecture

## Frontend Layer
- React 18 with TypeScript
- Vite build tool
- shadcn/ui components with Tailwind CSS
- React Query for server state management

## Backend Layer
- Netlify Functions for serverless API calls
- Supabase for database and authentication
- Google Gemini AI for code conversion
- OpenRouter as fallback AI service

## Data Flow
1. User uploads SQL files
2. Files are processed by AI conversion engine
3. Results are stored in Supabase database
4. User can view and download converted code
5. Performance metrics are collected throughout the process
`;

  const aiModelsContent = `
# AI Model Configuration and Usage

## Supported AI Models
- **Gemini Pro**: 95%+ accuracy, Fast, Medium cost - Complex procedures, production
- **Default**: 85%+ accuracy, Very Fast, Free - Simple conversions, testing
- **Custom**: Variable accuracy/speed/cost - Specialized requirements

## Google Gemini AI Configuration
- API Key: VITE_GEMINI_API_KEY environment variable
- Model: gemini-pro for production, gemini-2.0-flash-exp for speed
- Temperature: 0.1 for consistent code generation
- Max Output Tokens: 8192 for comprehensive responses
- Safety Settings: Configured for code generation tasks

## Prompt Engineering
- Base prompt template for Sybase to Oracle conversion
- Conversion rules: Parameter syntax, data types, functions, result sets
- Error handling and comment preservation
- Oracle-specific optimizations and best practices

## Model Selection Guidelines
- Use Gemini Pro for complex stored procedures
- Use Default model for simple scripts and testing
- Custom models for specialized requirements
- Performance optimization based on file size and complexity
`;

  const databaseSchemaContent = `
# Database Schema Documentation

## Schema Overview
- PostgreSQL via Supabase
- Authentication: auth.users, auth.sessions
- Core: profiles, migrations, migration_files, migration_reports, deployment_logs
- Admin: admin_logs, system_settings

## Core Tables

### profiles
- Extends user information with application-specific data
- Columns: id, email, full_name, organization, role, avatar_url, metadata
- Roles: user, moderator, admin

### migrations
- Stores migration session information
- Status: pending, processing, completed, failed, cancelled
- AI model tracking and file processing statistics

### migration_files
- Individual file conversion tracking
- Original and converted content storage
- Conversion status and error tracking

### migration_reports
- Generated migration reports and analytics
- Performance metrics and quality scores
- Manual review requirements and recommendations

## Security
- Row Level Security (RLS) policies
- User-based access control
- Admin role restrictions
- Audit logging for sensitive operations
`;

  const userGuideContent = `
# User Guide

## Getting Started
1. Account Setup: Registration, email verification, profile setup
2. Initial Configuration: AI model selection, preferences, test connection
3. First Login: Access migration dashboard

## User Interface Overview
- Main Dashboard: File upload, conversion status, recent activity, settings
- Navigation: Home, History, Reports, Profile, Admin
- Code Editor: Source panel, conversion panel, diff viewer, issues panel

## Migration Workflow
1. Upload Files: Single file or batch upload, supported types (.sql, .sp, .ddl, .func, .trg)
2. Review Conversions: Success/warning/failed status, side-by-side comparison
3. Generate Reports: Detailed analytics, performance metrics, recommendations

## Advanced Features
- Batch processing for multiple files
- Real-time conversion progress tracking
- Code quality analysis and optimization suggestions
- Integration with Oracle deployment tools

## Best Practices
- Test conversions on small files first
- Review all warnings and conversion notes
- Use appropriate AI model for complexity level
- Validate converted code in Oracle environment
`;

  const developerGuideContent = `
# Developer Guide

## Development Setup
- Prerequisites: Node.js v18+, npm/bun, Git, Docker (optional), VS Code
- Environment Setup: Clone repo, install dependencies, configure .env.local
- IDE Configuration: VS Code extensions and settings for optimal development

## Project Structure
- src/components/: Reusable UI components (shadcn/ui, custom components)
- src/pages/: Application pages and routing
- src/api/: API integration and data fetching
- src/contexts/: React context providers
- src/hooks/: Custom React hooks
- src/utils/: Utility functions and helpers

## Contributing Guidelines
- Code style: TypeScript, ESLint, Prettier
- Component development: shadcn/ui patterns
- Testing: Unit tests, integration tests
- Documentation: JSDoc comments, README updates

## API Reference
- Netlify Functions: Serverless API endpoints
- Supabase Client: Database operations and authentication
- AI Integration: Gemini and OpenRouter API calls
- File Processing: Upload, conversion, and download operations

## Testing
- Unit tests with Vitest
- Component testing with React Testing Library
- E2E testing with Playwright
- API testing with Postman/Thunder Client

## Deployment
- Netlify for frontend and functions
- Supabase for database and authentication
- Environment variable configuration
- CI/CD pipeline setup
`;

  const apiContent = `
# API Documentation

## Netlify Functions
- /api/ai-convert: Main conversion endpoint
- /api/ai-explain: Code explanation endpoint
- /api/chatbot: AI assistant endpoint
- /api/upload: File upload handling
- /api/reports: Report generation

## Supabase Integration
- Authentication: Sign up, sign in, session management
- Database: CRUD operations for migrations, files, reports
- Storage: File upload and download
- Real-time: Live updates for conversion progress

## AI Services Integration
- Google Gemini: Primary conversion engine
- OpenRouter: Fallback AI service
- Model selection and configuration
- Error handling and retry logic

## File Processing
- Upload validation and processing
- Conversion pipeline management
- Result storage and retrieval
- Download and export functionality
`;

  const configurationContent = `
# Configuration Guide

## Environment Variables
- VITE_SUPABASE_URL: Supabase project URL
- VITE_SUPABASE_ANON_KEY: Supabase anonymous key
- VITE_GEMINI_API_KEY: Google Gemini API key
- OPENROUTER_API_KEY: OpenRouter API key (fallback)
- ORACLE_CONNECTION_STRING: Oracle database connection

## AI Model Configuration
- Model selection: Gemini Pro, Default, Custom
- Temperature and token limits
- Safety settings and prompt templates
- Performance optimization settings

## Database Configuration
- Supabase project setup
- Table creation and schema management
- Row Level Security policies
- Backup and recovery procedures

## Application Settings
- File size limits and upload restrictions
- Conversion timeout settings
- Notification preferences
- User interface customization
`;

  const deploymentContent = `
# Deployment Guide

## Netlify Deployment
- Frontend build and deployment
- Netlify Functions configuration
- Environment variable setup
- Custom domain configuration

## Supabase Setup
- Project creation and configuration
- Database schema deployment
- Authentication setup
- Storage bucket configuration

## Production Configuration
- SSL certificate setup
- CDN configuration
- Monitoring and logging
- Performance optimization

## CI/CD Pipeline
- GitHub Actions workflow
- Automated testing
- Deployment automation
- Rollback procedures

## Monitoring and Maintenance
- Error tracking and alerting
- Performance monitoring
- Database maintenance
- Security updates
`;

  const troubleshootingContent = `
# Troubleshooting Guide

## Common Issues

### Conversion Failures
- Check file format and syntax
- Verify AI model availability
- Review error logs and messages
- Test with smaller files first

### Authentication Problems
- Verify Supabase configuration
- Check environment variables
- Clear browser cache and cookies
- Review user permissions

### Performance Issues
- Monitor API response times
- Check database query performance
- Review file size limits
- Optimize AI model settings

### Deployment Issues
- Verify environment variables
- Check Netlify function logs
- Review build configuration
- Test local development setup

## Debug Tools
- Browser developer tools
- Netlify function logs
- Supabase dashboard
- AI service monitoring

## Support Resources
- Documentation and guides
- Community forums
- Issue tracking system
- Direct support channels
`;

  // Check for different documentation areas
  const architectureKeywords = ['architecture', 'system', 'components', 'frontend', 'backend', 'data flow', 'structure'];
  const aiModelKeywords = ['ai model', 'gemini', 'openrouter', 'model configuration', 'prompt engineering', 'conversion engine'];
  const databaseKeywords = ['database', 'schema', 'tables', 'supabase', 'postgresql', 'profiles', 'migrations', 'reports'];
  const userGuideKeywords = ['user guide', 'getting started', 'workflow', 'upload', 'conversion', 'interface', 'dashboard'];
  const developerKeywords = ['developer', 'development', 'setup', 'contributing', 'testing', 'deployment', 'project structure'];
  const apiKeywords = ['api', 'endpoints', 'functions', 'integration', 'supabase client', 'netlify functions'];
  const configKeywords = ['configuration', 'environment variables', 'settings', 'setup', 'config'];
  const deploymentKeywords = ['deployment', 'netlify', 'production', 'ci/cd', 'monitoring', 'maintenance'];
  const troubleshootingKeywords = ['troubleshooting', 'debug', 'issues', 'problems', 'errors', 'support'];

  const isArchitectureQuery = architectureKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );
  const isAiModelQuery = aiModelKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );
  const isDatabaseQuery = databaseKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );
  const isUserGuideQuery = userGuideKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );
  const isDeveloperQuery = developerKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );
  const isApiQuery = apiKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );
  const isConfigQuery = configKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );
  const isDeploymentQuery = deploymentKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );
  const isTroubleshootingQuery = troubleshootingKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );

  if (isArchitectureQuery) {
    const relevantSections = extractRelevantSections(architectureContent, searchTerms);
    results.push({
      file: 'architecture.md',
      description: 'System architecture and component overview',
      relevance: searchTerms.length,
      sections: relevantSections
    });
  }

  if (isAiModelQuery) {
    const relevantSections = extractRelevantSections(aiModelsContent, searchTerms);
    results.push({
      file: 'ai-models.md',
      description: 'AI model configuration and usage guidelines',
      relevance: searchTerms.length,
      sections: relevantSections
    });
  }

  if (isDatabaseQuery) {
    const relevantSections = extractRelevantSections(databaseSchemaContent, searchTerms);
    results.push({
      file: 'database-schema.md',
      description: 'Database schema and table structures',
      relevance: searchTerms.length,
      sections: relevantSections
    });
  }

  if (isUserGuideQuery) {
    const relevantSections = extractRelevantSections(userGuideContent, searchTerms);
    results.push({
      file: 'user-guide/README.md',
      description: 'Complete user guide and workflow',
      relevance: searchTerms.length,
      sections: relevantSections
    });
  }

  if (isDeveloperQuery) {
    const relevantSections = extractRelevantSections(developerGuideContent, searchTerms);
    results.push({
      file: 'developer-guide/README.md',
      description: 'Developer documentation and setup',
      relevance: searchTerms.length,
      sections: relevantSections
    });
  }

  if (isApiQuery) {
    const relevantSections = extractRelevantSections(apiContent, searchTerms);
    results.push({
      file: 'api/README.md',
      description: 'API documentation and endpoints',
      relevance: searchTerms.length,
      sections: relevantSections
    });
  }

  if (isConfigQuery) {
    const relevantSections = extractRelevantSections(configurationContent, searchTerms);
    results.push({
      file: 'configuration/README.md',
      description: 'System configuration options',
      relevance: searchTerms.length,
      sections: relevantSections
    });
  }

  if (isDeploymentQuery) {
    const relevantSections = extractRelevantSections(deploymentContent, searchTerms);
    results.push({
      file: 'deployment/README.md',
      description: 'Deployment instructions and configuration',
      relevance: searchTerms.length,
      sections: relevantSections
    });
  }

  if (isTroubleshootingQuery) {
    const relevantSections = extractRelevantSections(troubleshootingContent, searchTerms);
    results.push({
      file: 'troubleshooting/README.md',
      description: 'Troubleshooting guides and solutions',
      relevance: searchTerms.length,
      sections: relevantSections
    });
  }

  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance);
  
  return results.slice(0, 3); // Return top 3 most relevant results
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
         docsContext = '\n\nPROJECT CONTEXT:\n';
         docsResults.forEach((result, index) => {
           docsContext += `\n${result.description}:\n`;
           result.sections.forEach(section => {
             docsContext += `${section.content}\n`;
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