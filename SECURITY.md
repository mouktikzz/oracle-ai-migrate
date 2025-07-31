# Security Implementation

This document outlines the comprehensive security measures implemented in the Oracle AI Migration project.

## Overview

The application implements multiple layers of security to protect against common web vulnerabilities and ensure data integrity.

## Security Features

### 1. Input Validation and Sanitization

#### File Upload Validation
- **File Size Limits**: Maximum 10MB per file
- **File Type Restrictions**: Only `.sql`, `.txt`, `.prc`, `.trg`, `.tab`, `.proc`, `.sp` files allowed
- **Filename Sanitization**: Removes dangerous characters and path traversal attempts
- **Content Validation**: Checks for malicious patterns and SQL injection attempts

#### User Input Validation
- **Email Validation**: Proper email format validation using Zod schemas
- **Password Validation**: Minimum 8 characters, maximum 128 characters, requires uppercase, lowercase, and numbers
- **Name Validation**: Alphanumeric characters only, maximum 100 characters
- **Database Connection Validation**: Host, port, username, and database name validation

#### Content Sanitization
- **HTML Sanitization**: Using DOMPurify to prevent XSS attacks
- **SQL Injection Prevention**: Pattern matching for common SQL injection attempts
- **XSS Prevention**: Removal of script tags and dangerous attributes
- **Null Byte Removal**: Prevents null byte injection attacks

### 2. Rate Limiting

#### Implementation
- **Global Rate Limiter**: 100 requests per 15 minutes
- **API Rate Limiter**: 50 requests per 5 minutes for API calls
- **Upload Rate Limiter**: 10 uploads per minute
- **Client-based Tracking**: Uses client identifiers for rate limiting

#### Protected Endpoints
- Login attempts
- Signup attempts
- Password reset requests
- File uploads
- Connection testing

### 3. XSS Protection

#### Client-side Protection
- **DOMPurify Integration**: Sanitizes all HTML content
- **Content Security Policy**: Restricts script execution
- **Input Sanitization**: Escapes dangerous characters
- **innerHTML Override**: Prevents direct HTML injection

#### CSP Headers
```javascript
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

### 4. SQL Injection Prevention

#### Pattern Detection
The application detects and blocks common SQL injection patterns:
- `UNION`, `SELECT`, `INSERT`, `UPDATE`, `DELETE` statements
- Comment patterns (`--`, `/* */`)
- Stored procedure calls (`xp_cmdshell`, `sp_executesql`)
- String concatenation functions (`char()`, `varchar()`, etc.)

#### Input Validation
- All database connection parameters are validated
- Host names must match valid format patterns
- Port numbers must be within valid range (1-65535)
- Usernames and database names must be alphanumeric

### 5. Security Headers

#### Implemented Headers
- **X-Frame-Options**: `DENY` - Prevents clickjacking
- **X-Content-Type-Options**: `nosniff` - Prevents MIME type sniffing
- **X-XSS-Protection**: `1; mode=block` - Enables XSS filtering
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Controls referrer information
- **Permissions-Policy**: Restricts camera, microphone, and geolocation access

### 6. File Security

#### Upload Security
- **File Type Validation**: Whitelist of allowed file extensions
- **Content Scanning**: Checks for malicious patterns in file content
- **Size Limits**: Prevents large file uploads
- **Path Traversal Prevention**: Removes `../` and directory separators

#### Content Validation
- **Malicious Pattern Detection**: Scans for JavaScript execution patterns
- **Null Byte Detection**: Prevents null byte injection
- **Encoding Validation**: Ensures proper text encoding

### 7. Authentication Security

#### Password Requirements
- Minimum 8 characters
- Maximum 128 characters
- Must contain uppercase and lowercase letters
- Must contain at least one number
- Real-time validation feedback

#### Login Protection
- Rate limiting on login attempts
- Input sanitization
- Secure password handling
- Session management

### 8. Security Monitoring

#### Event Logging
- **Security Events**: All security-related events are logged
- **Failed Attempts**: Login failures, validation failures, etc.
- **Rate Limit Violations**: When users exceed rate limits
- **Malicious Content**: Detection of potentially harmful content

#### Monitoring Features
- Real-time security status display
- Environment security checks
- Feature status indicators
- Security warnings for insecure environments

## Implementation Details

### Validation Schemas

```typescript
// File upload validation
export const fileUploadSchema = z.object({
  name: z.string().min(1).max(255).regex(/^[a-zA-Z0-9._-]+$/),
  size: z.number().max(10 * 1024 * 1024),
  type: z.string().refine((type) => {
    const allowedTypes = ['text/plain', 'application/sql', 'text/sql', 'application/octet-stream'];
    return allowedTypes.includes(type) || type.startsWith('text/');
  }),
  content: z.string().max(10 * 1024 * 1024)
});

// User input validation
export const userInputSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(100).regex(/^[a-zA-Z\s]+$/),
  filename: z.string().min(1).max(255).regex(/^[a-zA-Z0-9._-]+$/),
  content: z.string().min(1).max(10 * 1024 * 1024)
});
```

### Security Middleware

```typescript
// Rate limiting
const globalRateLimiter = new RateLimiter(100, 15 * 60 * 1000);
const apiRateLimiter = new RateLimiter(50, 5 * 60 * 1000);
const uploadRateLimiter = new RateLimiter(10, 60 * 1000);

// Input sanitization
export const sanitizeInput = (input: string): string => {
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  sanitized = sanitized.trim();
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
  return sanitized;
};
```

## Usage

### Security Hook

```typescript
import { useSecurity } from '@/hooks/useSecurity';

const { validateAndSanitizeFile, checkRateLimit, logSecurityEvent } = useSecurity();

// Validate file upload
const fileValidation = validateAndSanitizeFile(file);
if (!fileValidation.isValid) {
  console.error('File validation failed:', fileValidation.errors);
}

// Check rate limiting
if (checkRateLimit('user-123', 'api')) {
  console.log('Rate limit exceeded');
}
```

### Security Context

```typescript
import { useSecurityContext } from '@/contexts/SecurityContext';

const { isSecureEnvironment, securityFeatures } = useSecurityContext();

if (!isSecureEnvironment) {
  console.warn('Running in insecure environment');
}
```

## Best Practices

### For Developers

1. **Always validate inputs**: Use the provided validation schemas
2. **Sanitize user content**: Use the sanitization functions before processing
3. **Check rate limits**: Implement rate limiting for all user actions
4. **Log security events**: Use the logging functions for monitoring
5. **Use HTTPS**: Ensure secure environment in production

### For Users

1. **Use strong passwords**: Follow the password requirements
2. **Upload only trusted files**: Only upload files from trusted sources
3. **Report security issues**: Contact administrators for security concerns
4. **Keep software updated**: Ensure browser and system are up to date

## Security Checklist

- [x] Input validation and sanitization
- [x] XSS protection
- [x] SQL injection prevention
- [x] Rate limiting
- [x] File upload security
- [x] Authentication security
- [x] Security headers
- [x] Content Security Policy
- [x] Security monitoring
- [x] Environment security checks

## Monitoring and Alerts

The application includes comprehensive security monitoring:

1. **Real-time Validation**: All inputs are validated in real-time
2. **Security Event Logging**: All security events are logged
3. **Rate Limit Monitoring**: Tracks and logs rate limit violations
4. **Environment Checks**: Monitors for secure environment requirements
5. **Feature Status**: Displays current security feature status

## Future Enhancements

1. **Two-Factor Authentication**: Add 2FA support
2. **Advanced Threat Detection**: Implement ML-based threat detection
3. **Security Dashboard**: Admin dashboard for security monitoring
4. **Automated Security Testing**: CI/CD security testing
5. **Vulnerability Scanning**: Regular security scans

## Contact

For security-related issues or questions, please contact the development team or create a security issue in the project repository. 