import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Check, Edit3, Trash2, FileText, Folder, ChevronDown, ChevronUp, Download, ChevronLeft, ChevronRight, Rows } from 'lucide-react';
import { useUnreviewedFiles } from '@/hooks/useUnreviewedFiles';
import { UnreviewedFile, UnreviewedFileUpdate } from '@/types/unreviewedFiles';
import MarkedForReviewPanel from './MarkedForReviewPanel';
import FileTreeView from '@/components/FileTreeView';
import ConversionViewer from '@/components/ConversionViewer';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from '@/components/ui/use-toast';

interface DevReviewPanelProps {
  canCompleteMigration: boolean;
  onCompleteMigration: () => void;
  onFileReviewed: () => void;
  unreviewedFiles: UnreviewedFile[];
  isLoading: boolean;
  markAsReviewed: (id: string, fileName: string, convertedCode: string, originalCode: string) => Promise<boolean>;
  deleteUnreviewedFile: (id: string, showToast?: boolean) => Promise<boolean>;
  updateUnreviewedFile: (updateData: UnreviewedFileUpdate) => Promise<boolean>;
  refreshUnreviewedFiles: () => Promise<void>;
}

const DevReviewPanel: React.FC<DevReviewPanelProps> = ({
  canCompleteMigration,
  onCompleteMigration,
  onFileReviewed,
  unreviewedFiles,
  isLoading,
  markAsReviewed,
  deleteUnreviewedFile,
  updateUnreviewedFile,
  refreshUnreviewedFiles,
}) => {
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showClearUnreviewedDialog, setShowClearUnreviewedDialog] = useState(false);
  const [showClearReviewedDialog, setShowClearReviewedDialog] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [activeTab, setActiveTab] = useState('unreviewed');
  const [markingReviewed, setMarkingReviewed] = useState(false);

  // Ref and state for sticky offset
  const searchCardRef = useRef<HTMLDivElement>(null);
  const [stickyOffset, setStickyOffset] = useState(0);

  useEffect(() => {
    function updateOffset() {
      if (searchCardRef.current) {
        setStickyOffset(searchCardRef.current.offsetHeight);
      }
    }
    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, []);

  // Split files into pending and reviewed
  const pendingFiles = unreviewedFiles.filter(f => f.status !== 'reviewed');
  const reviewedFiles = unreviewedFiles.filter(f => f.status === 'reviewed');

  // Progress bar for review completion
  const totalFiles = unreviewedFiles.length;
  const reviewedCount = reviewedFiles.length;
  const reviewProgress = totalFiles > 0 ? Math.round((reviewedCount / totalFiles) * 100) : 0;
  const showReviewProgress = totalFiles > 0 && reviewedCount < totalFiles;

  // Filter helpers
  const filterFile = (file: UnreviewedFile) => {
    const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ? true :
      statusFilter === 'Pending' ? file.status !== 'reviewed' :
      statusFilter === 'Reviewed' ? file.status === 'reviewed' : true;
    return matchesSearch && matchesStatus;
  };

  const filteredPendingFiles = pendingFiles.filter(filterFile);
  const filteredReviewedFiles = reviewedFiles.filter(filterFile);

  // Map to FileItem for type property
  const mapToFileItem = (f: UnreviewedFile) => {
    let type: 'table' | 'procedure' | 'trigger' | 'other' = 'other';
    const lower = f.file_name.toLowerCase();
    if (lower.includes('trig')) type = 'trigger';
    else if (lower.includes('proc')) type = 'procedure';
    else if (lower.includes('tab') || lower.includes('table')) type = 'table';
    
    // Generate the converted filename
    const fileExtension = f.file_name.includes('.') 
      ? f.file_name.split('.').pop() 
      : 'sql';
    const baseName = f.file_name.includes('.')
      ? f.file_name.substring(0, f.file_name.lastIndexOf('.'))
      : f.file_name;
    const convertedFilename = `${baseName}_oracle.${fileExtension}`;
    
    return {
      ...f,
      name: f.file_name,
      content: f.original_code,
      convertedContent: f.converted_code,
      aiGeneratedCode: f.ai_generated_code || '', // Always use the ai_generated_code column as the AI baseline
      conversionStatus: 'pending',
      errorMessage: undefined,
      type,
      path: f.file_name,
      dataTypeMapping: f.data_type_mapping || [],
      issues: f.issues || [],
      performanceMetrics: f.performance_metrics || {},
      convertedFilename: convertedFilename, // Add the converted filename
    };
  };

  const mappedPendingFiles = filteredPendingFiles.map(mapToFileItem);
  const mappedReviewedFiles = filteredReviewedFiles.map(mapToFileItem);
  const filteredTables = mappedPendingFiles.filter(f => f.type === 'table');
  const filteredProcedures = mappedPendingFiles.filter(f => f.type === 'procedure');
  const filteredTriggers = mappedPendingFiles.filter(f => f.type === 'trigger');
  const filteredOther = mappedPendingFiles.filter(f => f.type === 'other');
  const reviewedTables = mappedReviewedFiles.filter(f => f.type === 'table');
  const reviewedProcedures = mappedReviewedFiles.filter(f => f.type === 'procedure');
  const reviewedTriggers = mappedReviewedFiles.filter(f => f.type === 'trigger');
  const reviewedOther = mappedReviewedFiles.filter(f => f.type === 'other');
  const allFilteredFiles = [
    ...filteredTables,
    ...filteredProcedures,
    ...filteredTriggers,
    ...filteredOther,
    ...reviewedTables,
    ...reviewedProcedures,
    ...reviewedTriggers,
    ...reviewedOther
  ];
  const currentIndex = allFilteredFiles.findIndex(f => f.id === selectedFileId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allFilteredFiles.length - 1;

  // Find selected file in either list
  const selectedFile: UnreviewedFile | undefined =
    pendingFiles.find(f => f.id === selectedFileId) ||
    reviewedFiles.find(f => f.id === selectedFileId) ||
    pendingFiles[0] ||
    reviewedFiles[0];

  useEffect(() => {
    if (
      allFilteredFiles.length > 0 &&
      !allFilteredFiles.some(f => f.id === selectedFileId)
    ) {
      setSelectedFileId(allFilteredFiles[0].id);
    }
  }, [allFilteredFiles, selectedFileId]);

  const handleStartEdit = (file: UnreviewedFile) => {
    setEditingFile(file.id);
    setEditedContent(file.converted_code);
  };

  const handleCancelEdit = () => {
    setEditingFile(null);
    setEditedContent('');
  };

  // Update handleSaveEdit to accept newMetrics and update local state
  const handleSaveEdit = async (file: UnreviewedFile, newCode: string, newMetrics?: any) => {
    // Always use ai_generated_code as the AI baseline
    // Remove ai_generated_code if not in UnreviewedFileUpdate type
    const updateData: UnreviewedFileUpdate = {
      id: file.id,
      converted_code: newCode,

      ...(newMetrics ? { performance_metrics: newMetrics } : {}),
    };
    const success = await updateUnreviewedFile(updateData);
    if (success) {
      setEditingFile(null);
      setEditedContent('');
      refreshUnreviewedFiles(); // Always refresh from DB after edit
    }
  };

  const handleMarkAsReviewed = async (file: UnreviewedFile) => {
    if (markingReviewed) return;
    setMarkingReviewed(true);
    const codeToSave = editingFile === file.id ? editedContent : file.converted_code;
    const originalCode = file.original_code || '';
    const success = await markAsReviewed(file.id, file.file_name, codeToSave, originalCode);
    if (success && editingFile === file.id) {
      setEditingFile(null);
      setEditedContent('');
    }
    // After marking as reviewed, trigger parent refresh
    if (onFileReviewed) onFileReviewed();
    // Select next unreviewed file if available, else previous, else clear
    const currentIdx = mappedPendingFiles.findIndex(f => f.id === file.id);
    let nextId = null;
    if (mappedPendingFiles.length > 1) {
      if (currentIdx < mappedPendingFiles.length - 1) {
        nextId = mappedPendingFiles[currentIdx + 1].id;
      } else if (currentIdx > 0) {
        nextId = mappedPendingFiles[currentIdx - 1].id;
      }
    }
    setSelectedFileId(nextId);
    setMarkingReviewed(false);
  };

  const handleDelete = async (fileId: string) => {
    await deleteUnreviewedFile(fileId);
  };

  const handleFileSelectToggle = (fileId: string) => {
    setSelectedFileIds(prev =>
        prev.includes(fileId)
            ? prev.filter(id => id !== fileId)
            : [...prev, fileId]
    );
  };

  const toggleSelectMode = () => {
      setIsSelectMode(prev => !prev);
      if (isSelectMode) {
          setSelectedFileIds([]);
      }
  };

  const handleDeleteSelected = async () => {
      for (const fileId of selectedFileIds) {
          await deleteUnreviewedFile(fileId);
      }
      setSelectedFileIds([]);
  };

  const handleMoveSelectedToReviewed = async () => {
    for (const fileId of selectedFileIds) {
      const file = pendingFiles.find(f => f.id === fileId);
      if (file) {
        const codeToSave = editingFile === file.id ? editedContent : file.converted_code;
        const originalCode = file.original_code || '';
        await markAsReviewed(file.id, file.file_name, codeToSave, originalCode);
      }
    }
    setSelectedFileIds([]);
    if (onFileReviewed) onFileReviewed();
    refreshUnreviewedFiles();
  };

  // Clear all unreviewed files
  const handleClearAllUnreviewed = async () => {
    for (const file of pendingFiles) {
      await deleteUnreviewedFile(file.id, false);
    }
    setShowClearUnreviewedDialog(false);
    toast({
      title: "Unreviewed Files Cleared",
      description: "All unreviewed files have been removed.",
    });
  };

  // Clear all reviewed files
  const handleClearAllReviewed = async () => {
    for (const file of reviewedFiles) {
      await deleteUnreviewedFile(file.id, false);
    }
    setShowClearReviewedDialog(false);
    toast({
      title: "Reviewed Files Cleared",
      description: "All reviewed files have been removed.",
    });
  };

  // Add state for AI Analyzer dialog
  const [showAnalyzerDialog, setShowAnalyzerDialog] = useState(false);
  const [analyzerLoading, setAnalyzerLoading] = useState(false);
  const [analyzerResult, setAnalyzerResult] = useState<string | null>(null);
  const [analyzerError, setAnalyzerError] = useState<string | null>(null);

  // Handler for AI Analyzer button
  const handleAIAnalyze = async (file: UnreviewedFile) => {
    setShowAnalyzerDialog(true);
    setAnalyzerLoading(true);
    setAnalyzerResult(null);
    setAnalyzerError(null);
    try {
      const response = await fetch('/.netlify/functions/ai-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: file.converted_code,
          prompt: 'Explain the following code in plain English for a non-technical user. Include the logic and purpose.',
        }),
      });
      const data = await response.json();
      if (data.rewrittenCode) {
        setAnalyzerResult(data.rewrittenCode);
      } else {
        setAnalyzerError(data.error || 'AI did not return an explanation.');
      }
    } catch (err) {
      setAnalyzerError('An error occurred during AI analysis.');
    } finally {
      setAnalyzerLoading(false);
    }
  };

  // Replace setActiveTab with a handler that also sets the selected file
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'unreviewed' && mappedPendingFiles.length > 0) {
      setSelectedFileId(mappedPendingFiles[0].id);
    } else if (tab === 'reviewed' && mappedReviewedFiles.length > 0) {
      setSelectedFileId(mappedReviewedFiles[0].id);
    }
  };

  const handleMoveSelectedToUnreviewed = async () => {
    for (const fileId of selectedFileIds) {
      const file = reviewedFiles.find(f => f.id === fileId);
      if (file) {
        await updateUnreviewedFile({ id: file.id, status: 'unreviewed' });
      }
    }
    setSelectedFileIds([]);
    if (onFileReviewed) onFileReviewed();
    refreshUnreviewedFiles();
  };
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Dev Review
          </CardTitle>
          <CardDescription>
            Loading your unreviewed files...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingFiles.length === 0 && reviewedFiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Dev Review
          </CardTitle>
          <CardDescription>
            All files have been cleared from Dev Review. Migration is complete!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-600 mb-2">
              Migration Complete
            </h3>
            <p className="text-sm text-muted-foreground">
              You can now view your migration report or start a new migration.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex gap-8 relative min-h-[500px] pb-20">
      {/* Sidebar */}
        <div className={cn(
          "flex flex-col h-full transition-all duration-300 ease-in-out",
          isMinimized ? "w-20" : "w-[400px] min-w-[350px] max-w-[440px]"
        )} style={{ maxHeight: 'calc(100vh - 120px)' }}>
        
        {isMinimized ? (
          <Card className="flex-1 flex flex-col items-center py-4 shadow-lg rounded-xl bg-white/90 dark:bg-slate-900/80 border border-orange-100 dark:border-slate-800">
            <Button variant="ghost" size="icon" onClick={() => setIsMinimized(false)} className="mb-4">
              <ChevronRight className="h-6 w-6 text-orange-500" />
            </Button>
            <div
              style={{ writingMode: 'vertical-rl' }}
              className="transform rotate-180 text-lg font-bold text-orange-700 dark:text-orange-200 cursor-pointer"
              onClick={() => setIsMinimized(false)}
            >
              Dev Review Files
            </div>
          </Card>
        ) : (
        <Card className="mb-4 shadow-lg rounded-xl bg-white/90 dark:bg-slate-900/80 border border-orange-100 dark:border-slate-800 flex-1 flex flex-col">
          {/* Header/Search/Filter */}
            <div className="pb-2 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-slate-900 dark:to-slate-800 rounded-t-xl px-6 pt-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <FileText className="h-6 w-6 text-orange-500" />
                    <span className="text-lg font-bold text-orange-700 dark:text-orange-200">Dev Review Files</span>
                </div>
                <div className="flex items-center gap-2">
                    {activeTab === 'unreviewed' && pendingFiles.length > 0 && (
                        <Button size="sm" variant="destructive" onClick={() => setShowClearUnreviewedDialog(true)} className="px-2 py-1 text-xs h-7">Clear All</Button>
                    )}
                    {activeTab === 'reviewed' && reviewedFiles.length > 0 && (
                        <Button size="sm" variant="destructive" onClick={() => setShowClearReviewedDialog(true)} className="px-2 py-1 text-xs h-7">Clear All</Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </div>
              </div>
              <div className="flex gap-2 w-full items-center">
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 rounded border border-gray-200 focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm bg-white dark:bg-slate-800"
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-2 py-2 rounded border border-gray-200 focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm bg-white dark:bg-slate-800"
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Reviewed">Reviewed</option>
                </select>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={toggleSelectMode}
                                className={cn(isSelectMode && "bg-orange-100")}
                            >
                                <Rows className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isSelectMode ? "Cancel Selection" : "Select Multiple Files"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

              </div>
                {isSelectMode && (
                  <div className="flex items-center gap-2 mt-2">
                    {selectedFileIds.length > 0 && (
                      <span className="text-sm text-muted-foreground">{selectedFileIds.length} files selected</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const filesInTab = activeTab === 'unreviewed' ? mappedPendingFiles : mappedReviewedFiles;
                        if (selectedFileIds.length === filesInTab.length) {
                          setSelectedFileIds([]); // Deselect all
                        } else {
                          setSelectedFileIds(filesInTab.map(f => f.id)); // Select all
                        }
                      }}
                    >
                      {selectedFileIds.length === (activeTab === 'unreviewed' ? mappedPendingFiles.length : mappedReviewedFiles.length) ? 'Deselect All' : 'Select All'}
                    </Button>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={handleDeleteSelected}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Delete Selected</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    {activeTab === 'unreviewed' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={handleMoveSelectedToReviewed}
                              className="flex items-center gap-2"
                            >
                              <Check className="h-4 w-4" />
                              Move to Reviewed
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Move to Reviewed</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {activeTab === 'reviewed' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={handleMoveSelectedToUnreviewed}
                              className="flex items-center gap-2"
                            >
                              <Clock className="h-4 w-4" />
                              Move to Unreviewed
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Move to Unreviewed</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                )}
        </div>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="unreviewed">
                      Unreviewed <Badge className="ml-2">{pendingFiles.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="reviewed">
                      Reviewed <Badge className="ml-2">{reviewedFiles.length}</Badge>
                  </TabsTrigger>
              </TabsList>
              <TabsContent value="unreviewed">
                  <FileTreeView
                      files={mappedPendingFiles}
                      onFileSelect={file => setSelectedFileId(file.id)}
                      selectedFile={selectedFile ? mapToFileItem(selectedFile) : null}
                      hideActions={true}
                      defaultExpandedSections={[]}
                      searchTerm={searchTerm}
                      statusFilter={statusFilter}
                      onSearchTermChange={setSearchTerm}
                      onStatusFilterChange={setStatusFilter}
                      selectedFileIds={selectedFileIds}
                      onFileSelectToggle={handleFileSelectToggle}
                      isSelectMode={isSelectMode}
                      toggleSelectMode={toggleSelectMode}
                      onDeleteSelected={handleDeleteSelected}
                  />
              </TabsContent>
              <TabsContent value="reviewed">
                  <FileTreeView
                      files={mappedReviewedFiles}
                      onFileSelect={file => setSelectedFileId(file.id)}
                      selectedFile={selectedFile ? mapToFileItem(selectedFile) : null}
                      hideActions={true}
                      defaultExpandedSections={[]}
                      searchTerm={searchTerm}
                      statusFilter={statusFilter}
                      onSearchTermChange={setSearchTerm}
                      onStatusFilterChange={setStatusFilter}
                      selectedFileIds={selectedFileIds}
                      onFileSelectToggle={handleFileSelectToggle}
                      isSelectMode={isSelectMode}
                      toggleSelectMode={toggleSelectMode}
                      onDeleteSelected={handleDeleteSelected}
                  />
              </TabsContent>
          </Tabs>
        {/* Unreviewed Files Section (no inner scroll) */}
          <Dialog open={showClearUnreviewedDialog} onOpenChange={setShowClearUnreviewedDialog}>
            <DialogContent aria-describedby="clear-unreviewed-description">
              <DialogHeader>
                <DialogTitle>Clear All Unreviewed Files?</DialogTitle>
              </DialogHeader>
              <div id="clear-unreviewed-description" className="py-2">Are you sure you want to clear all unreviewed files? This action cannot be undone.</div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowClearUnreviewedDialog(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleClearAllUnreviewed}>Clear All</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        {/* Reviewed Files Section (no inner scroll) */}
          <Dialog open={showClearReviewedDialog} onOpenChange={setShowClearReviewedDialog}>
            <DialogContent aria-describedby="clear-reviewed-description">
              <DialogHeader>
                <DialogTitle>Clear All Reviewed Files?</DialogTitle>
              </DialogHeader>
              <div id="clear-reviewed-description" className="py-2">Are you sure you want to clear all reviewed files? This action cannot be undone.</div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowClearReviewedDialog(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleClearAllReviewed}>Clear All</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
       )}
      </div>
      {/* Main Panel */}
      <div className="flex-1 min-w-0">
        {/* Review Progress Bar */}
        {showReviewProgress && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-green-700 dark:text-green-200">Review Progress</span>
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{reviewedCount} / {totalFiles} files reviewed</span>
            </div>
            <Progress value={reviewProgress} className="h-3 rounded-full bg-green-100 dark:bg-green-900/30" />
          </div>
        )}
        {/* Main File Review Card */}
        {selectedFile ? (
          <>
            <Card className="shadow-lg rounded-xl bg-white/90 dark:bg-slate-900/80 border border-green-100 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 border-b border-green-100 dark:border-green-800">
                <span className="text-xl font-bold">{selectedFile.file_name}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded ${selectedFile.status === 'reviewed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{selectedFile.status}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      const code = selectedFile.converted_code || '';
                      const fileExtension = selectedFile.file_name.includes('.') 
                        ? selectedFile.file_name.split('.').pop() 
                        : 'sql';
                      const baseName = selectedFile.file_name.includes('.')
                        ? selectedFile.file_name.substring(0, selectedFile.file_name.lastIndexOf('.'))
                        : selectedFile.file_name;
                      const blob = new Blob([code], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${baseName}_oracle.${fileExtension}`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    title="Download converted Oracle code"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <ConversionViewer
                  key={selectedFile.id} /* Add key to force re-render */
                  file={mapToFileItem(selectedFile)}
                  onManualEdit={(newContent) => handleSaveEdit(selectedFile, newContent)}
                  onDismissIssue={() => {}}
                  onSaveEdit={(newContent) => { handleSaveEdit(selectedFile, newContent); }}
                  hideEdit={selectedFile.status === 'reviewed'}
                  onPrevFile={hasPrev ? () => setSelectedFileId(allFilteredFiles[currentIndex - 1].id) : undefined}
                  onNextFile={hasNext ? () => setSelectedFileId(allFilteredFiles[currentIndex + 1].id) : undefined}
                  hasPrev={hasPrev}
                  hasNext={hasNext}
                  convertedFilename={mapToFileItem(selectedFile).convertedFilename}
                />
              </CardContent>
              <CardFooter className="flex justify-end gap-4">
                {/* Action Buttons previously outside the card, now inside */}
                {/* Place your Mark as Reviewed, Delete File, etc. buttons here. Example: */}
              {selectedFile.status !== 'reviewed' && (
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleMarkAsReviewed(selectedFile)} disabled={markingReviewed}>
                    {markingReviewed ? 'Marking...' : 'Mark as Reviewed'}
                  </Button>
              )}
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleAIAnalyze(selectedFile)} disabled={analyzerLoading}>
                  {analyzerLoading ? 'Analyzing...' : 'AI Analyzer'}
                </Button>
                {selectedFile.status === 'reviewed' && (
                  <Button className="bg-yellow-600 hover:bg-yellow-700 text-white" onClick={async () => {
                    await updateUnreviewedFile({ id: selectedFile.id, status: 'unreviewed' });
                    if (onFileReviewed) onFileReviewed();
                    refreshUnreviewedFiles(); // Remove await here
                    // Select next reviewed file if available, else previous, else clear
                    const currentIdx = mappedReviewedFiles.findIndex(f => f.id === selectedFile.id);
                    let nextId = null;
                    if (mappedReviewedFiles.length > 1) {
                      if (currentIdx < mappedReviewedFiles.length - 1) {
                        nextId = mappedReviewedFiles[currentIdx + 1].id;
                      } else if (currentIdx > 0) {
                        nextId = mappedReviewedFiles[currentIdx - 1].id;
                      }
                    }
                    setSelectedFileId(nextId);
                  }}>
                    Move to Unreviewed
                  </Button>
                )}
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteUnreviewedFile(selectedFile.id)}>
                  Delete File
                </Button>
              </CardFooter>
            </Card>
            {/* Complete Migration Button */}
            <div className="flex justify-end mt-8">
              <div className="relative group">
                <Button
                  onClick={onCompleteMigration}
                  className="px-8 py-3 text-lg font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
                  disabled={!canCompleteMigration}
                >
                  <Check className="h-6 w-6" />
                  Complete Migration
                </Button>
                <span className="absolute left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 bg-black text-white text-xs rounded px-2 py-1 pointer-events-none transition-opacity">Finish review and generate the final migration report</span>
              </div>
            </div>
            {/* AI Analyzer Dialog */}
            {showAnalyzerDialog && (
              <Dialog open={showAnalyzerDialog} onOpenChange={setShowAnalyzerDialog}>
                <DialogContent className="max-h-[80vh] w-full max-w-2xl flex flex-col">
                  <DialogHeader>
                    <DialogTitle>AI Code Explanation</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="flex-1 min-h-[100px] max-h-[60vh] pr-2">
                    <div className="py-2">
                      {analyzerLoading && <div>Analyzing code, please wait...</div>}
                      {analyzerError && <div className="text-red-600">{analyzerError}</div>}
                      {analyzerResult && <div className="whitespace-pre-wrap text-gray-800">{analyzerResult}</div>}
                    </div>
                  </ScrollArea>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAnalyzerDialog(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        ) : (
          <Card className="h-full flex items-center justify-center shadow-lg rounded-xl bg-white/90 dark:bg-slate-900/80 border border-green-100 dark:border-slate-800">
            <CardContent className="text-center">
              <FileText className="h-16 w-16 text-green-200 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No File Selected
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Choose a file from the left to review its conversion details.
              </p>
              <span className="inline-block bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-200 px-4 py-2 rounded-full text-sm">Tip: Use the search and filter to quickly find files</span>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DevReviewPanel;