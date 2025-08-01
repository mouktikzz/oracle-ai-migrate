import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Database, FileText, Folder, Loader2, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { CodeFile } from '@/types';
import { Label } from '@/components/ui/label';

interface StorageFile {
  name: string;
  path: string;
  size: number;
  type: string;
  bucket: string;
  lastModified?: string;
}

interface SupabaseStorageSelectorProps {
  onComplete: (files: CodeFile[]) => void;
}

const AVAILABLE_BUCKETS = ['ecommercedb', 'employeedb'];

const SupabaseStorageSelector: React.FC<SupabaseStorageSelectorProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBucket, setSelectedBucket] = useState<string>('ecommercedb');
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (selectedBucket) {
      fetchStorageFiles();
    }
  }, [selectedBucket]);

  const fetchStorageFiles = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(selectedBucket)
        .list('', {
          limit: 1000,
          offset: 0,
        });

      if (error) {
        throw error;
      }

      const storageFiles: StorageFile[] = (data || [])
        .filter(item => !item.name.startsWith('.')) // Filter out hidden files
        .map(item => ({
          name: item.name,
          path: item.name,
          size: item.metadata?.size || 0,
          type: item.metadata?.mimetype || 'text/plain',
          bucket: selectedBucket,
          lastModified: item.updated_at,
        }))
        .filter(file => {
          // Only show SQL and related files
          const supportedExtensions = ['.sql', '.txt', '.prc', '.trg', '.tab', '.proc', '.sp'];
          return supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        });

      setFiles(storageFiles);
    } catch (error) {
      console.error('Error fetching storage files:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch files from storage bucket',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (filePath: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (checked) {
      newSelected.add(filePath);
    } else {
      newSelected.delete(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(files.map(f => f.path)));
    } else {
      setSelectedFiles(new Set());
    }
  };

  const processSelectedFiles = async () => {
    if (selectedFiles.size === 0) {
      toast({
        title: 'No Files Selected',
        description: 'Please select at least one file to process',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const codeFiles: CodeFile[] = [];
      const selectedFileList = Array.from(selectedFiles);

      for (const filePath of selectedFileList) {
        const file = files.find(f => f.path === filePath);
        if (!file) continue;

        try {
          // Download file content from storage
          const { data, error } = await supabase.storage
            .from(selectedBucket)
            .download(filePath);

          if (error) {
            console.error(`Error downloading ${filePath}:`, error);
            continue;
          }

          // Convert blob to text
          const content = await data.text();
          
          const codeFile: CodeFile = {
            id: `${selectedBucket}-${filePath}`,
            name: file.name,
            content: content,
            type: determineFileType(file.name, content),
            status: 'pending',
            source: 'storage',
            bucket: selectedBucket,
            path: filePath,
          };

          codeFiles.push(codeFile);
        } catch (error) {
          console.error(`Error processing ${filePath}:`, error);
        }
      }

      if (codeFiles.length > 0) {
        onComplete(codeFiles);
        toast({
          title: 'Files Selected',
          description: `Successfully selected ${codeFiles.length} file(s) from storage`,
        });
      }
    } catch (error) {
      console.error('Error processing selected files:', error);
      toast({
        title: 'Error',
        description: 'Failed to process selected files',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const determineFileType = (fileName: string, content: string): 'table' | 'procedure' | 'trigger' | 'other' => {
    const lowerContent = content.toLowerCase();
    const lowerFileName = fileName.toLowerCase();

    if (lowerFileName.includes('table') || lowerContent.includes('create table')) {
      return 'table';
    }
    if (lowerFileName.includes('proc') || lowerContent.includes('create procedure') || lowerContent.includes('create proc')) {
      return 'procedure';
    }
    if (lowerFileName.includes('trig') || lowerContent.includes('create trigger')) {
      return 'trigger';
    }
    return 'other';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileName: string) => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('table')) return <Database className="h-4 w-4" />;
    if (lowerName.includes('proc')) return <FileText className="h-4 w-4" />;
    if (lowerName.includes('trig')) return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Select Files from Storage</CardTitle>
          <CardDescription>
            Browse and select files from your Supabase storage buckets for conversion.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Bucket Selection */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              <span className="font-medium">Storage Bucket:</span>
            </div>
            <Select value={selectedBucket} onValueChange={setSelectedBucket}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_BUCKETS.map(bucket => (
                  <SelectItem key={bucket} value={bucket}>
                    {bucket}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStorageFiles}
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

          {/* File Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedFiles.size === files.length && files.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="text-sm font-medium">
                Select All ({files.length} files)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedFiles.size} selected
              </Badge>
              <Button
                onClick={processSelectedFiles}
                disabled={selectedFiles.size === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Select Files ({selectedFiles.size})
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Files List */}
          <div className="border rounded-lg">
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading files...</span>
                </div>
              ) : files.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  <Folder className="h-8 w-8 mr-2" />
                  No files found in this bucket
                </div>
              ) : (
                <div className="divide-y">
                  {files.map((file) => (
                    <div
                      key={file.path}
                      className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedFiles.has(file.path)}
                        onCheckedChange={(checked) => handleFileSelect(file.path, checked as boolean)}
                      />
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {getFileTypeIcon(file.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{file.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • {file.type}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Status Summary */}
          {selectedFiles.size > 0 && (
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">Ready to Process</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedFiles.size} file(s) selected from {selectedBucket} bucket. 
                Click "Select Files" to add them to your conversion queue.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseStorageSelector; 