import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Code, 
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { ConversionResult } from '@/types';
import { diffChars } from 'diff';

interface PerformanceMetricsDashboardProps {
  results: ConversionResult[];
}

const PerformanceMetricsDashboard: React.FC<PerformanceMetricsDashboardProps> = ({ results }) => {
  const totalFiles = results.length;
  const successfulConversions = results.filter(r => r.status === 'success').length;
  const warningConversions = results.filter(r => r.status === 'warning').length;
  const errorConversions = results.filter(r => r.status === 'error').length;

  // New metrics aggregation
  const avgScalabilityScore = totalFiles > 0 ? results.reduce((sum, r) => sum + (r.performance?.scalabilityScore || 0), 0) / totalFiles : 0;
  const avgMaintainabilityScore = totalFiles > 0 ? results.reduce((sum, r) => sum + (r.performance?.maintainabilityScore || 0), 0) / totalFiles : 0;
  const avgPerformanceScore = totalFiles > 0 ? results.reduce((sum, r) => sum + (r.performance?.performanceScore || 0), 0) / totalFiles : 0;

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

  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Metrics Dashboard</h2>
          <p className="text-muted-foreground">
            Analysis of conversion scalability, maintainability, and performance
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {totalFiles} Files Processed
        </Badge>
      </div>

      {/* Conversion Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Files</p>
                <p className="text-2xl font-bold">{totalFiles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600">{successfulConversions}</p>
                <p className="text-xs text-muted-foreground">
                  {totalFiles > 0 ? Math.round((successfulConversions / totalFiles) * 100) : 0}% success rate
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{warningConversions}</p>
                <p className="text-xs text-muted-foreground">Needs review</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-600">{errorConversions}</p>
                <p className="text-xs text-muted-foreground">Failed conversions</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Avg. Scalability Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{avgScalabilityScore.toFixed(2)}/10</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avg. Maintainability Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{avgMaintainabilityScore.toFixed(2)}/10</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avg. Performance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{avgPerformanceScore.toFixed(2)}/100</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File-by-File Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>File Performance Breakdown</CardTitle>
          <CardDescription>
            Detailed metrics for each converted file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center font-semibold bg-slate-100 border-b py-2">
              <div className="w-1/5 px-2">File Name</div>
              <div className="w-1/6 text-center">Scalability</div>
              <div className="w-1/6 text-center">Maintainability</div>
              <div className="w-1/6 text-center">Performance</div>
              <div className="w-1/6 text-center">Human Edits</div>
              <div className="w-1/12 text-center">Status</div>
            </div>
            {results.map((result, idx) => {
              const aiCode = result.aiGeneratedCode || result.convertedCode || '';
              const finalCode = result.convertedCode || '';
              const editPercent = getEditPercentage(aiCode, finalCode);
              const perf = result.performance;
              return (
                <div
                  key={result.id}
                  className={`flex items-center py-1 border-b last:border-b-0 ${idx % 2 === 1 ? 'bg-slate-50' : ''}`}
                >
                  <div className="w-1/5 px-2 flex items-center gap-2 truncate">
                    {getStatusIcon(result.status)}
                    <span className="font-medium truncate">{result.originalFile.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{result.originalFile.type}</span>
                  </div>
                  <div className="w-1/6 text-center">
                    <span className="font-medium text-blue-600">{perf?.scalabilityScore ?? '-'}</span>
                    <div className="text-xs text-muted-foreground">/10</div>
                    {perf?.scalabilityMetrics && (
                      <div className="text-xs text-gray-500 mt-1">
                        BulkOps: {perf.scalabilityMetrics.bulkOperationsUsed ? 'Yes' : 'No'},
                        BulkCollect: {perf.scalabilityMetrics.bulkCollectUsed ? 'Yes' : 'No'},
                        Modern: {perf.scalabilityMetrics.modernOracleFeaturesCount}
                      </div>
                    )}
                  </div>
                  <div className="w-1/6 text-center">
                    <span className="font-medium text-green-600">{perf?.maintainabilityScore ?? '-'}</span>
                    <div className="text-xs text-muted-foreground">/10</div>
                  </div>
                  <div className="w-1/6 text-center">
                    <span className="font-medium text-indigo-600">{perf?.performanceScore ?? '-'}</span>
                    <div className="text-xs text-muted-foreground">/100</div>
                  </div>
                  <div className="w-1/6 text-center">
                    <span className="font-medium text-purple-600">{editPercent}%</span>
                    <div className="text-xs text-muted-foreground">Human Edits</div>
                  </div>
                  <div className="w-1/12 text-center">
                    <Badge variant="outline" className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            {results.flatMap(r => r.performance?.recommendations || []).map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMetricsDashboard; 