import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DatabaseConnection, CodeFile, ConversionResult, ConversionStep, ConversionReport } from '@/types';
import ConnectionForm from '@/components/ConnectionForm';
import CodeUploader from '@/components/CodeUploader';
import ConversionViewer from '@/components/ConversionViewer';
import ReportViewer from '@/components/ReportViewer';
import { convertSybaseToOracle, generateBalancedConversionReport } from '@/utils/componentUtilswithlangchain';
import { Database as DatabaseIcon, Code, FileSearch, FileWarning, Check, RefreshCw, Play, Download, ChevronLeft } from 'lucide-react';
import JSZip from 'jszip';
import { useProductionRateLimit } from '@/hooks/useProductionRateLimit';

const Index = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<ConversionStep>('connection');
  const [sybaseConnection, setSybaseConnection] = useState<DatabaseConnection | null>(null);
  const [oracleConnection, setOracleConnection] = useState<DatabaseConnection | null>(null);
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [selectedAIModel, setSelectedAIModel] = useState('default');
  const [report, setReport] = useState<ConversionReport | null>(null);

  // Production rate limiting: 10 conversions per minute with 2-second throttling
  const { checkRateLimit, isRateLimited, retryAfter, getRateLimitInfo } = useProductionRateLimit({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    throttleMs: 2000 // 2 seconds between conversions
  });

  const getStepIndex = (step: ConversionStep): number => {
    const steps: ConversionStep[] = ['connection', 'upload', 'review', 'report'];
    return steps.indexOf(step);
  };

  const handleConnectionComplete = (sybaseConn: DatabaseConnection, oracleConn: DatabaseConnection) => {
    setSybaseConnection(sybaseConn);
    setOracleConnection(oracleConn);
    setCurrentStep('upload');
  };

  const handleUploadComplete = (uploadedFiles: CodeFile[]) => {
    setFiles(uploadedFiles);
    setCurrentStep('review');
  };

  const handleConversionComplete = () => {
    setCurrentStep('report');
  };

  const handleReviewComplete = () => {
    setCurrentStep('report');
  };

  const handleStartOver = () => {
    setCurrentStep('connection');
    setSybaseConnection(null);
    setOracleConnection(null);
    setFiles([]);
    setResults([]);
    setReport(null);
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    const currentIndex = getStepIndex(currentStep);
    if (currentIndex > 0) {
      const steps: ConversionStep[] = ['connection', 'upload', 'review', 'report'];
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleDownloadAllFiles = async () => {
    if (results.length === 0) {
      toast({
        title: 'No Files',
        description: 'No converted files to download.',
        variant: 'destructive',
      });
      return;
    }

    const zip = new JSZip();
    
    results.forEach((result, index) => {
      const fileName = result.originalFile.name.replace(/\.[^/.]+$/, '') + '_converted.sql';
      zip.file(fileName, result.convertedCode);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted_files.zip';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: 'Download Complete',
      description: `Downloaded ${results.length} converted files.`,
    });
  };

  const handleAIReconversion = async (fileId: string, suggestion: string) => {
    const originalFile = files.find(f => f.id === fileId);
    if (!originalFile) return;

    // Check rate limit before reconversion
    if (!checkRateLimit()) {
      toast({
        title: 'Rate Limit Exceeded',
        description: `You can only convert 10 files per minute. Please wait ${retryAfter} seconds before trying again.`,
        variant: 'destructive',
      });
      return;
    }

    setIsConverting(true);
    try {
      const newResult = await convertSybaseToOracle(originalFile, selectedAIModel);
      
      setResults(prev => prev.map(result => 
        result.originalFile.id === fileId ? newResult : result
      ));

      toast({
        title: 'Reconversion Complete',
        description: 'File has been reconverted with AI suggestions.',
      });
    } catch (error) {
      toast({
        title: 'Reconversion Failed',
        description: 'Failed to reconvert the file.',
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleGenerateReport = () => {
    if (results.length === 0) {
      toast({
        title: 'No Results',
        description: 'No conversion results to generate report from.',
        variant: 'destructive',
      });
      return;
    }

    const reportSummary = generateBalancedConversionReport(results);
    const newReport: ConversionReport = {
      timestamp: new Date().toISOString(),
      filesProcessed: results.length,
      successCount: results.filter(r => r.status === 'success').length,
      warningCount: results.filter(r => r.status === 'warning').length,
      errorCount: results.filter(r => r.status === 'error').length,
      results: results,
      summary: reportSummary,
    };

    setReport(newReport);
    toast({
      title: 'Report Generated',
      description: 'Conversion report has been generated successfully.',
    });
  };

  const startConversion = async (filesToConvert: CodeFile[] = files) => {
    if (filesToConvert.length === 0) {
      toast({
        title: 'No Files',
        description: 'Please upload files before starting conversion.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsConverting(true);
    setResults([]);
    
    try {
      const newResults: ConversionResult[] = [];
      
      for (const file of filesToConvert) {
        // Check rate limit before each conversion
        if (!checkRateLimit()) {
          toast({
            title: 'Rate Limit Exceeded',
            description: `You can only convert 10 files per minute. Please wait ${retryAfter} seconds before trying again.`,
            variant: 'destructive',
          });
          break; // Stop conversion
        }

        setFiles(prevFiles => 
          prevFiles.map(f => 
            f.id === file.id ? { ...f, status: 'converting' } : f
          )
        );
        
        const result = await convertSybaseToOracle(file, selectedAIModel);
        newResults.push(result);
        
        setFiles(prevFiles => 
          prevFiles.map(f => 
            f.id === file.id ? 
              { ...f, status: result.status === 'error' ? 'error' : 'success' } : 
              f
          )
        );
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setResults(newResults);
      handleConversionComplete();
      
      toast({
        title: 'Conversion Complete',
        description: `Successfully processed ${newResults.length} files.`,
      });
    } catch (error) {
      toast({
        title: 'Conversion Failed',
        description: 'An error occurred during the conversion process.',
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleAIModelChange = (model: string) => {
    setSelectedAIModel(model);
  };
  
  const renderStepIndicator = () => {
    const steps: { key: ConversionStep; label: string; icon: React.ReactNode }[] = [
      { key: 'connection', label: 'Connection', icon: <DatabaseIcon className="h-5 w-5" /> },
      { key: 'upload', label: 'Upload Code', icon: <Code className="h-5 w-5" /> },
      { key: 'review', label: 'Code Review', icon: <FileSearch className="h-5 w-5" /> },
      { key: 'report', label: 'Migration Report', icon: <FileWarning className="h-5 w-5" /> },
    ];
    
    return (
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.key;
            const isComplete = getStepIndex(currentStep) > getStepIndex(step.key);
            
            return (
              <div 
                key={step.key} 
                className={`flex flex-col items-center ${index < steps.length - 1 ? 'w-1/4' : ''}`}
              >
                <div 
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2
                    ${isActive ? 'bg-primary text-white' : isComplete ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}
                  `}
                >
                  {isComplete ? <Check className="h-5 w-5" /> : step.icon}
                </div>
                <span 
                  className={`text-xs text-center ${isActive ? 'font-medium text-primary' : isComplete ? 'text-green-500' : 'text-muted-foreground'}`}
                >
                  {step.label}
                </span>
                
                {index < steps.length - 1 && (
                  <div 
                    className={`
                      h-[2px] w-full mt-5
                      ${isComplete ? 'bg-green-500' : 'bg-muted'}
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'connection':
        return (
          <ConnectionForm 
            onComplete={handleConnectionComplete}
            onGoHome={handleGoHome}
          />
        );
      case 'upload':
        return (
          <CodeUploader 
            onComplete={handleUploadComplete}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
          />
        );
      case 'review':
        return (
          <ConversionViewer 
            files={files}
            results={results}
            isConverting={isConverting}
            selectedAIModel={selectedAIModel}
            onStartConversion={startConversion}
            onAIReconversion={handleAIReconversion}
            onAIModelChange={handleAIModelChange}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
            onDownloadAll={handleDownloadAllFiles}
          />
        );
      case 'report':
        return (
          <ReportViewer 
            report={report}
            results={results}
            onGenerateReport={handleGenerateReport}
            onStartOver={handleStartOver}
            onGoHome={handleGoHome}
            onGoBack={handleGoBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <DatabaseIcon className="h-8 w-8 mr-3" />
              <h1 className="text-2xl font-bold">Sybase to Oracle Migration Tool</h1>
            </div>
            
            <div className="flex gap-2">
              {results.length > 0 && (
                <Button 
                  variant="secondary" 
                  className="text-foreground hover:bg-secondary/80 border border-secondary-foreground"
                  onClick={handleDownloadAllFiles}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All Files
                </Button>
              )}
              
              {currentStep !== 'connection' && (
                <Button 
                  variant="secondary" 
                  className="text-foreground hover:bg-secondary/80 border border-secondary-foreground"
                  onClick={handleStartOver}
                >
                  Start New Migration
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {renderStepIndicator()}
        {renderCurrentStep()}
      </main>
      
      <footer className="bg-muted py-1">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>Sybase to Oracle Migration Tool - Powered by AI</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
