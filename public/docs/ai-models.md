# AI Model Configuration and Usage

This document provides comprehensive information about configuring and using AI models in the Sybase to Oracle Migration Tool.

## 📚 Table of Contents

- [Supported AI Models](#supported-ai-models)
- [Google Gemini AI](#google-gemini-ai)
- [Default Conversion Model](#default-conversion-model)
- [Custom AI Models](#custom-ai-models)
- [Model Selection Guidelines](#model-selection-guidelines)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## 🤖 Supported AI Models

The migration tool supports multiple AI models to ensure flexibility and optimal conversion quality:

| Model | Accuracy | Speed | Cost | Best For |
|-------|----------|-------|------|----------|
| **Gemini Pro** | 95%+ | Fast | Medium | Complex procedures, production |
| **Default** | 85%+ | Very Fast | Free | Simple conversions, testing |
| **Custom** | Variable | Variable | Variable | Specialized requirements |

## 🧠 Google Gemini AI

### Overview

Google Gemini AI is our primary conversion engine, offering state-of-the-art natural language understanding specifically tuned for code conversion tasks.

### Configuration

#### API Key Setup

```typescript
// Environment configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here

// Runtime configuration
export const geminiConfig = {
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  model: 'gemini-pro',
  baseUrl: 'https://generativelanguage.googleapis.com',
};
```

#### Model Parameters

```typescript
// Advanced Gemini configuration
export const geminiAdvancedConfig = {
  model: 'gemini-pro',
  generationConfig: {
    temperature: 0.1,        // Low for consistent code generation
    topP: 0.8,              // Nucleus sampling parameter
    topK: 40,               // Top-k sampling parameter
    maxOutputTokens: 8192,   // Maximum response length
    candidateCount: 1,       // Number of response variants
    stopSequences: ['```'],  // Stop generation at code blocks
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_NONE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_NONE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_NONE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_NONE',
    },
  ],
};
```

### Prompt Engineering

#### Base Prompt Template

```typescript
export const sybaseToOraclePrompt = `
You are an expert database migration specialist. Convert the following Sybase code to Oracle PL/SQL.

CONVERSION RULES:
1. Parameter Syntax: @param → p_param IN/OUT TYPE
2. Data Types: Use Oracle equivalents (VARCHAR2, NUMBER, DATE, etc.)
3. Functions: Map Sybase functions to Oracle (GETDATE() → SYSDATE, ISNULL → NVL)
4. Result Sets: Use SYS_REFCURSOR for output
5. Error Handling: Use Oracle exception handling
6. Comments: Preserve original comments and add conversion notes

SYBASE CODE:
{sourceCode}

ORACLE PL/SQL:
`;
```

#### Context-Aware Prompts

```typescript
// Different prompts for different code types
export const promptTemplates = {
  storedProcedure: `
Convert this Sybase stored procedure to Oracle PL/SQL:

Requirements:
- Use CREATE OR REPLACE PROCEDURE
- Convert parameters: @param → p_param IN/OUT TYPE
- Add SYS_REFCURSOR for result sets
- Use Oracle-specific exception handling
- Maintain original business logic

Sybase Procedure:
{code}

Oracle PL/SQL:
`,

  function: `
Convert this Sybase function to Oracle:

Requirements:
- Use CREATE OR REPLACE FUNCTION
- Return proper Oracle data types
- Use Oracle built-in functions
- Handle NULL values with NVL/NVL2
- Maintain deterministic behavior

Sybase Function:
{code}

Oracle Function:
`,

  trigger: `
Convert this Sybase trigger to Oracle:

Requirements:
- Use CREATE OR REPLACE TRIGGER
- Update OLD/NEW reference syntax (:OLD, :NEW)
- Use Oracle trigger timing (BEFORE/AFTER/INSTEAD OF)
- Handle compound statements properly

Sybase Trigger:
{code}

Oracle Trigger:
`,

  ddl: `
Convert this Sybase DDL to Oracle:

Requirements:
- Use Oracle data types (VARCHAR2, NUMBER, DATE)
- Convert constraints properly
- Use Oracle-specific indexes and partitioning
- Maintain referential integrity

Sybase DDL:
{code}

Oracle DDL:
`,
};
```

### Usage Examples

#### Basic Conversion

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiConverter {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: geminiAdvancedConfig.generationConfig,
      safetySettings: geminiAdvancedConfig.safetySettings,
    });
  }

  async convertCode(sybaseCode: string, codeType: string = 'procedure'): Promise<ConversionResult> {
    try {
      const prompt = this.buildPrompt(sybaseCode, codeType);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const oracleCode = response.text();

      return {
        status: 'success',
        originalCode: sybaseCode,
        convertedCode: oracleCode,
        model: 'gemini-pro',
        processingTime: Date.now() - startTime,
        issues: this.validateConversion(oracleCode),
      };
    } catch (error) {
      return {
        status: 'error',
        originalCode: sybaseCode,
        convertedCode: '',
        model: 'gemini-pro',
        error: error.message,
        issues: [{ type: 'error', message: error.message }],
      };
    }
  }

  private buildPrompt(code: string, type: string): string {
    const template = promptTemplates[type] || promptTemplates.storedProcedure;
    return template.replace('{code}', code);
  }
}
```

#### Batch Processing

```typescript
class GeminiBatchProcessor {
  private converter: GeminiConverter;
  private concurrencyLimit: number = 3;

  constructor(apiKey: string) {
    this.converter = new GeminiConverter(apiKey);
  }

  async convertBatch(files: CodeFile[]): Promise<ConversionResult[]> {
    const batches = this.chunkArray(files, this.concurrencyLimit);
    const results: ConversionResult[] = [];

    for (const batch of batches) {
      const batchPromises = batch.map(file => 
        this.converter.convertCode(file.content, file.type)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            status: 'error',
            originalCode: batch[index].content,
            convertedCode: '',
            model: 'gemini-pro',
            error: result.reason,
          });
        }
      });

      // Rate limiting between batches
      await this.delay(1000);
    }

    return results;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 🔧 Default Conversion Model

### Overview

The default model provides fast, rule-based conversion for common Sybase-to-Oracle patterns. It's ideal for simple procedures and quick testing.

### Implementation

```typescript
class DefaultConverter {
  private conversionRules: ConversionRule[];

  constructor() {
    this.conversionRules = [
      // Data type conversions
      { pattern: /\bVARCHAR\b/gi, replacement: 'VARCHAR2' },
      { pattern: /\bTEXT\b/gi, replacement: 'CLOB' },
      { pattern: /\bIMAGE\b/gi, replacement: 'BLOB' },
      { pattern: /\bDATETIME\b/gi, replacement: 'DATE' },
      { pattern: /\bMONEY\b/gi, replacement: 'NUMBER(19,4)' },
      { pattern: /\bBIT\b/gi, replacement: 'NUMBER(1)' },

      // Function conversions
      { pattern: /\bGETDATE\(\)/gi, replacement: 'SYSDATE' },
      { pattern: /\bISNULL\(/gi, replacement: 'NVL(' },
      { pattern: /\bLEN\(/gi, replacement: 'LENGTH(' },
      { pattern: /\bCHARINDEX\(/gi, replacement: 'INSTR(' },

      // Parameter syntax
      { pattern: /@(\w+)/g, replacement: 'p_$1' },

      // Procedure structure
      { pattern: /CREATE\s+PROCEDURE/gi, replacement: 'CREATE OR REPLACE PROCEDURE' },
      { pattern: /\bAS\s*BEGIN/gi, replacement: 'AS\nBEGIN' },
      { pattern: /\bEND\s*$/gm, replacement: 'END procedure_name;\n/' },
    ];
  }

  async convertCode(sybaseCode: string): Promise<ConversionResult> {
    let oracleCode = sybaseCode;
    const appliedRules: string[] = [];

    // Apply conversion rules
    for (const rule of this.conversionRules) {
      if (rule.pattern.test(oracleCode)) {
        oracleCode = oracleCode.replace(rule.pattern, rule.replacement);
        appliedRules.push(rule.description || 'Pattern replacement');
      }
    }

    // Post-processing
    oracleCode = this.postProcess(oracleCode);

    // Validate result
    const issues = this.validateConversion(oracleCode);

    return {
      status: issues.some(i => i.type === 'error') ? 'error' : 'success',
      originalCode: sybaseCode,
      convertedCode: oracleCode,
      model: 'default',
      appliedRules,
      issues,
    };
  }

  private postProcess(code: string): string {
    // Remove duplicate newlines
    code = code.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Fix indentation
    code = this.fixIndentation(code);
    
    // Add proper procedure termination
    if (!code.includes('/')) {
      code += '\n/';
    }

    return code;
  }

  private validateConversion(code: string): ConversionIssue[] {
    const issues: ConversionIssue[] = [];

    // Check for common issues
    if (code.includes('@')) {
      issues.push({
        type: 'warning',
        message: 'Sybase parameter syntax (@) detected',
        suggestion: 'Verify parameter conversion',
      });
    }

    if (!code.includes('CREATE OR REPLACE')) {
      issues.push({
        type: 'error',
        message: 'Missing CREATE OR REPLACE statement',
        suggestion: 'Add proper Oracle procedure declaration',
      });
    }

    return issues;
  }
}
```

## 🛠️ Custom AI Models

### Model Integration Interface

```typescript
interface AIModel {
  name: string;
  version: string;
  capabilities: string[];
  
  // Core conversion method
  convert(code: string, options?: ConversionOptions): Promise<ConversionResult>;
  
  // Model validation
  validateResponse(response: string): boolean;
  
  // Health check
  isAvailable(): Promise<boolean>;
  
  // Cost estimation
  estimateCost(codeLength: number): number;
}
```

### Custom Model Implementation

```typescript
class CustomAIModel implements AIModel {
  name = 'custom-model';
  version = '1.0.0';
  capabilities = ['sybase-to-oracle', 'batch-processing'];

  private apiEndpoint: string;
  private apiKey: string;

  constructor(config: CustomModelConfig) {
    this.apiEndpoint = config.endpoint;
    this.apiKey = config.apiKey;
  }

  async convert(code: string, options: ConversionOptions = {}): Promise<ConversionResult> {
    const response = await fetch(`${this.apiEndpoint}/convert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_dialect: 'sybase',
        target_dialect: 'oracle',
        code,
        options,
      }),
    });

    if (!response.ok) {
      throw new Error(`Custom model error: ${response.statusText}`);
    }

    const result = await response.json();
    return this.mapResponse(result);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  validateResponse(response: string): boolean {
    // Implement custom validation logic
    return response.length > 0 && !response.includes('ERROR');
  }

  estimateCost(codeLength: number): number {
    // Implement cost estimation based on your model pricing
    return Math.ceil(codeLength / 1000) * 0.01; // $0.01 per 1000 characters
  }

  private mapResponse(apiResponse: any): ConversionResult {
    return {
      status: apiResponse.success ? 'success' : 'error',
      originalCode: apiResponse.input,
      convertedCode: apiResponse.output,
      model: this.name,
      confidence: apiResponse.confidence,
      issues: apiResponse.warnings || [],
    };
  }
}
```

## 🎯 Model Selection Guidelines

### When to Use Gemini AI

✅ **Recommended for:**
- Complex stored procedures with intricate business logic
- Production migrations requiring high accuracy
- Code with nested transactions and error handling
- Large enterprise applications
- Procedures with dynamic SQL generation

❌ **Not ideal for:**
- Simple CRUD operations
- Budget-constrained projects
- High-volume batch processing (cost considerations)

### When to Use Default Model

✅ **Recommended for:**
- Simple stored procedures and functions
- Quick prototyping and testing
- Budget-constrained projects
- Educational purposes
- Basic CRUD operations

❌ **Not ideal for:**
- Complex business logic
- Production-critical applications
- Advanced SQL features
- Error-prone legacy code

### When to Use Custom Models

✅ **Recommended for:**
- Organization-specific conversion requirements
- Industry-specific SQL dialects
- Integration with existing ML pipelines
- Specialized conversion rules
- Cost optimization for large volumes

❌ **Not ideal for:**
- Standard migration projects
- Quick one-time conversions
- Users without ML expertise

## ⚡ Performance Optimization

### Caching Strategy

```typescript
class ModelCache {
  private cache = new Map<string, ConversionResult>();
  private maxSize = 1000;
  private ttl = 60 * 60 * 1000; // 1 hour

  generateKey(code: string, model: string): string {
    return `${model}:${this.hashCode(code)}`;
  }

  get(key: string): ConversionResult | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached;
    }
    this.cache.delete(key);
    return null;
  }

  set(key: string, result: ConversionResult): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { ...result, timestamp: Date.now() });
  }

  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}
```

### Request Optimization

```typescript
class OptimizedModelManager {
  private models: Map<string, AIModel> = new Map();
  private cache = new ModelCache();
  private requestQueue: ConversionRequest[] = [];
  private processing = false;

  async convert(code: string, modelName: string): Promise<ConversionResult> {
    // Check cache first
    const cacheKey = this.cache.generateKey(code, modelName);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Queue the request
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        code,
        modelName,
        resolve,
        reject,
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, 3); // Process 3 at a time
      
      const promises = batch.map(async (request) => {
        try {
          const model = this.models.get(request.modelName);
          if (!model) {
            throw new Error(`Model ${request.modelName} not found`);
          }

          const result = await model.convert(request.code);
          const cacheKey = this.cache.generateKey(request.code, request.modelName);
          this.cache.set(cacheKey, result);
          
          request.resolve(result);
        } catch (error) {
          request.reject(error);
        }
      });

      await Promise.allSettled(promises);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.processing = false;
  }
}
```

## 🔧 Troubleshooting

### Common Issues

#### Gemini API Errors

```typescript
class GeminiErrorHandler {
  static handleError(error: any): ConversionResult {
    switch (error.status) {
      case 400:
        return {
          status: 'error',
          error: 'Invalid request format',
          suggestion: 'Check input code syntax',
        };
      case 401:
        return {
          status: 'error',
          error: 'Invalid API key',
          suggestion: 'Verify VITE_GEMINI_API_KEY environment variable',
        };
      case 429:
        return {
          status: 'error',
          error: 'Rate limit exceeded',
          suggestion: 'Implement exponential backoff or upgrade quota',
        };
      case 500:
        return {
          status: 'error',
          error: 'Gemini service unavailable',
          suggestion: 'Try again later or use fallback model',
        };
      default:
        return {
          status: 'error',
          error: `Unexpected error: ${error.message}`,
          suggestion: 'Contact support if issue persists',
        };
    }
  }
}
```

#### Fallback Strategy

```typescript
class RobustConverter {
  private models: AIModel[];

  constructor(models: AIModel[]) {
    this.models = models; // Ordered by preference
  }

  async convertWithFallback(code: string): Promise<ConversionResult> {
    const errors: Error[] = [];

    for (const model of this.models) {
      try {
        const available = await model.isAvailable();
        if (!available) {
          continue;
        }

        const result = await model.convert(code);
        if (result.status === 'success') {
          return result;
        }
      } catch (error) {
        errors.push(error);
        console.warn(`Model ${model.name} failed:`, error);
      }
    }

    return {
      status: 'error',
      originalCode: code,
      convertedCode: '',
      model: 'fallback',
      error: 'All models failed',
      details: errors.map(e => e.message),
    };
  }
}
```

This comprehensive guide covers all aspects of AI model configuration and usage in the Sybase to Oracle Migration Tool, enabling users to optimize their conversion workflow based on their specific needs and requirements.