import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Database, FileText, Home, Eye, Download, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import UserDropdown from '@/components/UserDropdown';
import HomeButton from '@/components/HomeButton';
import { format } from 'date-fns';
import CodeDiffViewer from '@/components/CodeDiffViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useUnreviewedFiles } from '@/hooks/useUnreviewedFiles';
import ReportViewer from '@/components/ReportViewer';

interface Migration {
  id: string;
  project_name: string;
  created_at: string;
  file_count: number;
  success_count: number;
  failed_count: number;
  pending_count: number;
  report_id?: string; // Add report_id
}

interface MigrationFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  original_content: string;
  converted_content: string | null;
  conversion_status: 'pending' | 'success' | 'failed';
  error_message: string | null;
  created_at: string;
  migration_id: string; // Added for multi-select
  performance_metrics?: any | null;
}

const History = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMigrationId, setSelectedMigrationId] = useState<string | null>(null);
  const [migrationFiles, setMigrationFiles] = useState<MigrationFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MigrationFile | null>(null);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const isFetchingFiles = useRef(false);
  const { addUnreviewedFile } = useUnreviewedFiles();
  const [undoingFileId, setUndoingFileId] = useState<string | null>(null);
  // Multi-select state
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [selectedMigrationIds, setSelectedMigrationIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showGeneratedReport, setShowGeneratedReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  // Get the return tab from location state
  const returnTab = location.state?.returnTab || 'upload';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchHistory();
    }
  }, [user, loading, navigate]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      // Fetch migrations with file counts and reports
      const { data: migrationsData, error: migrationsError } = await supabase
        .from('migrations')
        .select(`
          id,
          project_name,
          created_at,
          migration_files (
            id,
            conversion_status
          ),
          migration_reports(id)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (migrationsError) {
        console.error('Error fetching migrations:', migrationsError);
        toast({
          title: "Error",
          description: "Failed to fetch migration history",
          variant: "destructive",
        });
      } else {
        const processedMigrations = migrationsData?.map(migration => {
          const files = migration.migration_files || [];
          let reportId: string | undefined = undefined;
          if (Array.isArray(migration.migration_reports) && migration.migration_reports.length > 0 && migration.migration_reports[0] && typeof migration.migration_reports[0] === 'object') {
            reportId = migration.migration_reports[0].id;
          }
          return {
            id: migration.id,
            project_name: migration.project_name,
            created_at: migration.created_at,
            file_count: files.length,
            success_count: files.filter((f: any) => f.conversion_status === 'success').length,
            failed_count: files.filter((f: any) => f.conversion_status === 'failed').length,
            pending_count: files.filter((f: any) => f.conversion_status === 'pending').length,
            report_id: reportId,
          };
        }) || [];
        setMigrations(processedMigrations);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (location.state?.previousReportId) {
      navigate(`/report/${location.state.previousReportId}`);
    } else if (location.state?.fromLanding) {
      navigate('/');
    } else {
      navigate('/migration', { state: { activeTab: returnTab } });
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Fetch files for a migration
  const fetchMigrationFiles = async (migrationId: string) => {
    if (isFetchingFiles.current) return;
    isFetchingFiles.current = true;
    
    try {
      const { data, error } = await supabase
        .from('migration_files')
        .select('id, file_name, file_path, file_type, original_content, converted_content, conversion_status, error_message, created_at, migration_id, performance_metrics')
        .eq('migration_id', migrationId)
        .order('file_name', { ascending: true });
        
      if (error) {
        console.error('Error fetching migration files:', error);
        toast({
          title: "Error",
          description: "Failed to fetch migration files",
          variant: "destructive",
        });
        return;
      }
      
      // Map the data to ensure proper typing for conversion_status and migration_id
      const typedFiles: MigrationFile[] = (data || []).map(file => ({
        ...file,
        conversion_status: ['pending', 'success', 'failed'].includes(file.conversion_status) 
          ? file.conversion_status as 'pending' | 'success' | 'failed'
          : 'pending',
        migration_id: file.migration_id || migrationId
      }));
      
      setMigrationFiles(typedFiles);
    } catch (err) {
      console.error('Error in fetchMigrationFiles:', err);
      setMigrationFiles([]);
    } finally {
      isFetchingFiles.current = false;
    }
  };

  // Handle row click
  const handleRowClick = async (migrationId: string) => {
    if (selectedMigrationId === migrationId) {
      // Collapse if already selected
      setSelectedMigrationId(null);
      setMigrationFiles([]);
    } else {
      setSelectedMigrationId(migrationId);
      await fetchMigrationFiles(migrationId);
    }
  };

  // Handle file view
  const handleViewFile = (e: React.MouseEvent, file: MigrationFile) => {
    e.stopPropagation();
    setSelectedFile(file);
    setShowCodeDialog(true);
  };

  // Handle file download
  const handleDownloadFile = (e: React.MouseEvent, file: MigrationFile) => {
    e.stopPropagation();
    const content = file.converted_content || file.original_content;
    const fileExtension = file.file_name.includes('.') 
      ? file.file_name.split('.').pop() 
      : 'sql';
    const baseName = file.file_name.includes('.')
      ? file.file_name.substring(0, file.file_name.lastIndexOf('.'))
      : file.file_name;
    const downloadName = `${baseName}_oracle.${fileExtension}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded",
      description: `${downloadName} has been downloaded`,
    });
  };

  // Delete migration
  const handleDeleteMigration = async (e: React.MouseEvent, migrationId: string) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this migration? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Delete migration files first
      const { error: filesError } = await supabase
        .from('migration_files')
        .delete()
        .eq('migration_id', migrationId);
        
      if (filesError) {
        console.error('Error deleting migration files:', filesError);
        toast({
          title: "Error",
          description: "Failed to delete migration files",
          variant: "destructive",
        });
        return;
      }
      
      // Delete migration
      const { error: migrationError } = await supabase
        .from('migrations')
        .delete()
        .eq('id', migrationId);
        
      if (migrationError) {
        console.error('Error deleting migration:', migrationError);
        toast({
          title: "Error",
          description: "Failed to delete migration",
          variant: "destructive",
        });
        return;
      }
      
      // Update UI
      setMigrations(prev => prev.filter(m => m.id !== migrationId));
      if (selectedMigrationId === migrationId) {
        setSelectedMigrationId(null);
        setMigrationFiles([]);
      }
      
      toast({
        title: "Deleted",
        description: "Migration has been deleted successfully",
      });
    } catch (error) {
      console.error('Error in handleDeleteMigration:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the migration",
        variant: "destructive",
      });
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleClearAllHistory = async () => {
    if (!confirm('Are you sure you want to clear all your migration history? This will delete all your migration files, migrations, and deployment logs. This action cannot be undone.')) {
      return;
    }
    try {
      // Delete all migration files for the user
      await supabase.from('migration_files').delete().in('migration_id',
        (await supabase.from('migrations').select('id').eq('user_id', user?.id)).data?.map(m => m.id) || []
      );
      // Delete all migrations for the user
      await supabase.from('migrations').delete().eq('user_id', user?.id);
      // Delete all deployment logs for the user
      await supabase.from('deployment_logs').delete().eq('user_id', user?.id);
      setMigrations([]);
      setMigrationFiles([]);
      setSelectedMigrationId(null);
      toast({ title: 'History Cleared', description: 'All your migration history has been deleted.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to clear history', variant: 'destructive' });
    }
  };

  // Add undo handler
  const handleUndoToDevReview = async (e: React.MouseEvent, file: MigrationFile) => {
    e.stopPropagation();
    setUndoingFileId(file.id);
    try {
      await addUnreviewedFile({
        file_name: file.file_name,
        converted_code: file.converted_content || '',
        ai_generated_code: file.converted_content || '',
        original_code: file.original_content,
        data_type_mapping: [], // If you have mapping info, add here
        issues: [], // If you have issues info, add here
        performance_metrics: file.performance_metrics || {}, // If you have metrics, add here
        user_id: user?.id || '',
      });
      toast({
        title: 'Undo Successful',
        description: `${file.file_name} moved to Unreviewed Files.`,
      });
    } catch (err) {
      toast({
        title: 'Undo Failed',
        description: 'Could not move file to Dev Review.',
        variant: 'destructive',
      });
    } finally {
      setUndoingFileId(null);
    }
  };

  // Multi-select handlers
  const handleFileSelectToggle = (fileId: string) => {
    setSelectedFileIds(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };
  const handleMigrationSelectToggle = (migrationId: string) => {
    setSelectedMigrationIds(prev =>
      prev.includes(migrationId)
        ? prev.filter(id => id !== migrationId)
        : [...prev, migrationId]
    );
  };
  const toggleSelectMode = () => {
    setIsSelectMode(prev => {
      if (prev) {
        setSelectedFileIds([]);
        setSelectedMigrationIds([]);
      }
      return !prev;
    });
  };
  const handleDeleteSelected = async () => {
    if (selectedMigrationIds.length === 0 && selectedFileIds.length === 0) return;
    if (!confirm(`Delete ${selectedMigrationIds.length} migration(s) and ${selectedFileIds.length} file(s)? This cannot be undone.`)) return;
    try {
      // Delete selected migrations and all their files
      if (selectedMigrationIds.length > 0) {
        await supabase.from('migration_files').delete().in('migration_id', selectedMigrationIds);
        await supabase.from('migrations').delete().in('id', selectedMigrationIds);
      }
      // Delete selected files (not in selected migrations)
      const fileIdsToDelete = selectedFileIds.filter(fid => {
        const file = migrationFiles.find(f => f.id === fid);
        return file && !selectedMigrationIds.includes(file.migration_id);
      });
      if (fileIdsToDelete.length > 0) {
        await supabase.from('migration_files').delete().in('id', fileIdsToDelete);
      }
      // Update UI
      setMigrations(prev => prev.filter(m => !selectedMigrationIds.includes(m.id)));
      setMigrationFiles(prev => prev.filter(f =>
        !selectedFileIds.includes(f.id) && !selectedMigrationIds.includes(f.migration_id)
      ));
      setSelectedMigrationIds([]);
      setSelectedFileIds([]);
      setSelectedMigrationId(prev => selectedMigrationIds.includes(prev!) ? null : prev);
      toast({ title: 'Deleted', description: 'Selected migrations and files deleted.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete selected items', variant: 'destructive' });
    }
  };

  // Add handler to view report
  const handleViewReport = async (e: React.MouseEvent, migration: Migration) => {
    e.stopPropagation();
    if (migration.report_id) {
      navigate(`/report/${migration.report_id}`);
    } else {
      // Always fetch files for this migration if not already loaded
      let files = migrationFiles.filter(f => f.migration_id === migration.id);
      if (files.length === 0) {
        await fetchMigrationFiles(migration.id);
        files = migrationFiles.filter(f => f.migration_id === migration.id);
        // After fetch, if still empty, try to get directly from DB (in case state is not updated yet)
        if (files.length === 0) {
          const { data, error } = await supabase
            .from('migration_files')
            .select('*')
            .eq('migration_id', migration.id);
          if (data && data.length > 0) {
            files = data.map(file => ({
              ...file,
              conversion_status: ['pending', 'success', 'failed'].includes(file.conversion_status)
                ? file.conversion_status as 'pending' | 'success' | 'failed'
                : 'pending',
            }));
          }
        }
      }
      if (files.length === 0) {
        toast({ title: 'No Files', description: 'No files found for this migration.' });
        return;
      }
      // Calculate lines before/after and other details
      let totalLinesBefore = 0;
      let totalLinesAfter = 0;
      const results = files.map(file => {
        const before = file.original_content ? file.original_content.split('\n').length : 0;
        const after = file.converted_content ? file.converted_content.split('\n').length : 0;
        totalLinesBefore += before;
        totalLinesAfter += after;
        return {
          id: file.id,
          originalFile: {
            id: file.id,
            name: file.file_name,
            content: file.original_content,
            type: file.file_type,
            status: file.conversion_status,
          },
          convertedCode: file.converted_content || '',
          status: file.conversion_status,
          linesBefore: before,
          linesAfter: after,
          issues: file.error_message ? [file.error_message] : [],
          performance: file.performance_metrics || {},
        };
      });
      const report = {
        timestamp: migration.created_at,
        filesProcessed: files.length,
        successCount: files.filter(f => f.conversion_status === 'success').length,
        warningCount: files.filter(f => f.conversion_status === 'pending').length,
        errorCount: files.filter(f => f.conversion_status === 'failed').length,
        results,
        summary: `Migration: ${migration.project_name}\nDate: ${migration.created_at}\nFiles: ${files.length}\nTotal Lines Before: ${totalLinesBefore}\nTotal Lines After: ${totalLinesAfter}`,
        generated: true,
      };
      // Save the generated report to the DB
      try {
        const { data: reportData, error: reportError } = await supabase
          .from('migration_reports')
          .insert({
            migration_id: migration.id,
            user_id: user?.id,
            report: report,
          })
          .select()
          .single();
        if (reportError) {
          toast({ title: 'Error', description: 'Failed to save generated report.' });
          setGeneratedReport(report);
          setShowGeneratedReport(true);
          return;
        }
        // Update the migration in state to include the new report_id
        setMigrations(prev => prev.map(m => m.id === migration.id ? { ...m, report_id: reportData.id } : m));
        // Navigate to the saved report page
        navigate(`/report/${reportData.id}`);
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to save generated report.' });
        setGeneratedReport(report);
        setShowGeneratedReport(true);
      }
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Database className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={handleBack} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5" />
                Back
              </button>
              <HomeButton onClick={handleGoHome} />
              <Button 
                variant="ghost" 
                onClick={handleBack}
                className="flex items-center gap-2"
                style={{ display: 'none' }} // Hide duplicate back button
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center">
                <Database className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Migration History</h1>
              </div>
            </div>
            
            <UserDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Conversion History ({migrations.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSelectMode}
                className={isSelectMode ? 'bg-blue-100' : ''}
                title={isSelectMode ? 'Cancel Selection' : 'Select Multiple Files'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAllHistory}
                disabled={migrations.length === 0}
              >
                Clear History
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isSelectMode && (selectedMigrationIds.length > 0 || selectedFileIds.length > 0) && (
              <div className="sticky top-0 z-20 bg-white border-b flex items-center gap-4 px-4 py-2 mb-2 shadow-sm rounded-t-lg">
                <span className="font-medium text-blue-700">
                  {selectedMigrationIds.length} migration(s), {selectedFileIds.length} file(s) selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  title="Delete Selected"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete Selected
                </Button>
              </div>
            )}
            {migrations.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No migrations yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start your first migration project to see it here
                </p>
                <Button onClick={() => navigate('/migration')}>
                  Start New Migration
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-3"></th> {/* Checkbox column */}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Files</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Success</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Failed</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {migrations.map((migration) => (
                      <React.Fragment key={migration.id}>
                        <tr
                          className={`cursor-pointer hover:bg-blue-50 transition ${
                            selectedMigrationId === migration.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => handleRowClick(migration.id)}
                        >
                          <td className="px-2 py-3">
                            {isSelectMode && (
                              <input
                                type="checkbox"
                                checked={selectedMigrationIds.includes(migration.id)}
                                onChange={e => { e.stopPropagation(); handleMigrationSelectToggle(migration.id); }}
                                onClick={e => e.stopPropagation()}
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-blue-900 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            {migration.project_name}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {format(new Date(migration.created_at), 'MMM dd, yyyy HH:mm')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-1 text-sm bg-gray-100 text-gray-800 rounded">
                              {migration.file_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-1 text-sm bg-green-100 text-green-800 rounded">
                              {migration.success_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-1 text-sm bg-red-100 text-red-800 rounded">
                              {migration.failed_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-1 text-sm bg-orange-100 text-orange-800 rounded">
                              {migration.pending_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-1 justify-center">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(migration.id);
                                }}
                                title="View Files"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => handleViewReport(e, migration)}
                                title="View Report"
                              >
                                <FileText className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => handleDeleteMigration(e, migration.id)}
                                title="Delete Migration"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Show files if this migration is selected */}
                        {selectedMigrationId === migration.id && migrationFiles.length > 0 && (
                          migrationFiles.filter(f => f.migration_id === migration.id).map((file) => (
                            <tr key={file.id} className="bg-gray-50 hover:bg-blue-100">
                              <td className="px-2 py-2">
                                {isSelectMode && (
                                  <input
                                    type="checkbox"
                                    checked={selectedFileIds.includes(file.id)}
                                    onChange={() => handleFileSelectToggle(file.id)}
                                    onClick={e => e.stopPropagation()}
                                  />
                                )}
                              </td>
                              <td className="px-8 py-2 text-sm flex items-center gap-2" colSpan={1}>
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="truncate max-w-xs">{file.file_name}</span>
                              </td>
                              <td className="px-4 py-2 text-center text-xs text-gray-600">
                                {file.file_type}
                              </td>
                              <td className="px-4 py-2 text-center" colSpan={2}>
                                <div className="flex items-center justify-center gap-2">
                                  {getStatusIcon(file.conversion_status)}
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(file.conversion_status)}`}>
                                    {file.conversion_status.charAt(0).toUpperCase() + file.conversion_status.slice(1)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <div className="flex gap-1 justify-center">
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={(e) => handleViewFile(e, file)}
                                    title="View Code"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={(e) => handleUndoToDevReview(e, file)}
                                    title="Undo to Dev Review"
                                    disabled={undoingFileId === file.id}
                                    style={{ marginRight: 4, marginLeft: 4 }}
                                  >
                                    {/* Black undo icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l-5-5m0 0l5-5m-5 5h12a7 7 0 110 14h-1" /></svg>
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={(e) => handleDownloadFile(e, file)}
                                    title="Download converted Oracle code"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                        
                        {selectedMigrationId === migration.id && migrationFiles.length === 0 && (
                          <tr className="bg-gray-50">
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                              No files found for this migration
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Code Diff Dialog */}
        <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Code Comparison: {selectedFile?.file_name}</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {selectedFile && (
                <CodeDiffViewer
                  originalCode={selectedFile.original_content || ''}
                  convertedCode={selectedFile.converted_content || selectedFile.original_content || 'No converted code available'}
                  readOnly={true}
                  originalFilename={selectedFile.file_name}
                  convertedFilename={`${selectedFile.file_name.replace(/\.[^/.]+$/, '')}_oracle.sql`}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog for Generated Report */}
        {showGeneratedReport && generatedReport && (
          <Dialog open={showGeneratedReport} onOpenChange={setShowGeneratedReport}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Migration Report (Generated)</DialogTitle>
                <DialogClose />
              </DialogHeader>
              <div className="overflow-y-auto max-h-[80vh]">
                <ReportViewer report={generatedReport} onBack={() => setShowGeneratedReport(false)} />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
};

export default History;
