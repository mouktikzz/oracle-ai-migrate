import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useStorageFiles } from '@/hooks/useStorageFiles';
import { Database, FileText, CheckCircle, XCircle, Clock, Loader2, RefreshCw, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StorageFilesPanelProps {
  migrationId?: string;
}

const StorageFilesPanel: React.FC<StorageFilesPanelProps> = ({ migrationId }) => {
  const { toast } = useToast();
  const { storageFiles, isLoading, refreshStorageFiles, deleteStorageFile } = useStorageFiles();
  const [filteredFiles, setFilteredFiles] = useState(storageFiles);

  useEffect(() => {
    if (migrationId) {
      setFilteredFiles(storageFiles.filter(file => file.migration_id === migrationId));
    } else {
      setFilteredFiles(storageFiles);
    }
  }, [storageFiles, migrationId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'converting':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Converted</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'converting':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Converting</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getFileTypeIcon = (fileName: string) => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('table')) return <Database className="h-4 w-4" />;
    if (lowerName.includes('proc')) return <FileText className="h-4 w-4" />;
    if (lowerName.includes('trig')) return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    try {
      await deleteStorageFile(fileId);
      toast({
        title: 'File Deleted',
        description: `${fileName} has been removed from storage files`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = async () => {
    await refreshStorageFiles();
    toast({
      title: 'Refreshed',
      description: 'Storage files have been refreshed',
    });
  };

  const getFilteredFilesByStatus = (status: string) => {
    return filteredFiles.filter(file => file.conversion_status === status);
  };

  const pendingFiles = getFilteredFilesByStatus('pending');
  const convertedFiles = getFilteredFilesByStatus('success');
  const failedFiles = getFilteredFilesByStatus('failed');
  const convertingFiles = getFilteredFilesByStatus('converting');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Storage Files</CardTitle>
            <CardDescription>
              Files from Supabase storage buckets with real-time conversion status
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-2">
                {filteredFiles.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              <Badge variant="secondary" className="ml-2">
                {pendingFiles.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="converting">
              Converting
              <Badge variant="secondary" className="ml-2">
                {convertingFiles.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="converted">
              Converted
              <Badge variant="secondary" className="ml-2">
                {convertedFiles.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="failed">
              Failed
              <Badge variant="secondary" className="ml-2">
                {failedFiles.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <FileList files={filteredFiles} onDelete={handleDeleteFile} />
          </TabsContent>
          
          <TabsContent value="pending" className="mt-4">
            <FileList files={pendingFiles} onDelete={handleDeleteFile} />
          </TabsContent>
          
          <TabsContent value="converting" className="mt-4">
            <FileList files={convertingFiles} onDelete={handleDeleteFile} />
          </TabsContent>
          
          <TabsContent value="converted" className="mt-4">
            <FileList files={convertedFiles} onDelete={handleDeleteFile} />
          </TabsContent>
          
          <TabsContent value="failed" className="mt-4">
            <FileList files={failedFiles} onDelete={handleDeleteFile} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface FileListProps {
  files: any[];
  onDelete: (fileId: string, fileName: string) => void;
}

const FileList: React.FC<FileListProps> = ({ files, onDelete }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'converting':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Converted</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'converting':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Converting</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getFileTypeIcon = (fileName: string) => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('table')) return <Database className="h-4 w-4" />;
    if (lowerName.includes('proc')) return <FileText className="h-4 w-4" />;
    if (lowerName.includes('trig')) return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No files found in this category</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              {getFileTypeIcon(file.file_name)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{file.file_name}</span>
                {getStatusBadge(file.conversion_status)}
              </div>
              <div className="text-sm text-muted-foreground">
                {file.bucket_name} • {formatFileSize(file.file_size)} • {file.file_type}
              </div>
              {file.error_message && (
                <div className="text-sm text-red-600 mt-1">
                  Error: {file.error_message}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {new Date(file.updated_at).toLocaleDateString()}
              </div>
              {file.converted_content && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(file.id, file.file_name)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default StorageFilesPanel; 