import { useCallback } from 'react';
import { securityMiddleware, securityUtils } from '@/utils/securityMiddleware';
import { validateFile, validateFileContent, sanitizeInput, sanitizeFilename } from '@/utils/validationUtils';

export const useSecurity = () => {
  const validateAndSanitizeFile = useCallback((file: File) => {
    // Validate file
    const fileValidation = validateFile(file);
    if (!fileValidation.isValid) {
      return { isValid: false, errors: fileValidation.errors };
    }
    
    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(file.name);
    
    return { isValid: true, sanitizedFilename };
  }, []);
  
  const validateAndSanitizeContent = useCallback((content: string) => {
    // Validate content
    const contentValidation = validateFileContent(content);
    if (!contentValidation.isValid) {
      return { isValid: false, errors: contentValidation.errors };
    }
    
    // Sanitize content
    const sanitizedContent = sanitizeInput(content);
    
    return { isValid: true, sanitizedContent };
  }, []);
  
  const checkRateLimit = useCallback((identifier: string, type: 'global' | 'api' | 'upload' = 'global') => {
    return securityMiddleware.isRateLimited(identifier, type);
  }, []);
  
  const getRemainingRequests = useCallback((identifier: string, type: 'global' | 'api' | 'upload' = 'global') => {
    return securityMiddleware.getRemainingRequests(identifier, type);
  }, []);
  
  const logSecurityEvent = useCallback((event: string, details?: any) => {
    securityMiddleware.logSecurityEvent(event, details);
  }, []);
  
  const sanitizeUserInput = useCallback((input: string) => {
    return sanitizeInput(input);
  }, []);
  
  const isSecureEnvironment = useCallback(() => {
    return securityUtils.isSecureEnvironment();
  }, []);
  
  const generateSecureToken = useCallback((length: number = 32) => {
    return securityUtils.generateSecureToken(length);
  }, []);
  
  const hashString = useCallback(async (input: string) => {
    return await securityUtils.hashString(input);
  }, []);
  
  const validateUrl = useCallback((url: string) => {
    return securityUtils.validateUrl(url);
  }, []);
  
  return {
    validateAndSanitizeFile,
    validateAndSanitizeContent,
    checkRateLimit,
    getRemainingRequests,
    logSecurityEvent,
    sanitizeUserInput,
    isSecureEnvironment,
    generateSecureToken,
    hashString,
    validateUrl
  };
}; 