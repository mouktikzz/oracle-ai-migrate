import { ConversionResult, CodeFile, ConversionIssue, DataTypeMapping } from '@/types';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../integrations/supabase/client';

let cacheEnabled = true;

// Get API key safely for browser environment
const getApiKey = () => {
  if (typeof window !== 'undefined') {
    // Browser environment - try to get from window or use empty string
    return (window as any).__NEXT_PUBLIC_GOOGLE_API_KEY || '';
  }
  // Server environment
  return process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
};

export function isCacheEnabled() {
  return cacheEnabled;
}

export function setCacheEnabled(enabled: boolean) {
  cacheEnabled = enabled;
}

// Enhanced AI-based code conversion with comprehensive Sybase to Oracle rules
export const convertSybaseToOracle = async (
  file: CodeFile,
  aiModel: string = 'default',
  customPrompt?: string,
  skipExplanation: boolean = true
): Promise<ConversionResult> => {
  // Normalize content for cache key
  const normalizedContent = file.content.replace(/\r\n/g, '\n').trim();
  const hash = getConversionCacheKey(normalizedContent, aiModel);

  // 1. Check backend (DB) cache
  if (cacheEnabled) {
    const backendCached = await getBackendCachedConversion(hash, aiModel);
    if (backendCached) {
      console.log('[DB CACHE HIT]', file.name);
      const result = {
        id: backendCached.id,
        originalFile: file,
        convertedCode: backendCached.converted_code,
        aiGeneratedCode: '',
        issues: (backendCached.issues as unknown as ConversionIssue[]) || [],
        dataTypeMapping: (backendCached.data_type_mapping as unknown as DataTypeMapping[]) || [],
        performance: backendCached.metrics as any,
        status: 'success' as const,
        explanations: [],
      };
      if (result.performance && typeof result.performance === 'object') {
        (result.performance as any).conversionTimeMs = 1;
      }
      return result;
    } else {
      console.log('[DB CACHE MISS]', file.name);
    }
  }

  // 2. Check local cache
  let cached = null;
  if (cacheEnabled) {
    cached = getCachedConversion(normalizedContent, aiModel);
  }
  if (cached) {
    console.log('[LOCAL CACHE HIT]', file.name);
    const result = { ...cached };
    if (result.performance) {
      result.performance.conversionTimeMs = 1;
    }
    return result;
  } else {
    if (cacheEnabled) console.log('[LOCAL CACHE MISS]', file.name);
  }

  console.log(`[CONVERT] Starting conversion for file: ${file.name} with model: ${aiModel}`);
  const startTime = Date.now();

  // Extract data type mappings from original code
  const dataTypeMapping = extractDataTypeMappings(file.content);

  // Analyze code complexity before conversion
  const originalComplexity = analyzeCodeComplexity(file.content);

  // Initialize Google Generative AI only when needed
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Google API key not found. Please set NEXT_PUBLIC_GOOGLE_API_KEY environment variable.');
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);

  // Use custom prompt if provided, otherwise use default
  const prompt = customPrompt && customPrompt.trim().length > 0
    ? `${customPrompt}\n\nSybase code:\n${file.content}`
    : `Convert the following Sybase SQL code to Oracle PL/SQL. Ensure 100% accuracy and best practices. Output only the converted Oracle code.\n\nSybase code:\n${file.content}`;
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  let convertedCode = '';
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    convertedCode = response.text().replace(/^```[a-zA-Z]*|```$/g, '').trim();
  } catch (e) {
    console.error(`[CONVERT] Error converting file: ${file.name}`, e);
    throw new Error(`Conversion failed for file: ${file.name}`);
  }

  const conversionTime = Date.now() - startTime;

  // Analyze converted code complexity
  const convertedComplexity = analyzeCodeComplexity(convertedCode);

  // Generate quantitative performance analysis
  const performanceMetrics = generatePerformanceMetrics(
    originalComplexity,
    convertedComplexity,
    conversionTime,
    file.content,
    convertedCode
  );
  console.log('[PERF METRICS]', file.name, performanceMetrics);

  // Generate issues based on quantitative analysis
  const issues: ConversionIssue[] = generateQuantitativeIssues(
    originalComplexity,
    convertedComplexity,
    file.content,
    convertedCode
  );

  // Optionally skip AI explanation for speed
  let explanations: string[] = [];
  if (!skipExplanation) {
    try {
      const explanationPrompt = `Explain the main changes and rationale for converting the following Sybase SQL code to Oracle PL/SQL. Highlight any complex rewrites, data type changes, and best practices applied.\n\nSybase code:\n${file.content}\n\nOracle code:\n${convertedCode}`;
      const explanationResult = await model.generateContent(explanationPrompt);
      const explanationResponse = await explanationResult.response;
      const explanationText = explanationResponse.text().replace(/^```[a-zA-Z]*|```$/g, '').trim();
      explanations = [explanationText];
    } catch (e) {
      explanations = ["Explanation not available due to an error."];
    }
  }

  console.log(`[CONVERT] Success for file: ${file.name} in ${conversionTime}ms`);
  const result: ConversionResult = {
    id: uuidv4(),
    originalFile: file,
    convertedCode,
    aiGeneratedCode: '',
    issues,
    dataTypeMapping,
    performance: performanceMetrics,
    status: issues.some(i => i.severity === 'error') ? 'error' : 
            issues.length > 0 ? 'warning' : 'success',
    explanations,
  };

  // Save to cache with normalized content
  if (cacheEnabled) setCachedConversion(normalizedContent, aiModel, result);
  // Save to backend cache
  if (cacheEnabled) await setBackendCachedConversion(
    hash,
    normalizedContent,
    aiModel,
    result.convertedCode,
    result.performance,
    result.issues,
    result.dataTypeMapping
  );
  return result;
};

// Convert multiple files in parallel with support for customPrompt and skipExplanation
export const convertMultipleFiles = async (
  files: CodeFile[],
  aiModel: string = 'default',
  customPrompt?: string,
  skipExplanation: boolean = true
): Promise<ConversionResult[]> => {
  // Map each file to a conversion promise using the improved convertSybaseToOracle
  const conversionPromises = files.map(file =>
    convertSybaseToOracle(file, aiModel, customPrompt, skipExplanation)
  );
  return Promise.all(conversionPromises);
};

// Helper: extract data type mappings from code
const extractDataTypeMappings = (code: string): DataTypeMapping[] => {
  const mappings: DataTypeMapping[] = [];
  const sybaseTypes = [
    // Numeric types
    { pattern: /\bint\b/gi, oracle: 'NUMBER(10)', desc: 'Integer type' },
    { pattern: /\bsmallint\b/gi, oracle: 'NUMBER(5)', desc: 'Small integer type' },
    { pattern: /\bbigint\b/gi, oracle: 'NUMBER(19)', desc: 'Big integer type' },
    { pattern: /\btinyint\b/gi, oracle: 'NUMBER(3)', desc: 'Tiny integer type' },
    { pattern: /\bdecimal\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, oracle: 'NUMBER($1,$2)', desc: 'Decimal with precision and scale' },
    { pattern: /\bnumeric\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, oracle: 'NUMBER($1,$2)', desc: 'Numeric with precision and scale' },
    { pattern: /\bfloat\b/gi, oracle: 'BINARY_FLOAT', desc: 'Floating point number' },
    { pattern: /\breal\b/gi, oracle: 'BINARY_FLOAT', desc: 'Real number' },
    { pattern: /\bmoney\b/gi, oracle: 'NUMBER(19,4)', desc: 'Money type' },
    { pattern: /\bsmallmoney\b/gi, oracle: 'NUMBER(10,4)', desc: 'Small money type' },
    
    // Character types
    { pattern: /\bchar\s*\(\s*(\d+)\s*\)/gi, oracle: 'CHAR($1)', desc: 'Fixed-length character string' },
    { pattern: /\bvarchar\s*\(\s*(\d+)\s*\)/gi, oracle: 'VARCHAR2($1)', desc: 'Variable-length character string' },
    { pattern: /\bnchar\s*\(\s*(\d+)\s*\)/gi, oracle: 'NCHAR($1)', desc: 'Fixed-length Unicode string' },
    { pattern: /\bnvarchar\s*\(\s*(\d+)\s*\)/gi, oracle: 'NVARCHAR2($1)', desc: 'Variable-length Unicode string' },
    { pattern: /\btext\b/gi, oracle: 'CLOB', desc: 'Large text data' },
    { pattern: /\bntext\b/gi, oracle: 'NCLOB', desc: 'Large Unicode text data' },
    
    // Binary types
    { pattern: /\bbinary\s*\(\s*(\d+)\s*\)/gi, oracle: 'RAW($1)', desc: 'Fixed-length binary data' },
    { pattern: /\bvarbinary\s*\(\s*(\d+)\s*\)/gi, oracle: 'RAW($1)', desc: 'Variable-length binary data' },
    { pattern: /\bimage\b/gi, oracle: 'BLOB', desc: 'Large binary data' },
    
    // Date/Time types
    { pattern: /\bdatetime\b/gi, oracle: 'TIMESTAMP', desc: 'Date and time' },
    { pattern: /\bsmalldatetime\b/gi, oracle: 'TIMESTAMP', desc: 'Small date and time' },
    { pattern: /\bdate\b/gi, oracle: 'DATE', desc: 'Date only' },
    { pattern: /\btime\b/gi, oracle: 'TIMESTAMP', desc: 'Time only' },
    { pattern: /\btimestamp\b/gi, oracle: 'TIMESTAMP', desc: 'Timestamp' },
    
    // Boolean type
    { pattern: /\bbit\b/gi, oracle: 'NUMBER(1)', desc: 'Boolean type (0 or 1)' },
    
    // Other types
    { pattern: /\buniqueidentifier\b/gi, oracle: 'RAW(16)', desc: 'Unique identifier' },
    { pattern: /\bsql_variant\b/gi, oracle: 'VARCHAR2(4000)', desc: 'SQL variant type' },
    { pattern: /\bxml\b/gi, oracle: 'XMLTYPE', desc: 'XML data type' }
  ];

  const foundTypes = new Set<string>();
  
  sybaseTypes.forEach(({ pattern, oracle, desc }) => {
    const matches = code.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const sybaseType = match.toLowerCase();
        if (!foundTypes.has(sybaseType)) {
          foundTypes.add(sybaseType);
          
          // Handle parameterized types
          let oracleType = oracle;
          if (match.includes('(')) {
            const params = match.match(/\(([^)]+)\)/);
            if (params) {
              oracleType = oracle.replace(/\$(\d+)/g, (_, index) => {
                const parts = params[1].split(',').map(p => p.trim());
                return parts[parseInt(index) - 1] || '255';
              });
            }
          }
          
          mappings.push({
            sybaseType: match,
            oracleType: oracleType,
            description: desc
          });
        }
      });
    }
  });

  return mappings;
};

// Analyze code complexity quantitatively
const analyzeCodeComplexity = (code: string) => {
  // Remove trailing blank lines for consistent line counting
  const cleanedCode = code.replace(/\n+$/, '');
  const lines = cleanedCode.split('\n');
  const totalLines = lines.length;
  const commentLines = lines.filter(line => line.trim().startsWith('--') || line.trim().startsWith('/*')).length;
  const emptyLines = lines.filter(line => line.trim() === '').length;
  const codeLines = totalLines - commentLines - emptyLines;
  
  // Calculate cyclomatic complexity (simplified)
  const controlStructures = (code.match(/\b(if|while|for|case|when|loop)\b/gi) || []).length;
  const functions = (code.match(/\b(create|procedure|function|trigger)\b/gi) || []).length;
  const complexity = controlStructures + functions + 1;
  
  // Custom maintainability index: more sensitive, not stuck at 100
  let maintainabilityIndex = 100;
  maintainabilityIndex -= (complexity - 1) * 2;
  maintainabilityIndex -= Math.max(0, codeLines - 10) * 1; // start penalizing after 10 lines
  maintainabilityIndex -= (commentLines < codeLines * 0.15 ? 15 : 0); // require 15% comments
  maintainabilityIndex = Math.max(0, Math.min(100, Math.round(maintainabilityIndex)));
  return {
    totalLines,
    codeLines,
    commentLines,
    emptyLines,
    controlStructures,
    functions,
    cyclomaticComplexity: complexity,
    maintainabilityIndex,
    commentRatio: commentLines / totalLines,
    codeDensity: codeLines / totalLines
  };
};

// Analyze loops in code
const analyzeLoops = (code: string) => {
  const loopPatterns = [
    /\bwhile\s+/gi,
    /\bfor\s+/gi,
    /\bloop\b/gi,
    /\bcursor\s+for\s+/gi,
    /\bopen\s+.*\s+for\s+/gi
  ];
  
  let totalLoops = 0;
  loopPatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) {
      totalLoops += matches.length;
    }
  });
  
  return totalLoops;
};

// Generate quantitative performance metrics
const generatePerformanceMetrics = (
  originalComplexity: any,
  convertedComplexity: any,
  conversionTime: number,
  originalCode: string,
  convertedCode: string
) => {
  // Use cyclomatic complexity for improvement calculation, allow negative values
  const improvementPercentage = Math.round(
    ((originalComplexity.cyclomaticComplexity - convertedComplexity.cyclomaticComplexity) / originalComplexity.cyclomaticComplexity) * 100
  );
  
  // Calculate lines reduced
  const originalLines = originalComplexity.totalLines;
  const convertedLines = convertedComplexity.totalLines;
  const linesReduced = originalLines - convertedLines;

  // Calculate loops reduced
  const originalLoops = analyzeLoops(originalCode);
  const convertedLoops = analyzeLoops(convertedCode);
  const loopsReduced = originalLoops - convertedLoops;

  // Calculate complexity increase
  const complexityIncrease = Math.max(0, convertedComplexity.cyclomaticComplexity - originalComplexity.cyclomaticComplexity);
  const linesIncrease = Math.max(0, convertedLines - originalLines);
  const loopsIncrease = Math.max(0, convertedLoops - originalLoops);

  // Performance score: start from maintainability index, penalize increases (much harsher)
  let performanceScore = convertedComplexity.maintainabilityIndex;
  performanceScore -= complexityIncrease * 10; // much harsher penalty
  performanceScore -= linesIncrease * 2;      // much harsher penalty
  performanceScore -= loopsIncrease * 10;     // much harsher penalty
  // Remove forced low score:
  // if (complexityIncrease > 0 || linesIncrease > 0 || loopsIncrease > 0) {
  //   performanceScore = 40; // force low score if any increase
  // }
  performanceScore = Math.max(0, Math.min(100, Math.round(performanceScore)));

  const recommendations = [];
  
  if (convertedComplexity.cyclomaticComplexity > 10) {
    recommendations.push('Consider breaking down complex procedures into smaller functions');
  }
  
  if (convertedComplexity.commentRatio < 0.1) {
    recommendations.push('Add more comments to improve code maintainability');
  }
  
  if (convertedComplexity.codeLines > 100) {
    recommendations.push('Consider modularizing large code blocks');
  }
  
  // Add specific recommendations based on performance metrics
  if (linesReduced > 0) {
    recommendations.push(`Code optimization: ${linesReduced} lines reduced`);
  }
  
  if (loopsReduced > 0) {
    recommendations.push(`Loop optimization: ${loopsReduced} loops reduced`);
  }
  
  return {
    originalComplexity: originalComplexity.cyclomaticComplexity,
    convertedComplexity: convertedComplexity.cyclomaticComplexity,
    improvementPercentage, // allow negative values
    conversionTimeMs: conversionTime,
    performanceScore,
    maintainabilityIndex: convertedComplexity.maintainabilityIndex,
    // Enhanced metrics
    linesReduced: Math.max(0, linesReduced),
    loopsReduced: Math.max(0, loopsReduced),
    originalLines,
    convertedLines,
    originalLoops,
    convertedLoops,
    codeQuality: {
      totalLines: convertedComplexity.totalLines,
      codeLines: convertedComplexity.codeLines,
      commentRatio: Math.round(convertedComplexity.commentRatio * 100),
      complexityLevel: convertedComplexity.cyclomaticComplexity > 10 ? 'High' : convertedComplexity.cyclomaticComplexity > 5 ? 'Medium' : 'Low' as 'Low' | 'Medium' | 'High'
    },
    recommendations,
    // Legacy/DB compatibility keys
    score: performanceScore,
    maintainability: convertedComplexity.maintainabilityIndex,
    orig_complexity: originalComplexity.cyclomaticComplexity,
    conv_complexity: convertedComplexity.cyclomaticComplexity,
    improvement: improvementPercentage,
    lines_reduced: Math.max(0, linesReduced),
    loops_reduced: Math.max(0, loopsReduced),
    time_ms: conversionTime,
  };
};

// Generate issues based on quantitative analysis
const generateQuantitativeIssues = (
  originalComplexity: any,
  convertedComplexity: any,
  originalCode: string,
  convertedCode: string
): ConversionIssue[] => {
  const issues: ConversionIssue[] = [];
  
  if (convertedComplexity.cyclomaticComplexity > 15) {
    issues.push({
      id: uuidv4(),
      lineNumber: 1,
      description: `High cyclomatic complexity (${convertedComplexity.cyclomaticComplexity}). Consider refactoring to improve maintainability.`,
      severity: 'warning',
      originalCode: 'Complex procedure',
      suggestedFix: 'Break down into smaller functions'
    });
  }
  
  if (convertedComplexity.maintainabilityIndex < 50) {
    issues.push({
      id: uuidv4(),
      lineNumber: 1,
      description: `Low maintainability index (${convertedComplexity.maintainabilityIndex}/100). Code may be difficult to maintain.`,
      severity: 'warning',
      originalCode: 'Low maintainability',
      suggestedFix: 'Refactor code structure and add documentation'
    });
  }
  
  return issues;
};

export { analyzeCodeComplexity, generatePerformanceMetrics };

export const generateConversionReport = (results: ConversionResult[]): string => {
  const successCount = results.filter(r => r.status === 'success').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  
  // Calculate performance metrics
  const totalLinesReduced = results.reduce((sum, result) => 
    sum + (result.performance?.linesReduced || 0), 0
  );
  const totalLoopsReduced = results.reduce((sum, result) => 
    sum + (result.performance?.loopsReduced || 0), 0
  );
  const totalConversionTime = results.reduce((sum, result) => 
    sum + (result.performance?.conversionTimeMs || 0), 0
  );
  const averageConversionTime = results.length > 0 ? totalConversionTime / results.length : 0;
  
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
  
  return `
# 🚀 Code Conversion Report

**Generated:** ${new Date().toLocaleString()}

---

## 📊 Summary
- **Total Files:** ${results.length}
- **Successful:** ${successCount}
- **Warnings:** ${warningCount}
- **Errors:** ${errorCount}

---

## 🏆 Performance Metrics
| Metric                | Value |
|-----------------------|-------|
| 🟩 **Total Lines Reduced** | ${totalLinesReduced} |
| 🔵 **Total Loops Reduced** | ${totalLoopsReduced} |
| ⏱️ **Average Conversion Time** | ${Math.round(averageConversionTime)}ms |
| ⏱️ **Total Conversion Time**   | ${Math.round(totalConversionTime)}ms |
| 📉 **Original Lines**         | ${totalOriginalLines} |
| 📈 **Converted Lines**        | ${totalConvertedLines} |
| 🔄 **Original Loops**         | ${totalOriginalLoops} |
| 🔄 **Converted Loops**        | ${totalConvertedLoops} |

---

## 📂 File Details & Performance
${results.map(result => `
###  [1m${result.originalFile.name} [0m

| Metric | Value |
|--------|-------|
| **Status** | ${result.status === 'success' ? '✅ Success' : result.status === 'warning' ? '⚠️ Warning' : '❌ Error'} |
| **Data Types Mapped** | ${result.dataTypeMapping?.length || 0} |
| **Issues Found** | ${result.issues?.length || 0} |
| 🟩 **Lines Reduced** | ${result.performance?.linesReduced ?? '-'} |
| 🔵 **Loops Reduced** | ${result.performance?.loopsReduced ?? '-'} |
| ⏱️ **Conversion Time** | ${result.performance?.conversionTimeMs ?? '-'} ms |
| 🏅 **Performance Score** | ${result.performance?.performanceScore ?? '-'} / 100 |
| 🧮 **Maintainability Index** | ${result.performance?.maintainabilityIndex ?? '-'} / 100 |
| 📉 **Original Complexity** | ${result.performance?.originalComplexity ?? '-'} |
| 📈 **Converted Complexity** | ${result.performance?.convertedComplexity ?? '-'} |
| 🔥 **Improvement** | ${result.performance?.improvementPercentage ?? '-'}% |

${result.performance?.performanceScore && result.performance?.performanceScore >= 80 ? '🌟 Excellent performance!' : result.performance?.performanceScore >= 60 ? '👍 Good performance.' : result.performance?.performanceScore >= 40 ? '⚠️ Fair performance.' : '❗ Needs improvement.'}

---
`).join('')}

## 💡 Recommendations
- Review all converted code for accuracy
- Test in Oracle environment
- Validate data integrity
- Monitor performance
- Consider the ${totalLinesReduced} lines and ${totalLoopsReduced} loops that were optimized
`;
};

// Simple hash function for code+model
function hashCode(str: string): string {
  let hash = 0, i, chr;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash.toString();
}

export function getConversionCacheKey(code: string, model: string) {
  return `conversion-cache-${model}-${hashCode(code)}`;
}

export function getCachedConversion(code: string, model: string) {
  if (!cacheEnabled) return null;
  const key = getConversionCacheKey(code, model);
  const cached = localStorage.getItem(key);
  return cached ? JSON.parse(cached) : null;
}

export function setCachedConversion(code: string, model: string, result: any) {
  if (!cacheEnabled) return;
  const key = getConversionCacheKey(code, model);
  localStorage.setItem(key, JSON.stringify(result));
}

export async function setBackendCachedConversion(hash: string, original_code: string, ai_model: string, converted_code: string, metrics: any, issues: any, data_type_mapping: any) {
  await supabase
    .from('conversion_cache')
    .insert([{ content_hash: hash, original_code, converted_code, ai_model, metrics, issues, data_type_mapping }]);
}

export async function getBackendCachedConversion(hash: string, ai_model: string) {
  const { data, error } = await supabase
    .from('conversion_cache')
    .select('*')
    .eq('content_hash', hash)
    .eq('ai_model', ai_model)
    .single();
  if (error) {
    console.error('Error fetching from backend cache:', error);
    return null;
  }
  return data;
}
