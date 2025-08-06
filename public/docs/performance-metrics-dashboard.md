# Performance Metrics Dashboard

## Overview

The Performance Metrics Dashboard provides real-time monitoring and analytics for the Sybase to Oracle migration tool. It offers comprehensive insights into conversion performance, system health, and user activity to help optimize migration workflows and identify potential issues.

## Features

### 📊 Real-Time Analytics
- **Conversion Success Rates**: Track successful vs failed conversions
- **Processing Time Metrics**: Monitor average and peak processing times
- **File Type Performance**: Analyze performance by file type (procedures, triggers, tables)
- **User Activity Tracking**: Monitor user engagement and usage patterns

### 🎯 Key Metrics Displayed

#### Conversion Metrics
- **Total Files Processed**: Count of all files uploaded and converted
- **Success Rate**: Percentage of successful conversions
- **Average Processing Time**: Mean time per file conversion
- **Peak Processing Time**: Maximum time recorded for a single file
- **Failed Conversions**: Number and percentage of failed conversions

#### System Performance
- **Cache Hit Rate**: Percentage of conversions served from cache
- **API Response Times**: Average response time for AI model calls
- **Memory Usage**: System resource utilization
- **Concurrent Users**: Number of active users

#### User Analytics
- **Active Users**: Daily, weekly, and monthly active users
- **Conversion Volume**: Files converted per user
- **Popular File Types**: Most commonly processed file types
- **User Retention**: User engagement over time

## Usage

### Accessing the Dashboard

1. **Navigate to Dashboard**: Go to the main migration dashboard
2. **Select Metrics Tab**: Click on the "Performance" tab
3. **View Real-Time Data**: Metrics update automatically every 30 seconds

### Dashboard Sections

#### Overview Cards
```
┌─────────────────┬─────────────────┬─────────────────┐
│   Total Files   │  Success Rate   │ Avg. Time/File  │
│     1,234       │      95.2%      │     2.3s       │
└─────────────────┴─────────────────┴─────────────────┘
```

#### Performance Charts
- **Line Charts**: Show trends over time
- **Bar Charts**: Compare metrics across categories
- **Pie Charts**: Display distribution of file types

#### Detailed Metrics Table
| Metric | Value | Trend | Status |
|--------|-------|-------|--------|
| Cache Hit Rate | 78.5% | ↗️ +2.1% | Good |
| Avg Response Time | 1.2s | ↘️ -0.3s | Excellent |
| Error Rate | 2.1% | → 0.0% | Acceptable |

## Configuration

### Environment Variables

```bash
# Performance monitoring settings
VITE_METRICS_ENABLED=true
VITE_METRICS_UPDATE_INTERVAL=30000
VITE_METRICS_RETENTION_DAYS=30

# Cache monitoring
VITE_CACHE_METRICS_ENABLED=true
VITE_CACHE_HIT_RATE_THRESHOLD=70

# Performance thresholds
VITE_AVG_RESPONSE_TIME_THRESHOLD=5000
VITE_ERROR_RATE_THRESHOLD=5
```

### Customization Options

#### Metric Thresholds
```typescript
interface PerformanceThresholds {
  cacheHitRate: number;        // Minimum acceptable cache hit rate
  avgResponseTime: number;     // Maximum acceptable response time (ms)
  errorRate: number;           // Maximum acceptable error rate (%)
  successRate: number;         // Minimum acceptable success rate (%)
}
```

#### Display Options
```typescript
interface DashboardConfig {
  refreshInterval: number;     // Auto-refresh interval (ms)
  chartType: 'line' | 'bar' | 'pie';
  timeRange: '1h' | '24h' | '7d' | '30d';
  showTrends: boolean;
  enableAlerts: boolean;
}
```

## API Endpoints

### Get Performance Metrics
```http
GET /api/metrics/performance
Authorization: Bearer <token>

Response:
{
  "conversionMetrics": {
    "totalFiles": 1234,
    "successRate": 95.2,
    "avgProcessingTime": 2300,
    "peakProcessingTime": 8500
  },
  "systemMetrics": {
    "cacheHitRate": 78.5,
    "avgResponseTime": 1200,
    "memoryUsage": 65.2,
    "concurrentUsers": 12
  },
  "userMetrics": {
    "activeUsers": {
      "daily": 45,
      "weekly": 156,
      "monthly": 423
    }
  }
}
```

### Get Historical Data
```http
GET /api/metrics/history?range=7d&metric=successRate

Response:
{
  "data": [
    { "timestamp": "2024-01-01T00:00:00Z", "value": 94.2 },
    { "timestamp": "2024-01-02T00:00:00Z", "value": 95.1 },
    // ... more data points
  ]
}
```

## Alerts and Notifications

### Performance Alerts
The dashboard automatically generates alerts when metrics fall below thresholds:

- **Low Cache Hit Rate**: < 70%
- **High Response Time**: > 5 seconds
- **High Error Rate**: > 5%
- **Low Success Rate**: < 90%

### Alert Configuration
```typescript
interface AlertConfig {
  enabled: boolean;
  thresholds: PerformanceThresholds;
  notificationChannels: ('email' | 'slack' | 'webhook')[];
  cooldownPeriod: number; // Prevent spam alerts
}
```

## Troubleshooting

### Common Issues

#### Metrics Not Updating
1. Check if metrics collection is enabled
2. Verify API endpoints are accessible
3. Check browser console for errors
4. Ensure user has proper permissions

#### High Error Rates
1. Review recent conversion logs
2. Check AI model API status
3. Verify file format compatibility
4. Monitor system resources

#### Slow Performance
1. Check cache hit rates
2. Review API response times
3. Monitor concurrent user count
4. Verify database performance

### Performance Optimization

#### Caching Strategy
- Enable persistent caching for repeated conversions
- Monitor cache hit rates and adjust cache size
- Implement cache warming for common file types

#### API Optimization
- Use batch processing for multiple files
- Implement request queuing for high load
- Monitor and optimize AI model calls

## Integration

### Exporting Data
```typescript
// Export metrics to CSV
const exportMetrics = async (dateRange: string) => {
  const response = await fetch(`/api/metrics/export?range=${dateRange}`);
  const blob = await response.blob();
  downloadFile(blob, `metrics-${dateRange}.csv`);
};
```

### Third-Party Integrations
- **Grafana**: Connect to external monitoring dashboards
- **Slack**: Send performance alerts to team channels
- **Email**: Automated performance reports
- **Webhooks**: Custom integrations with other systems

## Security

### Data Privacy
- All metrics are anonymized
- User-specific data is encrypted
- Access is restricted to authorized users
- Data retention policies are enforced

### Access Control
- Role-based access to metrics
- Audit logging for all metric access
- Secure API endpoints with authentication
- Rate limiting to prevent abuse

## Future Enhancements

### Planned Features
- [ ] **Real-time Notifications**: Push notifications for performance issues
- [ ] **Custom Dashboards**: User-defined metric combinations
- [ ] **Predictive Analytics**: AI-powered performance predictions
- [ ] **Advanced Filtering**: Filter metrics by user, file type, date range
- [ ] **Export Options**: PDF reports, scheduled exports
- [ ] **Mobile App**: Dedicated mobile dashboard

### API Improvements
- [ ] **GraphQL Support**: More flexible data querying
- [ ] **WebSocket Updates**: Real-time metric streaming
- [ ] **Bulk Operations**: Batch metric retrieval
- [ ] **Custom Aggregations**: User-defined metric calculations

---

**Note**: The Performance Metrics Dashboard is designed to help optimize migration workflows and identify potential issues early. Regular monitoring of these metrics can significantly improve conversion success rates and user experience. 