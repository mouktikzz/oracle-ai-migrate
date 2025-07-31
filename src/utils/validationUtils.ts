import { z } from 'zod';
import DOMPurify from 'dompurify';

// File validation schemas
export const fileUploadSchema = z.object({
  name: z.string().min(1).max(255).regex(/^[a-zA-Z0-9._-]+$/),
  size: z.number().max(10 * 1024 * 1024), // 10MB limit
  type: z.string().refine((type) => {
    const allowedTypes = [
      'text/plain',
      'application/sql',
      'text/sql',
      'application/octet-stream'
    ];
    return allowedTypes.includes(type) || type.startsWith('text/');
  }, 'Invalid file type'),
  content: z.string().max(10 * 1024 * 1024) // 10MB content limit
});

export const userInputSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  fullName: z.string().min(1, 'Full name is required').max(100).regex(/^[a-zA-Z\s]+$/, 'Invalid characters in name'),
  filename: z.string().min(1).max(255).regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename'),
  content: z.string().min(1, 'Content cannot be empty').max(10 * 1024 * 1024)
});

export const databaseConnectionSchema = z.object({
  type: z.enum(['sybase', 'oracle']),
  host: z.string().min(1, 'Host is required').max(255).regex(/^[a-zA-Z0-9.-]+$/, 'Invalid host format'),
  port: z.string().regex(/^\d+$/, 'Port must be a number').refine((port) => {
    const portNum = parseInt(port);
    return portNum > 0 && portNum <= 65535;
  }, 'Port must be between 1 and 65535'),
  username: z.string().min(1, 'Username is required').max(50).regex(/^[a-zA-Z0-9_]+$/, 'Invalid username format'),
  password: z.string().min(1, 'Password is required').max(128),
  database: z.string().min(1, 'Database name is required').max(100).regex(/^[a-zA-Z0-9_]+$/, 'Invalid database name'),
  connectionString: z.string().max(1000).optional()
});

// SQL injection detection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)\b)/i,
  /(['"]\s*(union|select|insert|update|delete|drop|create|alter|exec|execute)\s*)/i,
  /(;\s*(union|select|insert|update|delete|drop|create|alter|exec|execute)\s*)/i,
  /(--\s*)/,
  /(\/\*.*?\*\/)/,
  /(xp_cmdshell|sp_executesql)/i,
  /(char\(|nchar\(|varchar\(|nvarchar\(|cast\(|convert\()/i
];

// XSS detection patterns
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /<form[^>]*>/gi,
  /<input[^>]*>/gi,
  /<textarea[^>]*>/gi,
  /<select[^>]*>/gi,
  /<button[^>]*>/gi
];

// Malicious file content patterns
const MALICIOUS_PATTERNS = [
  /eval\s*\(/gi,
  /Function\s*\(/gi,
  /setTimeout\s*\(/gi,
  /setInterval\s*\(/gi,
  /document\.write/gi,
  /document\.writeln/gi,
  /innerHTML\s*=/gi,
  /outerHTML\s*=/gi,
  /insertAdjacentHTML/gi,
  /createElement\s*\(/gi,
  /appendChild\s*\(/gi,
  /removeChild\s*\(/gi,
  /replaceChild\s*\(/gi
];

// Input sanitization functions
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // HTML sanitization using DOMPurify
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
  
  return sanitized;
};

export const sanitizeFilename = (filename: string): string => {
  if (typeof filename !== 'string') return '';
  
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '');
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, 255 - (ext ? ext.length + 1 : 0));
    sanitized = ext ? `${name}.${ext}` : name;
  }
  
  return sanitized;
};

// Validation functions
export const validateFile = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  try {
    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      errors.push('File size exceeds 10MB limit');
    }
    
    // Check file name
    const filenameValidation = userInputSchema.shape.filename.safeParse(file.name);
    if (!filenameValidation.success) {
      errors.push('Invalid filename format');
    }
    
    // Check file extension
    const ext = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['sql', 'txt', 'prc', 'trg', 'tab', 'proc', 'sp'];
    if (!ext || !allowedExtensions.includes(ext)) {
      errors.push('File type not supported');
    }
    
    // Check for duplicate files (basic check)
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      errors.push('Invalid file path');
    }
    
  } catch (error) {
    errors.push('File validation failed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateFileContent = (content: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  try {
    // Check content length
    if (content.length > 10 * 1024 * 1024) {
      errors.push('File content exceeds 10MB limit');
    }
    
    // Check for SQL injection patterns
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(content)) {
        errors.push('Potential SQL injection detected');
        break;
      }
    }
    
    // Check for XSS patterns
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(content)) {
        errors.push('Potential XSS attack detected');
        break;
      }
    }
    
    // Check for malicious patterns
    for (const pattern of MALICIOUS_PATTERNS) {
      if (pattern.test(content)) {
        errors.push('Potentially malicious content detected');
        break;
      }
    }
    
    // Check for null bytes
    if (content.includes('\x00')) {
      errors.push('Null bytes detected in content');
    }
    
  } catch (error) {
    errors.push('Content validation failed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateEmail = (email: string): boolean => {
  try {
    const emailSchema = z.string().email();
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rate limiting utilities
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private maxRequests: number;
  private windowMs: number;
  
  constructor(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requestData = this.requests.get(identifier);
    
    if (!requestData || now > requestData.resetTime) {
      this.requests.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (requestData.count >= this.maxRequests) {
      return false;
    }
    
    requestData.count++;
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const requestData = this.requests.get(identifier);
    if (!requestData) return this.maxRequests;
    
    const now = Date.now();
    if (now > requestData.resetTime) {
      return this.maxRequests;
    }
    
    return Math.max(0, this.maxRequests - requestData.count);
  }
}

// Security headers configuration
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.google.com https://cdn.jsdelivr.net 'blob:'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
          "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com https://*.supabase.co https://rnliangcnhtpfgnrrigm.supabase.co",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Input validation wrapper
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { success: false, errors: ['Validation failed'] };
  }
};

// Export types
export type FileUploadData = z.infer<typeof fileUploadSchema>;
export type UserInputData = z.infer<typeof userInputSchema>;
export type DatabaseConnectionData = z.infer<typeof databaseConnectionSchema>; 