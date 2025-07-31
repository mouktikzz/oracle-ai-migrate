import { RateLimiter, securityHeaders } from './validationUtils';

// Global rate limiter instance
const globalRateLimiter = new RateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes
const apiRateLimiter = new RateLimiter(50, 5 * 60 * 1000); // 50 requests per 5 minutes for API calls
const uploadRateLimiter = new RateLimiter(10, 60 * 1000); // 10 uploads per minute

// Security middleware for client-side protection
export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  
  private constructor() {
    this.initializeSecurityHeaders();
    this.setupCSP();
    this.preventXSS();
  }
  
  static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }
  
  private initializeSecurityHeaders(): void {
    // Set security headers for the application
    if (typeof window !== 'undefined') {
      // Client-side security measures
      this.setupClientSecurity();
    }
  }
  
  private setupClientSecurity(): void {
    // Disable right-click context menu (optional)
    document.addEventListener('contextmenu', (e) => {
      // Allow right-click in development
      if (import.meta.env.DEV) return;
      e.preventDefault();
    });
    
    // Disable F12, Ctrl+Shift+I, Ctrl+U
    document.addEventListener('keydown', (e) => {
      // Allow in development
      if (import.meta.env.DEV) return;
      
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
      }
    });
  }
  
  private setupCSP(): void {
    // Content Security Policy setup
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = securityHeaders['Content-Security-Policy'];
    document.head.appendChild(meta);
  }
  
  private preventXSS(): void {
    // Override dangerous methods to prevent XSS
    if (typeof window !== 'undefined') {
      // Capture reference to this instance for use in the setter
      const securityInstance = this;
      
      // Override innerHTML to sanitize content
      const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
      if (originalInnerHTML) {
        Object.defineProperty(Element.prototype, 'innerHTML', {
          set: function(value) {
            const sanitizedValue = securityInstance.sanitizeHTML(value);
            originalInnerHTML.set.call(this, sanitizedValue);
          },
          get: originalInnerHTML.get
        });
      }
    }
  }
  
  private sanitizeHTML(html: string): string {
    // Basic HTML sanitization
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  }
  
  // Rate limiting methods
  isRateLimited(identifier: string, type: 'global' | 'api' | 'upload' = 'global'): boolean {
    switch (type) {
      case 'api':
        return !apiRateLimiter.isAllowed(identifier);
      case 'upload':
        return !uploadRateLimiter.isAllowed(identifier);
      default:
        return !globalRateLimiter.isAllowed(identifier);
    }
  }
  
  getRemainingRequests(identifier: string, type: 'global' | 'api' | 'upload' = 'global'): number {
    switch (type) {
      case 'api':
        return apiRateLimiter.getRemainingRequests(identifier);
      case 'upload':
        return uploadRateLimiter.getRemainingRequests(identifier);
      default:
        return globalRateLimiter.getRemainingRequests(identifier);
    }
  }
  
  // Input sanitization wrapper
  sanitizeUserInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Remove null bytes and control characters
    let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Basic XSS prevention
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    return sanitized;
  }
  
  // File validation wrapper
  validateFileUpload(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      errors.push('File size exceeds 10MB limit');
    }
    
    // Check file name
    if (file.name.length > 255) {
      errors.push('Filename too long');
    }
    
    // Check for dangerous characters in filename
    if (/[<>:"|?*]/.test(file.name)) {
      errors.push('Filename contains invalid characters');
    }
    
    // Check file extension
    const ext = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['sql', 'txt', 'prc', 'trg', 'tab', 'proc', 'sp'];
    if (!ext || !allowedExtensions.includes(ext)) {
      errors.push('File type not supported');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Log security events
  logSecurityEvent(event: string, details?: any): void {
    console.warn(`[SECURITY] ${event}`, details);
    
    // In production, you would send this to a security monitoring service
    if (import.meta.env.PROD) {
      // Send to security monitoring service
      this.sendSecurityAlert(event, details);
    }
  }
  
  private sendSecurityAlert(event: string, details?: any): void {
    // Implementation for sending security alerts
    // This would typically send to a security monitoring service
    try {
      // Example: Send to security monitoring endpoint
      fetch('/api/security/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          details,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(() => {
        // Silently fail if security logging fails
      });
    } catch (error) {
      // Silently fail if security logging fails
    }
  }
}

// Export singleton instance
export const securityMiddleware = SecurityMiddleware.getInstance();

// Utility functions for common security checks
export const securityUtils = {
  // Check if the current environment is secure
  isSecureEnvironment(): boolean {
    if (typeof window === 'undefined') return true;
    
    // Check if running on HTTPS
    const isHttps = window.location.protocol === 'https:';
    
    // Check if running on localhost (development)
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    return isHttps || isLocalhost;
  },
  
  // Generate a secure random string
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(randomArray[i] % chars.length);
    }
    
    return result;
  },
  
  // Hash a string using SHA-256
  async hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },
  
  // Validate and sanitize URLs
  validateUrl(url: string): { isValid: boolean; sanitizedUrl?: string } {
    try {
      const urlObj = new URL(url);
      
      // Only allow HTTP and HTTPS protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false };
      }
      
      // Sanitize the URL
      const sanitizedUrl = urlObj.toString();
      
      return { isValid: true, sanitizedUrl };
    } catch {
      return { isValid: false };
    }
  }
}; 