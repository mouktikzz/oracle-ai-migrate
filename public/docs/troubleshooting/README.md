# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the Sybase to Oracle Migration Tool.

## 📚 Table of Contents

- [Common Issues](#common-issues)
- [Error Messages](#error-messages)
- [Performance Issues](#performance-issues)
- [Conversion Problems](#conversion-problems)
- [Authentication Issues](#authentication-issues)
- [Deployment Issues](#deployment-issues)
- [FAQ](#faq)

## 🔧 Common Issues

### File Upload Issues

#### Issue: Files not uploading or upload failing

**Symptoms:**
- Upload progress bar stuck
- "Upload failed" error messages
- Files not appearing in the file list

**Solutions:**

1. **Check file size limits:**
   ```typescript
   // Verify file size
   const maxSize = 10 * 1024 * 1024; // 10MB
   if (file.size > maxSize) {
     console.error(`File too large: ${file.size} bytes`);
   }
   ```

2. **Verify file types:**
   ```typescript
   const allowedTypes = ['.sql', '.sp', '.proc', '.ddl', '.func', '.trg'];
   const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
   if (!allowedTypes.includes(fileExtension)) {
     console.error(`Unsupported file type: ${fileExtension}`);
   }
   ```

3. **Check network connectivity:**
   ```bash
   # Test Supabase connection
   curl -I https://your-project.supabase.co/rest/v1/
   ```

4. **Clear browser cache and try again:**
   ```javascript
   // Clear local storage
   localStorage.clear();
   sessionStorage.clear();
   ```

#### Issue: Batch upload timing out

**Solutions:**

1. **Reduce batch size:**
   ```typescript
   // Split large batches
   const chunkSize = 10;
   const chunks = [];
   for (let i = 0; i < files.length; i += chunkSize) {
     chunks.push(files.slice(i, i + chunkSize));
   }
   ```

2. **Upload files sequentially:**
   ```typescript
   async function uploadSequentially(files: File[]) {
     const results = [];
     for (const file of files) {
       try {
         const result = await uploadFile(file);
         results.push(result);
       } catch (error) {
         console.error(`Failed to upload ${file.name}:`, error);
       }
     }
     return results;
   }
   ```

### AI Conversion Issues

#### Issue: AI conversion taking too long or timing out

**Symptoms:**
- Conversion stuck in "processing" state
- Timeout errors
- No response from AI service

**Solutions:**

1. **Check AI service status:**
   ```typescript
   // Test Gemini AI connection
   async function testAIConnection() {
     try {
       const response = await fetch('https://generativelanguage.googleapis.com/v1/models', {
         headers: {
           'Authorization': `Bearer ${GEMINI_API_KEY}`
         }
       });
       return response.ok;
     } catch (error) {
       console.error('AI service unavailable:', error);
       return false;
     }
   }
   ```

2. **Reduce code complexity:**
   ```sql
   -- Split large procedures into smaller ones
   -- Remove complex nested logic temporarily
   -- Test with simple examples first
   ```

3. **Retry with different AI model:**
   ```typescript
   const fallbackModels = ['gemini', 'default'];
   for (const model of fallbackModels) {
     try {
       const result = await convertCode(code, { aiModel: model });
       if (result.status === 'success') break;
     } catch (error) {
       console.error(`Model ${model} failed:`, error);
     }
   }
   ```

#### Issue: Poor conversion quality or incorrect results

**Solutions:**

1. **Add context to your code:**
   ```sql
   -- Add comments explaining business logic
   -- Include table schema information
   -- Document parameter purposes
   ```

2. **Use custom conversion rules:**
   ```typescript
   const customRules = [
     {
       pattern: /GETDATE\(\)/g,
       replacement: 'SYSDATE',
       description: 'Convert Sybase GETDATE() to Oracle SYSDATE'
     }
   ];
   ```

3. **Review and edit results manually:**
   ```typescript
   // Always validate converted code
   const validationResult = validateOracleCode(convertedCode);
   if (!validationResult.isValid) {
     console.warn('Manual review required:', validationResult.issues);
   }
   ```

### Database Connection Issues

#### Issue: Cannot connect to Oracle database

**Symptoms:**
- Connection timeout errors
- Authentication failures
- Network unreachable errors

**Solutions:**

1. **Verify connection parameters:**
   ```typescript
   const connectionTest = {
     host: 'your-oracle-host',
     port: 1521,
     service: 'ORCL',
     user: 'username',
     password: 'password'
   };
   
   // Test connection
   async function testConnection() {
     try {
       const connection = await oracledb.getConnection(connectionTest);
       console.log('Connection successful');
       await connection.close();
       return true;
     } catch (error) {
       console.error('Connection failed:', error.message);
       return false;
     }
   }
   ```

2. **Check network connectivity:**
   ```bash
   # Test port accessibility
   telnet your-oracle-host 1521
   
   # Test DNS resolution
   nslookup your-oracle-host
   ```

3. **Verify Oracle listener status:**
   ```sql
   -- Connect as DBA and check listener
   SELECT * FROM V$LISTENER_NETWORK;
   ```

## ❌ Error Messages

### Authentication Errors

#### Error: "Invalid JWT token"

**Cause:** Expired or malformed authentication token

**Solution:**
```typescript
// Refresh token
const { data, error } = await supabase.auth.refreshSession();
if (error) {
  // Redirect to login
  window.location.href = '/auth';
}
```

#### Error: "Insufficient permissions"

**Cause:** User doesn't have required role or permissions

**Solution:**
```typescript
// Check user role
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (!['admin', 'moderator'].includes(profile?.role)) {
  throw new Error('Admin access required');
}
```

### File Processing Errors

#### Error: "File too large"

**Cause:** File exceeds maximum size limit

**Solution:**
```typescript
// Compress or split large files
function splitSQLFile(content: string, maxSize: number): string[] {
  const chunks = [];
  let currentChunk = '';
  const lines = content.split('\n');
  
  for (const line of lines) {
    if ((currentChunk + line).length > maxSize) {
      chunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk += '\n' + line;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}
```

#### Error: "Unsupported file type"

**Cause:** File extension not in allowed list

**Solution:**
```typescript
// Map file extensions to types
const fileTypeMap = {
  '.txt': '.sql',
  '.syb': '.sql',
  '.procedure': '.proc',
  '.function': '.func'
};

function normalizeFileExtension(filename: string): string {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return fileTypeMap[ext] || ext;
}
```

### AI Service Errors

#### Error: "API quota exceeded"

**Cause:** Gemini AI rate limits reached

**Solution:**
```typescript
// Implement exponential backoff
async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) { // Rate limit
        const delay = Math.pow(2, retries) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

#### Error: "Invalid API key"

**Cause:** Incorrect or expired API key

**Solution:**
```typescript
// Validate API key
async function validateAPIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}
```

## 🐌 Performance Issues

### Slow Page Loading

**Symptoms:**
- Long initial page load times
- Large bundle sizes
- Slow component rendering

**Solutions:**

1. **Enable code splitting:**
   ```typescript
   // Lazy load components
   const AdminPanel = lazy(() => import('./pages/AdminPanel'));
   const ReportViewer = lazy(() => import('./components/ReportViewer'));
   
   // Use in routes
   <Route path="/admin" element={
     <Suspense fallback={<div>Loading...</div>}>
       <AdminPanel />
     </Suspense>
   } />
   ```

2. **Optimize bundle size:**
   ```bash
   # Analyze bundle
   npm run build
   npx vite-bundle-analyzer dist
   
   # Remove unused dependencies
   npm uninstall unused-package
   ```

3. **Enable caching:**
   ```typescript
   // Service worker for caching
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.register('/sw.js');
   }
   ```

### Slow AI Conversion

**Solutions:**

1. **Implement caching:**
   ```typescript
   const conversionCache = new Map();
   
   async function convertWithCache(code: string) {
     const cacheKey = hashCode(code);
     if (conversionCache.has(cacheKey)) {
       return conversionCache.get(cacheKey);
     }
     
     const result = await convertCode(code);
     conversionCache.set(cacheKey, result);
     return result;
   }
   ```

2. **Use batch processing:**
   ```typescript
   // Process multiple files together
   async function batchConvert(files: CodeFile[]) {
     const batches = chunkArray(files, 5); // Process 5 at a time
     const results = [];
     
     for (const batch of batches) {
       const batchResults = await Promise.all(
         batch.map(file => convertCode(file.content))
       );
       results.push(...batchResults);
     }
     
     return results;
   }
   ```

### Database Performance Issues

**Solutions:**

1. **Add database indexes:**
   ```sql
   -- Common query indexes
   CREATE INDEX idx_migrations_user_status ON migrations(user_id, status);
   CREATE INDEX idx_files_migration_processed ON migration_files(migration_id, processed_at);
   ```

2. **Optimize queries:**
   ```typescript
   // Use select specific columns
   const { data } = await supabase
     .from('migrations')
     .select('id, name, status, created_at') // Only needed columns
     .eq('user_id', userId)
     .limit(20);
   ```

3. **Use pagination:**
   ```typescript
   // Implement pagination
   async function getPaginatedResults(page: number, pageSize: number = 20) {
     const from = page * pageSize;
     const to = from + pageSize - 1;
     
     return await supabase
       .from('migrations')
       .select('*')
       .range(from, to);
   }
   ```

## 🔄 Conversion Problems

### Syntax Errors in Converted Code

**Issue:** Generated Oracle code has syntax errors

**Solutions:**

1. **Post-processing validation:**
   ```typescript
   function validateOracleCode(code: string): ValidationResult {
     const errors = [];
     
     // Check for common syntax issues
     if (code.includes('@')) {
       errors.push('Sybase parameter syntax detected (@param)');
     }
     
     if (!code.includes('CREATE OR REPLACE')) {
       errors.push('Missing CREATE OR REPLACE syntax');
     }
     
     return { isValid: errors.length === 0, errors };
   }
   ```

2. **Custom post-processing rules:**
   ```typescript
   function applyPostProcessingRules(code: string): string {
     return code
       .replace(/@(\w+)/g, 'p_$1') // Fix parameter names
       .replace(/\[\[/g, '/*') // Fix comment syntax
       .replace(/\]\]/g, '*/')
       .replace(/GO\s*$/gm, '/'); // Fix batch terminators
   }
   ```

### Incomplete Conversions

**Issue:** Some parts of code not converted

**Solutions:**

1. **Break down complex procedures:**
   ```sql
   -- Original complex procedure
   CREATE PROCEDURE ComplexProc AS
   BEGIN
     -- Split into multiple smaller procedures
     EXEC SubProc1;
     EXEC SubProc2;
     EXEC SubProc3;
   END
   ```

2. **Add explicit conversion hints:**
   ```sql
   -- Add comments to guide AI
   /* CONVERT: This is a stored procedure that calculates totals */
   CREATE PROCEDURE CalculateTotals
   /* PARAMETERS: @CustomerID should be NUMBER */
   @CustomerID INT
   AS
   BEGIN
     /* LOGIC: Sum all orders for customer */
     SELECT SUM(Amount) FROM Orders WHERE CustomerID = @CustomerID
   END
   ```

### Function Mapping Issues

**Issue:** Sybase functions not properly converted to Oracle equivalents

**Solutions:**

1. **Custom function mappings:**
   ```typescript
   const functionMappings = {
     'GETDATE()': 'SYSDATE',
     'ISNULL': 'NVL',
     'LEN': 'LENGTH',
     'CHARINDEX': 'INSTR',
     'STUFF': 'REPLACE',
     'PATINDEX': 'REGEXP_INSTR'
   };
   
   function applyFunctionMappings(code: string): string {
     let result = code;
     for (const [sybaseFunc, oracleFunc] of Object.entries(functionMappings)) {
       result = result.replace(new RegExp(sybaseFunc, 'gi'), oracleFunc);
     }
     return result;
   }
   ```

## 👤 Authentication Issues

### Login Problems

**Issue:** Cannot sign in or stay signed in

**Solutions:**

1. **Clear authentication state:**
   ```typescript
   // Clear all auth data
   await supabase.auth.signOut();
   localStorage.removeItem('supabase.auth.token');
   sessionStorage.clear();
   ```

2. **Check session validity:**
   ```typescript
   async function checkSession() {
     const { data: { session }, error } = await supabase.auth.getSession();
     
     if (error || !session) {
       console.log('No valid session, redirecting to login');
       window.location.href = '/auth';
       return false;
     }
     
     return true;
   }
   ```

3. **Handle token refresh:**
   ```typescript
   // Auto-refresh tokens
   supabase.auth.onAuthStateChange(async (event, session) => {
     if (event === 'TOKEN_REFRESHED') {
       console.log('Token refreshed');
     } else if (event === 'SIGNED_OUT') {
       window.location.href = '/auth';
     }
   });
   ```

### Permission Errors

**Issue:** User cannot access certain features

**Solutions:**

1. **Verify user role:**
   ```typescript
   async function checkUserRole(requiredRole: string) {
     const { data: profile } = await supabase
       .from('profiles')
       .select('role')
       .eq('id', user.id)
       .single();
     
     const roleHierarchy = { user: 0, moderator: 1, admin: 2 };
     const userLevel = roleHierarchy[profile?.role] || 0;
     const requiredLevel = roleHierarchy[requiredRole] || 0;
     
     return userLevel >= requiredLevel;
   }
   ```

## 🚀 Deployment Issues

### Build Failures

**Issue:** Application fails to build

**Solutions:**

1. **Check dependencies:**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Update dependencies
   npm audit fix
   ```

2. **Fix TypeScript errors:**
   ```bash
   # Check TypeScript compilation
   npx tsc --noEmit
   
   # Fix specific errors
   npx tsc --listFiles | grep error
   ```

3. **Environment variables:**
   ```bash
   # Verify all required env vars are set
   echo "Checking environment variables..."
   [ -z "$VITE_SUPABASE_URL" ] && echo "VITE_SUPABASE_URL is missing"
   [ -z "$VITE_SUPABASE_ANON_KEY" ] && echo "VITE_SUPABASE_ANON_KEY is missing"
   ```

### Runtime Errors in Production

**Solutions:**

1. **Enable error tracking:**
   ```typescript
   // Add error boundary
   class ErrorBoundary extends React.Component {
     constructor(props) {
       super(props);
       this.state = { hasError: false };
     }
   
     static getDerivedStateFromError(error) {
       return { hasError: true };
     }
   
     componentDidCatch(error, errorInfo) {
       console.error('Error caught by boundary:', error, errorInfo);
       // Send to error tracking service
     }
   
     render() {
       if (this.state.hasError) {
         return <h1>Something went wrong.</h1>;
       }
       return this.props.children;
     }
   }
   ```

2. **Add health checks:**
   ```typescript
   // Health check endpoint
   export async function healthCheck() {
     const checks = {
       database: await testDatabaseConnection(),
       ai_service: await testAIService(),
       storage: await testStorageAccess(),
     };
     
     const healthy = Object.values(checks).every(check => check.status === 'ok');
     
     return {
       status: healthy ? 'healthy' : 'unhealthy',
       checks,
       timestamp: new Date().toISOString(),
     };
   }
   ```

## ❓ FAQ

### General Questions

**Q: What file types are supported?**
A: The tool supports `.sql`, `.sp`, `.proc`, `.ddl`, `.func`, and `.trg` files. Other text files can be uploaded but may require manual conversion.

**Q: Is there a file size limit?**
A: Yes, individual files are limited to 10MB. For larger files, consider splitting them into smaller procedures or functions.

**Q: How accurate is the AI conversion?**
A: Accuracy varies by code complexity. Simple procedures typically achieve 90%+ accuracy, while complex code may require manual review and adjustment.

**Q: Can I customize the conversion rules?**
A: Yes, you can add custom conversion rules through the settings panel or by using the API.

### Technical Questions

**Q: Which Oracle versions are supported?**
A: The tool targets Oracle 11g and higher. Specify your target version in the conversion options for best results.

**Q: Can I use this tool offline?**
A: No, the tool requires an internet connection for AI processing and database operations.

**Q: Is my code data secure?**
A: Yes, all files are encrypted at rest and in transit. See our security documentation for details.

**Q: Can I integrate this with CI/CD pipelines?**
A: Yes, use our API or CLI tools for automated integration. See the API documentation for examples.

### Troubleshooting Questions

**Q: What if the AI conversion fails?**
A: Try reducing code complexity, using the default model instead of Gemini, or breaking large procedures into smaller ones.

**Q: How do I report a bug?**
A: Use the in-app feedback form or contact support with detailed steps to reproduce the issue.

**Q: Can I get help with complex migrations?**
A: Yes, professional services are available for complex enterprise migrations. Contact our support team for details.

For additional help, contact our support team or check the community forum for peer assistance.