# API Documentation

This document provides comprehensive API documentation for the Sybase to Oracle Migration Tool, including endpoints, data structures, and integration examples.

## 📚 Table of Contents

- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Core Endpoints](#core-endpoints)
- [Data Models](#data-models)
- [Integration Examples](#integration-examples)
- [SDK and Libraries](#sdk-and-libraries)

## 🌐 API Overview

The Migration Tool provides both REST API endpoints through Supabase and client-side JavaScript APIs for direct integration.

### Base Configuration

```typescript
// API Configuration
const API_CONFIG = {
  baseUrl: 'https://your-project.supabase.co',
  apiKey: 'your-anon-key',
  version: 'v1',
  timeout: 30000,
};
```

### API Architecture

```
Client Application
       │
       ▼
┌─────────────────┐
│   Frontend API  │ ← Direct function calls
├─────────────────┤
│  Supabase API   │ ← REST endpoints
├─────────────────┤
│   AI Services   │ ← Gemini AI integration
└─────────────────┘
       │
       ▼
   PostgreSQL
```

## 🔐 Authentication

### Supabase Authentication

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Sign out
const { error } = await supabase.auth.signOut();
```

### API Key Authentication (for external integrations)

```typescript
// Custom API wrapper with authentication
class MigrationAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }
}
```

## 🔌 Core Endpoints

### File Management

#### Upload Files

```typescript
// Upload single file
export async function uploadFile(file: File): Promise<UploadResult> {
  const { data, error } = await supabase.storage
    .from('migration-files')
    .upload(`${userId}/${file.name}`, file);

  if (error) throw error;
  return data;
}

// Upload multiple files
export async function uploadFiles(files: File[]): Promise<UploadResult[]> {
  const uploads = files.map(file => uploadFile(file));
  return Promise.all(uploads);
}

// Example usage
const files = Array.from(fileInput.files);
const results = await uploadFiles(files);
```

#### List Files

```typescript
// Get user's uploaded files
export async function getUserFiles(userId: string): Promise<FileInfo[]> {
  const { data, error } = await supabase
    .from('migration_files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Get files by migration
export async function getMigrationFiles(migrationId: string): Promise<FileInfo[]> {
  const { data, error } = await supabase
    .from('migration_files')
    .select('*')
    .eq('migration_id', migrationId);

  if (error) throw error;
  return data;
}
```

#### Delete Files

```typescript
// Delete file
export async function deleteFile(fileId: string): Promise<void> {
  const { error } = await supabase
    .from('migration_files')
    .delete()
    .eq('id', fileId);

  if (error) throw error;
}
```

### Conversion Operations

#### Convert Code

```typescript
// Convert single file
export async function convertCode(
  code: string,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  const { aiModel = 'gemini', includeComments = true } = options;
  
  const result = await convertSybaseToOracle(code, {
    model: aiModel,
    preserveComments: includeComments,
    optimizeForOracle: true,
  });

  return result;
}

// Batch conversion
export async function convertBatch(
  files: CodeFile[],
  options: ConversionOptions = {}
): Promise<ConversionResult[]> {
  const results = await Promise.all(
    files.map(file => convertCode(file.content, options))
  );
  
  return results;
}

// Example usage
const conversionResult = await convertCode(sybaseCode, {
  aiModel: 'gemini',
  includeComments: true,
  targetOracleVersion: '19c',
});
```

#### Get Conversion Status

```typescript
// Check conversion progress
export async function getConversionStatus(migrationId: string): Promise<MigrationStatus> {
  const { data, error } = await supabase
    .from('migrations')
    .select(`
      *,
      migration_files(
        id,
        status,
        original_name,
        issues
      )
    `)
    .eq('id', migrationId)
    .single();

  if (error) throw error;
  return data;
}

// Real-time status updates
export function subscribeToMigrationUpdates(
  migrationId: string,
  callback: (status: MigrationStatus) => void
) {
  return supabase
    .channel(`migration:${migrationId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'migrations',
      filter: `id=eq.${migrationId}`,
    }, (payload) => {
      callback(payload.new as MigrationStatus);
    })
    .subscribe();
}
```

### Report Generation

#### Generate Migration Report

```typescript
// Generate comprehensive report
export async function generateMigrationReport(
  migrationId: string,
  options: ReportOptions = {}
): Promise<MigrationReport> {
  const migration = await getMigrationDetails(migrationId);
  const files = await getMigrationFiles(migrationId);
  
  const report = await generateBalancedConversionReport(
    migration,
    files,
    options
  );
  
  // Save report to database
  await saveMigrationReport(migrationId, report);
  
  return report;
}

// Get existing reports
export async function getMigrationReports(migrationId: string): Promise<MigrationReport[]> {
  const { data, error } = await supabase
    .from('migration_reports')
    .select('*')
    .eq('migration_id', migrationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

#### Export Report

```typescript
// Export report as PDF
export async function exportReportAsPDF(reportId: string): Promise<Blob> {
  const report = await getMigrationReport(reportId);
  return generatePDFReport(report);
}

// Export as Excel
export async function exportReportAsExcel(reportId: string): Promise<Blob> {
  const report = await getMigrationReport(reportId);
  return generateExcelReport(report);
}
```

### User Management (Admin API)

#### User Operations

```typescript
// Get all users (admin only)
export async function getAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Update user role
export async function updateUserRole(
  userId: string, 
  role: 'user' | 'moderator' | 'admin'
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}

// Delete user
export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;
}
```

### System Statistics

#### Get System Stats

```typescript
// Get dashboard statistics
export async function getSystemStats(): Promise<SystemStats> {
  const [
    totalUsers,
    totalMigrations,
    totalFiles,
    successRate
  ] = await Promise.all([
    getUserCount(),
    getMigrationCount(),
    getFileCount(),
    getSuccessRate()
  ]);

  return {
    users: totalUsers,
    migrations: totalMigrations,
    files: totalFiles,
    successRate,
    lastUpdated: new Date().toISOString(),
  };
}

// Get activity logs
export async function getActivityLogs(
  limit: number = 50,
  offset: number = 0
): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}
```

## 📊 Data Models

### Core Types

```typescript
// User Profile
interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  organization?: string;
  role: 'user' | 'moderator' | 'admin';
  created_at: string;
  updated_at: string;
}

// Migration
interface Migration {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_model: string;
  created_at: string;
  completed_at?: string;
  metadata: Record<string, any>;
}

// File Information
interface FileInfo {
  id: string;
  migration_id: string;
  original_name: string;
  original_content: string;
  converted_content?: string;
  file_type: string;
  size_bytes: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'warning';
  issues: ConversionIssue[];
  metrics: ConversionMetrics;
  created_at: string;
  processed_at?: string;
}

// Conversion Result
interface ConversionResult {
  id: string;
  file_id: string;
  original_code: string;
  converted_code: string;
  status: 'success' | 'warning' | 'error';
  issues: ConversionIssue[];
  metrics: ConversionMetrics;
  ai_model: string;
  processing_time: number;
}

// Conversion Issue
interface ConversionIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Conversion Metrics
interface ConversionMetrics {
  lines_processed: number;
  lines_converted: number;
  functions_converted: number;
  procedures_converted: number;
  compatibility_score: number;
  performance_score: number;
  complexity_score: number;
}

// Migration Report
interface MigrationReport {
  id: string;
  migration_id: string;
  title: string;
  summary: string;
  statistics: ReportStatistics;
  file_analysis: FileAnalysis[];
  recommendations: string[];
  created_at: string;
  report_data: Record<string, any>;
}
```

### Request/Response Models

```typescript
// Upload Request
interface UploadRequest {
  files: File[];
  migration_name?: string;
  description?: string;
  ai_model?: string;
}

// Upload Response
interface UploadResponse {
  migration_id: string;
  file_ids: string[];
  status: 'uploaded' | 'processing';
  message: string;
}

// Conversion Request
interface ConversionRequest {
  code: string;
  file_type?: string;
  ai_model?: string;
  options?: ConversionOptions;
}

// Conversion Options
interface ConversionOptions {
  aiModel?: 'gemini' | 'default' | 'custom';
  preserveComments?: boolean;
  targetOracleVersion?: string;
  optimizeForPerformance?: boolean;
  includeDocumentation?: boolean;
  customRules?: ConversionRule[];
}

// API Response Wrapper
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    request_id: string;
    processing_time: number;
  };
}
```

## 🔧 Integration Examples

### React Hook Integration

```typescript
// Custom hook for migration operations
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useMigration() {
  const queryClient = useQueryClient();

  // Get migrations
  const { data: migrations, isLoading } = useQuery({
    queryKey: ['migrations'],
    queryFn: getUserMigrations,
  });

  // Create migration mutation
  const createMigration = useMutation({
    mutationFn: async (data: CreateMigrationData) => {
      const migration = await createNewMigration(data);
      return migration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['migrations'] });
    },
  });

  // Upload files mutation
  const uploadFiles = useMutation({
    mutationFn: async ({ migrationId, files }: { migrationId: string; files: File[] }) => {
      return await uploadMigrationFiles(migrationId, files);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['migration', variables.migrationId] 
      });
    },
  });

  return {
    migrations,
    isLoading,
    createMigration: createMigration.mutate,
    uploadFiles: uploadFiles.mutate,
    isCreating: createMigration.isPending,
    isUploading: uploadFiles.isPending,
  };
}

// Usage in component
function MigrationDashboard() {
  const { migrations, createMigration, uploadFiles } = useMigration();

  const handleCreateMigration = useCallback((data: CreateMigrationData) => {
    createMigration(data);
  }, [createMigration]);

  return (
    <div>
      {/* Migration UI */}
    </div>
  );
}
```

### Node.js Integration

```typescript
// Node.js SDK for server-side integration
import { createClient } from '@supabase/supabase-js';

class MigrationSDK {
  private supabase;

  constructor(url: string, key: string) {
    this.supabase = createClient(url, key);
  }

  // Authenticate with service role
  async authenticate(serviceRoleKey: string) {
    this.supabase = createClient(this.supabaseUrl, serviceRoleKey);
  }

  // Batch processing
  async processBatch(files: { name: string; content: string }[]) {
    const migration = await this.createMigration({
      name: `Batch_${Date.now()}`,
      description: 'Automated batch processing',
    });

    const results = [];
    for (const file of files) {
      const result = await this.convertCode(file.content);
      results.push(result);
    }

    return {
      migration_id: migration.id,
      results,
    };
  }

  // Convert single file
  async convertCode(code: string, options: ConversionOptions = {}) {
    return await convertSybaseToOracle(code, options);
  }
}

// Usage
const sdk = new MigrationSDK(supabaseUrl, supabaseKey);
await sdk.authenticate(serviceRoleKey);

const results = await sdk.processBatch([
  { name: 'proc1.sql', content: sybaseCode1 },
  { name: 'proc2.sql', content: sybaseCode2 },
]);
```

### Python Integration

```python
# Python SDK for integration
import requests
import json
from typing import List, Dict, Optional

class MigrationAPI:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })

    def upload_files(self, migration_id: str, files: List[Dict]) -> Dict:
        """Upload files to migration"""
        response = self.session.post(
            f'{self.base_url}/migrations/{migration_id}/files',
            json={'files': files}
        )
        response.raise_for_status()
        return response.json()

    def get_migration_status(self, migration_id: str) -> Dict:
        """Get migration status"""
        response = self.session.get(
            f'{self.base_url}/migrations/{migration_id}'
        )
        response.raise_for_status()
        return response.json()

    def convert_code(self, code: str, options: Optional[Dict] = None) -> Dict:
        """Convert Sybase code to Oracle"""
        payload = {
            'code': code,
            'options': options or {}
        }
        response = self.session.post(
            f'{self.base_url}/convert',
            json=payload
        )
        response.raise_for_status()
        return response.json()

# Usage
api = MigrationAPI('https://your-api.com', 'your-api-key')

# Convert code
result = api.convert_code(sybase_code, {
    'ai_model': 'gemini',
    'preserve_comments': True
})

print(f"Conversion status: {result['status']}")
print(f"Oracle code: {result['converted_code']}")
```

## 📚 SDK and Libraries

### Official JavaScript SDK

```bash
npm install @migration-tool/sdk
```

```typescript
import { MigrationSDK } from '@migration-tool/sdk';

const sdk = new MigrationSDK({
  supabaseUrl: 'your-supabase-url',
  supabaseKey: 'your-supabase-key',
  geminiApiKey: 'your-gemini-key',
});

// Initialize
await sdk.initialize();

// Upload and convert
const migration = await sdk.createMigration('My Migration');
const files = await sdk.uploadFiles(migration.id, fileList);
const results = await sdk.convertFiles(files);
```

### CLI Tool

```bash
npm install -g @migration-tool/cli
```

```bash
# Configure CLI
migration-cli config set --supabase-url=your-url --api-key=your-key

# Upload and convert files
migration-cli convert ./sql-files/*.sql --output=./oracle-files/

# Generate report
migration-cli report --migration-id=123 --format=pdf --output=report.pdf
```

### REST API Client Libraries

Available in multiple languages:
- **JavaScript/TypeScript**: `@migration-tool/sdk`
- **Python**: `migration-tool-python`
- **Java**: `migration-tool-java`
- **C#**: `MigrationTool.SDK`
- **Go**: `github.com/migration-tool/go-sdk`

This API documentation provides comprehensive coverage of all available endpoints and integration patterns for the Sybase to Oracle Migration Tool.