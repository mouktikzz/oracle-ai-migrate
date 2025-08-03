# File Tree Viewer

## Overview

The File Tree Viewer provides a hierarchical, interactive interface for managing and organizing database migration files. It offers intuitive file navigation, categorization, and batch operations to streamline the migration workflow.

## Features

### 🌳 Hierarchical Organization
- **Tree Structure**: Organize files in folders and subfolders
- **Drag & Drop**: Intuitive file organization
- **Expand/Collapse**: Navigate large file collections easily
- **Search & Filter**: Quickly find specific files or types

### 📁 File Type Categorization
- **Automatic Detection**: Identify file types by extension and content
- **Visual Indicators**: Icons and colors for different file types
- **Type Grouping**: Group similar files together
- **Custom Categories**: Create organization-specific categories

### ⚡ Batch Operations
- **Multi-Select**: Select multiple files for batch processing
- **Bulk Conversion**: Convert entire folders or file types
- **Batch Actions**: Delete, move, or rename multiple files
- **Progress Tracking**: Monitor batch operation progress

## Interface Components

### File Tree Structure
```
📁 Migration Project
├── 📁 Stored Procedures
│   ├── 📄 user_management.sql
│   ├── 📄 order_processing.sql
│   └── 📁 legacy_procedures
│       ├── 📄 old_user_proc.sql
│       └── 📄 deprecated_order.sql
├── 📁 Tables
│   ├── 📄 users.sql
│   ├── 📄 orders.sql
│   └── 📄 products.sql
├── 📁 Triggers
│   ├── 📄 audit_triggers.sql
│   └── 📄 validation_triggers.sql
└── 📁 Functions
    ├── 📄 utility_functions.sql
    └── 📄 business_functions.sql
```

### File Type Icons
```
📄 .sql     - SQL files (procedures, functions, etc.)
🗃️ .tab     - Table definitions
⚡ .trg     - Trigger files
🔧 .prc     - Stored procedure files
📊 .vw      - View definitions
🔐 .sec     - Security objects
📋 .idx     - Index definitions
```

## Usage

### Navigation

#### Basic Navigation
1. **Expand/Collapse**: Click folder icons to expand or collapse
2. **Select Files**: Click on file names to select them
3. **Multi-Select**: Hold Ctrl/Cmd to select multiple files
4. **Select All**: Use Ctrl+A to select all visible files

#### Search and Filter
```typescript
// Search by filename
const searchFiles = (query: string) => {
  return files.filter(file => 
    file.name.toLowerCase().includes(query.toLowerCase())
  );
};

// Filter by file type
const filterByType = (type: FileType) => {
  return files.filter(file => file.type === type);
};

// Filter by status
const filterByStatus = (status: ConversionStatus) => {
  return files.filter(file => file.conversionStatus === status);
};
```

### File Operations

#### Individual File Operations
```typescript
interface FileOperations {
  // View file details
  viewFile: (fileId: string) => void;
  
  // Edit file content
  editFile: (fileId: string) => void;
  
  // Convert single file
  convertFile: (fileId: string) => void;
  
  // Delete file
  deleteFile: (fileId: string) => void;
  
  // Rename file
  renameFile: (fileId: string, newName: string) => void;
  
  // Move file
  moveFile: (fileId: string, targetFolder: string) => void;
}
```

#### Batch Operations
```typescript
interface BatchOperations {
  // Convert multiple files
  convertFiles: (fileIds: string[]) => Promise<void>;
  
  // Delete multiple files
  deleteFiles: (fileIds: string[]) => Promise<void>;
  
  // Move multiple files
  moveFiles: (fileIds: string[], targetFolder: string) => Promise<void>;
  
  // Export multiple files
  exportFiles: (fileIds: string[], format: 'zip' | 'sql') => Promise<void>;
  
  // Generate report for multiple files
  generateBatchReport: (fileIds: string[]) => Promise<Report>;
}
```

## File Type Detection

### Automatic Detection
```typescript
interface FileTypeDetector {
  // Detect by file extension
  detectByExtension: (filename: string) => FileType;
  
  // Detect by content analysis
  detectByContent: (content: string) => FileType;
  
  // Detect by file header
  detectByHeader: (content: string) => FileType;
}

const fileTypePatterns = {
  procedure: /CREATE\s+(PROCEDURE|PROC)/i,
  function: /CREATE\s+FUNCTION/i,
  trigger: /CREATE\s+TRIGGER/i,
  table: /CREATE\s+TABLE/i,
  view: /CREATE\s+VIEW/i,
  index: /CREATE\s+(INDEX|UNIQUE\s+INDEX)/i
};
```

### Custom File Types
```typescript
interface CustomFileType {
  name: string;
  extensions: string[];
  patterns: RegExp[];
  icon: string;
  color: string;
  category: string;
}

const customFileTypes: CustomFileType[] = [
  {
    name: 'Legacy Procedure',
    extensions: ['.legacy', '.old'],
    patterns: [/--\s*LEGACY/i, /--\s*DEPRECATED/i],
    icon: '📜',
    color: '#ff6b6b',
    category: 'Legacy'
  }
];
```

## Configuration

### Tree View Settings
```typescript
interface TreeViewConfig {
  // Display options
  showIcons: boolean;
  showFileSize: boolean;
  showLastModified: boolean;
  showConversionStatus: boolean;
  
  // Behavior options
  autoExpand: boolean;
  rememberExpanded: boolean;
  sortBy: 'name' | 'type' | 'size' | 'modified';
  sortOrder: 'asc' | 'desc';
  
  // Selection options
  allowMultiSelect: boolean;
  allowDragDrop: boolean;
  allowContextMenu: boolean;
}
```

### File Type Configuration
```typescript
interface FileTypeConfig {
  // Type definitions
  types: FileTypeDefinition[];
  
  // Category grouping
  categories: CategoryDefinition[];
  
  // Visual settings
  icons: IconMapping;
  colors: ColorMapping;
  
  // Processing rules
  conversionRules: ConversionRule[];
  validationRules: ValidationRule[];
}
```

## API Integration

### Get File Tree
```http
GET /api/files/tree
Authorization: Bearer <token>

Response:
{
  "folders": [
    {
      "id": "folder_123",
      "name": "Stored Procedures",
      "path": "/procedures",
      "children": [
        {
          "id": "file_456",
          "name": "user_management.sql",
          "type": "procedure",
          "size": 2048,
          "modified": "2024-01-15T10:30:00Z",
          "status": "converted"
        }
      ]
    }
  ]
}
```

### Batch Operations API
```http
POST /api/files/batch/convert
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileIds": ["file_123", "file_456", "file_789"],
  "options": {
    "aiModel": "gemini",
    "customPrompt": "Optimize for Oracle 19c"
  }
}

Response:
{
  "jobId": "batch_job_123",
  "totalFiles": 3,
  "status": "processing",
  "progress": 0
}
```

### File Operations API
```http
// Move files
PUT /api/files/move
{
  "fileIds": ["file_123", "file_456"],
  "targetFolder": "legacy_procedures"
}

// Delete files
DELETE /api/files/batch
{
  "fileIds": ["file_123", "file_456"]
}

// Export files
POST /api/files/export
{
  "fileIds": ["file_123", "file_456"],
  "format": "zip"
}
```

## Advanced Features

### Smart Organization

#### Auto-Categorization
```typescript
const autoCategorizeFiles = (files: FileItem[]): CategoryMap => {
  const categories: CategoryMap = {};
  
  files.forEach(file => {
    const category = determineCategory(file);
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(file);
  });
  
  return categories;
};

const determineCategory = (file: FileItem): string => {
  // Business logic for categorization
  if (file.name.includes('user')) return 'User Management';
  if (file.name.includes('order')) return 'Order Processing';
  if (file.name.includes('legacy')) return 'Legacy Code';
  return 'General';
};
```

#### Dependency Analysis
```typescript
interface DependencyAnalyzer {
  // Analyze file dependencies
  analyzeDependencies: (files: FileItem[]) => DependencyGraph;
  
  // Find circular dependencies
  findCircularDependencies: (graph: DependencyGraph) => string[][];
  
  // Suggest conversion order
  suggestConversionOrder: (graph: DependencyGraph) => string[];
}

const dependencyPatterns = {
  tableReference: /FROM\s+(\w+)/gi,
  procedureCall: /EXEC\s+(\w+)/gi,
  functionCall: /(\w+)\s*\(/gi
};
```

### Batch Processing

#### Progress Tracking
```typescript
interface BatchProgress {
  jobId: string;
  totalFiles: number;
  processedFiles: number;
  successfulFiles: number;
  failedFiles: number;
  currentFile: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errors: BatchError[];
}

const trackBatchProgress = (jobId: string): Promise<BatchProgress> => {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      const progress = await getBatchProgress(jobId);
      
      if (progress.status === 'completed' || progress.status === 'failed') {
        clearInterval(interval);
        resolve(progress);
      }
    }, 1000);
  });
};
```

#### Error Handling
```typescript
interface BatchError {
  fileId: string;
  fileName: string;
  error: string;
  suggestion: string;
  retryable: boolean;
}

const handleBatchErrors = (errors: BatchError[]): void => {
  errors.forEach(error => {
    if (error.retryable) {
      // Add to retry queue
      addToRetryQueue(error.fileId);
    } else {
      // Log permanent failure
      logPermanentFailure(error);
    }
  });
};
```

## Performance Optimization

### Lazy Loading
```typescript
interface LazyLoadingConfig {
  // Load files in chunks
  chunkSize: number;
  
  // Virtual scrolling for large lists
  virtualScroll: boolean;
  
  // Cache loaded data
  enableCache: boolean;
  
  // Preload adjacent items
  preloadCount: number;
}

const lazyLoadFiles = async (
  folderId: string, 
  offset: number, 
  limit: number
): Promise<FileItem[]> => {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('folder_id', folderId)
    .range(offset, offset + limit - 1);
    
  return data || [];
};
```

### Search Optimization
```typescript
interface SearchConfig {
  // Index search terms
  enableIndexing: boolean;
  
  // Fuzzy search
  fuzzySearch: boolean;
  
  // Search highlighting
  highlightResults: boolean;
  
  // Search suggestions
  enableSuggestions: boolean;
}

const searchFiles = (query: string, config: SearchConfig): FileItem[] => {
  if (config.fuzzySearch) {
    return fuzzySearch(query);
  } else {
    return exactSearch(query);
  }
};
```

## Troubleshooting

### Common Issues

#### Performance Problems
1. **Large File Trees**
   - Implement virtual scrolling
   - Use lazy loading
   - Enable file caching

2. **Slow Search**
   - Optimize search algorithms
   - Use indexed search
   - Implement search caching

#### File Operations Issues
1. **Permission Errors**
   - Check file permissions
   - Verify user access rights
   - Handle permission gracefully

2. **Batch Operation Failures**
   - Implement retry logic
   - Provide detailed error messages
   - Allow partial success

### Debug Tools
```typescript
const debugFileTree = {
  // Log file operations
  logOperation: (operation: string, details: any) => {
    console.log(`[FileTree] ${operation}:`, details);
  },
  
  // Validate file structure
  validateStructure: (tree: FileTree) => {
    // Validate tree integrity
    return validateTreeIntegrity(tree);
  },
  
  // Performance monitoring
  measurePerformance: (operation: string) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`${operation} took ${end - start}ms`);
    };
  }
};
```

## Best Practices

### File Organization
1. **Use Descriptive Names**: Clear, meaningful file names
2. **Group Related Files**: Organize by functionality or module
3. **Version Control**: Use consistent versioning strategy
4. **Documentation**: Include README files in folders

### Performance
1. **Limit File Count**: Keep folders manageable in size
2. **Use Efficient Formats**: Optimize file formats for processing
3. **Regular Cleanup**: Remove obsolete files regularly
4. **Monitor Usage**: Track file access patterns

### Security
1. **Access Control**: Implement proper file permissions
2. **Validation**: Validate file content and structure
3. **Audit Trail**: Log file operations for security
4. **Backup Strategy**: Regular backups of important files

## Future Enhancements

### Planned Features
- [ ] **Advanced Search**: Full-text search with filters
- [ ] **File Previews**: Preview file content without opening
- [ ] **Collaboration**: Real-time file sharing and editing
- [ ] **Version History**: Track file changes over time
- [ ] **Integration**: Connect with external file systems
- [ ] **Automation**: Automated file organization rules

### Advanced Capabilities
- [ ] **AI-Powered Organization**: Smart file categorization
- [ ] **Dependency Visualization**: Visual dependency graphs
- [ ] **Migration Planning**: Automated migration sequence planning
- [ ] **Quality Assessment**: Automated code quality analysis
- [ ] **Impact Analysis**: Analyze changes across files

---

**Note**: The File Tree Viewer is essential for managing large migration projects efficiently. Proper file organization and batch operations can significantly improve migration productivity and reduce errors. 