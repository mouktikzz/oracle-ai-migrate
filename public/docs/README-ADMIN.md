# Admin Panel Setup and Usage

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
- `profiles` - User information and roles
- `admin_logs` - Activity logging
- `system_settings` - Configuration management
- `migrations` - Migration tracking
- `migration_files` - File conversion tracking

## Monitoring and Alerts

The admin panel provides real-time monitoring for:
- System resource usage
- Active conversions
- Queue lengths
- Cache performance
- Response times