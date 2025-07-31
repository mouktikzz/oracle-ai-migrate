import React, { useCallback, useState, useEffect } from 'react';
import { convertSybaseToOracle, generateBalancedConversionReport } from '@/utils/componentUtilswithlangchain';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/hooks/useAuth';
import { useProductionRateLimit } from '@/hooks/useProductionRateLimit';
import { useToast } from '@/hooks/use-toast';

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
}

export const useConversionLogic = (
  files: FileItem[],
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>,
  setConversionResults: React.Dispatch<React.SetStateAction<ConversionResult[]>>,
  selectedAiModel: string,
  batchSize: number = 5 // Configurable batch size, default 5
) => {
  const { toast } = useToast();
  const [isConverting, setIsConverting] = useState(false);
  const [convertingFileIds, setConvertingFileIds] = useState<string[]>([]);

  // Production rate limiting: 10 conversions per minute with 2-second throttling
  const { checkRateLimit, isRateLimited, retryAfter, getRateLimitInfo, resetRateLimit } = useProductionRateLimit({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    throttleMs: 2000 // 2 seconds between conversions
  });

  // Reset rate limit when component mounts
  useEffect(() => {
    resetRateLimit();
    console.log('Rate limit reset on mount');
  }, [resetRateLimit]);

  // Helper function to wait for rate limit
  const waitForRateLimit = async (): Promise<void> => {
    return new Promise((resolve) => {
      const checkAndWait = () => {
        if (checkRateLimit()) {
          resolve();
        } else {
          // Wait 1 second and check again
          setTimeout(checkAndWait, 1000);
        }
      };
      checkAndWait();
    });
  };

  // Helper function to process files in batches with rate limiting
  const processBatchWithRateLimit = async (filesToProcess: FileItem[], customBatchSize?: number) => {
    const results: ConversionResult[] = [];
    
    // Calculate optimal batch size based on remaining rate limit
    const getOptimalBatchSize = (remainingFiles: number, currentUsed: number) => {
      const remainingInWindow = 10 - currentUsed;
      const maxBatchSize = Math.min(customBatchSize || batchSize, 5);
      return Math.min(maxBatchSize, remainingInWindow, remainingFiles);
    };
    
    let processedCount = 0;
    
    // Process files in batches
    while (processedCount < filesToProcess.length) {
      const remainingFiles = filesToProcess.length - processedCount;
      const rateLimitInfo = getRateLimitInfo();
      const currentUsed = rateLimitInfo.used;
      
      // Calculate optimal batch size for this iteration
      const optimalBatchSize = getOptimalBatchSize(remainingFiles, currentUsed);
      
      if (optimalBatchSize === 0) {
        // Wait for rate limit window to reset
        const waitTime = Math.ceil((rateLimitInfo.reset - Date.now()) / 1000);
        toast({
          title: "Rate limit reached",
          description: `Waiting ${waitTime} seconds for rate limit to reset...`,
          variant: "destructive"
        });
        
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        resetRateLimit();
        continue;
      }
      
      // Get current batch
      const batch = filesToProcess.slice(processedCount, processedCount + optimalBatchSize);
      console.log(`Starting batch: ${batch.length} files, Rate limit used: ${currentUsed}/10`);
      
      // Wait for rate limit before processing batch
      await waitForRateLimit();
      
      // Process files sequentially within the batch
      for (const file of batch) {
        console.log(`Converting ${file.name}, Rate limit before: ${getRateLimitInfo().used}/10`);
        
        // Check rate limit for each file
        if (!checkRateLimit()) {
          console.log(`Rate limit exceeded for file ${file.name}`);
          // Mark remaining files as failed
          const remainingFilesInBatch = batch.slice(batch.indexOf(file));
          for (const remainingFile of remainingFilesInBatch) {
            setFiles(prev => prev.map(f => 
              f.id === remainingFile.id 
                ? { ...f, conversionStatus: 'failed', errorMessage: 'Rate limit exceeded' }
                : f
            ));
          }
          break;
        }
        
        // Set file as pending and add to converting list
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, conversionStatus: 'pending' } : f));
        setConvertingFileIds(prev => [...prev, file.id]);
        
        try {
          const result = await convertSybaseToOracle({
            name: file.name,
            content: file.content,
            type: file.type
          });
          
          // Update file status
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { 
                  ...f, 
                  conversionStatus: 'success', 
                  convertedContent: result.convertedCode,
                  dataTypeMapping: result.dataTypeMapping,
                  issues: result.issues,
                  performanceMetrics: result.performance
                }
              : f
          ));
          
          results.push(result);
          
        } catch (error) {
          console.error(`Error converting ${file.name}:`, error);
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, conversionStatus: 'failed', errorMessage: error.message }
              : f
          ));
        } finally {
          // Remove from converting list
          setConvertingFileIds(prev => prev.filter(id => id !== file.id));
        }
      }
      
      processedCount += batch.length;
      
      // Add delay between batches
      if (processedCount < filesToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  };

  const mapConversionStatus = (status: 'success' | 'warning' | 'error'): 'pending' | 'success' | 'failed' => {
    switch (status) {
      case 'success': return 'success';
      case 'warning': return 'success';
      case 'error': return 'failed';
      default: return 'pending';
    }
  };

  const handleConvertFile = useCallback(async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    // Wait for rate limit to be available
    await waitForRateLimit();

    setConvertingFileIds([fileId]);
    setIsConverting(true);
    
    try {
      const result = await convertSybaseToOracle(file, selectedAiModel);
      
      const conversionResult: ConversionResult = {
        id: result.id,
        originalFile: {
          id: file.id,
          name: file.name,
          content: file.content,
          type: file.type,
          status: 'pending'
        },
        aiGeneratedCode: result.convertedCode, // Store original AI output
        convertedCode: result.convertedCode,
        issues: result.issues,
        dataTypeMapping: result.dataTypeMapping,
        performance: result.performance,
        status: result.status
      };
      
      setConversionResults(prev => [...prev, conversionResult]);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              conversionStatus: mapConversionStatus(result.status),
              convertedContent: result.convertedCode,
              dataTypeMapping: result.dataTypeMapping,
              issues: result.issues,
              performanceMetrics: result.performance
            }
          : f
      ));

      await supabase.from('migration_files').update({
        conversion_status: mapConversionStatus(result.status),
        converted_content: result.convertedCode,
        performance_metrics: result.performance || {
          score: 85,
          maintainability: 90,
          orig_complexity: 10,
          conv_complexity: 7,
          improvement: 30,
          lines_reduced: 15,
          loops_reduced: 2,
          time_ms: 120
        }
      }).eq('file_name', file.name);
    } catch (error) {
      console.error('Conversion failed:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, conversionStatus: 'failed' } : f
      ));
    } finally {
      setConvertingFileIds([]);
      setIsConverting(false);
    }
  }, [files, selectedAiModel, setFiles, setConversionResults, waitForRateLimit]);

  const handleConvertAllByType = useCallback(async (type: 'table' | 'procedure' | 'trigger' | 'other') => {
    const typeFiles = files.filter(f => f.type === type && f.conversionStatus === 'pending');
    if (typeFiles.length === 0) return;

    setIsConverting(true);
    setConvertingFileIds(typeFiles.map(f => f.id));

    try {
      // Process files in batches with rate limiting
      const results = await processBatchWithRateLimit(typeFiles);
      
      // Add results to conversion results
      setConversionResults(prev => [...prev, ...results]);
      
      toast({
        title: 'Conversion Complete',
        description: `Successfully converted ${results.length} files.`,
      });
    } catch (error) {
      console.error('Batch conversion failed:', error);
      toast({
        title: 'Conversion Failed',
        description: 'Some files failed to convert. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setConvertingFileIds([]);
      setIsConverting(false);
    }
  }, [files, selectedAiModel, setFiles, setConversionResults, processBatchWithRateLimit]);

  const handleConvertAll = useCallback(async () => {
    const pendingFiles = files.filter(f => f.conversionStatus === 'pending');
    if (pendingFiles.length === 0) return;

    setIsConverting(true);
    setConvertingFileIds(pendingFiles.map(f => f.id));

    try {
      // Process files in batches with rate limiting
      const results = await processBatchWithRateLimit(pendingFiles);
      
      // Add results to conversion results
      setConversionResults(prev => [...prev, ...results]);
      
      toast({
        title: 'Conversion Complete',
        description: `Successfully converted ${results.length} files.`,
      });
    } catch (error) {
      console.error('Batch conversion failed:', error);
      toast({
        title: 'Conversion Failed',
        description: 'Some files failed to convert. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setConvertingFileIds([]);
      setIsConverting(false);
    }
  }, [files, selectedAiModel, setFiles, setConversionResults, processBatchWithRateLimit]);

  const handleFixFile = useCallback(async (fileId: string) => {
    // Wait for rate limit to be available
    await waitForRateLimit();

    setIsConverting(true);
    setConvertingFileIds([fileId]);
    try {
      const fileToFix = files.find(file => file.id === fileId);
      if (!fileToFix) {
        console.error('File not found');
        return;
      }
      // Re-run the conversion logic for the failed file
      const result = await convertSybaseToOracle(fileToFix, selectedAiModel);
      const conversionResult: ConversionResult = {
        id: result.id,
        originalFile: {
          id: fileToFix.id,
          name: fileToFix.name,
          content: fileToFix.content,
          type: fileToFix.type,
          status: 'pending'
        },
        aiGeneratedCode: result.convertedCode, // Store original AI output
        convertedCode: result.convertedCode,
        issues: result.issues,
        dataTypeMapping: result.dataTypeMapping,
        performance: result.performance,
        status: result.status
      };

      setConversionResults(prev => [...prev, conversionResult]);

      setFiles(prev => prev.map(f =>
        f.id === fileId
          ? {
              ...f,
              conversionStatus: mapConversionStatus(result.status),
              convertedContent: result.convertedCode,
              dataTypeMapping: result.dataTypeMapping,
              issues: result.issues,
              performanceMetrics: result.performance
            }
          : f
      ));

      await supabase.from('migration_files').update({
        conversion_status: mapConversionStatus(result.status),
        converted_content: result.convertedCode,
        performance_metrics: result.performance || {
          score: 85,
          maintainability: 90,
          orig_complexity: 10,
          conv_complexity: 7,
          improvement: 30,
          lines_reduced: 15,
          loops_reduced: 2,
          time_ms: 120
        }
      }).eq('file_name', fileToFix.name);
    } catch (error) {
      console.error('Fix failed:', error);
      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, conversionStatus: 'failed' } : f
      ));
    } finally {
      setConvertingFileIds([]);
      setIsConverting(false);
    }
  }, [files, selectedAiModel, setFiles, setConversionResults, waitForRateLimit]);

  const handleGenerateReport = useCallback(async () => {
    const { user } = useAuth();
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      const successfulConversions = files.filter(f => f.conversionStatus === 'success');
      if (successfulConversions.length === 0) {
        console.log('No successful conversions to report');
        return;
      }

      const report = generateBalancedConversionReport(successfulConversions.map(file => ({
        id: file.id,
        originalFile: {
          id: file.id,
          name: file.name,
          content: file.content,
          type: file.type,
          status: 'success'
        },
        convertedCode: file.convertedContent || '',
        aiGeneratedCode: file.convertedContent || '',
        issues: file.issues || [],
        dataTypeMapping: file.dataTypeMapping || [],
        performance: file.performanceMetrics || {},
        status: 'success',
        explanations: []
      })));

      const reportId = uuidv4();
      const { error } = await supabase.from('conversion_reports').insert({
        id: reportId,
        user_id: user.id,
        report_content: report,
        created_at: new Date().toISOString()
      });

      if (error) {
        console.error('Failed to save report:', error);
        return;
      }

      console.log('Report generated and saved:', reportId);
      return reportId;
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  }, [files]);

  return {
    handleConvertFile,
    handleConvertAllByType,
    handleConvertAll,
    handleFixFile,
    handleGenerateReport,
    isConverting,
    convertingFileIds,
    isRateLimited,
    retryAfter,
    getRateLimitInfo
  };
};
