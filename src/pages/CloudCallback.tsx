import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Github,
  Box,
  HardDrive
} from 'lucide-react';

const CloudCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'cancelled'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const [provider, setProvider] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    // Determine provider from state parameter or URL
    const stateParam = urlParams.get('state');
    if (stateParam && stateParam.startsWith('github_')) {
      setProvider('github');
    } else if (stateParam && stateParam.startsWith('dropbox_')) {
      setProvider('dropbox');
    } else if (stateParam && stateParam.startsWith('google-drive_')) {
      setProvider('google-drive');
    } else {
      // Fallback to URL path detection
      const path = window.location.pathname;
      if (path.includes('github')) {
        setProvider('github');
      } else if (path.includes('dropbox')) {
        setProvider('dropbox');
      } else if (path.includes('google')) {
        setProvider('google-drive');
      }
    }

    if (error) {
      setStatus('error');
      setMessage(errorDescription || error);
      
      setTimeout(() => {
        window.opener?.postMessage({
          type: 'cloud-auth-error',
          error: errorDescription || error
        }, window.location.origin);
        window.close();
      }, 2000);
      return;
    }

    if (code) {
      handleTokenExchange(code, state);
    } else {
      setStatus('cancelled');
      setMessage('Authentication was cancelled');
      
      setTimeout(() => {
        window.opener?.postMessage({
          type: 'cloud-auth-cancelled'
        }, window.location.origin);
        window.close();
      }, 2000);
    }
  }, []);

  const handleTokenExchange = async (code: string, state: string | null) => {
    try {
      setMessage('Exchanging authorization code...');
      
      // Call the appropriate backend function based on provider
      const functionName = provider === 'google-drive' ? 'google-auth' : `${provider}-auth`;
      const response = await fetch(`/.netlify/functions/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          redirect_uri: `${window.location.origin}/cloud-callback`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setStatus('success');
      setMessage('Authentication successful!');
      
      setTimeout(() => {
        window.opener?.postMessage({
          type: 'cloud-auth-success',
          provider: provider,
          token: data.access_token,
          user: data.user,
          state: state
        }, window.location.origin);
        window.close();
      }, 1000);
      
    } catch (error) {
      console.error('Token exchange failed:', error);
      setStatus('error');
      setMessage('Failed to complete authentication');
      
      setTimeout(() => {
        window.opener?.postMessage({
          type: 'cloud-auth-error',
          error: error instanceof Error ? error.message : 'Failed to exchange code for token'
        }, window.location.origin);
        window.close();
      }, 2000);
    }
  };

  const handleClose = () => {
    window.opener?.postMessage({
      type: 'cloud-auth-cancelled'
    }, window.location.origin);
    window.close();
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-8 w-8 text-gray-600" />;
      default:
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'cancelled':
        return 'text-gray-600';
      default:
        return 'text-blue-600';
    }
  };

  const getProviderIcon = () => {
  switch (provider) {
    case 'github':
      return <Github className="h-5 w-5" />;
    case 'dropbox':
      return <Box className="h-5 w-5" />;
    case 'google-drive':
      return <HardDrive className="h-5 w-5" />;
    default:
      return <ExternalLink className="h-5 w-5" />;
  }
};

  const getProviderName = () => {
    switch (provider) {
      case 'github':
        return 'GitHub';
      case 'dropbox':
        return 'Dropbox';
      case 'google-drive':
        return 'Google Drive';
      default:
        return 'Cloud Storage';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className={`flex items-center justify-center gap-2 ${getStatusColor()}`}>
            {getProviderIcon()}
            {getProviderName()} Authentication
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="animate-pulse text-sm text-gray-600">
                  Please wait while we complete the authentication process...
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <div className="text-sm text-green-600">
                Successfully authenticated with {getProviderName()}!
              </div>
              <div className="text-xs text-gray-500">
                This window will close automatically...
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <div className="text-sm text-red-600">
                Authentication failed. Please try again.
              </div>
              <div className="text-xs text-gray-500">
                This window will close automatically...
              </div>
            </div>
          )}
          
          {status === 'cancelled' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Authentication was cancelled.
              </div>
              <div className="text-xs text-gray-500">
                This window will close automatically...
              </div>
            </div>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="w-full mt-4"
          >
            Close Window
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CloudCallback; 