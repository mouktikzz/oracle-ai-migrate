# Configuration Guide

This guide covers all configuration options for the Sybase to Oracle Migration Tool, from basic setup to advanced customization.

## 📚 Table of Contents

- [Environment Configuration](#environment-configuration)
- [AI Model Configuration](#ai-model-configuration)
- [Database Configuration](#database-configuration)
- [Application Settings](#application-settings)
- [Security Configuration](#security-configuration)
- [Performance Tuning](#performance-tuning)

## 🌍 Environment Configuration

### Environment Variables

The application uses environment variables for configuration. Create appropriate `.env` files for each environment.

#### Core Configuration

```bash
# .env.local / .env.production

# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Services Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_OPENAI_API_KEY=your_openai_api_key (optional)

# Application Mode
VITE_APP_MODE=production # development, staging, production
VITE_DEBUG=false # Enable debug logging

# Optional: External Services
VITE_SENTRY_DSN=https://your-sentry-dsn
VITE_ANALYTICS_ID=your_analytics_id
```

#### Development Configuration

```bash
# .env.development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=your_dev_gemini_key
VITE_APP_MODE=development
VITE_DEBUG=true
VITE_HOT_RELOAD=true
VITE_MOCK_AI=false # Use mock AI responses for development
```

#### Staging Configuration

```bash
# .env.staging
VITE_SUPABASE_URL=https://your-project-staging.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=your_staging_gemini_key
VITE_APP_MODE=staging
VITE_DEBUG=true
VITE_SENTRY_DSN=https://your-staging-sentry-dsn
```

### Build Configuration

#### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          editor: ['@monaco-editor/react'],
          ai: ['@google/generative-ai', '@langchain/google-genai'],
        },
      },
    },
    // Performance optimizations
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
  },
  // Environment-specific configurations
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  // Development server
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:54321',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

## 🤖 AI Model Configuration

### Gemini AI Configuration

```typescript
// src/config/ai.ts
export const geminiConfig = {
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  model: 'gemini-pro',
  generationConfig: {
    temperature: 0.1, // Low temperature for consistent code generation
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 8192,
    candidateCount: 1,
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_NONE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_NONE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_NONE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_NONE',
    },
  ],
};
```

### Custom AI Model Integration

```typescript
// src/utils/ai/CustomAIModel.ts
import { AIModel, ConversionOptions, ConversionResult } from '@/types';

export class CustomAIModel implements AIModel {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; baseUrl: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
  }

  async convert(
    code: string, 
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const response = await fetch(`${this.baseUrl}/convert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        sourceDialect: 'sybase',
        targetDialect: 'oracle',
        options,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI conversion failed: ${response.statusText}`);
    }

    return await response.json();
  }
}
```

### Prompt Templates

```typescript
// src/config/prompts.ts
export const promptTemplates = {
  storedProcedure: `
Convert the following Sybase stored procedure to Oracle PL/SQL:

1. Change parameter syntax from @param to p_param IN/OUT TYPE
2. Add SYS_REFCURSOR for result sets
3. Use Oracle-specific functions where needed
4. Maintain the original logic and structure
5. Add proper error handling

Sybase Code:
{code}

Oracle PL/SQL:
`,

  function: `
Convert the following Sybase function to Oracle:

1. Change function declaration syntax
2. Update parameter and return types
3. Use Oracle built-in functions
4. Handle NULL values appropriately

Sybase Code:
{code}

Oracle Code:
`,

  trigger: `
Convert the following Sybase trigger to Oracle:

1. Update trigger syntax
2. Change OLD/NEW reference syntax
3. Use Oracle trigger features
4. Maintain trigger timing and events

Sybase Code:
{code}

Oracle Code:
`,
};
```

## 🗄️ Database Configuration

### Supabase Configuration

#### Database Schema

```sql
-- Core tables for the application
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  organization VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Migrations table
CREATE TABLE migrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  ai_model VARCHAR(100) DEFAULT 'gemini',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Migration files table
CREATE TABLE migration_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  migration_id UUID REFERENCES migrations(id) ON DELETE CASCADE,
  original_name VARCHAR(255) NOT NULL,
  original_content TEXT NOT NULL,
  converted_content TEXT,
  file_type VARCHAR(50),
  size_bytes INTEGER,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'warning')),
  issues JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);
```

#### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_files ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Migrations policies
CREATE POLICY "Users can view own migrations" ON migrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create migrations" ON migrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own migrations" ON migrations
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );
```

#### Storage Configuration

```sql
-- Storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('migration-files', 'migration-files', false);

-- Storage policies
CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'migration-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'migration-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Oracle Database Configuration (Target)

```typescript
// src/config/oracle.ts
export const oracleConfig = {
  development: {
    host: 'localhost',
    port: 1521,
    service: 'XEPDB1',
    user: 'migration_user',
    password: 'secure_password',
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
  production: {
    host: process.env.ORACLE_HOST,
    port: parseInt(process.env.ORACLE_PORT || '1521'),
    service: process.env.ORACLE_SERVICE,
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectTimeout: 60000,
    requestTimeout: 60000,
    pool: {
      min: 2,
      max: 10,
      increment: 1,
      timeout: 60,
    },
  },
};
```

## ⚙️ Application Settings

### Feature Flags

```typescript
// src/config/features.ts
export const featureFlags = {
  // AI Models
  enableGeminiAI: true,
  enableOpenAI: false,
  enableCustomAI: false,
  
  // File Processing
  enableBatchUpload: true,
  enableFolderUpload: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFilesPerBatch: 50,
  
  // Conversion Features
  enableDirectDeployment: true,
  enableRealtimePreview: true,
  enableCollaboration: true,
  
  // Admin Features
  enableUserManagement: true,
  enableSystemMonitoring: true,
  enableAdvancedReporting: true,
  
  // UI Features
  enableDarkMode: true,
  enableCodeEditor: true,
  enableDiffViewer: true,
};
```

### Application Constants

```typescript
// src/config/constants.ts
export const APP_CONFIG = {
  // File handling
  SUPPORTED_FILE_TYPES: ['.sql', '.sp', '.proc', '.ddl', '.func', '.trg'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_BATCH_SIZE: 50,
  
  // AI Processing
  AI_REQUEST_TIMEOUT: 120000, // 2 minutes
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Database
  CONNECTION_TIMEOUT: 30000,
  QUERY_TIMEOUT: 60000,
  
  // UI
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  PAGINATION_SIZE: 20,
  
  // Storage
  TEMP_FILE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  REPORT_RETENTION: 30 * 24 * 60 * 60 * 1000, // 30 days
};
```

### Conversion Rules Configuration

```typescript
// src/config/conversionRules.ts
export const conversionRules = {
  // Data type mappings
  dataTypes: {
    'VARCHAR': 'VARCHAR2',
    'TEXT': 'CLOB',
    'IMAGE': 'BLOB',
    'DATETIME': 'DATE',
    'SMALLDATETIME': 'DATE',
    'MONEY': 'NUMBER(19,4)',
    'SMALLMONEY': 'NUMBER(10,4)',
    'BIT': 'NUMBER(1)',
    'TINYINT': 'NUMBER(3)',
    'SMALLINT': 'NUMBER(5)',
    'INT': 'NUMBER(10)',
    'BIGINT': 'NUMBER(19)',
    'FLOAT': 'BINARY_DOUBLE',
    'REAL': 'BINARY_FLOAT',
  },
  
  // Function mappings
  functions: {
    'GETDATE()': 'SYSDATE',
    'ISNULL': 'NVL',
    'LEN': 'LENGTH',
    'CHARINDEX': 'INSTR',
    'LEFT': 'SUBSTR',
    'RIGHT': 'SUBSTR',
    'STUFF': 'REPLACE',
    'PATINDEX': 'REGEXP_INSTR',
    'DATEDIFF': 'EXTRACT',
    'DATEADD': 'INTERVAL',
    'CONVERT': 'TO_CHAR/TO_NUMBER/TO_DATE',
  },
  
  // System function mappings
  systemFunctions: {
    '@@IDENTITY': 'sequence_name.CURRVAL',
    '@@ROWCOUNT': 'SQL%ROWCOUNT',
    '@@ERROR': 'SQLCODE',
    '@@TRANCOUNT': 'transaction_active',
  },
  
  // Operator mappings
  operators: {
    '+=': '= column +',
    '-=': '= column -',
    '*=': '= column *',
    '/=': '= column /',
    '%=': '= column MOD',
  },
};
```

## 🔒 Security Configuration

### Authentication Configuration

```typescript
// src/config/auth.ts
export const authConfig = {
  supabase: {
    redirectTo: `${window.location.origin}/auth/callback`,
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    
    // Session configuration
    storage: {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      removeItem: (key: string) => localStorage.removeItem(key),
    },
    
    // Auto sign-in configuration
    flowType: 'pkce',
  },
  
  // Role-based access control
  roles: {
    user: {
      permissions: ['upload', 'convert', 'download', 'view_history'],
    },
    moderator: {
      permissions: ['upload', 'convert', 'download', 'view_history', 'moderate', 'view_admin'],
    },
    admin: {
      permissions: ['*'], // All permissions
    },
  },
  
  // Session management
  session: {
    timeout: 8 * 60 * 60 * 1000, // 8 hours
    refreshInterval: 60 * 60 * 1000, // 1 hour
    maxRefreshAttempts: 3,
  },
};
```

### API Security

```typescript
// src/config/security.ts
export const securityConfig = {
  // Rate limiting
  rateLimit: {
    upload: { requests: 10, window: 60000 }, // 10 uploads per minute
    conversion: { requests: 20, window: 60000 }, // 20 conversions per minute
    api: { requests: 100, window: 60000 }, // 100 API calls per minute
  },
  
  // File validation
  fileValidation: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['.sql', '.sp', '.proc', '.ddl', '.func', '.trg'],
    scanForMalware: true,
    quarantineDelay: 1000, // 1 second scan delay
  },
  
  // Content Security Policy
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://*.supabase.co', 'https://generativelanguage.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  },
  
  // CORS configuration
  cors: {
    allowedOrigins: process.env.NODE_ENV === 'production' 
      ? ['https://your-domain.com'] 
      : ['http://localhost:5173', 'http://localhost:3000'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },
};
```

## 🚀 Performance Tuning

### Frontend Optimization

```typescript
// src/config/performance.ts
export const performanceConfig = {
  // Code splitting
  lazyLoading: {
    chunkSize: 250000, // 250KB max chunk size
    preloadDelay: 2000, // 2 seconds
    retryAttempts: 3,
  },
  
  // Caching
  cache: {
    api: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    files: {
      maxSize: 50 * 1024 * 1024, // 50MB cache
      expiry: 24 * 60 * 60 * 1000, // 24 hours
    },
  },
  
  // Virtual scrolling
  virtualScrolling: {
    itemHeight: 40,
    bufferSize: 10,
    threshold: 100, // Enable for lists > 100 items
  },
  
  // Image optimization
  images: {
    lazyLoad: true,
    placeholder: 'blur',
    quality: 85,
    formats: ['webp', 'png'],
  },
};
```

### Database Performance

```sql
-- Indexes for better performance
CREATE INDEX idx_migrations_user_created ON migrations(user_id, created_at);
CREATE INDEX idx_migration_files_migration_status ON migration_files(migration_id, status);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_admin_logs_timestamp ON admin_logs(created_at);

-- Partial indexes for common queries
CREATE INDEX idx_migrations_active ON migrations(user_id) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_files_failed ON migration_files(migration_id) WHERE status = 'failed';
```

### AI Processing Optimization

```typescript
// src/config/aiOptimization.ts
export const aiOptimizationConfig = {
  // Request batching
  batching: {
    enabled: true,
    maxBatchSize: 5,
    batchTimeout: 2000, // 2 seconds
  },
  
  // Caching
  responseCache: {
    enabled: true,
    maxSize: 100, // 100 cached responses
    ttl: 60 * 60 * 1000, // 1 hour
    keyGenerator: (code: string) => hashCode(code),
  },
  
  // Retry logic
  retry: {
    attempts: 3,
    delay: 1000, // 1 second
    backoff: 2, // Exponential backoff
    retryOn: [408, 429, 500, 502, 503, 504],
  },
  
  // Timeout configuration
  timeouts: {
    request: 120000, // 2 minutes
    connection: 30000, // 30 seconds
  },
};
```

This configuration guide provides comprehensive coverage of all configurable aspects of the Sybase to Oracle Migration Tool. Always test configuration changes in development environments before applying to production.