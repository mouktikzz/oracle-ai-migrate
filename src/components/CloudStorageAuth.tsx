import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Github, 
  Box,
  HardDrive,
  CheckCircle, 
  XCircle, 
  Loader2,
  User,
  Calendar,
  MapPin,
  Building,
  FileText,
  Folder,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CloudUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  provider: 'github' | 'dropbox' | 'google-drive';
}

interface CloudFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: string;
  path: string;
  provider: 'github' | 'dropbox' | 'google-drive';
}

interface CloudStorageAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: CloudUser, files?: CloudFile[]) => void;
}

const CloudStorageAuth: React.FC<CloudStorageAuthProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<CloudUser | null>(null);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [popup, setPopup] = useState<Window | null>(null);
  const [activeProvider, setActiveProvider] = useState<'github' | 'dropbox' | 'google-drive'>('github');
  const { toast } = useToast();

  // OAuth configuration
  const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'your-github-client-id';
  const DROPBOX_CLIENT_ID = import.meta.env.VITE_DROPBOX_CLIENT_ID || 'your-dropbox-client-id';
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id';
  
  const REDIRECT_URI = `${window.location.origin}/cloud-callback`;

  useEffect(() => {
    // Listen for messages from the popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'cloud-auth-success') {
        handleAuthSuccess(event.data.provider, event.data.token, event.data.user);
      } else if (event.data.type === 'cloud-auth-error') {
        handleAuthError(event.data.error);
      } else if (event.data.type === 'cloud-auth-cancelled') {
        handleAuthCancelled();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const getAuthUrl = (provider: string) => {
    switch (provider) {
      case 'github':
        return `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user,repo&state=${Date.now()}`;
      case 'dropbox':
        return `https://www.dropbox.com/oauth2/authorize?client_id=${DROPBOX_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&state=${Date.now()}`;
      case 'google-drive':
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=https://www.googleapis.com/auth/drive.readonly&state=${Date.now()}`;
      default:
        return '';
    }
  };

  const handleAuthSuccess = async (provider: string, token: string, userData?: any) => {
    try {
      setIsLoading(true);
      
      let finalUserData: CloudUser;
      
      if (userData) {
        finalUserData = {
          id: userData.id?.toString() || userData.login || userData.account_id,
          name: userData.name || userData.login || userData.name?.display_name,
          email: userData.email || '',
          avatar_url: userData.avatar_url || userData.profile_photo_url,
          provider: provider as 'github' | 'dropbox' | 'google-drive'
        };
      } else {
        // Fallback: fetch user data
        const response = await fetch(`/.netlify/functions/${provider}-auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: token })
        });
        
        if (!response.ok) throw new Error('Failed to fetch user data');
        const data = await response.json();
        finalUserData = data.user;
      }
      
      setUser(finalUserData);
      setIsAuthenticated(true);
      
      // Fetch files from the provider
      await fetchFiles(provider, token);
      
      toast({
        title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Connected!`,
        description: `Successfully authenticated as ${finalUserData.name}`,
      });

      if (popup && !popup.closed) {
        popup.close();
      }
      
    } catch (error) {
      console.error('Error in auth success:', error);
      handleAuthError('Failed to complete authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFiles = async (provider: string, token: string) => {
    try {
      const response = await fetch(`/.netlify/functions/${provider}-files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token })
      });
      
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleAuthError = (error: string) => {
    console.error('Cloud auth error:', error);
    toast({
      title: "Authentication Failed",
      description: error,
      variant: "destructive",
    });
    
    if (popup && !popup.closed) {
      popup.close();
    }
    setIsLoading(false);
  };

  const handleAuthCancelled = () => {
    toast({
      title: "Authentication Cancelled",
      description: "Authentication was cancelled",
    });
    
    if (popup && !popup.closed) {
      popup.close();
    }
    setIsLoading(false);
  };

  const initiateAuth = (provider: string) => {
    setIsLoading(true);
    setActiveProvider(provider as 'github' | 'dropbox' | 'google-drive');
    
    const authUrl = getAuthUrl(provider);
    const popupWindow = window.open(
      authUrl,
      'cloud-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    if (!popupWindow) {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site to continue with authentication",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setPopup(popupWindow);

    const checkClosed = setInterval(() => {
      if (popupWindow.closed) {
        clearInterval(checkClosed);
        if (!isAuthenticated) {
          handleAuthCancelled();
        }
      }
    }, 1000);
  };

  const handleContinue = () => {
    if (user) {
      onSuccess(user, files);
      onClose();
    }
  };

  const handleClose = () => {
    if (popup && !popup.closed) {
      popup.close();
    }
    onClose();
  };

  const getProviderIcon = (provider: string) => {
  switch (provider) {
    case 'github': return <Github className="h-4 w-4" />;
    case 'dropbox': return <Box className="h-4 w-4" />;
    case 'google-drive': return <HardDrive className="h-4 w-4" />;
    default: return <ExternalLink className="h-4 w-4" />;
  }
};

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'github': return 'GitHub';
      case 'dropbox': return 'Dropbox';
      case 'google-drive': return 'Google Drive';
      default: return provider;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Cloud Storage Authentication
          </DialogTitle>
        </DialogHeader>

        {!isAuthenticated ? (
          <Tabs value={activeProvider} onValueChange={(value) => setActiveProvider(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="github" className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub
              </TabsTrigger>
                          <TabsTrigger value="dropbox" className="flex items-center gap-2">
              <Box className="h-4 w-4" />
              Dropbox
            </TabsTrigger>
              <TabsTrigger value="google-drive" className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Google Drive
              </TabsTrigger>
            </TabsList>

            <TabsContent value="github" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    Connect with GitHub
                  </CardTitle>
                  <CardDescription>
                    Access your GitHub repositories and import code directly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">What you'll get:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Access to your GitHub repositories
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Direct code import from GitHub
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Version control integration
                      </li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => initiateAuth('github')} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Github className="mr-2 h-4 w-4" />
                        Connect GitHub
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dropbox" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Box className="h-5 w-5" />
                    Connect with Dropbox
                  </CardTitle>
                  <CardDescription>
                    Access your Dropbox files and folders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">What you'll get:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Access to your Dropbox files
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Browse folders and files
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Import files directly
                      </li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => initiateAuth('dropbox')} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Box className="mr-2 h-4 w-4" />
                        Connect Dropbox
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="google-drive" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Connect with Google Drive
                  </CardTitle>
                  <CardDescription>
                    Access your Google Drive files and documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">What you'll get:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Access to your Google Drive files
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Browse documents and folders
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Import files directly
                      </li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => initiateAuth('google-drive')} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <HardDrive className="mr-2 h-4 w-4" />
                        Connect Google Drive
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {getProviderIcon(user?.provider || 'github')}
                  {getProviderName(user?.provider || 'github')} Connected!
                </CardTitle>
                <CardDescription>
                  You're now authenticated with {getProviderName(user?.provider || 'github')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        {user.email && <p className="text-sm text-gray-600">{user.email}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {files.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Available Files:</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {files.slice(0, 10).map((file) => (
                        <div key={file.id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                          {file.type === 'folder' ? (
                            <Folder className="h-4 w-4 text-blue-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="truncate">{file.name}</span>
                        </div>
                      ))}
                      {files.length > 10 && (
                        <p className="text-xs text-gray-500">... and {files.length - 10} more files</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleContinue} className="flex-1">
                    Continue
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CloudStorageAuth; 