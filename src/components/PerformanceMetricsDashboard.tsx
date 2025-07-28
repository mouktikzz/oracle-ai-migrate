import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  FileText, 
  Code, 
  Zap,
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
  // Calculate aggregated metrics
  const totalFiles = results.length;
  const successfulConversions = results.filter(r => r.status === 'success').length;
  const warningConversions = results.filter(r => r.status === 'warning').length;
  const errorConversions = results.filter(r => r.status === 'error').length;

  // Performance metrics calculations
  const totalLinesReduced = results.reduce((sum, result) => 
    sum + (result.performance?.linesReduced || 0), 0
  );
  const totalLoopsReduced = results.reduce((sum, result) => 
    sum + (result.performance?.loopsReduced || 0), 0
  );
  const totalConversionTime = results.reduce((sum, result) => 
    sum + (result.performance?.conversionTimeMs || 0), 0
  );
  const averageConversionTime = totalFiles > 0 ? totalConversionTime / totalFiles : 0;

  // Original vs Converted metrics
  const totalOriginalLines = results.reduce((sum, result) => 
    sum + (result.performance?.originalLines || 0), 0
  );
  const totalConvertedLines = results.reduce((sum, result) => 
    sum + (result.performance?.convertedLines || 0), 0
  );
  const totalOriginalLoops = results.reduce((sum, result) => 
    sum + (result.performance?.originalLoops || 0), 0
  );
  const totalConvertedLoops = results.reduce((sum, result) => 
    sum + (result.performance?.convertedLoops || 0), 0
  );

  // Complexity improvements
  const totalOriginalComplexity = results.reduce((sum, result) => 
    sum + (result.performance?.originalComplexity || 0), 0
  );
  const totalConvertedComplexity = results.reduce((sum, result) => 
    sum + (result.performance?.convertedComplexity || 0), 0
  );
  const averageComplexityReduction = totalOriginalComplexity > 0 
    ? ((totalOriginalComplexity - totalConvertedComplexity) / totalOriginalComplexity) * 100 
    : 0;

  // Performance score
  const averagePerformanceScore = results.reduce((sum, result) => 
    sum + (result.performance?.performanceScore || 0), 0
  ) / totalFiles;

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

  // Calculate line difference and percent change
  const lineDiff = totalConvertedLines - totalOriginalLines;
  const percentChange = totalOriginalLines > 0 ? ((totalConvertedLines - totalOriginalLines) / totalOriginalLines) * 100 : 0;
  const linesLabel = lineDiff < 0 ? 'Lines Reduced' : lineDiff > 0 ? 'Lines Increased' : 'No Change';
  const linesColor = lineDiff < 0 ? 'text-green-600' : lineDiff > 0 ? 'text-red-600' : 'text-gray-600';
  const percentColor = lineDiff < 0 ? 'text-green-600' : lineDiff > 0 ? 'text-red-600' : 'text-gray-600';

  // Loops improvements
  const loopDiff = totalConvertedLoops - totalOriginalLoops;
  const percentLoopChange = totalOriginalLoops > 0 ? ((totalConvertedLoops - totalOriginalLoops) / totalOriginalLoops) * 100 : 0;
  const loopsLabel = loopDiff < 0 ? 'Loops Reduced' : loopDiff > 0 ? 'Loops Increased' : 'No Change';
  const loopsColor = loopDiff < 0 ? 'text-blue-600' : loopDiff > 0 ? 'text-red-600' : 'text-gray-600';
  const loopsPercentColor = loopDiff < 0 ? 'text-blue-600' : loopDiff > 0 ? 'text-red-600' : 'text-gray-600';
  const loopsDescription = loopDiff < 0 ? 'Loop optimizations achieved during conversion' : loopDiff > 0 ? 'Loops added during conversion' : 'No change in total loops during conversion';

  // Complexity improvements
  const diffComplexity = totalConvertedComplexity - totalOriginalComplexity;
  const percentComplexityChange = totalOriginalComplexity > 0 
    ? ((totalConvertedComplexity - totalOriginalComplexity) / totalOriginalComplexity) * 100 
    : 0;
  let complexityLabel, complexityColor, complexityPercentLabel;
  if (diffComplexity < 0) {
    complexityLabel = 'Complexity Reduction';
    complexityColor = 'text-purple-600';
    complexityPercentLabel = (totalOriginalComplexity === 0 || totalOriginalComplexity === undefined || totalOriginalComplexity === null || isNaN(percentComplexityChange))
      ? '0%'
      : `${Math.abs(Math.round(percentComplexityChange))}%`;
  } else if (diffComplexity > 0) {
    complexityLabel = 'Complexity Increase';
    complexityColor = 'text-red-600';
    complexityPercentLabel = (totalOriginalComplexity === 0 || totalOriginalComplexity === undefined || totalOriginalComplexity === null || isNaN(percentComplexityChange))
      ? '0%'
      : `${Math.abs(Math.round(percentComplexityChange))}%`;
  } else {
    complexityLabel = 'No Change';
    complexityColor = 'text-gray-600';
    complexityPercentLabel = '0%';
  }

  // Clamp and fix metrics for dashboard consistency
  const safePercent = (value) => isNaN(value) || value === undefined || value === null ? 0 : Math.min(100, Math.round(value));
  const safeScore10 = (value) => isNaN(value) || value === undefined || value === null ? 0 : Math.min(10, Math.round(value));
  const safeInt = (value) => isNaN(value) || value === undefined || value === null ? 0 : Math.round(value);

  // In summary cards and file breakdown, apply color coding as follows:
  // Scalability Score
  const getScalabilityColor = (score) => {
    if (score >= 8) return 'text-green-700 font-semibold';
    if (score >= 5) return 'text-orange-600 font-semibold';
    return 'text-red-700 font-semibold';
  };
  // Modern Features
  const getModernFeaturesColor = (count) => count > 0 ? 'text-blue-700 font-semibold' : 'text-gray-700 font-semibold';
  // Bulk Ops/Collect
  const getBulkColor = (used) => used ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold';
  // Lines/Loops Reduced
  const getLinesColor = (v) => v > 0 ? 'text-green-700 font-semibold' : v < 0 ? 'text-red-700 font-semibold' : 'text-gray-700 font-semibold';
  const getLoopsColor = (v) => v > 0 ? 'text-green-700 font-semibold' : v < 0 ? 'text-red-700 font-semibold' : 'text-gray-700 font-semibold';
  // Complexity
  const getComplexityColor = (orig, conv) => conv < orig ? 'text-green-700 font-semibold' : conv > orig ? 'text-red-700 font-semibold' : 'text-gray-700 font-semibold';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Metrics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis of conversion performance and optimizations
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
              <FileText className="h-8 w-8 text-blue-500" />
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

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lines Reduced */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-500" />
              {linesLabel}
            </CardTitle>
            <CardDescription>
              {lineDiff < 0 ? 'Total lines of code optimized during conversion' : lineDiff > 0 ? 'Total lines of code added during conversion' : 'No change in total lines during conversion'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className={`text-3xl font-bold ${linesColor}`}>{Math.abs(lineDiff)}</p>
                <p className="text-sm text-muted-foreground">{linesLabel === 'No Change' ? 'No change in lines' : `Total ${linesLabel.toLowerCase()}`}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Original Lines</span>
                  <span className="font-medium">{totalOriginalLines}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Converted Lines</span>
                  <span className="font-medium">{totalConvertedLines}</span>
                </div>
                <div className={`flex justify-between text-sm ${percentColor}`}>
                  <span>{lineDiff < 0 ? 'Reduction' : lineDiff > 0 ? 'Increase' : 'Change'}</span>
                  <span className="font-medium">
                    {totalOriginalLines > 0 ? `${Math.abs(Math.round(percentChange))}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loops Reduced */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              {loopsLabel}
            </CardTitle>
            <CardDescription>
              {loopsDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className={`text-3xl font-bold ${loopsColor}`}>{Math.abs(loopDiff)}</p>
                <p className="text-sm text-muted-foreground">{loopsLabel === 'No Change' ? 'No change in loops' : `Total ${loopsLabel.toLowerCase()}`}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Original Loops</span>
                  <span className="font-medium">{totalOriginalLoops}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Converted Loops</span>
                  <span className="font-medium">{totalConvertedLoops}</span>
                </div>
                <div className={`flex justify-between text-sm ${loopsPercentColor}`}>
                  <span>{loopDiff < 0 ? 'Reduction' : loopDiff > 0 ? 'Increase' : 'Change'}</span>
                  <span className="font-medium">
                    {totalOriginalLoops > 0 ? `${Math.abs(Math.round(percentLoopChange))}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Conversion Time
            </CardTitle>
            <CardDescription>
              Performance metrics for conversion processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">
                  {Math.round(averageConversionTime)}ms
                </p>
                <p className="text-sm text-muted-foreground">Average per file</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Time</span>
                  <span className="font-medium">{Math.round(totalConversionTime)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Files Processed</span>
                  <span className="font-medium">{totalFiles}</span>
                </div>
                <div className="flex justify-between text-sm text-orange-600">
                  <span>Efficiency</span>
                  <span className="font-medium">
                    {totalFiles > 0 ? Math.round(totalConversionTime / totalFiles) : 0}ms/file
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complexity Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-purple-500" />
            Complexity Analysis
          </CardTitle>
          <CardDescription>
            Cyclomatic complexity improvements across all conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{totalOriginalComplexity}</p>
              <p className="text-sm text-muted-foreground">Original Complexity</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${
                totalConvertedComplexity < totalOriginalComplexity
                  ? 'text-green-600'
                  : totalConvertedComplexity > totalOriginalComplexity
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}>{totalConvertedComplexity}</p>
              <p className="text-sm text-muted-foreground">Converted Complexity</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${complexityColor}`}>{complexityPercentLabel}</p>
              <p className="text-sm text-muted-foreground">{complexityLabel}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>{diffComplexity < 0 ? 'Complexity Reduction' : diffComplexity > 0 ? 'Complexity Increase' : 'No Change'}</span>
              <span className={complexityColor}>{complexityPercentLabel}</span>
            </div>
            <div className={`w-full rounded-full h-2 ${diffComplexity < 0 ? 'bg-green-200' : diffComplexity > 0 ? 'bg-red-200' : 'bg-gray-200'}`}> 
              <div 
                className={`${diffComplexity < 0 ? 'bg-green-500' : diffComplexity > 0 ? 'bg-red-500' : 'bg-gray-400'} h-2 rounded-full transition-all duration-300`} 
                style={{ width: `${Math.min(Math.abs(percentComplexityChange), 100)}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Overall Performance Score
          </CardTitle>
          <CardDescription>
            Average performance score across all conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-indigo-600">
              {Math.round(averagePerformanceScore)}/100
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(averagePerformanceScore)}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground">
              {averagePerformanceScore >= 80 ? 'Excellent' :
               averagePerformanceScore >= 60 ? 'Good' :
               averagePerformanceScore >= 40 ? 'Fair' : 'Poor'} Performance
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Scalability & Maintainability Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Scalability Metrics
          </CardTitle>
          <CardDescription>
            Aggregated scalability metrics across all conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Scalability Score */}
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {safeScore10(results.reduce((sum, r) => sum + (r.performance?.scalabilityMetrics?.scalabilityScore || 0), 0) / (totalFiles || 1))}/10
              </p>
              <p className="text-sm text-muted-foreground">Scalability Score</p>
            </Card>
            {/* Modern Features Used */}
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {results.reduce((sum, r) => sum + (r.performance?.scalabilityMetrics?.modernOracleFeaturesCount || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Modern Features Used</p>
            </Card>
            {/* Bulk Operations Used */}
            <Card className="p-4 text-center">
              <p className="text-lg font-bold text-blue-700">
                {results.filter(r => r.performance?.scalabilityMetrics?.bulkOperationsUsed).length} / {totalFiles}
              </p>
              <p className="text-sm text-muted-foreground">Bulk Operations Used</p>
            </Card>
            {/* Bulk Collect Used */}
            <Card className="p-4 text-center">
              <p className="text-lg font-bold text-blue-700">
                {results.filter(r => r.performance?.scalabilityMetrics?.bulkCollectUsed).length} / {totalFiles}
              </p>
              <p className="text-sm text-muted-foreground">Bulk Collect Used</p>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* File-by-File Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>File Performance Breakdown</CardTitle>
          <CardDescription>
            Detailed performance metrics for each converted file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden w-full">
            {/* Header Row */}
            <div className="flex items-center font-semibold bg-slate-100 border-b py-2 w-full">
              <div className="flex-[2] px-2">File Name</div>
              <div className="flex-1 text-center">Lines</div>
              <div className="flex-1 text-center">Loops</div>
              <div className="flex-1 text-center">Time</div>
              <div className="flex-1 text-center">Status</div>
              <div className="flex-1 text-center">Scalability</div>
              <div className="flex-1 text-center">Human Edits</div>
              <div className="flex-1 text-center">Bulk Ops</div>
              <div className="flex-1 text-center">Bulk Collect</div>
              <div className="flex-1 text-center">Modern Features</div>
            </div>
            {results.map((result, idx) => {
              const aiCode = result.aiGeneratedCode || result.convertedCode || '';
              const finalCode = result.convertedCode || '';
              const editPercent = getEditPercentage(aiCode, finalCode);
              const originalLines = result.performance?.originalLines || 0;
              const convertedLines = result.performance?.convertedLines || 0;
              const lineDiff = convertedLines - originalLines;
              const linesColor = lineDiff < 0 ? 'text-green-600' : lineDiff > 0 ? 'text-red-600' : 'text-gray-600';
              const linesLabel = lineDiff < 0 ? 'Lines Reduced' : lineDiff > 0 ? 'Lines Increased' : 'No Change';
              const scalability = result.performance?.scalabilityMetrics?.scalabilityScore ?? '-';
              const maintainability = result.performance?.scalabilityMetrics?.maintainabilityScore ?? '-';
              const bulkOps = result.performance?.scalabilityMetrics?.bulkOperationsUsed ? '✔️' : '❌';
              const bulkCollect = result.performance?.scalabilityMetrics?.bulkCollectUsed ? '✔️' : '❌';
              const modernFeatures = result.performance?.scalabilityMetrics?.modernOracleFeaturesCount ?? 0;
              return (
                <div
                  key={result.id}
                  className={`flex items-center py-1 border-b ${idx === results.length - 1 ? '' : 'last:border-b-0'} ${idx % 2 === 1 ? 'bg-slate-50' : ''} w-full`}
                >
                  <div className="flex-[2] px-2 flex items-center gap-2 truncate">
                    {getStatusIcon(result.status)}
                    <span className="font-medium truncate">{result.originalFile.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{result.originalFile.type}</span>
                  </div>
                  <div className="flex-1 text-center">
                    <span className={`font-medium ${linesColor}`}>{Math.abs(lineDiff)}</span>
                    <div className="text-xs text-muted-foreground">{linesLabel}</div>
                    <div className="text-xs text-gray-400">{originalLines} → {convertedLines}</div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="font-medium text-blue-600">{result.performance?.loopsReduced || 0}</span>
                    <div className="text-xs text-muted-foreground">Loops</div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="font-medium text-orange-600">{result.performance?.conversionTimeMs || 0}ms</span>
                    <div className="text-xs text-muted-foreground">Time</div>
                  </div>
                  <div className="flex-1 text-center">
                    <Badge variant="outline" className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                  <div className="flex-1 text-center">
                    <span className={`font-medium ${getScalabilityColor(scalability)}`}>{scalability}</span>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="font-medium text-purple-600">{editPercent}%</span>
                  </div>
                  <div className="flex-1 text-center">
                    <span className={`font-medium ${getBulkColor(bulkOps)}`}>{bulkOps}</span>
                  </div>
                  <div className="flex-1 text-center">
                    <span className={`font-medium ${getBulkColor(bulkCollect)}`}>{bulkCollect}</span>
                  </div>
                  <div className="flex-1 text-center">
                    <span className={`font-medium ${getModernFeaturesColor(modernFeatures)}`}>{modernFeatures}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMetricsDashboard; 