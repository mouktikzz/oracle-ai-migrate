import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import ConversionIssuesPanel from './ConversionIssuesPanel';
import FileDownloader from './FileDownloader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUnreviewedFiles } from '@/hooks/useUnreviewedFiles';
import CodeDiffViewer from './CodeDiffViewer';
import { diffChars } from 'diff';
import { analyzeCodeComplexity, generateBalancedPerformanceMetrics } from '@/utils/componentUtilswithlangchain';

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
}) => {
  const { toast } = useToast();
  const { addUnreviewedFile } = useUnreviewedFiles();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isMarkedUnreviewed, setIsMarkedUnreviewed] = useState(false);

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
    const newMetrics = generateBalancedPerformanceMetrics(
      originalComplexity,
      convertedComplexity,
      conversionTime,
      originalCode,
      newCode
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
    onManualEdit(newCode, newMetrics); // pass newMetrics to update state/UI
    setIsEditing(false);
    if (onSaveEdit) {
      await onSaveEdit(newCode);
      return;
    }
  };

  return (
    <>
      {/* Removed top bar with filename, badges, and download button. Now only tabs and code sections remain. */}
      <Tabs defaultValue="code" className="w-full">
        <TabsList className={`grid w-full grid-cols-${file.type === 'trigger' ? '3' : '4'}`}>
          <TabsTrigger value="code">Code</TabsTrigger>
          {file.type !== 'trigger' && <TabsTrigger value="mapping">Data Types</TabsTrigger>}
          <TabsTrigger value="issues">Issues {file.issues && file.issues.length > 0 && (<Badge variant="outline" className="ml-1">{file.issues.length}</Badge>)}</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
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
                        </div>
                      </>
                    )
                  ) : (
                    <>
                      <pre className="bg-green-50 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                        {file.convertedContent}
                      </pre>
                      {!hideEdit && (
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Scalability Score</h4>
                  <p className="text-2xl font-bold text-blue-600">{file.performanceMetrics?.scalabilityScore ?? file.scalabilityScore ?? '-'} /10</p>
                  {file.performanceMetrics?.scalabilityMetrics && (
                    <div className="text-xs text-gray-500 mt-2">
                      BulkOps: {file.performanceMetrics.scalabilityMetrics.bulkOperationsUsed ? 'Yes' : 'No'},
                      BulkCollect: {file.performanceMetrics.scalabilityMetrics.bulkCollectUsed ? 'Yes' : 'No'},
                      Modern: {file.performanceMetrics.scalabilityMetrics.modernOracleFeaturesCount}
                    </div>
                  )}
                </Card>
                <Card className="p-4 text-center">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Maintainability Score</h4>
                  <p className="text-2xl font-bold text-green-600">{file.performanceMetrics?.maintainabilityScore ?? file.maintainabilityScore ?? '-'} /10</p>
                </Card>
                <Card className="p-4 text-center">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Human Edits</h4>
                  <p className="text-2xl font-bold text-purple-600">{humanEditPercent}%</p>
                  <div className="text-xs text-muted-foreground">% of code changed by a human after AI conversion</div>
                </Card>
              </div>
              <CodeDiffViewer
                originalCode={file.aiGeneratedCode || file.content}
                convertedCode={file.convertedContent || ''}
                readOnly={true}
              />
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
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No performance metrics available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
};

export default ConversionViewer;
