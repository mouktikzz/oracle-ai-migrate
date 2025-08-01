import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CodeFile } from '@/types';

export interface StorageFile {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  bucket_name: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  conversion_status: 'pending' | 'converting' | 'success' | 'failed';
  original_content: string | null;
  converted_content: string | null;
  error_message: string | null;
  migration_id: string | null;
  performance_metrics: any | null;
  issues: any | null;
  data_type_mapping: any | null;
  syntax_differences: any | null;
}

export interface StorageFileInsert {
  user_id: string;
  bucket_name: string;
  file_path: string;
  file_name: string;
  file_size?: number | null;
  file_type?: string | null;
  conversion_status?: 'pending' | 'converting' | 'success' | 'failed';
  original_content?: string | null;
  converted_content?: string | null;
  error_message?: string | null;
  migration_id?: string | null;
  performance_metrics?: any | null;
  issues?: any | null;
  data_type_mapping?: any | null;
  syntax_differences?: any | null;
}

export const useStorageFiles = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch storage files for the current user
  const fetchStorageFiles = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('storage_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStorageFiles((data || []) as StorageFile[]);
    } catch (error) {
      console.error('Error fetching storage files:', error);
      toast({
        title: "Error",
        description: "Failed to fetch storage files",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a storage file
  const addStorageFile = async (fileData: StorageFileInsert) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('storage_files')
        .insert([{ ...fileData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setStorageFiles(prev => [data as StorageFile, ...prev]);
      return data as StorageFile;
    } catch (error) {
      console.error('Error adding storage file:', error);
      toast({
        title: "Error",
        description: "Failed to add storage file",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update storage file conversion status
  const updateStorageFileStatus = async (
    fileId: string, 
    status: 'pending' | 'converting' | 'success' | 'failed',
    convertedContent?: string,
    errorMessage?: string,
    performanceMetrics?: any,
    issues?: any,
    dataTypeMapping?: any,
    syntaxDifferences?: any
  ) => {
    try {
      const updateData: any = { conversion_status: status };
      
      if (convertedContent !== undefined) {
        updateData.converted_content = convertedContent;
      }
      if (errorMessage !== undefined) {
        updateData.error_message = errorMessage;
      }
      if (performanceMetrics !== undefined) {
        updateData.performance_metrics = performanceMetrics;
      }
      if (issues !== undefined) {
        updateData.issues = issues;
      }
      if (dataTypeMapping !== undefined) {
        updateData.data_type_mapping = dataTypeMapping;
      }
      if (syntaxDifferences !== undefined) {
        updateData.syntax_differences = syntaxDifferences;
      }

      const { data, error } = await supabase
        .from('storage_files')
        .update(updateData)
        .eq('id', fileId)
        .select()
        .single();

      if (error) throw error;
      
      setStorageFiles(prev => 
        prev.map(file => 
          file.id === fileId ? (data as StorageFile) : file
        )
      );
      
      return data as StorageFile;
    } catch (error) {
      console.error('Error updating storage file status:', error);
      toast({
        title: "Error",
        description: "Failed to update file status",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Delete a storage file
  const deleteStorageFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('storage_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      
      setStorageFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Error deleting storage file:', error);
      toast({
        title: "Error",
        description: "Failed to delete storage file",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Convert CodeFile to StorageFile and save to database
  const saveCodeFileToStorage = async (codeFile: CodeFile, migrationId?: string) => {
    if (!codeFile.source || codeFile.source !== 'storage' || !codeFile.bucket || !codeFile.path) {
      throw new Error('CodeFile must be from storage source with bucket and path');
    }

    const storageFileData: StorageFileInsert = {
      user_id: user!.id,
      bucket_name: codeFile.bucket,
      file_path: codeFile.path,
      file_name: codeFile.name,
      file_size: codeFile.content.length,
      file_type: codeFile.type,
      conversion_status: 'pending',
      original_content: codeFile.content,
      migration_id: migrationId || null,
    };

    return await addStorageFile(storageFileData);
  };

  // Get storage files by migration ID
  const getStorageFilesByMigration = async (migrationId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('storage_files')
        .select('*')
        .eq('user_id', user.id)
        .eq('migration_id', migrationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as StorageFile[];
    } catch (error) {
      console.error('Error fetching storage files by migration:', error);
      return [];
    }
  };

  // Refresh storage files
  const refreshStorageFiles = async () => {
    await fetchStorageFiles();
  };

  useEffect(() => {
    if (user) {
      fetchStorageFiles();
    }
  }, [user]);

  return {
    storageFiles,
    isLoading,
    addStorageFile,
    updateStorageFileStatus,
    deleteStorageFile,
    saveCodeFileToStorage,
    getStorageFilesByMigration,
    refreshStorageFiles,
    fetchStorageFiles,
  };
}; 