import React, { createContext, useContext, useEffect, useState } from 'react';
import { securityMiddleware, securityUtils } from '@/utils/securityMiddleware';

interface SecurityContextType {
  isInitialized: boolean;
  isSecureEnvironment: boolean;
  securityFeatures: {
    rateLimiting: boolean;
    inputValidation: boolean;
    xssProtection: boolean;
    cspEnabled: boolean;
  };
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSecureEnvironment, setIsSecureEnvironment] = useState(false);
  const [securityFeatures, setSecurityFeatures] = useState({
    rateLimiting: false,
    inputValidation: false,
    xssProtection: false,
    cspEnabled: false,
  });

  useEffect(() => {
    const initializeSecurity = () => {
      try {
        // Check if we're in a secure environment
        const secure = securityUtils.isSecureEnvironment();
        setIsSecureEnvironment(secure);

        // Initialize security features
        const features = {
          rateLimiting: true, // Rate limiting is always enabled
          inputValidation: true, // Input validation is always enabled
          xssProtection: true, // XSS protection is always enabled
          cspEnabled: typeof window !== 'undefined', // CSP is enabled in browser
        };

        setSecurityFeatures(features);

        // Log security initialization
        securityMiddleware.logSecurityEvent('Security initialized', {
          secureEnvironment: secure,
          features,
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
          timestamp: new Date().toISOString(),
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize security:', error);
        securityMiddleware.logSecurityEvent('Security initialization failed', { error });
        setIsInitialized(true); // Still mark as initialized to prevent blocking
      }
    };

    initializeSecurity();
  }, []);

  const value: SecurityContextType = {
    isInitialized,
    isSecureEnvironment,
    securityFeatures,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}; 