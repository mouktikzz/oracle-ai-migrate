# Database Schema Documentation

This document describes the database schema for the Sybase to Oracle Migration Tool, including tables, relationships, and data flow.

## 📚 Table of Contents

- [Schema Overview](#schema-overview)
- [Core Tables](#core-tables)
- [Authentication & Users](#authentication--users)
- [Migration Management](#migration-management)
- [Admin & Logging](#admin--logging)
- [Relationships](#relationships)
- [Indexes](#indexes)
- [Security](#security)

## 🗄️ Schema Overview

The application uses PostgreSQL (via Supabase) with the following schema structure:

```
Authentication (Supabase Auth)
├── auth.users
└── auth.sessions

Core Application
├── profiles (user management)
├── migrations (migration sessions)
├── migration_files (individual files)
├── migration_reports (generated reports)
└── deployment_logs (Oracle deployment tracking)

Administration
├── admin_logs (audit trail)
└── system_settings (configuration)
```

## 👥 Authentication & Users

### auth.users (Supabase managed)
Built-in Supabase authentication table.

### profiles
Extends user information with application-specific data.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  organization VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  PRIMARY KEY (id)
);
```

#### Columns Description
- **id**: Primary key, references auth.users
- **email**: User's email address (unique)
- **full_name**: User's display name
- **organization**: Company or organization name
- **role**: User role (user, moderator, admin)
- **avatar_url**: Profile picture URL
- **metadata**: Additional user preferences and settings

#### Sample Data
```sql
INSERT INTO profiles (id, email, full_name, organization, role) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'john.doe@company.com', 'John Doe', 'ACME Corp', 'user'),
('123e4567-e89b-12d3-a456-426614174001', 'admin@company.com', 'Admin User', 'ACME Corp', 'admin');
```

## 🔄 Migration Management

### migrations
Stores migration session information.

```sql
CREATE TABLE migrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
  ),
  ai_model VARCHAR(100) DEFAULT 'gemini',
  total_files INTEGER DEFAULT 0,
  processed_files INTEGER DEFAULT 0,
  success_files INTEGER DEFAULT 0,
  warning_files INTEGER DEFAULT 0,
  error_files INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  metadata JSONB DEFAULT '{}'
);
```

#### Status Flow
```
pending → processing → completed
                    → failed
                    → cancelled
```

#### Sample Data
```sql
INSERT INTO migrations (user_id, name, description, ai_model) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'Customer System Migration', 'Migration of customer management procedures', 'gemini');
```

### migration_files
Individual files within a migration session.

```sql
CREATE TABLE migration_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  migration_id UUID REFERENCES migrations(id) ON DELETE CASCADE,
  original_name VARCHAR(255) NOT NULL,
  original_content TEXT NOT NULL,
  converted_content TEXT,
  file_type VARCHAR(50) NOT NULL,
  size_bytes INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'warning', 'skipped')
  ),
  conversion_model VARCHAR(100),
  processing_time_ms INTEGER,
  similarity_score DECIMAL(5,2),
  complexity_score DECIMAL(5,2),
  issues JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  is_approved BOOLEAN DEFAULT false
);
```

#### Issues JSON Structure
```json
{
  "issues": [
    {
      "type": "warning",
      "message": "Function GETDATE() converted to SYSDATE",
      "line": 15,
      "severity": "low",
      "suggestion": "Verify timezone handling"
    }
  ]
}
```

#### Metrics JSON Structure
```json
{
  "metrics": {
    "lines_processed": 150,
    "lines_converted": 147,
    "functions_converted": 5,
    "procedures_converted": 2,
    "triggers_converted": 1,
    "compatibility_score": 95.5,
    "performance_score": 88.2,
    "maintainability_score": 91.7
  }
}
```

### migration_reports
Generated migration reports and documentation.

```sql
CREATE TABLE migration_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  migration_id UUID REFERENCES migrations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) DEFAULT 'standard' CHECK (
    report_type IN ('summary', 'detailed', 'technical', 'executive')
  ),
  format VARCHAR(20) DEFAULT 'json' CHECK (format IN ('json', 'pdf', 'html', 'excel')),
  content JSONB NOT NULL DEFAULT '{}',
  file_path TEXT,
  file_size INTEGER,
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  downloaded_count INTEGER DEFAULT 0,
  last_downloaded TIMESTAMP WITH TIME ZONE,
  is_public BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE
);
```

### deployment_logs
Tracks Oracle database deployments.

```sql
CREATE TABLE deployment_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  migration_id UUID REFERENCES migrations(id) ON DELETE CASCADE,
  file_id UUID REFERENCES migration_files(id) ON DELETE CASCADE,
  deployment_target VARCHAR(255) NOT NULL, -- Oracle connection identifier
  status VARCHAR(50) DEFAULT 'pending' CHECK (
    status IN ('pending', 'deploying', 'success', 'failed', 'rollback')
  ),
  deployment_script TEXT,
  execution_log TEXT,
  error_message TEXT,
  objects_created JSONB DEFAULT '[]',
  rollback_script TEXT,
  deployed_by UUID REFERENCES auth.users(id),
  deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  deployment_duration_ms INTEGER
);
```

## 🛡️ Admin & Logging

### admin_logs
Audit trail for administrative actions.

```sql
CREATE TABLE admin_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50), -- 'user', 'migration', 'system', etc.
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Sample Admin Actions
```sql
-- User role change
INSERT INTO admin_logs (admin_user_id, action, target_type, target_id, details) VALUES
('admin-uuid', 'role_changed', 'user', 'user-uuid', '{"old_role": "user", "new_role": "moderator"}');

-- System setting update
INSERT INTO admin_logs (admin_user_id, action, target_type, details) VALUES
('admin-uuid', 'setting_updated', 'system', '{"setting": "max_file_size", "old_value": "10MB", "new_value": "20MB"}');
```

### system_settings
Application-wide configuration settings.

```sql
CREATE TABLE system_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  data_type VARCHAR(20) DEFAULT 'string' CHECK (
    data_type IN ('string', 'number', 'boolean', 'json')
  ),
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- Can be read by non-admin users
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Default Settings
```sql
INSERT INTO system_settings (setting_key, setting_value, data_type, description, is_public) VALUES
('max_file_size_mb', '10', 'number', 'Maximum file size in MB', true),
('max_batch_files', '50', 'number', 'Maximum files per batch upload', true),
('default_ai_model', 'gemini', 'string', 'Default AI model for conversions', true),
('maintenance_mode', 'false', 'boolean', 'System maintenance mode', true),
('api_rate_limit', '100', 'number', 'API requests per minute per user', false);
```

## 🔗 Relationships

### Entity Relationship Diagram

```
auth.users ||--o{ profiles : "1:1 extends"
auth.users ||--o{ migrations : "1:many creates"
auth.users ||--o{ admin_logs : "1:many performs"

migrations ||--o{ migration_files : "1:many contains"
migrations ||--o{ migration_reports : "1:many generates"
migrations ||--o{ deployment_logs : "1:many deploys"

migration_files ||--o{ deployment_logs : "1:many deploys"
```

### Key Relationships

1. **User → Migrations**: One user can create multiple migrations
2. **Migration → Files**: Each migration contains multiple files
3. **Migration → Reports**: Each migration can have multiple reports
4. **File → Deployments**: Each file can be deployed multiple times
5. **Admin → Logs**: All admin actions are logged

## 📊 Indexes

### Performance Indexes

```sql
-- User and migration queries
CREATE INDEX idx_migrations_user_created ON migrations(user_id, created_at DESC);
CREATE INDEX idx_migrations_status ON migrations(status) WHERE status IN ('pending', 'processing');

-- File processing queries
CREATE INDEX idx_migration_files_migration_status ON migration_files(migration_id, status);
CREATE INDEX idx_migration_files_processed ON migration_files(processed_at) WHERE processed_at IS NOT NULL;

-- Report queries
CREATE INDEX idx_migration_reports_migration ON migration_reports(migration_id, created_at DESC);

-- Admin and audit queries
CREATE INDEX idx_admin_logs_admin_created ON admin_logs(admin_user_id, created_at DESC);
CREATE INDEX idx_admin_logs_action_created ON admin_logs(action, created_at DESC);

-- Settings queries
CREATE INDEX idx_system_settings_public ON system_settings(setting_key) WHERE is_public = true;

-- Deployment tracking
CREATE INDEX idx_deployment_logs_migration ON deployment_logs(migration_id, deployed_at DESC);
CREATE INDEX idx_deployment_logs_status ON deployment_logs(status, deployed_at DESC);
```

### Unique Constraints

```sql
-- Ensure email uniqueness
ALTER TABLE profiles ADD CONSTRAINT unique_email UNIQUE (email);

-- Ensure setting key uniqueness
ALTER TABLE system_settings ADD CONSTRAINT unique_setting_key UNIQUE (setting_key);
```

## 🔒 Security

### Row Level Security (RLS)

#### Profiles Security
```sql
-- Users can only view/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );
```

#### Migrations Security
```sql
-- Users can only access their own migrations
CREATE POLICY "Users can view own migrations" ON migrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create migrations" ON migrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own migrations" ON migrations
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all migrations
CREATE POLICY "Admins can view all migrations" ON migrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );
```

#### Files Security
```sql
-- Users can only access files from their migrations
CREATE POLICY "Users can view own migration files" ON migration_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM migrations 
      WHERE id = migration_files.migration_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own migration files" ON migration_files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM migrations 
      WHERE id = migration_files.migration_id AND user_id = auth.uid()
    )
  );
```

#### Admin Security
```sql
-- Only admins can view admin logs
CREATE POLICY "Only admins can view admin logs" ON admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can modify system settings
CREATE POLICY "Only admins can modify settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Non-admins can only read public settings
CREATE POLICY "Users can read public settings" ON system_settings
  FOR SELECT USING (is_public = true);
```

### Storage Security

```sql
-- Storage bucket policies for file uploads
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'migration-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'migration-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'migration-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Functions and Triggers

#### Auto-update timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Calculate migration progress
```sql
CREATE OR REPLACE FUNCTION calculate_migration_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE migrations SET
    processed_files = (
      SELECT COUNT(*) FROM migration_files 
      WHERE migration_id = NEW.migration_id 
      AND status IN ('completed', 'failed', 'warning')
    ),
    success_files = (
      SELECT COUNT(*) FROM migration_files 
      WHERE migration_id = NEW.migration_id 
      AND status = 'completed'
    ),
    warning_files = (
      SELECT COUNT(*) FROM migration_files 
      WHERE migration_id = NEW.migration_id 
      AND status = 'warning'
    ),
    error_files = (
      SELECT COUNT(*) FROM migration_files 
      WHERE migration_id = NEW.migration_id 
      AND status = 'failed'
    ),
    progress_percentage = (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE status IN ('completed', 'failed', 'warning'))::decimal / 
         NULLIF(COUNT(*), 0)) * 100, 2
      )
      FROM migration_files 
      WHERE migration_id = NEW.migration_id
    )
  WHERE id = NEW.migration_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_migration_progress
  AFTER INSERT OR UPDATE ON migration_files
  FOR EACH ROW EXECUTE FUNCTION calculate_migration_progress();
```

This schema provides a robust foundation for the Sybase to Oracle Migration Tool with proper security, performance optimization, and data integrity.