import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Database,
  FileText,
  Code,
  ArrowRight
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeploymentResult {
  success: boolean;
  message: string;
  details?: {
    [key: string]: {
      success: boolean;
      rowsAffected?: number;
      error?: string;
      statement: string;
    };
  };
}

interface DeploymentStatusProps {
  results: DeploymentResult[];
  isDeploying: boolean;
  totalFiles: number;
  deployedFiles: number;
}

const DeploymentStatus: React.FC<DeploymentStatusProps> = ({
  results,
  isDeploying,
  totalFiles,
  deployedFiles
}) => {
  const successfulDeployments = results.filter(r => r.success).length;
  const failedDeployments = results.filter(r => !r.success).length;
  const progress = totalFiles > 0 ? (deployedFiles / totalFiles) * 100 : 0;

  const getStatusIcon = (success: boolean) => {
    if (success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Deployment Progress
          </CardTitle>
          <CardDescription>
            {isDeploying ? 'Deploying files to Oracle database...' : 'Deployment completed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalFiles}</p>
                <p className="text-sm text-muted-foreground">Total Files</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{successfulDeployments}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{failedDeployments}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Deployment Details
          </CardTitle>
          <CardDescription>
            Detailed results for each deployed file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.success)}
                        <span className={`font-medium ${getStatusColor(result.success)}`}>
                          File {index + 1}
                        </span>
                      </div>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {result.message}
                    </p>

                    {/* Statement Details */}
                    {result.details && Object.keys(result.details).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">SQL Statements:</h4>
                        {Object.entries(result.details).map(([key, detail]) => (
                          <div key={key} className="bg-gray-50 p-3 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(detail.success)}
                                <span className="text-sm font-medium">
                                  Statement {key.split('_')[1]}
                                </span>
                              </div>
                              {detail.success && detail.rowsAffected !== undefined && (
                                <Badge variant="outline" className="text-xs">
                                  {detail.rowsAffected} rows affected
                                </Badge>
                              )}
                            </div>
                            
                            <div className="text-xs text-gray-600 mb-2">
                              <Code className="h-3 w-3 inline mr-1" />
                              {detail.statement}
                            </div>
                            
                            {!detail.success && detail.error && (
                              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                Error: {detail.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Summary */}
      {!isDeploying && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Deployment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Total Files Processed:</span>
                <span className="font-medium">{totalFiles}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Successfully Deployed:</span>
                <span className="font-medium text-green-600">{successfulDeployments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Failed Deployments:</span>
                <span className="font-medium text-red-600">{failedDeployments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Success Rate:</span>
                <span className="font-medium">
                  {totalFiles > 0 ? Math.round((successfulDeployments / totalFiles) * 100) : 0}%
                </span>
              </div>
            </div>
            
            {failedDeployments > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    {failedDeployments} file(s) failed to deploy. Please review the errors above and try again.
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeploymentStatus; 