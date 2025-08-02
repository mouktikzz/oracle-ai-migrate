const fetch = require('node-fetch');

// Comprehensive project knowledge base with complete line-by-line documentation
const PROJECT_KNOWLEDGE_BASE = {
  documents: [
    {
      id: "main-readme",
      title: "Main README - Complete Project Overview",
      content: `# Sybase to Oracle Migration Tool

🚀 Sybase to Oracle Migration Tool
AI-Powered Database Migration Made Simple

🌟 Overview
Transform your Sybase database code to Oracle-compatible syntax with our intelligent AI-powered migration tool. Built for enterprise-scale migrations, this tool combines the power of Google Gemini AI with advanced conversion algorithms to ensure accurate, efficient, and reliable database migrations.

🤖 AI Chatbot Assistant
The application includes an intelligent AI chatbot to help with your migration:
- Access: Click the chat icon in the bottom-right corner
- Ask Questions: Get help with migration strategies, code explanations, and best practices
- Code Analysis: Upload code snippets for detailed analysis and conversion guidance
- Quick Suggestions: Use pre-built questions for common migration scenarios

🎯 Key Benefits
- 🤖 AI-Powered: Leverage Google Gemini AI for superior conversion accuracy
- ⚡ Fast & Efficient: Process multiple files simultaneously with batch operations
- 🔍 Quality Assurance: Advanced diff viewer and comprehensive validation
- 📊 Detailed Reporting: Generate professional migration reports for stakeholders
- 🚀 Direct Deployment: Deploy converted code directly to Oracle databases
- 👥 Team Collaboration: Multi-user support with role-based access control

✨ Features
Core Functionality:
- 📁 Multi-Format Support: SQL, Stored Procedures, Functions, Triggers, DDL
- 🔄 Batch Processing: Upload and convert entire directories
- 🎨 Visual Diff Viewer: Side-by-side code comparison with syntax highlighting
- 📈 Progress Tracking: Real-time conversion progress and status updates
- 💾 Export Options: Download individual files or complete migration packages
- 🤖 AI Chatbot Assistant: Get help with migration questions, code explanations, and best practices

Advanced Features:
- 🧠 Multiple AI Models: Choose between Gemini AI, Default, or Custom models
- ⚙️ Custom Rules: Define organization-specific conversion rules
- 🔗 API Integration: RESTful API for programmatic access
- 📋 Migration History: Complete audit trail of all conversions
- 🛡️ Enterprise Security: Role-based access, encryption, and audit logging

Administrative Capabilities:
- 👤 User Management: Comprehensive user and role administration
- 📊 System Monitoring: Real-time performance metrics and health checks
- 🗂️ File Management: Centralized file organization and lifecycle management
- 📈 Analytics Dashboard: Conversion success rates and usage statistics

🛠️ Technology Stack
Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
Backend: Supabase, PostgreSQL, Supabase Auth, Supabase Storage, Edge Functions
AI/ML: Gemini AI, LangChain, OpenAI (Optional), Custom Models
Infrastructure: Docker, Nginx, Cloud Deploy, CI/CD, Monitoring

🚀 Quick Start
1. Prerequisites: Node.js 18+ or Bun, Modern web browser, Supabase account, Gemini AI API key
2. Installation: Clone repository, install dependencies, set up environment variables
3. Configuration: Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GEMINI_API_KEY
4. Development: Start development server with npm run dev
5. First Migration: Sign up, upload files, choose AI model, review results, generate report, download

🐳 Docker Deployment
Quick Deploy: docker build -t sybase-oracle-migration . && docker run -p 8080:80 sybase-oracle-migration

📖 Documentation
Our comprehensive documentation covers every aspect of the migration tool:
- 📋 User Guide: Complete user manual and tutorials
- 🏗️ Architecture: System design and component overview
- 👩‍💻 Developer Guide: Setup, contributing, and customization
- 🚀 Deployment Guide: Production deployment instructions
- ⚙️ Configuration: Environment and feature configuration
- 📡 API Reference: Complete API documentation
- 🔧 Troubleshooting: Common issues and solutions

🔧 Configuration Examples
Basic Setup:
export const basicConfig = {
  aiModel: 'gemini',
  fileTypes: ['.sql', '.sp', '.proc'],
  maxFileSize: '10MB',
  batchSize: 20
};

Enterprise Setup:
export const enterpriseConfig = {
  aiModel: 'gemini',
  customRules: true,
  batchProcessing: true,
  directDeployment: true,
  auditLogging: true,
  roleBasedAccess: true
};

🤝 Contributing
Quick Contribution Steps:
1. Fork the repository
2. Create a feature branch: git checkout -b feature/amazing-feature
3. Make your changes and add tests
4. Commit with conventional commits: git commit -m "feat: add amazing feature"
5. Push to your fork: git push origin feature/amazing-feature
6. Open a Pull Request

📊 Project Stats
Conversion Accuracy: 95%+ for standard procedures
Processing Speed: < 30 seconds per file
Supported File Types: 6+ SQL file formats
AI Models: Multiple options available
Max File Size: 10MB per file
Batch Processing: Up to 50 files

🛟 Support
Getting Help:
- 📚 Documentation: Check our comprehensive docs
- 🐛 Issues: GitHub Issues for bug reports
- 💬 Discussions: GitHub Discussions for questions
- 📧 Email: support@migration-tool.com

Community:
- 🌟 Star us on GitHub if this project helps you!
- 🐦 Follow updates on our social channels
- 🤝 Contribute to make the tool even better

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
- Google Gemini AI for powering our conversion engine
- Supabase for providing the backend infrastructure
- Open Source Community for the amazing libraries and tools
- Contributors who help make this tool better every day

Made with ❤️ for the database migration community`,
      keywords: ["overview", "introduction", "features", "benefits", "technology", "quick start", "installation", "configuration", "deployment", "documentation", "contributing", "support", "license"]
    },
    {
      id: "admin-panel",
      title: "Admin Panel Setup and Usage - Complete Documentation",
      content: `# Admin Panel Setup and Usage

## Overview

The admin panel provides comprehensive system administration capabilities for the Oracle AI Migration application. It includes user management, system monitoring, activity logging, and configuration management.

## Features

### 1. Overview Dashboard
- Real-time system statistics
- User activity metrics
- Migration success rates
- System health indicators

### 2. User Management
- View all registered users
- Update user roles (user, moderator, admin)
- Delete user accounts
- Monitor user activity

### 3. System Settings
- Configure AI models
- Set file size limits
- Toggle cache settings
- Enable/disable maintenance mode

### 4. Activity Logs
- Track all administrative actions
- Monitor system events
- Audit trail for compliance

### 5. System Monitoring
- Real-time performance metrics
- CPU, memory, and disk usage
- Application-specific metrics
- Queue monitoring

## User Roles

### Admin
- Full system access
- User management
- System configuration
- Activity monitoring

### Moderator
- Limited admin access
- User management (no deletion)
- View activity logs
- Basic system monitoring

### User
- Standard application access
- No admin capabilities

## Security Features

- Role-based access control (RBAC)
- Row-level security (RLS) policies
- Activity logging for all admin actions
- Secure API endpoints

## API Endpoints

The admin panel uses the following Supabase tables:
- \`profiles\` - User information and roles
- \`admin_logs\` - Activity logging
- \`system_settings\` - Configuration management
- \`migrations\` - Migration tracking
- \`migration_files\` - File conversion tracking

## Monitoring and Alerts

The admin panel provides real-time monitoring for:
- System resource usage
- Active conversions
- Queue lengths
- Cache performance
- Response times

## Database Schema for Admin Panel

The admin panel relies on several key database tables:

### profiles Table
- id: UUID (Primary Key)
- email: String (Unique)
- full_name: String
- organization: String
- role: Enum ('user', 'moderator', 'admin')
- avatar_url: String (Optional)
- metadata: JSONB (Additional user data)
- created_at: Timestamp
- updated_at: Timestamp

### admin_logs Table
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to profiles)
- action: String (Action performed)
- details: JSONB (Action details)
- ip_address: String
- user_agent: String
- created_at: Timestamp

### system_settings Table
- id: UUID (Primary Key)
- key: String (Unique setting key)
- value: JSONB (Setting value)
- description: String
- updated_by: UUID (Foreign Key to profiles)
- updated_at: Timestamp

## Admin Panel Interface

### Dashboard Components
1. **System Overview Card**
   - Total users count
   - Active migrations
   - System health status
   - Recent activity summary

2. **User Management Section**
   - User list with search and filter
   - Role assignment interface
   - User activity timeline
   - Bulk user operations

3. **System Monitoring**
   - Real-time metrics display
   - Performance charts
   - Resource usage graphs
   - Alert notifications

4. **Activity Logs**
   - Filterable log entries
   - Export functionality
   - Audit trail viewer
   - Security event highlights

## Security Implementation

### Row Level Security (RLS) Policies

```sql
-- Admin users can view all profiles
CREATE POLICY "Admin can view all profiles" ON profiles
FOR SELECT USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Users can only view their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (
  auth.uid() = id
);

-- Only admins can update user roles
CREATE POLICY "Only admins can update roles" ON profiles
FOR UPDATE USING (
  auth.jwt() ->> 'role' = 'admin'
);
```

### API Security
- JWT token validation
- Role-based endpoint access
- Rate limiting on admin endpoints
- Input validation and sanitization

## Monitoring and Alerting

### Key Metrics Tracked
1. **User Activity**
   - Login frequency
   - Feature usage patterns
   - Session duration
   - Error rates

2. **System Performance**
   - API response times
   - Database query performance
   - Memory usage
   - CPU utilization

3. **Migration Processing**
   - Queue length
   - Processing times
   - Success/failure rates
   - AI model performance

### Alert Configuration
- High error rate notifications
- System resource warnings
- Unusual activity detection
- Security event alerts

## Best Practices for Admin Panel Usage

### User Management
1. **Regular Role Reviews**
   - Audit user roles quarterly
   - Remove unnecessary admin access
   - Document role assignments

2. **Activity Monitoring**
   - Review admin logs regularly
   - Investigate unusual activity
   - Maintain audit trail

3. **Security Maintenance**
   - Update security policies
   - Monitor for security events
   - Regular security assessments

### System Configuration
1. **Performance Tuning**
   - Monitor system metrics
   - Adjust settings based on usage
   - Optimize for peak loads

2. **Backup and Recovery**
   - Regular data backups
   - Test recovery procedures
   - Document disaster recovery plans

## Troubleshooting Common Admin Issues

### User Access Problems
- Verify user role assignments
- Check RLS policies
- Review authentication logs
- Validate JWT tokens

### System Performance Issues
- Monitor resource usage
- Check database performance
- Review API response times
- Analyze error logs

### Security Concerns
- Review admin activity logs
- Check for unauthorized access
- Validate security policies
- Update security configurations

## Integration with Main Application

### Data Flow
1. **User Authentication** → Admin panel access control
2. **Role Verification** → Feature access determination
3. **Action Logging** → Admin logs recording
4. **System Updates** → Real-time dashboard updates

### API Integration
- RESTful endpoints for admin operations
- Real-time WebSocket connections
- Secure authentication middleware
- Comprehensive error handling

This comprehensive admin panel provides enterprise-grade administration capabilities for the Oracle AI Migration Tool, ensuring secure, efficient, and maintainable system management.`,
      keywords: ["admin", "administrator", "management", "user management", "system", "dashboard", "admin panel", "roles", "security", "monitoring", "profiles", "admin_logs", "system_settings", "RLS", "RBAC"]
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