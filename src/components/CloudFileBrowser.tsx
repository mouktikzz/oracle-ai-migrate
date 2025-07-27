import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Github, 
  Box, 
  HardDrive,
  Folder,
  FileText,
  Download,
  Search,
  ArrowLeft,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CloudFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: string;
  path: string;
  provider: 'github' | 'dropbox' | 'google-drive';
  content?: string;
  download_url?: string;
}

interface CloudFileBrowserProps {
  provider: 'github' | 'dropbox' | 'google-drive';
  accessToken: string;
  onFileSelect: (file: CloudFile) => void;
  onClose: () => void;
}

const CloudFileBrowser: React.FC<CloudFileBrowserProps> = ({
  provider,
  accessToken,
  onFileSelect,
  onClose
}) => {
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<CloudFile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/.netlify/functions/${provider}-files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          path: currentPath,
          limit: 100
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to load files: ${response.status}`);
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error Loading Files",
        description: "Failed to load files from cloud storage",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClick = (file: CloudFile) => {
    if (file.type === 'folder') {
      setCurrentPath(file.path);
      setSelectedFile(null);
    } else {
      setSelectedFile(file);
    }
  };

  const handleFileSelect = async (file: CloudFile) => {
    try {
      // For GitHub, we need to fetch the file content
      if (provider === 'github' && file.type === 'file') {
        const response = await fetch(`/.netlify/functions/${provider}-files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: accessToken,
            path: file.path,
            action: 'get_content'
          })
        });

        if (response.ok) {
          const data = await response.json();
          file.content = data.content;
        }
      }

      onFileSelect(file);
      toast({
        title: "File Selected",
        description: `Selected ${file.name} from ${getProviderName(provider)}`,
      });
    } catch (error) {
      console.error('Error selecting file:', error);
      toast({
        title: "Error Selecting File",
        description: "Failed to select the file",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    if (currentPath) {
      const pathParts = currentPath.split('/').filter(Boolean);
      pathParts.pop();
      setCurrentPath(pathParts.join('/'));
      setSelectedFile(null);
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProviderIcon = () => {
    switch (provider) {
      case 'github': return <Github className="h-5 w-5" />;
      case 'dropbox': return <Box className="h-5 w-5" />;
      case 'google-drive': return <HardDrive className="h-5 w-5" />;
      default: return <Folder className="h-5 w-5" />;
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getProviderIcon()}
            <div>
              <CardTitle className="text-lg">
                {getProviderName(provider)} File Browser
              </CardTitle>
              <CardDescription>
                Browse and select files from your {getProviderName(provider)} account
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadFiles}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Breadcrumb */}
        {currentPath && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-6 px-2"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back
            </Button>
            <span>/</span>
            <span className="font-medium">{currentPath}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Files List */}
        <div className="border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading files...
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No files found matching your search' : 'No files in this folder'}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer ${
                    selectedFile?.id === file.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleFileClick(file)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {file.type === 'folder' ? (
                      <Folder className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{file.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        {file.type === 'file' && file.size && (
                          <span>{formatFileSize(file.size)}</span>
                        )}
                        {file.modified && (
                          <span>Modified: {formatDate(file.modified)}</span>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {file.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {file.type === 'file' && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileSelect(file);
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Select
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Selected: {selectedFile.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedFile.size && <span>Size: {formatFileSize(selectedFile.size)}</span>}
                  {selectedFile.modified && (
                    <span className="ml-4">Modified: {formatDate(selectedFile.modified)}</span>
                  )}
                </div>
                <Button onClick={() => handleFileSelect(selectedFile)}>
                  <Download className="h-4 w-4 mr-1" />
                  Import File
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default CloudFileBrowser; 