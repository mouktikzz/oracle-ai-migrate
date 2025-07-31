# Production Rate Limiting

This application implements client-side rate limiting to ensure fair usage and prevent abuse of the AI conversion service.

## Rate Limits

- **10 conversions per minute** - Maximum number of file conversions allowed
- **2-second throttling** - Minimum time between consecutive conversions
- **Automatic reset** - Limits reset after the 1-minute window

## How It Works

The rate limiting is implemented using a React hook (`useProductionRateLimit`) that:

1. **Tracks conversions** - Counts conversions within a sliding 1-minute window
2. **Enforces throttling** - Ensures at least 2 seconds between conversions
3. **Provides feedback** - Shows remaining conversions and retry times
4. **Graceful degradation** - Stops processing when limits are exceeded

## User Experience

- **Visual indicators** - Progress bars and badges show conversion usage
- **Clear messaging** - Toast notifications explain rate limit exceeded
- **Automatic stopping** - Batch processing stops when limits are reached
- **Retry information** - Users know exactly when they can try again

## Implementation

The rate limiting is integrated into:
- `src/components/dashboard/ConversionLogic.tsx` - Dashboard conversion logic
- `src/pages/Index.tsx` - Main conversion page
- `src/hooks/useProductionRateLimit.ts` - Rate limiting hook
- `src/components/ProductionRateLimitStatus.tsx` - Status display component

## Benefits

- **Prevents abuse** - Limits prevent excessive AI API usage
- **Fair usage** - All users get equal access to conversion resources
- **Cost control** - Manages AI API costs effectively
- **Better performance** - Prevents overwhelming the system
- **User-friendly** - Clear feedback and graceful handling

## Configuration

Rate limits can be adjusted in the hook configuration:

```typescript
const { checkRateLimit } = useProductionRateLimit({
  maxRequests: 10,        // Conversions per minute
  windowMs: 60 * 1000,    // 1 minute window
  throttleMs: 2000        // 2 seconds between conversions
});
```

This provides a production-ready rate limiting solution that balances user experience with system protection. 