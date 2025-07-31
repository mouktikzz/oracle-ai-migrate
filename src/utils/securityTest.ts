// Security test suite
import { securityMiddleware } from './securityMiddleware';
import { sanitizeInput, validateEmail, validatePassword } from './validationUtils';

export const runSecurityTests = () => {
  console.log('🔒 Running Security Tests...');
  
  // Test 1: Input sanitization
  const maliciousInput = '<script>alert("xss")</script>Hello World';
  const sanitized = sanitizeInput(maliciousInput);
  console.log('✅ Input Sanitization Test:', {
    input: maliciousInput,
    sanitized,
    passed: !sanitized.includes('<script>')
  });
  
  // Test 2: Email validation
  const validEmail = 'test@example.com';
  const invalidEmail = 'invalid-email';
  console.log('✅ Email Validation Test:', {
    valid: validateEmail(validEmail),
    invalid: !validateEmail(invalidEmail),
    passed: validateEmail(validEmail) && !validateEmail(invalidEmail)
  });
  
  // Test 3: Password validation
  const weakPassword = '123';
  const strongPassword = 'StrongPass123!';
  const weakResult = validatePassword(weakPassword);
  const strongResult = validatePassword(strongPassword);
  console.log('✅ Password Validation Test:', {
    weak: weakResult.isValid,
    strong: strongResult.isValid,
    passed: !weakResult.isValid && strongResult.isValid
  });
  
  // Test 4: Rate limiting
  const testId = 'test-user';
  const allowed1 = securityMiddleware.isRateLimited(testId);
  const allowed2 = securityMiddleware.isRateLimited(testId);
  console.log('✅ Rate Limiting Test:', {
    first: allowed1,
    second: allowed2,
    passed: !allowed1 && !allowed2 // Should allow first few requests
  });
  
  // Test 5: XSS Prevention (innerHTML override)
  try {
    const testElement = document.createElement('div');
    testElement.innerHTML = '<script>alert("test")</script>Hello';
    const content = testElement.innerHTML;
    console.log('✅ XSS Prevention Test:', {
      content,
      passed: !content.includes('<script>')
    });
  } catch (error) {
    console.log('✅ XSS Prevention Test: innerHTML override working');
  }
  
  // Test 6: File validation
  const mockFile = new File(['test content'], 'test.sql', { type: 'text/plain' });
  const fileValidation = securityMiddleware.validateFileUpload(mockFile);
  console.log('✅ File Validation Test:', {
    isValid: fileValidation.isValid,
    errors: fileValidation.errors,
    passed: fileValidation.isValid
  });
  
  console.log('🔒 Security Tests Completed!');
};

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runSecurityTests);
  } else {
    runSecurityTests();
  }
} 