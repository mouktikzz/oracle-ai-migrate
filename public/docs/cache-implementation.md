# Cache Implementation

## Overview

The Cache Implementation provides a robust, multi-layered caching system designed to optimize performance and reduce costs for the Sybase to Oracle migration tool. It implements both in-memory and persistent caching strategies to ensure fast response times and efficient resource utilization.

## Architecture

### Multi-Layer Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                       │
├─────────────────────────────────────────────────────────────┤
│                    Browser Cache Layer                      │
│              (SessionStorage, LocalStorage)                 │
├─────────────────────────────────────────────────────────────┤
│                    In-Memory Cache Layer                    │
│              (JavaScript Map/Set Objects)                   │
├─────────────────────────────────────────────────────────────┤
│                    Persistent Cache Layer                   │
│              (Supabase Database Storage)                    │
├─────────────────────────────────────────────────────────────┤
│                    AI Model API Layer                       │
│              (Gemini, OpenAI, Custom Models)                │
└─────────────────────────────────────────────────────────────┘
```

### Cache Flow
1. **Client Request**: User uploads file for conversion
2. **Browser Cache Check**: Check local storage for cached result
3. **In-Memory Check**: Check application memory cache
4. **Database Check**: Query persistent cache in Supabase
5. **AI Processing**: If not cached, process with AI model
6. **Cache Storage**: Store result in all cache layers
7. **Response**: Return cached or fresh result

## Features

### 🚀 Performance Optimization
- **Multi-Layer Caching**: Browser, memory, and database layers
- **Intelligent Cache Keys**: Content-based hashing for accurate matching
- **Cache Warming**: Pre-load frequently accessed conversions
- **LRU Eviction**: Least Recently Used cache replacement

### 💾 Persistent Storage
- **Database Backend**: Supabase PostgreSQL for reliable storage
- **Content Hashing**: SHA-256 hashing for unique cache keys
- **Metadata Storage**: Store conversion parameters and timestamps
- **Cache Analytics**: Track hit rates and performance metrics

### ⚙️ Configuration Management
- **Dynamic Toggle**: Enable/disable caching at runtime
- **Cache Size Limits**: Configurable memory and storage limits
- **TTL Support**: Time-based cache expiration
- **Selective Caching**: Cache specific file types or AI models

### 🔍 Cache Management
- **Cache Invalidation**: Manual and automatic cache clearing
- **Cache Statistics**: Monitor hit rates and performance
- **Cache Warming**: Pre-load common conversions
- **Cache Export/Import**: Backup and restore cache data

## Implementation Details

### Cache Key Generation

```typescript
interface CacheKey {
  contentHash: string;      // SHA-256 hash of file content
  aiModel: string;          // AI model used for conversion
  customPrompt?: string;    // Optional custom prompt
  version: string;          // Cache version for invalidation
}

function generateCacheKey(
  content: string, 
  aiModel: string, 
  customPrompt?: string
): string {
  const normalizedContent = content.replace(/\r\n/g, '\n').trim();
  const contentHash = sha256(normalizedContent);
  const promptHash = customPrompt ? sha256(customPrompt) : '';
  
  return `${contentHash}_${aiModel}_${promptHash}_v1.0`;
}
```

### Cache Storage Structure

#### Database Schema
```sql
CREATE TABLE conversion_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  original_content TEXT NOT NULL,
  converted_code TEXT NOT NULL,
  ai_model VARCHAR(100) NOT NULL,
  custom_prompt TEXT,
  issues JSONB,
  data_type_mapping JSONB,
  performance_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_count INTEGER DEFAULT 1,
  file_size INTEGER,
  processing_time_ms INTEGER
);

CREATE INDEX idx_cache_key ON conversion_cache(cache_key);
CREATE INDEX idx_ai_model ON conversion_cache(ai_model);
CREATE INDEX idx_created_at ON conversion_cache(created_at);
CREATE INDEX idx_accessed_at ON conversion_cache(accessed_at);
```

### Cache Operations

#### Store Conversion Result
```typescript
async function storeConversionResult(
  cacheKey: string,
  result: ConversionResult,
  aiModel: string,
  customPrompt?: string
): Promise<void> {
  const cacheEntry = {
    cache_key: cacheKey,
    original_content: result.originalFile.content,
    converted_code: result.convertedCode,
    ai_model: aiModel,
    custom_prompt: customPrompt,
    issues: result.issues,
    data_type_mapping: result.dataTypeMapping,
    performance_metrics: result.performance,
    file_size: result.originalFile.content.length,
    processing_time_ms: result.performance?.conversionTimeMs || 0
  };

  await supabase
    .from('conversion_cache')
    .upsert(cacheEntry, { onConflict: 'cache_key' });
}
```

#### Retrieve Cached Result
```typescript
async function getCachedConversion(
  cacheKey: string
): Promise<ConversionResult | null> {
  const { data, error } = await supabase
    .from('conversion_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .single();

  if (error || !data) {
    return null;
  }

  // Update access statistics
  await supabase
    .from('conversion_cache')
    .update({
      accessed_at: new Date().toISOString(),
      access_count: data.access_count + 1
    })
    .eq('cache_key', cacheKey);

  return {
    id: data.id,
    originalFile: {
      name: 'cached_file.sql',
      content: data.original_content,
      type: 'sql'
    },
    convertedCode: data.converted_code,
    aiGeneratedCode: data.converted_code,
    issues: data.issues || [],
    dataTypeMapping: data.data_type_mapping || [],
    performance: {
      ...data.performance_metrics,
      conversionTimeMs: 1 // Cached results are instant
    },
    status: 'success' as const,
    explanations: []
  };
}
```

## Configuration

### Environment Variables

```bash
# Cache Configuration
VITE_CACHE_ENABLED=true
VITE_CACHE_TTL_HOURS=24
VITE_CACHE_MAX_SIZE_MB=100
VITE_CACHE_CLEANUP_INTERVAL_HOURS=6

# Database Cache Settings
VITE_DB_CACHE_ENABLED=true
VITE_DB_CACHE_TTL_DAYS=30
VITE_DB_CACHE_MAX_ENTRIES=10000

# Memory Cache Settings
VITE_MEMORY_CACHE_ENABLED=true
VITE_MEMORY_CACHE_MAX_ENTRIES=1000
VITE_MEMORY_CACHE_TTL_MINUTES=60

# Browser Cache Settings
VITE_BROWSER_CACHE_ENABLED=true
VITE_BROWSER_CACHE_TTL_HOURS=2
VITE_BROWSER_CACHE_MAX_SIZE_MB=10
```

### Cache Configuration Interface

```typescript
interface CacheConfig {
  enabled: boolean;
  layers: {
    browser: BrowserCacheConfig;
    memory: MemoryCacheConfig;
    database: DatabaseCacheConfig;
  };
  ttl: {
    browser: number;    // Hours
    memory: number;     // Minutes
    database: number;   // Days
  };
  limits: {
    browser: number;    // MB
    memory: number;     // Entries
    database: number;   // Entries
  };
  cleanup: {
    interval: number;   // Hours
    enabled: boolean;
  };
}
```

## Usage

### Basic Cache Operations

#### Enable/Disable Caching
```typescript
import { setCacheEnabled, isCacheEnabled } from '@/utils/conversionUtils';

// Enable caching
setCacheEnabled(true);

// Check if caching is enabled
const enabled = isCacheEnabled();
console.log('Cache enabled:', enabled);
```

#### Manual Cache Management
```typescript
import { clearCache, getCacheStats } from '@/utils/conversionUtils';

// Clear all cache layers
await clearCache();

// Get cache statistics
const stats = await getCacheStats();
console.log('Cache hit rate:', stats.hitRate);
console.log('Total entries:', stats.totalEntries);
```

### Advanced Cache Operations

#### Cache Warming
```typescript
async function warmCache(commonFiles: CodeFile[]): Promise<void> {
  for (const file of commonFiles) {
    const cacheKey = generateCacheKey(file.content, 'gemini');
    const cached = await getCachedConversion(cacheKey);
    
    if (!cached) {
      // Pre-convert and cache
      const result = await convertSybaseToOracle(file, 'gemini');
      await storeConversionResult(cacheKey, result, 'gemini');
    }
  }
}
```

#### Selective Cache Invalidation
```typescript
async function invalidateCacheByModel(aiModel: string): Promise<void> {
  await supabase
    .from('conversion_cache')
    .delete()
    .eq('ai_model', aiModel);
}

async function invalidateCacheByDate(beforeDate: Date): Promise<void> {
  await supabase
    .from('conversion_cache')
    .delete()
    .lt('created_at', beforeDate.toISOString());
}
```

## Performance Monitoring

### Cache Metrics

#### Hit Rate Calculation
```typescript
interface CacheMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  storageUsage: number;
}

async function getCacheMetrics(): Promise<CacheMetrics> {
  const { data: cacheStats } = await supabase
    .from('conversion_cache')
    .select('access_count, processing_time_ms');

  const totalRequests = cacheStats?.reduce((sum, stat) => sum + stat.access_count, 0) || 0;
  const cacheHits = totalRequests;
  const cacheMisses = await getCacheMissCount();
  
  return {
    totalRequests: totalRequests + cacheMisses,
    cacheHits,
    cacheMisses,
    hitRate: (cacheHits / (totalRequests + cacheMisses)) * 100,
    averageResponseTime: 1, // Cached responses are instant
    memoryUsage: getMemoryCacheSize(),
    storageUsage: await getDatabaseCacheSize()
  };
}
```

### Performance Optimization

#### Cache Size Optimization
```typescript
async function optimizeCacheSize(): Promise<void> {
  // Remove old entries
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  
  await supabase
    .from('conversion_cache')
    .delete()
    .lt('created_at', cutoffDate.toISOString());

  // Remove least accessed entries
  const { data: leastAccessed } = await supabase
    .from('conversion_cache')
    .select('id')
    .order('access_count', { ascending: true })
    .limit(1000);

  if (leastAccessed) {
    const ids = leastAccessed.map(entry => entry.id);
    await supabase
      .from('conversion_cache')
      .delete()
      .in('id', ids);
  }
}
```

## Troubleshooting

### Common Issues

#### Cache Not Working
1. **Check Configuration**
   ```typescript
   console.log('Cache enabled:', isCacheEnabled());
   console.log('Cache config:', getCacheConfig());
   ```

2. **Verify Database Connection**
   ```typescript
   const { data, error } = await supabase
     .from('conversion_cache')
     .select('count')
     .limit(1);
   
   if (error) {
     console.error('Database cache error:', error);
   }
   ```

3. **Check Cache Keys**
   ```typescript
   const cacheKey = generateCacheKey(content, aiModel);
   console.log('Generated cache key:', cacheKey);
   ```

#### Performance Issues
1. **Monitor Cache Hit Rates**
   - Low hit rates indicate cache configuration issues
   - High miss rates suggest cache key generation problems

2. **Check Cache Size**
   - Large cache sizes can impact performance
   - Implement cache cleanup strategies

3. **Database Performance**
   - Monitor query performance
   - Ensure proper indexing
   - Consider cache partitioning

### Debugging Tools

#### Cache Debug Mode
```typescript
const DEBUG_CACHE = true;

function debugCache(operation: string, data: any): void {
  if (DEBUG_CACHE) {
    console.log(`[CACHE] ${operation}:`, data);
  }
}
```

#### Cache Health Check
```typescript
async function checkCacheHealth(): Promise<{
  browser: boolean;
  memory: boolean;
  database: boolean;
}> {
  return {
    browser: checkBrowserCache(),
    memory: checkMemoryCache(),
    database: await checkDatabaseCache()
  };
}
```

## Best Practices

### Cache Strategy
1. **Use Appropriate TTL**: Set TTL based on content volatility
2. **Monitor Hit Rates**: Aim for 80%+ cache hit rate
3. **Regular Cleanup**: Implement automated cache cleanup
4. **Size Limits**: Set reasonable cache size limits

### Performance Optimization
1. **Efficient Cache Keys**: Use fast hashing algorithms
2. **Batch Operations**: Group cache operations when possible
3. **Async Operations**: Use non-blocking cache operations
4. **Error Handling**: Gracefully handle cache failures

### Security Considerations
1. **Content Validation**: Validate cached content before use
2. **Access Control**: Implement proper cache access controls
3. **Data Privacy**: Ensure sensitive data is not cached
4. **Cache Poisoning**: Protect against malicious cache entries

## Future Enhancements

### Planned Features
- [ ] **Distributed Caching**: Redis integration for multi-server deployments
- [ ] **Cache Compression**: Compress cached content to save storage
- [ ] **Predictive Caching**: AI-powered cache warming
- [ ] **Cache Analytics**: Advanced analytics and reporting
- [ ] **Cache Synchronization**: Sync cache across multiple instances
- [ ] **Cache Versioning**: Support for multiple cache versions

### Advanced Capabilities
- [ ] **Cache Clustering**: Load-balanced cache distribution
- [ ] **Cache Replication**: Backup cache instances
- [ ] **Cache Migration**: Seamless cache data migration
- [ ] **Cache Monitoring**: Real-time cache health monitoring
- [ ] **Cache Optimization**: Automatic cache optimization

---

**Note**: The cache implementation significantly improves performance and reduces costs by avoiding redundant AI API calls. Proper cache management is essential for optimal system performance. 