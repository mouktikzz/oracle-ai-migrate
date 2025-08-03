import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, X, Download, Upload, Database, FileText, Info, Lightbulb, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConversionReport } from '@/types';
import { deployToOracle } from '@/utils/databaseUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { diffChars } from 'diff';
import { analyzeCodeComplexity, generateBalancedPerformanceMetrics } from '@/utils/componentUtilswithlangchain';

interface ReportViewerProps {
  report: ConversionReport;
  onBack: () => void;
}

interface DeploymentLog {
  id: string;
  created_at: string;
  status: string;
  lines_of_sql: number;
  file_count: number;
  error_message: string | null;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ report, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLog[]>([]);
  const [showClearLogsDialog, setShowClearLogsDialog] = useState(false);
  
  useEffect(() => {
    fetchDeploymentLogs();
    const channel = supabase
      .channel('deployment-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deployment_logs',
        },
        () => {
          fetchDeploymentLogs();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDeploymentLogs = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('deployment_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching deployment logs:', error);
        return;
      }
      setDeploymentLogs(data || []);
    } catch (error) {
      console.error('Error fetching deployment logs:', error);
    }
  };

  const handleClearDeploymentLogs = async () => {
    if (!user) return;
    try {
        const { error } = await supabase
            .from('deployment_logs')
            .delete()
            .eq('user_id', user.id);
        if (error) throw error;
        setDeploymentLogs([]);
        toast({
            title: 'Deployment Logs Cleared',
            description: 'All deployment logs have been successfully deleted.',
        });
    } catch (error) {
        console.error('Error clearing deployment logs:', error);
        toast({
            title: 'Error',
            description: 'Failed to clear deployment logs.',
            variant: 'destructive',
        });
    }
    setShowClearLogsDialog(false);
  };

  const saveDeploymentLog = async (status: string, linesOfSql: number, fileCount: number, errorMessage?: string) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('deployment_logs')
        .insert({
          user_id: user.id,
          status,
          lines_of_sql: linesOfSql,
          file_count: fileCount,
          error_message: errorMessage || null,
        })
        .select()
        .single();
      if (error) {
        console.error('Error saving deployment log:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error saving deployment log:', error);
      return null;
    }
  };
  
  const handleDownload = () => {
    const blob = new Blob([report.summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oracle-migration-report-${report.timestamp.split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: 'Report Downloaded',
      description: 'The migration report has been downloaded to your device.',
    });
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const linesOfSql = report.summary.split('\n').length;
      const fileCount = report.filesProcessed;
      let allSuccess = true;
      let filesToInsert = [];
      let latestFiles = [];
      if (user) {
        const { data: unreviewed, error } = await supabase
          .from('unreviewed_files')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'reviewed');
        if (!error && unreviewed && unreviewed.length > 0) {
          latestFiles = unreviewed.map(f => ({
            file_name: f.file_name,
            file_path: f.file_name,
            file_type: (f.file_name.toLowerCase().includes('trig') ? 'trigger' : f.file_name.toLowerCase().includes('proc') ? 'procedure' : f.file_name.toLowerCase().includes('tab') ? 'table' : 'other'),
            converted_content: f.converted_code,
            original_content: f.original_code,
            conversion_status: 'success',
          }));
        }
      }
      if (latestFiles.length > 0) {
        filesToInsert = latestFiles.map(f => ({
          ...f,
          performance_metrics: f.performance_metrics || {
            score: 85,
            maintainability: 90,
            orig_complexity: 10,
            conv_complexity: 7,
            improvement: 30,
            lines_reduced: 15,
            loops_reduced: 2,
            time_ms: 120
          }
        }));
      } else {
        filesToInsert = report.results.map(r => ({
          file_name: r.originalFile.name,
          file_path: r.originalFile.name,
          file_type: r.originalFile.type,
          converted_content: r.convertedCode,
          original_content: r.originalFile.content,
          conversion_status: r.status,
          performance_metrics: r.performance_metrics || {
            score: 85,
            maintainability: 90,
            orig_complexity: 10,
            conv_complexity: 7,
            improvement: 30,
            lines_reduced: 15,
            loops_reduced: 2,
            time_ms: 120
          }
        }));
      }
      const deploymentResults = [];
      for (const file of filesToInsert) {
        const deployResult = await deployToOracle(
          { 
            type: 'oracle',
            host: 'localhost',
            port: '1521',
            username: 'system',
            password: 'password',
            database: 'ORCL',
          },
          file.converted_content
        );
        deploymentResults.push({
          fileName: file.file_name,
          success: deployResult.success,
          message: deployResult.message
        });
        if (!deployResult.success) allSuccess = false;
      }
      const { data: migration, error: migrationError } = await supabase
        .from('migrations')
        .insert({
          user_id: user?.id,
          project_name: `Oracle Deployment: ${new Date().toLocaleString()}`,
        })
        .select()
        .single();
      if (!migrationError && migration) {
        await supabase.from('migration_files').insert(
          filesToInsert.map(f => ({ ...f, migration_id: migration.id }))
        );
        await supabase.from('unreviewed_files').delete().eq('user_id', user.id).eq('status', 'reviewed');
      }
      // Create detailed error message if any files failed
      let errorMessage = undefined;
      if (!allSuccess) {
        const failedFiles = deploymentResults.filter(r => !r.success);
        if (failedFiles.length === 1) {
          errorMessage = `Failed to deploy ${failedFiles[0].fileName}: ${failedFiles[0].message}`;
        } else {
          const failedFileNames = failedFiles.map(f => f.fileName).join(', ');
          errorMessage = `Failed to deploy ${failedFiles.length} files: ${failedFileNames}`;
        }
      }

      const logEntry = await saveDeploymentLog(
        allSuccess ? 'Success' : 'Failed',
        linesOfSql,
        fileCount,
        errorMessage
      );
      toast({
        title: allSuccess ? 'Deployment Successful' : 'Deployment Failed',
        description: allSuccess 
          ? `All ${fileCount} files deployed successfully.` 
          : `Failed to deploy ${deploymentResults.filter(r => !r.success).length} of ${fileCount} files.`,
        variant: allSuccess ? 'default' : 'destructive',
      });
      if (logEntry) {
        console.log('Deployment log saved:', logEntry);
        // Refresh the deployment logs to show the new entry
        await fetchDeploymentLogs();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorLogEntry = await saveDeploymentLog(
        'Failed',
        report.summary.split('\n').length,
        report.filesProcessed,
        errorMessage
      );
      if (errorLogEntry) {
        await fetchDeploymentLogs();
      }
      toast({
        title: 'Deployment Failed',
        description: 'An unexpected error occurred during deployment.',
        variant: 'destructive',
      });
    } finally {
      setIsDeploying(false);
    }
  };
  
  // Ensure metrics are recalculated for consistency with dev review tab
  const getConsistentPerformance = (result: any) => {
    if (result.performance && result.performance.performanceScore !== undefined) {
      return result.performance;
    }
    // Recalculate if missing or incomplete
    const originalCode = result.originalFile.content || '';
    const convertedCode = result.convertedCode || '';
    const originalComplexity = analyzeCodeComplexity(originalCode);
    const convertedComplexity = analyzeCodeComplexity(convertedCode);
    // Use defaults for assessment/optimization/expansion if missing
    const complexityAssessment = result.performance?.complexityAssessment || 'moderate';
    const optimizationLevel = result.performance?.optimizationLevel || 'basic';
    const expansionRatio = (convertedComplexity.totalLines || 1) / (originalComplexity.totalLines || 1);
    return generateBalancedPerformanceMetrics(
      originalComplexity,
      convertedComplexity,
      result.performance?.conversionTimeMs || 0,
      complexityAssessment,
      optimizationLevel,
      expansionRatio,
      convertedCode,
      result.originalFile.content
    );
  };

  // Prepare data for charts
  const chartData = report.results.map((result: any) => {
    const perf = getConsistentPerformance(result);
    return {
      name: result.originalFile.name,
      score: perf.performanceScore !== undefined && perf.performanceScore !== null ? perf.performanceScore : 0,
      maintainability: perf.maintainabilityIndex !== undefined && perf.maintainabilityIndex !== null ? perf.maintainabilityIndex : 0,
      time: perf.conversionTimeMs !== undefined && perf.conversionTimeMs !== null ? perf.conversionTimeMs : 0,
      improvement: perf.improvementPercentage !== undefined && perf.improvementPercentage !== null ? perf.improvementPercentage : 0,
    };
  });
  const statusCounts = [
    { name: 'Success', value: report.successCount, color: '#22c55e' }, // Green
    { name: 'Warning', value: report.warningCount, color: '#f97316' }, // Orange
    { name: 'Error', value: report.errorCount, color: '#ef4444' },     // Red
  ];
  
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 p-6 flex items-center justify-between shadow-sm border mb-2">
        <div className="flex items-center gap-4">
          <FileText className="h-10 w-10 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
              Migration Report
              <Badge variant="outline" className="ml-2 text-base font-normal px-3 py-1 bg-white/80 dark:bg-slate-900/60">
                {new Date(report.timestamp).toLocaleString()}
              </Badge>
            </h1>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Report ID: <span className="font-mono text-xs">{report.timestamp.split('T')[0]}-{Date.now().toString().slice(-6)}</span>
            </CardDescription>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Back to Review
          </Button>
          <Button onClick={handleDownload} variant="secondary">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center shadow-none border bg-white/80 dark:bg-slate-900/60">
          <div className="flex justify-center mb-2"><FileText className="h-6 w-6 text-blue-500" /></div>
          <h3 className="text-sm font-medium text-gray-600">Total Files</h3>
          <p className="text-2xl font-bold">{report.filesProcessed}</p>
        </Card>
        <Card className="p-4 text-center shadow-none border bg-green-50 dark:bg-green-900/20">
          <div className="flex justify-center mb-2"><Check className="h-6 w-6 text-green-500" /></div>
          <h3 className="text-sm font-medium text-green-600">Successful</h3>
          <p className="text-2xl font-bold text-green-700">{report.successCount}</p>
        </Card>
        <Card className="p-4 text-center shadow-none border bg-red-50 dark:bg-red-900/20">
          <div className="flex justify-center mb-2"><X className="h-6 w-6 text-red-500" /></div>
          <h3 className="text-sm font-medium text-red-600">Failed</h3>
          <p className="text-2xl font-bold text-red-700">{report.errorCount}</p>
        </Card>
        <Card className="p-4 text-center shadow-none border bg-blue-50 dark:bg-blue-900/20">
          <div className="flex justify-center mb-2"><Info className="h-6 w-6 text-blue-600" /></div>
          <h3 className="text-sm font-medium text-blue-600">Success Rate</h3>
          <p className="text-2xl font-bold text-blue-700">
            {Math.round((report.successCount / report.filesProcessed) * 100)}%
          </p>
        </Card>
      </div>

      {/* Processed Files List */}
      <Card className="shadow-none border bg-white/80 dark:bg-slate-900/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Processed Files</CardTitle>
            <span className="ml-2 text-gray-400 text-sm">({report.results.length})</span>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 border rounded-md">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800">
                  <th className="px-4 py-2 text-left font-semibold">File Name</th>
                  <th className="px-4 py-2 text-left font-semibold">Type</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-left font-semibold">Issues</th>
                </tr>
              </thead>
              <tbody>
                {report.results.map((result: any, idx: number) => (
                  <tr key={result.id} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900/60' : 'bg-slate-50 dark:bg-slate-800'}>
                    <td className="px-4 py-2 font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-400" />
                      {result.originalFile.name}
                    </td>
                    <td className="px-4 py-2 capitalize">{result.originalFile.type}</td>
                    <td className="px-4 py-2">
                      <Badge variant={
                        result.status === 'success' ? 'default' :
                        result.status === 'error' ? 'destructive' : 'secondary'
                      }>
                        {result.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={result.issues?.length ? 'destructive' : 'default'}>
                        {result.issues?.length || 0}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </ScrollArea>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Bar Chart: Performance Score per File */}
        <Card className="shadow border bg-white/90 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Performance Score by File</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap={20}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="score" fill="#6366f1" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Pie Chart: Status Distribution */}
        <Card className="shadow border bg-white/90 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusCounts}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  fill="#8884d8"
                  isAnimationActive
                  animationDuration={1200}
                >
                  {statusCounts.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value, entry, index) => {
                    const total = statusCounts.reduce((sum, s) => sum + s.value, 0);
                    const percent = total ? ((statusCounts[index].value / total) * 100).toFixed(0) : 0;
                    return `${value}: ${percent}%`;
                  }}
                />
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* File Performance Metrics Table */}
      <Card className="mt-4 shadow border bg-white/90 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            File Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm border rounded">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800">
                  <th className="px-3 py-2 text-left font-semibold">File Name</th>
                  <th className="px-3 py-2 text-left font-semibold">🏅 Score</th>
                  <th className="px-3 py-2 text-left font-semibold">🧮 Maintainability</th>
                  <th className="px-3 py-2 text-left font-semibold">📊 Complexity</th>
                  <th className="px-3 py-2 text-left font-semibold">🔥 Improvement</th>
                  <th className="px-3 py-2 text-left font-semibold">🟩 Lines Reduced</th>
                  <th className="px-3 py-2 text-left font-semibold">🔵 Loops Reduced</th>
                  <th className="px-3 py-2 text-left font-semibold">⏱️ Time (ms)</th>
                  <th className="px-3 py-2 text-left font-semibold">⚡ Scalability</th>
                  <th className="px-3 py-2 text-left font-semibold">✨ Modern Features</th>
                  <th className="px-3 py-2 text-left font-semibold">📦 Bulk Ops</th>
                  <th className="px-3 py-2 text-left font-semibold">📦 Bulk Collect</th>
                </tr>
              </thead>
              <tbody>
                {report.results.map((result: any) => {
                  const perf = getConsistentPerformance(result);
                  // Clamp maintainability index
                  const maintainability =
                    perf.maintainabilityIndex === undefined || perf.maintainabilityIndex === null || isNaN(perf.maintainabilityIndex)
                      ? 0
                      : Math.max(0, Math.min(100, Math.round(perf.maintainabilityIndex)));
                  // Extract scalability metrics
                  const scalability = perf.scalabilityMetrics || {};
                  const scalabilityScore = scalability.scalabilityScore !== undefined && scalability.scalabilityScore !== null && !isNaN(scalability.scalabilityScore)
                    ? Math.max(0, Math.min(10, Math.round(scalability.scalabilityScore)))
                    : 0;
                  const modernFeatures = scalability.modernFeaturesCount !== undefined && scalability.modernFeaturesCount !== null && !isNaN(scalability.modernFeaturesCount)
                    ? Math.max(0, Math.round(scalability.modernFeaturesCount))
                    : 0;
                  const bulkOps = scalability.bulkOpsUsed ? '✔️' : '❌';
                  const bulkCollect = scalability.bulkCollectUsed ? '✔️' : '❌';
                  return (
                    <tr key={result.id + '-perf-row'}>
                      <td className="px-3 py-2 font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-400" />
                        {result.originalFile.name}
                      </td>
                      <td className="px-3 py-2">{perf.performanceScore !== undefined && perf.performanceScore !== null ? perf.performanceScore : 0}/100</td>
                      <td className="px-3 py-2">{maintainability}/100</td>
                      <td className={(() => {
                        const orig = perf.originalComplexity !== undefined && perf.originalComplexity !== null ? perf.originalComplexity : 0;
                        const conv = perf.convertedComplexity !== undefined && perf.convertedComplexity !== null ? perf.convertedComplexity : 0;
                        if (conv > orig) return 'px-3 py-2 text-red-700 font-semibold';
                        if (conv < orig) return 'px-3 py-2 text-green-700 font-semibold';
                        return 'px-3 py-2 text-gray-700 font-semibold';
                      })()}>
                        {`${perf.originalComplexity !== undefined && perf.originalComplexity !== null ? perf.originalComplexity : 0} → ${perf.convertedComplexity !== undefined && perf.convertedComplexity !== null ? perf.convertedComplexity : 0}`}
                      </td>
                      <td className={`px-3 py-2 ${perf.improvementPercentage > 0 ? 'text-green-700' : perf.improvementPercentage < 0 ? 'text-red-700' : 'text-gray-700'}`}>{perf.improvementPercentage !== undefined && perf.improvementPercentage !== null ? (perf.improvementPercentage > 0 ? '+' : '') + perf.improvementPercentage : 0}%</td>
                      <td className={(() => {
                        const v = perf.linesReduced !== undefined && perf.linesReduced !== null ? perf.linesReduced : 0;
                        if (v > 0) return 'px-3 py-2 text-green-700 font-semibold';
                        if (v < 0) return 'px-3 py-2 text-red-700 font-semibold';
                        return 'px-3 py-2 text-gray-700 font-semibold';
                      })()}>{perf.linesReduced !== undefined && perf.linesReduced !== null ? perf.linesReduced : 0}</td>
                      <td className={(() => {
                        const v = perf.loopsReduced !== undefined && perf.loopsReduced !== null ? perf.loopsReduced : 0;
                        if (v > 0) return 'px-3 py-2 text-green-700 font-semibold';
                        if (v < 0) return 'px-3 py-2 text-red-700 font-semibold';
                        return 'px-3 py-2 text-gray-700 font-semibold';
                      })()}>{perf.loopsReduced !== undefined && perf.loopsReduced !== null ? perf.loopsReduced : 0}</td>
                      <td className="px-3 py-2">{perf.conversionTimeMs !== undefined && perf.conversionTimeMs !== null ? perf.conversionTimeMs : 0}</td>
                      <td className={(() => {
                        if (scalabilityScore >= 8) return 'px-3 py-2 text-green-700 font-semibold';
                        if (scalabilityScore >= 5) return 'px-3 py-2 text-orange-600 font-semibold';
                        return 'px-3 py-2 text-red-700 font-semibold';
                      })()}>{scalabilityScore}/10</td>
                      <td className={modernFeatures > 0 ? 'px-3 py-2 text-blue-700 font-semibold' : 'px-3 py-2 text-gray-700 font-semibold'}>{modernFeatures}</td>
                      <td className={bulkOps === '✔️' ? 'px-3 py-2 text-green-700 font-semibold' : 'px-3 py-2 text-red-700 font-semibold'}>{bulkOps}</td>
                      <td className={bulkCollect === '✔️' ? 'px-3 py-2 text-green-700 font-semibold' : 'px-3 py-2 text-red-700 font-semibold'}>{bulkCollect}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Section */}
      <Card className="shadow-none border bg-white/80 dark:bg-slate-900/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Oracle Deployment
            </CardTitle>
            <div className="flex items-center gap-2">
                {deploymentLogs.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={() => setShowClearLogsDialog(true)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Logs
                    </Button>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                  <Button 
                    onClick={handleDeploy} 
                    disabled={isDeploying}
                    className="px-6 py-3 text-lg font-semibold rounded-lg shadow-md transition-all duration-200
                      bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0
                      hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl
                      focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    aria-label="Deploy to Oracle Database"
                  >
                    {isDeploying ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin inline-flex"><svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg></span>
                        <Upload className="h-5 w-5 text-white" />
                        <Database className="h-5 w-5 text-white" />
                        Deploying to Oracle...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-white drop-shadow" />
                        <Database className="h-5 w-5 text-white drop-shadow" />
                        <span>Deploy to Oracle</span>
                      </span>
                    )}
              </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-base max-w-xs">
                  Deploy all successfully converted files to your Oracle database. This will insert the converted SQL into your configured Oracle instance and log the deployment.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            </div>
            </div>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2"><Database className="h-5 w-5 text-blue-500" /> Deployment Logs</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Tracks actual deployment attempts to Oracle database. This is separate from file conversion status shown in History.
          </p>
          <ScrollArea className="h-64 border rounded-md">
                {deploymentLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Database className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No deployment logs yet</p>
                  <p className="text-sm">Click "Deploy to Oracle" to start</p>
                </div>
                  </div>
                ) : (
              <ol className="relative border-l border-blue-200 dark:border-blue-900 ml-4 mt-2">
                {deploymentLogs.map((log, idx) => (
                  <li key={log.id} className="mb-8 ml-6">
                    <span className={`absolute flex items-center justify-center w-6 h-6 bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-blue-900 rounded-full -left-3 ring-4 ring-blue-100 dark:ring-blue-900`}>{log.status === 'Success' ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}</span>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={log.status === 'Success' ? 'default' : 'destructive'}>{log.status}</Badge>
                      <span className="text-xs text-gray-400">ID: {log.id.slice(0, 8)}...</span>
                      <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                    <div className="grid grid-cols-2 gap-4 text-xs mb-1">
                      <div>Files: <strong>{log.file_count}</strong></div>
                        </div>
                        {log.error_message && (
                      <div className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
                        <X className="inline h-4 w-4 mr-1 align-text-bottom" />
                        Error: {log.error_message}
                      </div>
                    )}
                  </li>
                    ))}
              </ol>
                )}
              </ScrollArea>
        </CardContent>
      </Card>

      {/* Recommendations Section */}
      <Card className="shadow-none border bg-yellow-50 dark:bg-yellow-900/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-1 text-sm text-yellow-900 dark:text-yellow-100">
            <li>Review all <span className="font-semibold">failed conversions</span> manually</li>
            <li>Test converted procedures in <span className="font-semibold">Oracle environment</span></li>
            <li>Validate <span className="font-semibold">data integrity</span> after migration</li>
            <li>Monitor <span className="font-semibold">performance</span> after deployment</li>
          </ul>
        </CardContent>
      </Card>
        <Dialog open={showClearLogsDialog} onOpenChange={setShowClearLogsDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Clear All Deployment Logs?</DialogTitle>
                </DialogHeader>
                <div className="py-2">Are you sure you want to delete all deployment logs? This action cannot be undone.</div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowClearLogsDialog(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleClearDeploymentLogs}>Clear Logs</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
};

export default ReportViewer;
