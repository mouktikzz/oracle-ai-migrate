import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, Clock, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
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
  aiGeneratedCode?: string; // Add this field for human edits
  errorMessage?: string;
  dataTypeMapping?: DataTypeMapping[];
  issues?: ConversionIssue[];
  performanceMetrics?: PerformanceMetrics;
  status: 'reviewed' | 'unreviewed'; // New field for status
  ai_analysis?: string; // Add this field for persistent analysis
  migration_id?: string; // Add this field for migration files
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
  onAiAnalysis?: (explanation: string) => void; // Called after new analysis is generated
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
  onAiAnalysis,
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
  const [showExplainDialog, setShowExplainDialog] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    // Prefer persistent analysis if available
    if (file.ai_analysis) {
      setExplanation(file.ai_analysis);
    } else {
      setExplanation('');
    }
  }, [file.ai_analysis]);

  useEffect(() => {
    setEditedContent(file.convertedContent || '');
  }, [file.convertedContent]);

  // Helper to calculate human edit percentage (character-based)
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
      originalCode // Pass originalCode as the 8th argument
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
  const getLinesColor = (v) => v > 0 ? 'text-green-700 font-semibold' : v < 0 ? 'text-red-700 font-semibold' : 'text-gray-700 font-semibold';
  const getLoopsColor = (v) => v > 0 ? 'text-green-700 font-semibold' : v < 0 ? 'text-red-700 font-semibold' : 'text-gray-700 font-semibold';
  const getComplexityColor = (orig, conv) => conv < orig ? 'text-green-700 font-semibold' : conv > orig ? 'text-red-700 font-semibold' : 'text-gray-700 font-semibold';

  return (
    <>
      {/* Removed top bar with filename, badges, and download button. Now only tabs and code sections remain. */}
      <Tabs defaultValue="code" className="w-full">
        <TabsList className="grid w-full grid-cols-5 p-0 m-0 gap-0">
          <TabsTrigger value="code" className="w-full">Code</TabsTrigger>
          {file.type !== 'trigger' && <TabsTrigger value="mapping" className="w-full">Data Types</TabsTrigger>}
          <TabsTrigger value="issues" className="w-full">Issues {file.issues && file.issues.length > 0 && (<Badge variant="outline" className="ml-1">{file.issues.length}</Badge>)}</TabsTrigger>
          <TabsTrigger value="performance" className="w-full">Performance</TabsTrigger>
          <TabsTrigger value="analysis" className="w-full">AI Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="code" className="space-y-4">
          {file.convertedContent ? (
            <div className="relative grid grid-cols-2 gap-4">
              {/* Left Column: Original Sybase Code with Prev Arrow */}
              <div className="flex items-start">
                {hasPrev && onPrevFile && (
                  <button
                    className="mr-2 bg-white border rounded-full shadow p-1 hover:bg-gray-100"
                    onClick={onPrevFile}
                    aria-label="Previous file"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                )}
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-2">Original Sybase Code:</h3>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                    {file.content}
                  </pre>
                </div>
              </div>
              {/* Right Column: Converted Oracle Code with Next Arrow */}
              <div className="flex items-start">
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-2 text-green-700">Converted Oracle Code:</h3>
                  {isEditing ? (
                    hideEdit ? (
                      <pre className="bg-green-50 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                        {file.convertedContent}
                      </pre>
                    ) : (
                      <>
                        <Textarea
                          value={editedContent}
                          onChange={e => setEditedContent(e.target.value)}
                          className="min-h-64 font-mono text-sm mb-2"
                          onSelect={e => {
                            const target = e.target as HTMLTextAreaElement;
                            setSelection({ start: target.selectionStart, end: target.selectionEnd });
                          }}
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={handleSaveEdit}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </Button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowRewriteDialog(true)}
                                  disabled={isRewriting || selection.start === selection.end}
                                  className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 shadow-md hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
                                >
                                  <Sparkles className="h-4 w-4 mr-1 text-yellow-200" />
                                  {isRewriting ? 'Rewriting...' : 'Rewrite with AI'}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Rewrite the code using AI to optimize performance, add comments, or improve readability.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </>
                    )
                  ) : (
                    <>
                      <pre className="bg-green-50 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                        {file.convertedContent}
                      </pre>
                      {!hideEdit && !isEditing && (
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {hasNext && onNextFile && (
                  <button
                    className="ml-2 bg-white border rounded-full shadow p-1 hover:bg-gray-100"
                    onClick={onNextFile}
                    aria-label="Next file"
                  >
                    <ArrowRight className="h-6 w-6" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="relative flex items-start justify-center">
              {hasPrev && onPrevFile && (
                <button
                  className="mr-2 bg-white border rounded-full shadow p-1 hover:bg-gray-100 self-center"
                  onClick={onPrevFile}
                  aria-label="Previous file"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              )}
              <div className="flex-1 w-full">
                <h3 className="text-sm font-medium mb-2">Original Sybase Code:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                  {file.content}
                </pre>
              </div>
              {hasNext && onNextFile && (
                <button
                  className="ml-2 bg-white border rounded-full shadow p-1 hover:bg-gray-100 self-center"
                  onClick={onNextFile}
                  aria-label="Next file"
                >
                  <ArrowRight className="h-6 w-6" />
                </button>
              )}
            </div>
          )}
          {file.errorMessage && (
            <div>
              <h3 className="text-sm font-medium mb-2 text-red-700">Error:</h3>
              <div className="bg-red-50 p-4 rounded text-sm text-red-700">
                {file.errorMessage}
              </div>
            </div>
          )}
        </TabsContent>
        
        {file.type !== 'trigger' && (
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
        )}
        
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

              {/* Human Edits Metric */}
              <Card className="p-6">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Human Edits</h4>
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

              {/* Human Edits Diff Viewer */}
              {humanEditPercent > 0 && (
                <div className="p-0">
                  <CodeDiffViewer 
                    originalCode={aiCode}
                    convertedCode={finalCode}
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
                        {file.performanceMetrics.scalabilityMetrics.bulkOperationsUsed ? (
                          <span style={{ color: 'green' }}>✔️</span>
                        ) : (
                          <span style={{ color: 'red' }}>❌</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">Bulk Operations Used</p>
                    </Card>
                    {/* Bulk Collect Used */}
                    <Card className="p-4 text-center">
                      <p className={`text-2xl font-bold ${getBulkColor(file.performanceMetrics.scalabilityMetrics.bulkCollectUsed)}`}>
                        {file.performanceMetrics.scalabilityMetrics.bulkCollectUsed ? (
                          <span style={{ color: 'green' }}>✔️</span>
                        ) : (
                          <span style={{ color: 'red' }}>❌</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">Bulk Collect Used</p>
                    </Card>
                  </div>
                </>
              )}
              
              {/* Recommendations */}
              {file.performanceMetrics.recommendations && file.performanceMetrics.recommendations.length > 0 && (
                <Card className="p-6">
                  <h4 className="text-lg font-medium mb-4">Performance Recommendations</h4>
                  <ul className="space-y-3">
                    {file.performanceMetrics.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No performance metrics available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="prose whitespace-pre-wrap">
            {isExplaining ? (
              <div>Loading analysis...</div>
            ) : explanation ? (
              <div>{explanation}</div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  setIsExplaining(true);
                  setExplanation('');
                  try {
                    // Determine fileType for API
                    let fileType = file.migration_id ? 'migration_files' : 'unreviewed_files';
                    const res = await fetch('/api/ai-explain', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        code: file.convertedContent,
                        language: 'oracle sql',
                        fileId: file.id,
                        fileType
                      }),
                    });
                    const data = await res.json();
                    setExplanation(data.explanation || 'No explanation returned.');
                    if (onAiAnalysis && data.explanation) {
                      onAiAnalysis(data.explanation);
                    }
                    // Optionally update file.ai_analysis in parent state if possible
                  } catch (err) {
                    setExplanation('Failed to get explanation.');
                  } finally {
                    setIsExplaining(false);
                  }
                }}
              >
                Analyze Code
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showRewriteDialog} onOpenChange={setShowRewriteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rewrite with AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Instruction for AI:</label>
            <Input
              value={rewritePrompt}
              onChange={e => setRewritePrompt(e.target.value)}
              placeholder="E.g. Optimize for performance, add comments, etc."
              disabled={isRewriting}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRewriteDialog(false)} disabled={isRewriting}>Cancel</Button>
            <Button
              variant="default"
              onClick={async () => {
                setIsRewriting(true);
                try {
                  // Only send the selected code to the AI
                  const selectedText = editedContent.slice(selection.start, selection.end);
                  const res = await fetch('/api/ai-rewrite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      code: selectedText,
                      prompt: `${rewritePrompt}\n\nOnly return the rewritten code. Do not include explanations, markdown, or comments unless they are part of the code itself.`,
                      language: 'oracle sql',
                    }),
                  });
                  const data = await res.json();
                  if (data.rewrittenCode) {
                    // Post-process: remove markdown/code fences and explanations
                    let rewritten = data.rewrittenCode;
                    rewritten = rewritten.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '');
                    rewritten = rewritten.split('\n').filter(line =>
                      !line.trim().startsWith('I changed') &&
                      !line.trim().startsWith('Here\'s') &&
                      !line.trim().startsWith('If you prefer') &&
                      !line.trim().startsWith('Explanation:')
                    ).join('\n');
                    setEditedContent(
                      editedContent.slice(0, selection.start) +
                      rewritten +
                      editedContent.slice(selection.end)
                    );
                    toast({ title: 'AI Rewrite Complete', description: 'The selected code has been rewritten by AI.' });
                    setShowRewriteDialog(false);
                  } else {
                    toast({ title: 'AI Rewrite Failed', description: data.error || 'Unknown error', variant: 'destructive' });
                  }
                } catch (err) {
                  toast({ title: 'AI Rewrite Failed', description: 'Network or server error', variant: 'destructive' });
                } finally {
                  setIsRewriting(false);
                }
              }}
              disabled={isRewriting || !rewritePrompt}
            >
              {isRewriting ? 'Rewriting...' : 'Rewrite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExplainDialog} onOpenChange={setShowExplainDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Code Analyzer</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {isExplaining ? (
              <div className="text-center py-4">Analyzing code with AI...</div>
            ) : (
              <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap max-h-96 overflow-auto">{explanation}</pre>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExplainDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConversionViewer;
