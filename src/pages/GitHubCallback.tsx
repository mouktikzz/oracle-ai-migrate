import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, CheckCircle, XCircle } from 'lucide-react';

const GitHubCallback: React.FC = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      // Handle OAuth error
      window.opener?.postMessage({
        type: 'github-auth-error',
        error: error
      }, window.location.origin);
      window.close();
      return;
    }

    if (code) {
      // Exchange code for token (in a real app, this would be done server-side)
      // For now, we'll simulate the token exchange
      handleTokenExchange(code, state);
    }
  }, []);

  const handleTokenExchange = async (code: string, state: string | null) => {
    try {
      // In a real implementation, you would make a server-side call to exchange the code for a token
      // For now, we'll simulate this process
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll create a mock token
      // In production, you would get this from your backend
      const mockToken = `ghp_${Math.random().toString(36).substring(2)}`;
      
      // Send token back to parent window
      window.opener?.postMessage({
        type: 'github-auth-success',
        token: mockToken,
        state: state
      }, window.location.origin);
      
      // Close the popup
      window.close();
    } catch (error) {
      console.error('Token exchange failed:', error);
      window.opener?.postMessage({
        type: 'github-auth-error',
        error: 'Failed to exchange code for token'
      }, window.location.origin);
      window.close();
    }
  };

  const handleClose = () => {
    window.opener?.postMessage({
      type: 'github-auth-cancelled'
    }, window.location.origin);
    window.close();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
                           <div className="mx-auto mb-4">
                   <ExternalLink className="h-12 w-12 text-gray-600" />
                 </div>
          <CardTitle>GitHub Authentication</CardTitle>
          <CardDescription>
            Processing your GitHub authentication...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Please wait while we complete the authentication process.
          </p>
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="w-full"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GitHubCallback; 