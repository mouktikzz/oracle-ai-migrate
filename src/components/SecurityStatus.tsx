import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { useSecurityContext } from '@/contexts/SecurityContext';

export const SecurityStatus: React.FC = () => {
  const { isInitialized, isSecureEnvironment, securityFeatures } = useSecurityContext();

  if (!isInitialized) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
          <CardDescription>Initializing security features...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Status
        </CardTitle>
        <CardDescription>Current security configuration and status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Environment Security</span>
          <Badge variant={isSecureEnvironment ? "default" : "destructive"} className="flex items-center gap-1">
            {isSecureEnvironment ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Secure
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3" />
                Insecure
              </>
            )}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Rate Limiting</span>
            <Badge variant={securityFeatures.rateLimiting ? "default" : "secondary"}>
              {securityFeatures.rateLimiting ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Input Validation</span>
            <Badge variant={securityFeatures.inputValidation ? "default" : "secondary"}>
              {securityFeatures.inputValidation ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">XSS Protection</span>
            <Badge variant={securityFeatures.xssProtection ? "default" : "secondary"}>
              {securityFeatures.xssProtection ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Content Security Policy</span>
            <Badge variant={securityFeatures.cspEnabled ? "default" : "secondary"}>
              {securityFeatures.cspEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </div>

        {!isSecureEnvironment && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Security Warning</p>
                <p>This application is not running in a secure environment. For production use, ensure HTTPS is enabled.</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Security Features Active</p>
              <p>All uploaded files and user inputs are validated and sanitized for security.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 