import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Check, Edit3, Trash2, FileText, Folder, ChevronDown, ChevronUp } from 'lucide-react';
import { useUnreviewedFiles } from '@/hooks/useUnreviewedFiles';
import { UnreviewedFile } from '@/types/unreviewedFiles';
import MarkedForReviewPanel from './MarkedForReviewPanel';
import FileTreeView from '@/components/FileTreeView';
import ConversionViewer from '@/components/ConversionViewer';
import { cn } from '@/lib/utils';

interface DevReviewPanelProps {
  canCompleteMigration: boolean;
  onCompleteMigration: () => void;
}

const DevReviewPanel: React.FC<DevReviewPanelProps> = ({ canCompleteMigration, onCompleteMigration }) => {
  const { unreviewedFiles, isLoading, markAsReviewed, deleteUnreviewedFile, updateUnreviewedFile } = useUnreviewedFiles();
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showUnreviewed, setShowUnreviewed] = useState(true);
  const [showReviewed, setShowReviewed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Split files into pending and reviewed
  const pendingFiles = unreviewedFiles.filter(f => f.status !== 'reviewed');
  const reviewedFiles = unreviewedFiles.filter(f => f.status === 'reviewed');

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
  const mapToFileItem = (f: UnreviewedFile): any => {
    let type: 'table' | 'procedure' | 'trigger' | 'other' = 'other';
            const lower = f.file_name.toLowerCase();
            if (lower.includes('trig')) type = 'trigger';
            else if (lower.includes('proc')) type = 'procedure';
            else if (lower.includes('tab') || lower.includes('table')) type = 'table';
            return {
              ...f,
              name: f.file_name,
              content: f.original_code,
              convertedContent: f.converted_code,
              conversionStatus: 'pending',
      errorMessage: undefined,
              type,
      path: f.file_name,
      dataTypeMapping: f.data_type_mapping || [],
      issues: f.issues || [],
      performanceMetrics: f.performance_metrics || {},
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
  console.log('DEBUG: currentIndex', currentIndex, 'selectedFileId', selectedFileId, 'allFilteredFiles', allFilteredFiles.map(f => f.id));
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allFilteredFiles.length - 1;

  // Find selected file in either list
  const selectedFile =
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

  // Start editing a file's converted code
  const handleStartEdit = (file: UnreviewedFile) => {
    setEditingFile(file.id);
    setEditedContent(file.converted_code);
  };

  // Cancel editing and reset state
  const handleCancelEdit = () => {
    setEditingFile(null);
    setEditedContent('');
  };

  const handleSaveEdit = async (file: UnreviewedFile, newCode: string) => {
    const success = await updateUnreviewedFile({
      id: file.id,
      converted_code: newCode
    });
    if (success) {
      setEditingFile(null);
      setEditedContent('');
    }
  };

  // Mark a file as reviewed and save changes
  const handleMarkAsReviewed = async (file: UnreviewedFile) => {
    const codeToSave = editingFile === file.id ? editedContent : file.converted_code;
    const originalCode = file.original_code || '';
    const success = await markAsReviewed(file.id, file.file_name, codeToSave, originalCode);
    if (success && editingFile === file.id) {
      setEditingFile(null);
      setEditedContent('');
    }
    // After marking as reviewed, select next pending file if available
    setSelectedFileId(
      pendingFiles.filter(f => f.id !== file.id)[0]?.id ||
      reviewedFiles.concat([{ ...file, status: 'reviewed' }])[0]?.id ||
      null
    );
  };

  // Delete a file from the unreviewed list
  const handleDelete = async (fileId: string) => {
    await deleteUnreviewedFile(fileId);
    if (editingFile === fileId) {
      handleCancelEdit();
    }
    // After delete, select next file
    setSelectedFileId(
      pendingFiles.filter(f => f.id !== fileId)[0]?.id ||
      reviewedFiles.filter(f => f.id !== fileId)[0]?.id ||
      null
    );
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
    <div className="grid grid-cols-12 gap-6 relative min-h-[500px] pb-20">
      <div className="col-span-4 flex flex-col h-full">
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-orange-600 text-lg flex items-center gap-2">
                <Folder className="h-4 w-4 text-orange-500" />
                UnReviewed Files ({pendingFiles.length})
              </div>
              <button onClick={() => setShowUnreviewed(v => !v)} className="focus:outline-none">
                {showUnreviewed ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            {showUnreviewed && (
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
              />
            )}
          </CardContent>
        </Card>
        {/* Review Files Folder */}
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-green-700 flex items-center gap-2">
                <Folder className="h-4 w-4 text-green-600" />
                Reviewed Files ({reviewedFiles.length})
              </div>
              <button onClick={() => setShowReviewed(v => !v)} className="focus:outline-none">
                {showReviewed ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            {showReviewed && (
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
              />
            )}
          </CardContent>
        </Card>
      </div>
      <div className="col-span-8">
        {selectedFile ? (
          <>
            <ConversionViewer
              file={{
                ...selectedFile,
                name: selectedFile.file_name,
                content: selectedFile.original_code,
                convertedContent: editingFile === selectedFile.id ? editedContent : selectedFile.converted_code,
                aiGeneratedCode: selectedFile.ai_generated_code || selectedFile.converted_code || '',
                conversionStatus: 'pending',
                errorMessage: undefined,
                type: (() => {
                  const lower = selectedFile.file_name.toLowerCase();
                  if (lower.includes('trig')) return 'trigger';
                  if (lower.includes('proc')) return 'procedure';
                  if (lower.includes('tab') || lower.includes('table')) return 'table';
                  return 'other';
                })() as 'table' | 'procedure' | 'trigger' | 'other',
                path: selectedFile.file_name,
                dataTypeMapping: selectedFile.data_type_mapping || [],
                issues: selectedFile.issues || [],
                performanceMetrics: selectedFile.performance_metrics || {},
              }}
              onManualEdit={content => {
                setEditingFile(selectedFile.id);
                setEditedContent(content);
              }}
              onSaveEdit={(newContent) => handleSaveEdit(selectedFile, newContent)}
              onDismissIssue={() => {}}
              onPrevFile={hasPrev ? () => setSelectedFileId(allFilteredFiles[currentIndex - 1].id) : undefined}
              onNextFile={hasNext ? () => setSelectedFileId(allFilteredFiles[currentIndex + 1].id) : undefined}
              hasPrev={hasPrev}
              hasNext={hasNext}
            />
            <div className="flex gap-2 mt-4">
              {/* Removed Edit button */}
              {selectedFile.status !== 'reviewed' && (
              <Button
                size="sm"
                onClick={() => handleMarkAsReviewed(selectedFile)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Mark as Reviewed & Save
              </Button>
              )}
            </div>
          </>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a file to review
              </h3>
              <p className="text-gray-600">
                Choose a file from the list to see its details
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Complete Migration and Delete buttons always visible at bottom right */}
      <div className="absolute right-0 bottom-0 p-4 flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleDelete(selectedFile?.id)}
          disabled={!selectedFile}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={onCompleteMigration}>
            <Check className="h-4 w-4 mr-2" />
            Complete Migration
          </Button>
        </div>
    </div>
  );
};

export default DevReviewPanel;