import React from 'react';
import { AlertTriangle, Clock, CheckCircle, Zap } from 'lucide-react';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface ProductionRateLimitStatusProps {
  isRateLimited: boolean;
  retryAfter: number | null;
  rateLimitInfo: {
    limit: number;
    remaining: number;
    used: number;
    isThrottled?: boolean;
  } | null;
}

export function ProductionRateLimitStatus({ 
  isRateLimited, 
  retryAfter, 
  rateLimitInfo 
}: ProductionRateLimitStatusProps) {
  if (!rateLimitInfo) return null;

  const usagePercentage = (rateLimitInfo.used / rateLimitInfo.limit) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isCritical = usagePercentage >= 95;

  return (
    <div className="space-y-2">
      {isRateLimited ? (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">
              {rateLimitInfo.isThrottled ? 'Throttling Active' : 'Rate Limit Exceeded'}
            </p>
            <p className="text-xs text-destructive/80">
              {retryAfter ? `Retry in ${retryAfter} seconds` : 'Please wait before converting more files'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-foreground">
                Conversion Limit
              </span>
            </div>
            <Badge 
              variant={isCritical ? "destructive" : isNearLimit ? "secondary" : "outline"}
              className="text-xs"
            >
              {rateLimitInfo.remaining} remaining
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Used: {rateLimitInfo.used}/{rateLimitInfo.limit}</span>
              <span>{Math.round(usagePercentage)}%</span>
            </div>
            <Progress 
              value={usagePercentage} 
              className="h-2"
              style={{
                '--progress-background': isCritical ? 'hsl(var(--destructive))' : 
                                       isNearLimit ? 'hsl(var(--warning))' : 
                                       'hsl(var(--primary))'
              } as React.CSSProperties}
            />
          </div>
          
          {isNearLimit && !isRateLimited && (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <Zap className="h-3 w-3" />
              <span>Approaching conversion limit</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 