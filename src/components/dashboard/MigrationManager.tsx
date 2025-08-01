import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStorageFiles } from '@/hooks/useStorageFiles';
import { CodeFile } from '@/types';

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  content: string;
  conversionStatus: 'pending' | 'success' | 'failed';
  convertedContent?: string;
  errorMessage?: string;
  dataTypeMapping?: any[];
  issues?: any[];
  performanceMetrics?: any;
  source?: 'upload' | 'storage';
  bucket?: string;
}

export const useMigrationManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { saveCodeFileToStorage } = useStorageFiles();
  const [currentMigrationId, setCurrentMigrationId] = useState<string | null>(null);

  const startNewMigration = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('migrations')
        .insert({ 
          user_id: user.id,
          project_name: `Migration_${new Date().toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '')}`
        })
        .select()
        .single();

      if (error) {
        console.error('Error starting new migration:', error);
        toast({
          title: "Migration Error",
          description: "Failed to start new migration",
          variant: "destructive",
        });
      } else {
        setCurrentMigrationId(data.id);
      }
    } catch (error) {
      console.error('Error starting new migration:', error);
    }
  }, [user, toast]);

  const handleCodeUpload = useCallback(async (uploadedFiles: CodeFile[]): Promise<FileItem[]> => {
    // Ensure a migration exists before uploading files
    const convertedFiles: FileItem[] = [];
    
    for (const file of uploadedFiles) {
      const fileItem: FileItem = {
        id: file.id,
        name: file.name,
        path: file.path || file.name,
        type: file.type,
        content: file.content,
        conversionStatus: 'pending' as const,
        dataTypeMapping: [],
        issues: [],
        performanceMetrics: undefined,
        convertedContent: undefined,
        errorMessage: undefined,
        source: file.source,
        bucket: file.bucket,
      };
      
      // If it's a storage file, save it to the database
      if (file.source === 'storage' && currentMigrationId) {
        try {
          await saveCodeFileToStorage(file, currentMigrationId);
        } catch (error) {
          console.error('Error saving storage file to database:', error);
          toast({
            title: "Warning",
            description: `Failed to save ${file.name} to database, but it will still be processed`,
            variant: "destructive",
          });
        }
      }
      
      convertedFiles.push(fileItem);
    }
    
    return convertedFiles;
  }, [user, toast, currentMigrationId, startNewMigration, saveCodeFileToStorage]);

  return {
    currentMigrationId,
    handleCodeUpload,
    startNewMigration,
  };
};
