import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X, ArrowLeft, ArrowRight, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import ConversionIssuesPanel from './ConversionIssuesPanel';
import FileDownloader from './FileDownloader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUnreviewedFiles } from '@/hooks/useUnreviewedFiles';
import CodeDiffViewer from './CodeDiffViewer';
import { diffChars } from 'diff';
import { analyzeCodeComplexity, generateBalancedPerformanceMetrics } from '@/utils/componentUtilswithlangchain';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CodeEditor from './CodeEditor'; // Added import for CodeEditor
import { CommentSection } from './CommentSection';

interface DataTypeMapping {
  sybaseType: string;
  oracleType: string;
  description: string;
}

interface ConversionIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
  lineNumber?: number;
  suggestedFix?: string;
  originalCode?: string;
  category: string;
}

interface PerformanceMetrics {
  originalComplexity: number;
  convertedComplexity: number;
  improvementPercentage: number;
  recommendations: string[];
  performanceScore?: number;
  codeQuality?: {
    totalLines: number;
    codeLines: number;
    commentRatio: number;
    complexityLevel: 'Low' | 'Medium' | 'High';
  };
  maintainabilityIndex?: number;
  conversionTimeMs?: number;
  originalLines?: number;
  convertedLines?: number;
  originalLoops?: number;
  convertedLoops?: number;
  linesReduced?: number;
  loopsReduced?: number;
  complexityAssessment?: string;
  optimizationLevel?: string;
  scalabilityMetrics?: {
    scalabilityScore: number;
    maintainabilityScore: number;
    modernOracleFeaturesCount: number;
    bulkOperationsUsed: boolean;
    bulkCollectUsed: boolean;
  };
  complexityCategory?: string; // Added this field
}

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  content: string;
  conversionStatus: 'pending' | 'success' | 'failed';
  convertedContent?: string;
  aiGeneratedCode?: string; // Add this field for manual edits
  errorMessage?: string;
  dataTypeMapping?: DataTypeMapping[];
  issues?: ConversionIssue[];
  performanceMetrics?: PerformanceMetrics;
  status: 'reviewed' | 'unreviewed'; // New field for status
}

interface ConversionViewerProps {
  file: FileItem;
  onManualEdit: (newContent: string) => void;
  onDismissIssue: (issueId: string) => void;
  onSaveEdit?: (newContent: string) => void | Promise<void>; // Accepts edited content
  hideEdit?: boolean; // Hide edit option
  onPrevFile?: () => void;
  onNextFile?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  convertedFilename?: string;
}

const ConversionViewer: React.FC<ConversionViewerProps> = ({
  file,
  onManualEdit,
  onDismissIssue,
  onSaveEdit,
  hideEdit,
  onPrevFile,
  onNextFile,
  hasPrev,
  hasNext,
  convertedFilename,
}) => {
  const { toast } = useToast();
  const { addUnreviewedFile } = useUnreviewedFiles();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isMarkedUnreviewed, setIsMarkedUnreviewed] = useState(false);
  const [showRewriteDialog, setShowRewriteDialog] = useState(false);
  const [rewritePrompt, setRewritePrompt] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [preservedSelection, setPreservedSelection] = useState<{
    start: number;
    end: number;
  }>({ start: 0, end: 0 });
  const [showExplainDialog, setShowExplainDialog] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  // Fetch comment count when file changes
  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        // Only get comments by file_id - don't fall back to file_name
        // This ensures re-uploaded files start with 0 comments
        const { data, error } = await supabase
          .from('conversion_comments')
          .select('id')
          .eq('file_id', file.id);
        
        if (!error && data !== null) {
          setCommentCount(data.length);
        }
      } catch (error) {
        console.error('Error fetching comment count:', error);
      }
    };

    fetchCommentCount();
  }, [file.id]);

  // Update comment count when comments are added/removed
  const handleCommentCountChange = (newCount: number) => {
    setCommentCount(newCount);
  };

  // Calculate dynamic height based on content length
  const getDynamicHeight = (content: string) => {
    const lineCount = content.split('\n').length;
    if (lineCount <= 20) return '300px';
    if (lineCount <= 50) return '350px';
    if (lineCount <= 100) return '400px';
    if (lineCount <= 200) return '450px';
    return '500px'; // max height
  };

  const originalHeight = getDynamicHeight(file.content || '');
  const convertedHeight = getDynamicHeight(file.convertedContent || '');

  useEffect(() => {
    setEditedContent(file.convertedContent || '');
  }, [file.id, file.convertedContent]); // Add file.id to dependency array

  // Helper to calculate manual edit percentage (character-based)
  function getEditPercentage(aiCode: string, finalCode: string): number {
    if (!aiCode || !finalCode) return 0;
    const diff = diffChars(aiCode, finalCode);
    let changed = 0;
    let total = aiCode.length;
    diff.forEach(part => {
      if (part.added || part.removed) {
        changed += part.count || part.value.length;
      }
    });
    return total > 0 ? Math.min(100, Math.round((changed / total) * 100)) : 0;
  }
  const aiCode = (file as any).aiGeneratedCode || file.convertedContent || '';
  const finalCode = file.convertedContent || '';
  const humanEditPercent = getEditPercentage(aiCode, finalCode);

  const handleSaveEdit = async () => {
    const originalCode = file.content; // or file.original_code if available
    const newCode = editedContent;

    // 1. Recalculate metrics
    const originalComplexity = analyzeCodeComplexity(originalCode);
    const convertedComplexity = analyzeCodeComplexity(newCode);
    const conversionTime = 0; // Optionally, you can track edit time
    // Use the correct arguments for generateBalancedPerformanceMetrics
    const newMetrics = generateBalancedPerformanceMetrics(
      originalComplexity,
      convertedComplexity,
      conversionTime,
      // The next three arguments are required: complexityAssessment, optimizationLevel, expansionRatio
      // For manual edits, we can estimate or reuse previous values if available, or use defaults
      file.performanceMetrics?.complexityAssessment || 'moderate',
      file.performanceMetrics?.optimizationLevel || 'basic',
      (convertedComplexity.totalLines || 1) / (originalComplexity.totalLines || 1),
      newCode,
      originalCode
    );

    // 2. Update in Supabase
    await supabase
      .from('unreviewed_files')
      .update({
        converted_code: newCode,
        performance_metrics: newMetrics,
      })
      .eq('id', file.id);

    // 3. Update in local state/UI
    onManualEdit(newCode); // pass only newCode as expected
    setIsEditing(false);
    if (onSaveEdit) {
      await onSaveEdit(newCode);
      return;
    }
  };

  // Add color helpers:
  const getScalabilityColor = (score) => {
    if (score >= 8) return 'text-green-700 font-semibold';
    if (score >= 5) return 'text-orange-600 font-semibold';
    return 'text-red-700 font-semibold';
  };
  const getModernFeaturesColor = (count) => count > 0 ? 'text-blue-700 font-semibold' : 'text-gray-700 font-semibold';
  const getBulkColor = (used) => used ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold';
  const getLinesColor = (v) => v < 0 ? 'text-green-700 font-semibold' : v > 0 ? 'text-red-700 font-semibold' : 'text-gray-700 font-semibold';
  const getLoopsColor = (v) => v < 0 ? 'text-green-700 font-semibold' : v > 0 ? 'text-red-700 font-semibold' : 'text-gray-700 font-semibold';
  const getComplexityColor = (orig, conv) => conv < orig ? 'text-green-700 font-semibold' : conv > orig ? 'text-red-700 font-semibold' : 'text-gray-700 font-semibold';

  return (
    <>
      {/* Removed top bar with filename, badges, and download button. Now only tabs and code sections remain. */}
      <Tabs defaultValue="code" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="mapping">Data Types</TabsTrigger>
          <TabsTrigger value="issues">Issues {file.issues && file.issues.length > 0 && (<Badge variant="outline" className="ml-1">{file.issues.length}</Badge>)}</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="code" className="space-y-4">
          {(file.content || file.convertedContent) ? (
            <div className={`relative grid gap-6 ${file.convertedContent ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {/* Left Column: Original Sybase Code with Prev Arrow */}
                <div className="flex flex-col min-h-0 overflow-hidden">
                  <div className="flex items-center mb-2">
                  {hasPrev && onPrevFile && (
                    <button
                      className="mr-2 bg-white border rounded-full shadow p-1 hover:bg-gray-100"
                      onClick={onPrevFile}
                      aria-label="Previous file"
                    >
                      <ArrowLeft className="h-6 w-6" />
                    </button>
                  )}
                    <h3 className="text-sm font-medium">Original Sybase Code:</h3>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <CodeEditor
                      initialCode={file.content}
                      readOnly={true}
                      showLineNumbers={true}
                      height={originalHeight}
                      language="sql"
                      filename={file.name}
                      editorId="original-sybase-code"
                    />
                  </div>
                </div>
                {/* Right Column: Converted Oracle Code (only if available) */}
                {file.convertedContent && (
                  <div className="flex flex-col min-h-0 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-green-700">Converted Oracle Code:</h3>
                      {hasNext && onNextFile && (
                    <button
                          className="bg-white border rounded-full shadow p-1 hover:bg-gray-100"
                      onClick={onNextFile}
                      aria-label="Next file"
                    >
                      <ArrowRight className="h-6 w-6" />
                    </button>
                  )}
                </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                      {isEditing ? (
                        hideEdit ? (
                          <CodeEditor
                            initialCode={file.convertedContent}
                            readOnly={true}
                            showLineNumbers={true}
                            height={convertedHeight}
                            language="sql"
                            filename={convertedFilename || file.name}
                            actions={undefined}
                            editorId="converted-oracle-code-readonly"
                          />
                        ) : (
                          <>
                            <CodeEditor
                              initialCode={file.convertedContent}
                              value={editedContent}
                              onChange={setEditedContent}
                              readOnly={false}
                              showLineNumbers={true}
                              height={convertedHeight}
                              language="sql"
                              selection={selection}
                              onSelectionChange={setSelection}
                              filename={convertedFilename || file.name}
                              editorId="converted-oracle-code-editable"
                              actions={(isDarkMode) => (
                                <div className="flex items-center gap-2 mt-0">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={handleSaveEdit}
                                          className="h-8 w-8 p-0"
                                        >
                                          <Save className={`h-5 w-5 ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`} />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Save</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => {
                                            setIsEditing(false);
                                            setEditedContent(file.convertedContent || '');
                                          }}
                                          className="h-8 w-8 p-0"
                                        >
                                          <X className="h-5 w-5 text-red-500" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Cancel</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => {
                                            setPreservedSelection({ start: selection.start, end: selection.end });
                                            setShowRewriteDialog(true);
                                          }}
                                          disabled={isRewriting}
                                          className="h-8 w-8 p-0 bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
                                        >
                                          <Sparkles className="h-5 w-5 text-white drop-shadow" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Rewrite with AI</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              )}
                            />
                          </>
                        )
                      ) : (
                          <CodeEditor
                            initialCode={file.convertedContent}
                            readOnly={true}
                            showLineNumbers={true}
                            height={convertedHeight}
                            language="sql"
                            filename={convertedFilename || file.name}
                            editorId="converted-oracle-code-view"
                            actions={hideEdit ? undefined : (isDarkMode) => (
                              <div className="flex items-center gap-2 mt-0">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setIsEditing(true)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Edit className={`h-5 w-5 ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={async () => {
                                          setShowExplainDialog(true);
                                          setIsExplaining(true);
                                          setExplanation('');
                                          try {
                                            const res = await fetch('/.netlify/functions/ai-explain', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ code: file.convertedContent, language: 'oracle sql' }),
                                            });
                                            
                                            if (!res.ok) {
                                              throw new Error(`Network response error: ${res.status} ${res.statusText}`);
                                            }
                                            
                                            const data = await res.json();
                                            
                                            if (data.explanation && data.explanation.includes('AI service error')) {
                                              // This is an API error from Gemini
                                              console.error('AI explanation API error:', data.explanation);
                                              setExplanation(`${data.explanation}\n\nPlease contact the administrator to check the API configuration.`);
                                            } else if (data.explanation && data.explanation.includes('No explanation returned')) {
                                              // This is when the API returned empty content
                                              console.warn('AI explanation returned empty content');
                                              setExplanation(`${data.explanation}\n\nPlease try again later or contact the administrator.`);
                                            } else {
                                              // Normal case with explanation
                                              setExplanation(data.explanation || 'No explanation available for this code.');
                                            }
                                          } catch (err) {
                                            console.error('AI explanation request failed:', err);
                                            setExplanation(`Failed to get explanation: ${err.message || 'Unknown error'}\n\nPlease check your network connection and try again.`);
                                          } finally {
                                            setIsExplaining(false);
                                          }
                                        }}
                                        className="h-8 w-8 p-0 bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md hover:from-blue-600 hover:to-cyan-700 transition-all duration-200"
                                      >
                                        <Sparkles className="h-5 w-5 text-white drop-shadow" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>AI Code Analyzer</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}
                          />
                      )}
                    </div>
                  </div>
                )}
                

               </div>
          ) : (
            <div className="text-center text-gray-400">No code available.</div>
          )}
                     {file.errorMessage && (
             <div>
               <h3 className="text-sm font-medium mb-2 text-red-700">Error:</h3>
               <div className="bg-red-50 p-4 rounded text-sm text-red-700">
                 {file.errorMessage}
               </div>
             </div>
           )}

           {/* Comments Section */}
           <div className="mt-6 border-t pt-4">
             <button
               onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
               className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
             >
               {isCommentsExpanded ? (
                 <ChevronUp className="h-4 w-4" />
               ) : (
                 <ChevronDown className="h-4 w-4" />
               )}
               Comments
               <Badge variant="secondary" className="ml-1">{commentCount}</Badge>
             </button>
             
             {isCommentsExpanded && (
               <div className="mt-4">
                 <CommentSection 
                   fileId={file.id} 
                   fileName={file.name} 
                   conversionId={file.conversion_id}
                   onCommentCountChange={handleCommentCountChange}
                 />
               </div>
             )}
           </div>
         </TabsContent>
        
        <TabsContent value="mapping" className="space-y-4">
          {file.dataTypeMapping && file.dataTypeMapping.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Data Type Mappings</h3>
              <div className="grid gap-3">
                {file.dataTypeMapping.map((mapping, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Sybase Type</h4>
                        <code className="bg-red-50 px-3 py-2 rounded text-sm font-mono block">
                          {mapping.sybaseType}
                        </code>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">Oracle Type</h4>
                        <code className="bg-green-50 px-3 py-2 rounded text-sm font-mono block">
                          {mapping.oracleType}
                        </code>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                          {mapping.description || 'Standard type conversion'}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No data type mappings available</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="issues" className="space-y-4">
          <ConversionIssuesPanel
            issues={file.issues || []}
            onDismissIssue={onDismissIssue}
          />
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          {file.performanceMetrics ? (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Quantitative Performance Analysis</h3>
              {file.performanceMetrics.complexityCategory && (
                <div className="text-center">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-sm font-semibold mb-2
                      ${file.performanceMetrics.complexityCategory === 'Simple' ? 'bg-green-100 text-green-700' : ''}
                      ${file.performanceMetrics.complexityCategory === 'Moderate' ? 'bg-orange-100 text-orange-700' : ''}
                      ${file.performanceMetrics.complexityCategory === 'Complex' ? 'bg-red-100 text-red-700' : ''}
                    `}
                  >
                    Complexity Category: {file.performanceMetrics.complexityCategory}
                  </span>
                </div>
              )}
              
              {/* Performance Score */}
              <Card className="p-6">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Overall Performance Score</h4>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {file.performanceMetrics.performanceScore || 0}/100
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${file.performanceMetrics.performanceScore || 0}%` }}
                    ></div>
                  </div>
                </div>
              </Card>

              {/* Manual Edits Metric */}
              <Card className="p-6">
                <div className="text-center">
                                      <h4 className="text-sm font-medium text-gray-600 mb-2">Manual Edits</h4>
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {humanEditPercent}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${humanEditPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Percentage of code changed by a human after AI conversion
                  </p>
                </div>
              </Card>

              {/* Manual Edits Diff Viewer */}
              {humanEditPercent > 0 && (
                <div className="p-0">
                  <CodeDiffViewer 
                    originalCode={aiCode}
                    convertedCode={finalCode}
                    originalFilename={`${file.name} (AI Generated)`}
                    convertedFilename={`${file.name} (Manual Edited)`}
                  />
                </div>
              )}

              {/* Complexity Metrics */}
              <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Original Complexity */}
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Original Complexity</h4>
                    <p className="text-2xl font-bold text-red-600">
                      {file.performanceMetrics.originalComplexity || 0}
                    </p>
                    <p className="text-xs text-gray-500">Cyclomatic Complexity</p>
                  </div>
                  {/* Converted Complexity */}
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Converted Complexity</h4>
                    <p className={`text-2xl font-bold ${
                      file.performanceMetrics.convertedComplexity < file.performanceMetrics.originalComplexity
                        ? 'text-green-600'
                        : file.performanceMetrics.convertedComplexity > file.performanceMetrics.originalComplexity
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}>
                      {file.performanceMetrics.convertedComplexity || 0}
                    </p>
                    <p className="text-xs text-gray-500">Cyclomatic Complexity</p>
                  </div>
                  {/* Improvement */}
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Improvement</h4>
                    <p className={`text-2xl font-bold ${
                      (() => {
                        const orig = file.performanceMetrics.originalComplexity || 0;
                        const conv = file.performanceMetrics.convertedComplexity || 0;
                        if (orig === 0) return 'text-gray-600';
                        if (conv < orig) return 'text-blue-600';
                        if (conv > orig) return 'text-red-600';
                        return 'text-gray-600';
                      })()
                    }`}>
                      {(() => {
                        const orig = file.performanceMetrics.originalComplexity || 0;
                        const conv = file.performanceMetrics.convertedComplexity || 0;
                        if (orig === 0) return '0%';
                        const percent = Math.round(((orig - conv) / orig) * 100);
                        if (percent > 0) return `+${percent}%`;
                        if (percent < 0) return `${percent}%`;
                        return '0%';
                      })()}
                    </p>
                    <p className="text-xs text-gray-500">Performance Gain</p>
                  </div>
                </div>
              </Card>

              {/* Code Quality Metrics */}
              {file.performanceMetrics.codeQuality && (
                <Card className="p-6">
                  <h4 className="text-lg font-medium mb-4">Code Quality Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{file.performanceMetrics.codeQuality.totalLines}</p>
                      <p className="text-sm text-gray-600">Total Lines</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{file.performanceMetrics.codeQuality.codeLines}</p>
                      <p className="text-sm text-gray-600">Code Lines</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{parseInt(file.performanceMetrics.codeQuality.commentRatio.toString(), 10)}%</p>
                      <p className="text-sm text-gray-600">Comment Ratio</p>
                    </div>
                    <div className="text-center">
                      <Badge variant={
                        file.performanceMetrics.codeQuality.complexityLevel === 'Low' ? 'default' :
                        file.performanceMetrics.codeQuality.complexityLevel === 'Medium' ? 'secondary' : 'destructive'
                      }>
                        {file.performanceMetrics.codeQuality.complexityLevel}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">Complexity</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Maintainability Index */}
              {file.performanceMetrics.maintainabilityIndex !== undefined && file.performanceMetrics.maintainabilityIndex !== null && (
                <Card className="p-6">
                  <h4 className="text-lg font-medium mb-4">Maintainability Index</h4>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {Math.min(100, Math.round(file.performanceMetrics.maintainabilityIndex))}/100
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round(file.performanceMetrics.maintainabilityIndex))}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {file.performanceMetrics.maintainabilityIndex >= 80 ? 'Excellent' :
                       file.performanceMetrics.maintainabilityIndex >= 60 ? 'Good' :
                       file.performanceMetrics.maintainabilityIndex >= 40 ? 'Fair' : 'Poor'} Maintainability
                    </p>
                  </div>
                </Card>
              )}

              {/* Enhanced Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Lines Reduced/Increased */}
                <Card className="p-4 text-center">
                  <div className="font-semibold text-gray-700 mb-2">Lines Change</div>
                  <p className={`text-2xl font-bold ${getLinesColor((file.performanceMetrics.convertedLines || 0) - (file.performanceMetrics.originalLines || 0))}`}>{Math.abs(parseInt(((file.performanceMetrics.convertedLines || 0) - (file.performanceMetrics.originalLines || 0)).toString(), 10))}</p>
                  <p className="text-xs text-gray-500">
                    {parseInt((file.performanceMetrics.originalLines || 0).toString(), 10)} → {parseInt((file.performanceMetrics.convertedLines || 0).toString(), 10)}
                  </p>
                  <h4 className="text-sm font-medium text-gray-600 mt-2">{(() => {
                    const diff = (file.performanceMetrics.convertedLines || 0) - (file.performanceMetrics.originalLines || 0);
                    if (diff < 0) return 'Lines Reduced';
                    if (diff > 0) return 'Lines Increased';
                    return 'No Change';
                  })()}</h4>
                </Card>
                {/* Loops Reduced/Increased */}
                <Card className="p-4 text-center">
                  <div className="font-semibold text-gray-700 mb-2">Loops Change</div>
                  <p className={`text-2xl font-bold ${getLoopsColor((file.performanceMetrics.convertedLoops || 0) - (file.performanceMetrics.originalLoops || 0))}`}>{Math.abs(parseInt(((file.performanceMetrics.convertedLoops || 0) - (file.performanceMetrics.originalLoops || 0)).toString(), 10))}</p>
                  <p className="text-xs text-gray-500">
                    {parseInt((file.performanceMetrics.originalLoops || 0).toString(), 10)} → {parseInt((file.performanceMetrics.convertedLoops || 0).toString(), 10)}
                  </p>
                  <h4 className="text-sm font-medium text-gray-600 mt-2">{(() => {
                    const diff = (file.performanceMetrics.convertedLoops || 0) - (file.performanceMetrics.originalLoops || 0);
                    if (diff < 0) return 'Loops Reduced';
                    if (diff > 0) return 'Loops Increased';
                    return 'No Change';
                  })()}</h4>
                </Card>
                {/* Conversion Time */}
                <Card className="p-4 text-center">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Conversion Time</h4>
                  <p className="text-2xl font-bold text-orange-600">
                    {file.performanceMetrics.conversionTimeMs || 0}ms
                  </p>
                  <p className="text-xs text-gray-500">Processing Time</p>
                </Card>
              </div>
              
              {/* Scalability & Maintainability Metrics */}
              {file.performanceMetrics.scalabilityMetrics && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Scalability Score */}
                    <Card className="p-4 text-center">
                      <p className={`text-2xl font-bold ${getScalabilityColor(file.performanceMetrics.scalabilityMetrics.scalabilityScore)}`}>{file.performanceMetrics.scalabilityMetrics.scalabilityScore}/10</p>
                      <p className="text-sm text-gray-600">Scalability Score</p>
                    </Card>
                    {/* Modern Features Used */}
                    <Card className="p-4 text-center">
                      <p className={`text-2xl font-bold ${getModernFeaturesColor(file.performanceMetrics.scalabilityMetrics.modernOracleFeaturesCount)}`}>{file.performanceMetrics.scalabilityMetrics.modernOracleFeaturesCount}</p>
                      <p className="text-sm text-gray-600">Modern Features Used</p>
                    </Card>
                    {/* Bulk Operations Used */}
                    <Card className="p-4 text-center">
                      <p className={`text-2xl font-bold ${getBulkColor(file.performanceMetrics.scalabilityMetrics.bulkOperationsUsed)}`}>
                        {file.performanceMetrics.scalabilityMetrics.bulkOperationsUsed ? 'Yes' : 'No'}
                      </p>
                      <p className="text-sm text-gray-600">Bulk Operations Used</p>
                    </Card>
                    {/* Bulk Collect Used */}
                    <Card className="p-4 text-center">
                      <p className={`text-2xl font-bold ${getBulkColor(file.performanceMetrics.scalabilityMetrics.bulkCollectUsed)}`}>
                        {file.performanceMetrics.scalabilityMetrics.bulkCollectUsed ? 'Yes' : 'No'}
                      </p>
                      <p className="text-sm text-gray-600">Bulk Collect Used</p>
                    </Card>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No performance metrics available</p>
            </div>
          )}
        </TabsContent>
        
        
      </Tabs>

      {/* Rewrite Dialog */}
      <Dialog open={showRewriteDialog} onOpenChange={setShowRewriteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rewrite Code with AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isRewriting ? (
              <div className="text-center py-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900">Rewriting Code with AI...</p>
                    <p className="text-sm text-gray-500">This may take a few moments</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
            <div>
              <label className="block text-sm font-medium mb-2">Rewrite Instructions (Optional)</label>
              <Textarea
                value={rewritePrompt}
                onChange={(e) => setRewritePrompt(e.target.value)}
                placeholder="Describe how you want the code to be rewritten (e.g., 'Add comments', 'Optimize performance', 'Improve readability')"
                rows={3}
              />
            </div>
            <div className="text-sm text-gray-600">
              <p>Selected code will be rewritten using AI. You can provide specific instructions or let AI optimize automatically.</p>
            </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRewriteDialog(false)}
              disabled={isRewriting}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                // Preserve the current selection
                setPreservedSelection({ start: selection.start, end: selection.end });
                setIsRewriting(true);
                try {
                  const isPartial = selection.start !== selection.end;
                  const codeToRewrite = isPartial
                    ? editedContent.slice(selection.start, selection.end)
                    : editedContent;

                  const prompt = isPartial
                    ? (rewritePrompt || "Rewrite only the following code snippet, do not include any extra code or context. Return only the rewritten snippet.")
                    : (rewritePrompt || "Rewrite this code to improve performance, readability, and add appropriate comments");

                  const res = await fetch('/.netlify/functions/ai-rewrite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      code: codeToRewrite,
                      prompt,
                      language: 'oracle sql'
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Rewrite failed');

                  if (isPartial) {
                    // Replace only the selected part
                    const newContent =
                      editedContent.slice(0, selection.start) +
                      data.rewrittenCode +
                      editedContent.slice(selection.end);
                    setEditedContent(newContent);
                  } else {
                    setEditedContent(data.rewrittenCode);
                  }
                  setShowRewriteDialog(false);
                  setRewritePrompt('');
                  toast({
                    title: 'AI Rewrite Complete',
                    description: 'Your code has been rewritten by AI.',
                  });
                } catch (err) {
                  toast({
                    title: "Rewrite Failed",
                    description: "Failed to rewrite the code. Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setIsRewriting(false);
                }
              }}
              disabled={isRewriting}
            >
              {isRewriting ? 'Rewriting...' : 'Rewrite Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Explain Dialog */}
      <Dialog open={showExplainDialog} onOpenChange={setShowExplainDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>AI Code Analysis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            {isExplaining ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Analyzing code...</p>
              </div>
            ) : (
              <div className="w-full">
                {explanation.includes('Error') || explanation.includes('No explanation returned') ? (
                  <div className="bg-amber-50 border border-amber-200 rounded p-4 text-amber-800">
                    <h4 className="font-medium mb-2">AI Analysis Issue</h4>
                    <p className="whitespace-pre-wrap text-sm">{explanation}</p>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded overflow-x-auto max-w-full break-words">{explanation}</pre>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowExplainDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConversionViewer;