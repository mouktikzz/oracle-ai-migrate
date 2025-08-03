# Cache Implementation

This document describes the caching system implemented in the Sybase to Oracle migration tool.

## Overview

The application implements a comprehensive caching system to improve performance and reduce redundant AI API calls during code conversion.

## Cache Types

### 1. Local Cache (Browser Storage)
- **Location**: Browser localStorage
- **Purpose**: Store conversion results locally for immediate access
- **Key Format**: `conversion-cache-{model}-{hash}`
- **Lifetime**: Persistent until browser data is cleared

### 2. Backend Cache (Database)
- **Location**: Supabase `conversion_cache` table
- **Purpose**: Persistent storage across sessions and users
- **Schema**: 
  - `hash`: Unique identifier for the conversion
  - `original_code`: Source Sybase code
  - `ai_model`: AI model used for conversion
  - `converted_code`: Resulting Oracle code
  - `metrics`: Performance metrics
  - `issues`: Conversion issues found
  - `data_type_mapping`: Data type mappings

## Cache Configuration

### Environment Variables
- `cache_enabled`: Boolean flag to enable/disable caching (default: true)

### Cache Control Functions
- `isCacheEnabled()`: Check if cache is enabled
- `setCacheEnabled(enabled)`: Enable/disable cache
- `getCachedConversion()`: Retrieve cached result
- `setCachedConversion()`: Store conversion result

## Cache Strategy

### 1. Cache Key Generation
```typescript
function getConversionCacheKey(code: string, model: string) {
  return `conversion-cache-${model}-${hashCode(code)}`;
}
```

### 2. Cache Lookup Order
1. **Backend Cache**: Check Supabase database first
2. **Local Cache**: Fallback to browser localStorage
3. **AI Conversion**: If no cache hit, perform AI conversion
4. **Cache Storage**: Store result in both backend and local cache

### 3. Cache Hit/Miss Logging
- `[DB CACHE HIT]`: Backend cache found
- `[DB CACHE MISS]`: Backend cache not found
- `[LOCAL CACHE HIT]`: Local cache found
- `[LOCAL CACHE MISS]`: Local cache not found

## Performance Benefits

### Conversion Time Reduction
- **Cache Hit**: ~1ms (immediate retrieval)
- **Cache Miss**: 2-10 seconds (AI processing time)

### Cost Optimization
- Reduces AI API calls
- Saves on API costs
- Improves user experience

## Cache Management

### Automatic Cache Population
- Cache is populated automatically during conversions
- No manual intervention required
- Transparent to end users

### Cache Invalidation
- Cache is based on content hash
- Different AI models have separate cache entries
- Content changes automatically invalidate cache

## Implementation Details

### File Locations
- **Main Cache Logic**: `src/utils/conversionUtils.ts`
- **Component Integration**: `src/utils/componentUtilswithlangchain.ts`
- **Database Schema**: `src/integrations/supabase/types.ts`
- **UI Controls**: `src/pages/Dashboard.tsx`

### Key Functions
```typescript
// Cache control
export function isCacheEnabled()
export function setCacheEnabled(enabled: boolean)

// Cache operations
export function getCachedConversion(code: string, model: string)
export function setCachedConversion(code: string, model: string, result: any)
export async function getBackendCachedConversion(hash: string, ai_model: string)
export async function setBackendCachedConversion(hash: string, original_code: string, ai_model: string, converted_code: string, metrics: any, issues: any, data_type_mapping: any)
```

## Monitoring and Debugging

### Cache Status Indicators
- Cache hits/misses are logged to console
- Performance metrics include cache status
- UI shows cache enabled/disabled state

### Debug Information
- Cache key generation is logged
- Cache storage operations are tracked
- Performance impact is measured

## Best Practices

### Cache Usage
- Enable cache for production environments
- Monitor cache hit rates
- Review cache performance regularly

### Cache Configuration
- Set appropriate cache timeouts
- Monitor cache storage usage
- Implement cache cleanup strategies

## Troubleshooting

### Common Issues
1. **Cache Not Working**: Check if cache is enabled
2. **Stale Cache**: Verify cache invalidation logic
3. **Performance Issues**: Monitor cache hit rates

### Debug Steps
1. Check console logs for cache operations
2. Verify cache configuration
3. Test cache with simple conversions
4. Monitor database cache table

## Future Enhancements

### Planned Improvements
- Cache expiration policies
- Cache size management
- Advanced cache analytics
- Cache sharing between users 