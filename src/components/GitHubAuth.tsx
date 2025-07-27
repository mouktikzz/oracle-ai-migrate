import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Github, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Loader2,
  User,
  Calendar,
  MapPin,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  bio: string;
  location: string;
  company: string;
  created_at: string;
  public_repos: number;
  followers: number;
  following: number;
}

interface GitHubAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: GitHubUser) => void;
}

const GitHubAuth: React.FC<GitHubAuthProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [popup, setPopup] = useState<Window | null>(null);
  const { toast } = useToast();

  // GitHub OAuth configuration
  const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'your-github-client-id';
  const REDIRECT_URI = `${window.location.origin}/github-callback`;
  const GITHUB_AUTH_URL = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user,repo&state=${Date.now()}`;

  useEffect(() => {
    // Listen for messages from the popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

                if (event.data.type === 'github-auth-success') {
            handleAuthSuccess(event.data.token, event.data.user);
          } else if (event.data.type === 'github-auth-error') {
        handleAuthError(event.data.error);
      } else if (event.data.type === 'github-auth-cancelled') {
        handleAuthCancelled();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

        const handleAuthSuccess = async (token: string, userData?: GitHubUser) => {
        try {
          setIsLoading(true);
          
          let finalUserData: GitHubUser;
          
          if (userData) {
            // User data was already fetched by the backend
            finalUserData = userData;
          } else {
            // Fallback: fetch user data from GitHub API
            const response = await fetch('https://api.github.com/user', {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            });

            if (!response.ok) {
              throw new Error('Failed to fetch user data');
            }

            finalUserData = await response.json();
          }
          
          setUser(finalUserData);
          setIsAuthenticated(true);
          
          toast({
            title: "GitHub Connected!",
            description: `Successfully authenticated as ${finalUserData.login}`,
          });

          // Close popup if it's still open
          if (popup && !popup.closed) {
            popup.close();
          }
          
        } catch (error) {
          console.error('Error fetching user data:', error);
          handleAuthError('Failed to fetch user data');
        } finally {
          setIsLoading(false);
        }
      };

  const handleAuthError = (error: string) => {
    console.error('GitHub auth error:', error);
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
      description: "GitHub authentication was cancelled",
    });
    
    if (popup && !popup.closed) {
      popup.close();
    }
    setIsLoading(false);
  };

  const initiateGitHubAuth = () => {
    setIsLoading(true);
    
    // Open popup window
    const popupWindow = window.open(
      GITHUB_AUTH_URL,
      'github-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    if (!popupWindow) {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site to continue with GitHub authentication",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setPopup(popupWindow);

    // Check if popup was closed manually
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
      onSuccess(user);
      onClose();
    }
  };

  const handleClose = () => {
    if (popup && !popup.closed) {
      popup.close();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Authentication
          </DialogTitle>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connect with GitHub</CardTitle>
                <CardDescription>
                  Authenticate with GitHub to access your repositories and enable advanced features
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
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Enhanced collaboration features
                    </li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={initiateGitHubAuth} 
                    disabled={isLoading}
                    className="flex-1"
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
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">GitHub Connected!</CardTitle>
                <CardDescription>
                  You're now authenticated with GitHub
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatar_url} 
                        alt={user.login}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-medium">{user.name || user.login}</h3>
                        <p className="text-sm text-gray-600">@{user.login}</p>
                      </div>
                    </div>

                    {user.bio && (
                      <p className="text-sm text-gray-600">{user.bio}</p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span>{user.public_repos} repos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{user.followers} followers</span>
                      </div>
                    </div>

                    {user.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {user.location}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      Member since {new Date(user.created_at).toLocaleDateString()}
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

export default GitHubAuth; 