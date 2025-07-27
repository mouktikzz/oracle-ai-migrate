import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadCloud, File, Trash2, Plus, Folder, Info, Download, ExternalLink, Github } from 'lucide-react';
import { CodeFile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { v4 as uuidv4 } from 'uuid';

interface CodeUploaderProps {
  onComplete: (files: CodeFile[]) => void;
}

interface GitHubFile {
  name: string;
  path: string;
  content: string;
  type: string;
}

const CodeUploader: React.FC<CodeUploaderProps> = ({ onComplete }) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'manual' | 'mapping' | 'syntax'>('upload');
  const [manualContent, setManualContent] = useState<string>('');
  const [manualFileName, setManualFileName] = useState<string>('');
  const [templateType, setTemplateType] = useState<'table' | 'procedure' | 'trigger'>('table');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  // Cloud service configurations
  const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'your_github_client_id';
  const GITHUB_REDIRECT_URI = `${window.location.origin}/github-callback`;
  const DROPBOX_CLIENT_ID = import.meta.env.VITE_DROPBOX_CLIENT_ID || 'your_dropbox_client_id';
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id';
  
  const processFiles = useCallback((uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;
    
    console.log('Processing files:', uploadedFiles.length);
    
    Array.from(uploadedFiles).forEach(file => {
      // Skip if file is too large (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: `${file.name} is too large. Please select files under 10MB.`,
          variant: 'destructive'
        });
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          const content = e.target.result as string;
          const newFile: CodeFile = {
            id: uuidv4(),
            name: file.name,
            content: content,
            type: determineFileType(file.name, content),
            status: 'pending'
          };
          
          setFiles(prevFiles => {
            // Check if file already exists
            if (prevFiles.some(f => f.name === file.name)) {
              toast({
                title: 'Duplicate File',
                description: `${file.name} is already uploaded.`,
                variant: 'destructive'
              });
              return prevFiles;
            }
            return [...prevFiles, newFile];
          });
          
          toast({
            title: 'File Uploaded',
            description: `${file.name} has been uploaded successfully.`
          });
        }
      };
      
      reader.onerror = () => {
        toast({
          title: 'Upload Failed',
          description: `Failed to read ${file.name}.`,
          variant: 'destructive'
        });
      };
      
      reader.readAsText(file);
    });
  }, [toast]);

  // GitHub Integration
  const handleGitHubAuth = () => {
    // Prevent any file input triggering
    event?.preventDefault();
    event?.stopPropagation();
    
    // Check if we have a stored token
    const storedToken = localStorage.getItem('github_token');
    if (storedToken) {
      // Immediately show repositories without any loading state
      openGitHubFilePicker(storedToken);
    } else {
      // For now, just open GitHub directly since OAuth setup is complex
      // In production, you'd implement proper OAuth flow
      toast({
        title: 'GitHub Integration',
        description: 'Please visit GitHub directly to access your repositories. OAuth integration will be available soon!',
      });
      
      // Open GitHub in new tab
      window.open('https://github.com', '_blank');
    }
  };

  const openGitHubFilePicker = async (token: string) => {
    try {
      // Show immediate feedback
      toast({
        title: 'GitHub Connected',
        description: 'Fetching your repositories...',
      });

      // Fetch user's repositories
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const repos = await response.json();
      
      if (repos.length > 0) {
        // Show repository selection dialog or use the first repository
        const repo = repos[0];
        toast({
          title: 'Repository Found',
          description: `Using repository: ${repo.name}`,
        });
        await fetchGitHubFiles(token, repo.owner.login, repo.name, 'main');
      } else {
        toast({
          title: 'No Repositories',
          description: 'No repositories found in your GitHub account.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('GitHub error:', error);
      toast({
        title: 'GitHub Error',
        description: 'Failed to access GitHub repositories. Please try logging in again.',
        variant: 'destructive'
      });
      // Clear invalid token
      localStorage.removeItem('github_token');
    }
  };

  const fetchGitHubFiles = async (token: string, owner: string, repo: string, branch: string = 'main') => {
    try {
      // Fetch repository contents
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repository contents');
      }

      const data = await response.json();
      
      // Filter for SQL files
      const sqlFiles = data.tree.filter((item: any) => 
        item.type === 'blob' && 
        /\.(sql|txt|prc|trg|tab|proc|sp)$/i.test(item.path)
      );

      if (sqlFiles.length === 0) {
        toast({
          title: 'No SQL Files Found',
          description: 'No supported SQL files found in this repository.',
          variant: 'destructive'
        });
        return;
      }

      // Fetch file contents
      const filePromises = sqlFiles.map(async (file: any) => {
        const fileResponse = await fetch(file.url, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          const content = atob(fileData.content);
          
          return {
            id: uuidv4(),
            name: file.path.split('/').pop(),
            content: content,
            type: determineFileType(file.path, content),
            status: 'pending' as const
          };
        }
        return null;
      });

      const fetchedFiles = (await Promise.all(filePromises)).filter(Boolean) as CodeFile[];
      
      setFiles(prevFiles => {
        const newFiles = [...prevFiles];
        fetchedFiles.forEach(file => {
          if (!newFiles.some(f => f.name === file.name)) {
            newFiles.push(file);
          }
        });
        return newFiles;
      });

      toast({
        title: 'GitHub Files Imported',
        description: `Successfully imported ${fetchedFiles.length} files from GitHub.`
      });

    } catch (error) {
      console.error('GitHub fetch error:', error);
      toast({
        title: 'GitHub Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import files from GitHub.',
        variant: 'destructive'
      });
    }
  };

  // Dropbox Integration
  const handleDropboxAuth = () => {
    // Prevent any file input triggering
    event?.preventDefault();
    event?.stopPropagation();
    
    // For demo purposes, we'll show a coming soon message
    // In production, you'd implement Dropbox OAuth
    toast({
      title: 'Dropbox Integration',
      description: 'Dropbox integration will be available soon!',
    });
  };

  const openDropboxFilePicker = async (token: string) => {
    // Dropbox API implementation would go here
    toast({
      title: 'Dropbox Integration',
      description: 'Dropbox file picker will be implemented soon!',
    });
  };

  // Google Drive Integration
  const handleGoogleDriveAuth = () => {
    // Prevent any file input triggering
    event?.preventDefault();
    event?.stopPropagation();
    
    // For demo purposes, we'll show a coming soon message
    // In production, you'd implement Google OAuth
    toast({
      title: 'Google Drive Integration',
      description: 'Google Drive integration will be available soon!',
    });
  };

  const openGoogleDriveFilePicker = async (token: string) => {
    // Google Drive API implementation would go here
    toast({
      title: 'Google Drive Integration',
      description: 'Google Drive file picker will be implemented soon!',
    });
  };
   
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    event.target.value = '';
  };

  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Folder upload triggered:', event.target.files);
    const files = event.target.files;
    
    if (files && files.length > 0) {
      console.log('Processing folder with files:', files.length);
      
      // Filter for supported file types
      const supportedFiles = Array.from(files).filter(file => {
        const ext = file.name.toLowerCase().split('.').pop();
        return ['sql', 'txt', 'prc', 'trg', 'tab', 'proc', 'sp'].includes(ext || '');
      });
      
      if (supportedFiles.length === 0) {
        toast({
          title: 'No Supported Files',
          description: 'No supported files found in the selected folder. Please select a folder containing .sql, .txt, .prc, .trg, or .tab files.',
          variant: 'destructive'
        });
        return;
      }
      
      if (supportedFiles.length !== files.length) {
        toast({
          title: 'Some Files Skipped',
          description: `${files.length - supportedFiles.length} unsupported files were skipped. Only .sql, .txt, .prc, .trg, and .tab files are supported.`,
        });
      }
      
      // Create a new FileList with only supported files
      const dt = new DataTransfer();
      supportedFiles.forEach(file => dt.items.add(file));
      
      processFiles(dt.files);
    } else {
      toast({
        title: 'No Folder Selected',
        description: 'Please select a folder containing files to upload.',
        variant: 'destructive'
      });
    }
    event.target.value = '';
  };
   
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
   
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };
   
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
   
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const dt = e.dataTransfer;
    const droppedFiles = dt.files;
    
    if (droppedFiles && droppedFiles.length > 0) {
      // Filter for supported file types
      const supportedFiles = Array.from(droppedFiles).filter(file => {
        const ext = file.name.toLowerCase().split('.').pop();
        return ['sql', 'txt', 'prc', 'trg', 'tab', 'proc', 'sp'].includes(ext || '');
      });
      
      if (supportedFiles.length === 0) {
        toast({
          title: 'Unsupported Files',
          description: 'Only .sql, .txt, .prc, .trg, and .tab files are supported.',
          variant: 'destructive'
        });
        return;
      }
      
      // Create new FileList with supported files
      const newDt = new DataTransfer();
      supportedFiles.forEach(file => newDt.items.add(file));
      
      processFiles(newDt.files);
    }
  };
   
  const handleDropAreaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFolderSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };
   
  const determineFileType = (fileName: string, content: string): 'table' | 'procedure' | 'trigger' | 'other' => {
    fileName = fileName.toLowerCase();
    content = content.toLowerCase();
    
    if (fileName.includes('table') || fileName.includes('tbl') || fileName.endsWith('.tab')) {
      return 'table';
    } else if (fileName.includes('proc') || fileName.includes('sp_') || fileName.endsWith('.prc')) {
      return 'procedure';
    } else if (fileName.includes('trig') || fileName.includes('tr_') || fileName.endsWith('.trg')) {
      return 'trigger';
    }
    
    if (fileName.endsWith('.sql')) {
      if (content.includes('create table') || 
          content.includes('alter table') || 
          content.match(/\bcreate\s+.*\s+table\b/i)) {
        return 'table';
      }
      
      if (content.includes('create procedure') || 
          content.includes('create or replace procedure') || 
          content.includes('create proc')) {
        return 'procedure';
      }
      
      if (content.includes('create trigger') || 
          content.includes('create or replace trigger') || 
          content.match(/\btrigger\s+on\b/i)) {
        return 'trigger';
      }
    }
    
    return 'other';
  };
   
  const handleRemoveFile = (id: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
    
    toast({
      title: 'File Removed',
      description: 'The file has been removed from the upload list.'
    });
  };
   
  const handleManualSubmit = () => {
    if (!manualContent.trim()) {
      toast({
        title: 'Empty Content',
        description: 'Please enter code content before adding the file.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!manualFileName.trim()) {
      toast({
        title: 'Missing Filename',
        description: 'Please enter a filename for the code content.',
        variant: 'destructive'
      });
      return;
    }
    
    const newFile: CodeFile = {
      id: uuidv4(),
      name: manualFileName,
      content: manualContent,
      type: templateType,
      status: 'pending'
    };
    
    setFiles(prevFiles => [...prevFiles, newFile]);
    
    setManualContent('');
    setManualFileName('');
    
    toast({
      title: 'File Added',
      description: `${manualFileName} has been added to the list.`
    });
  };
   
  const handleChangeFileType = (id: string, newType: 'table' | 'procedure' | 'trigger' | 'other') => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === id ? { ...file, type: newType } : file
      )
    );
    
    toast({
      title: 'File Type Changed',
      description: `The file type has been updated to ${newType}.`
    });
  };
   
  const getFilteredFiles = (type: 'table' | 'procedure' | 'trigger' | 'other') => {
    return files.filter(file => file.type === type);
  };
   
  const handleContinue = () => {
    if (files.length === 0) {
      toast({
        title: 'No Files',
        description: 'Please upload at least one file to continue.',
        variant: 'destructive'
      });
      return;
    }
    
    onComplete(files);
  };
   
  const getCodeTemplate = (type: 'table' | 'procedure' | 'trigger') => {
    if (type === 'table') {
      return `CREATE TABLE customers (
  customer_id INTEGER IDENTITY(1,1) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NULL,
  phone CHAR(15) NULL,
  is_active BIT DEFAULT 1,
  created_at DATETIME DEFAULT getdate(),
  notes TEXT,
  PRIMARY KEY (customer_id)
)`;
    } else if (type === 'procedure') {
      return `CREATE PROCEDURE get_customer_orders
  @customer_id INT
AS
BEGIN
  SELECT o.order_id, o.order_date, o.total_amount
  FROM orders o
  WHERE o.customer_id = @customer_id
  ORDER BY o.order_date DESC
  
  IF @@ROWCOUNT = 0
    PRINT 'No orders found for this customer'
  
  RETURN @@ROWCOUNT
END`;
    } else {
      return `CREATE TRIGGER trg_order_insert
ON orders
AFTER INSERT
AS
BEGIN
  DECLARE @customer_id INT
  SELECT @customer_id = customer_id FROM inserted
  
  UPDATE customers
  SET last_order_date = GETDATE()
  WHERE customer_id = @customer_id
END`;
    }
  };
   
  const addTemplateCode = (type: 'table' | 'procedure' | 'trigger') => {
    const template = getCodeTemplate(type);
    const fileName = type === 'table' ? 'example_table.sql' : 
                    type === 'procedure' ? 'example_procedure.sql' : 
                    'example_trigger.sql';
    
    setManualFileName(fileName);
    setManualContent(template);
    setTemplateType(type);
  };

  const dataTypeMappings = [
    { tsql: 'INT', plsql: 'NUMBER(10)', usage: 'Primary keys, counters', notes: 'Oracle NUMBER is more flexible' },
    { tsql: 'VARCHAR(n)', plsql: 'VARCHAR2(n)', usage: 'Variable length strings', notes: 'VARCHAR2 recommended in Oracle' },
    { tsql: 'CHAR(n)', plsql: 'CHAR(n)', usage: 'Fixed length strings', notes: 'Same in both databases' },
    { tsql: 'TEXT', plsql: 'CLOB', usage: 'Large text data', notes: 'CLOB for large character data' },
    { tsql: 'DATETIME', plsql: 'DATE', usage: 'Date and time', notes: 'Oracle DATE includes time' },
    { tsql: 'BIT', plsql: 'NUMBER(1)', usage: 'Boolean values', notes: 'Use CHECK constraint (0,1)' },
    { tsql: 'FLOAT', plsql: 'BINARY_FLOAT', usage: 'Floating point', notes: 'Oracle has BINARY_FLOAT/DOUBLE' },
    { tsql: 'DECIMAL(p,s)', plsql: 'NUMBER(p,s)', usage: 'Precise decimal', notes: 'NUMBER is Oracle standard' },
    { tsql: 'IDENTITY', plsql: 'SEQUENCE + TRIGGER', usage: 'Auto-increment', notes: 'Oracle 12c+ has IDENTITY' },
    { tsql: 'UNIQUEIDENTIFIER', plsql: 'RAW(16)', usage: 'GUID/UUID', notes: 'Use SYS_GUID() function' }
  ];

  const syntaxDifferences = [
    { category: 'Variables', tsql: 'DECLARE @var INT', plsql: 'DECLARE var NUMBER;', example: '@customer_id vs customer_id' },
    { category: 'String Concat', tsql: 'str1 + str2', plsql: 'str1 || str2', example: "'Hello' + 'World' vs 'Hello' || 'World'" },
    { category: 'IF Statement', tsql: 'IF condition BEGIN...END', plsql: 'IF condition THEN...END IF;', example: 'IF @count > 0 vs IF count > 0 THEN' },
    { category: 'Error Handling', tsql: 'TRY...CATCH', plsql: 'EXCEPTION WHEN', example: 'BEGIN TRY vs EXCEPTION WHEN OTHERS' },
    { category: 'Loops', tsql: 'WHILE condition BEGIN...END', plsql: 'WHILE condition LOOP...END LOOP;', example: 'WHILE @i < 10 vs WHILE i < 10 LOOP' },
    { category: 'Functions', tsql: 'GETDATE(), LEN()', plsql: 'SYSDATE, LENGTH()', example: 'GETDATE() vs SYSDATE' },
    { category: 'NULL Check', tsql: 'ISNULL(col, default)', plsql: 'NVL(col, default)', example: 'ISNULL(name, "Unknown") vs NVL(name, "Unknown")' },
    { category: 'Top Records', tsql: 'SELECT TOP n', plsql: 'WHERE ROWNUM <= n', example: 'SELECT TOP 10 vs WHERE ROWNUM <= 10' }
  ];
   
  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload Sybase Code</CardTitle>
          <CardDescription>
            Upload your Sybase database objects for conversion to Oracle.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload">Upload Files</TabsTrigger>
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
              <TabsTrigger value="mapping">Data Type Mapping</TabsTrigger>
              <TabsTrigger value="syntax">Syntax Differences</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-6">
              {/* Modern Upload Interface */}
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
                  ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'}`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleDropAreaClick}
              >
                {/* Main Upload Button */}
                <div className="mb-6">
                  <Button 
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                  >
                    <UploadCloud className="h-6 w-6 mr-3" />
                    SELECT FILES
                  </Button>
                </div>

                                 {/* Cloud Service Dropdown */}
                 <div className="flex justify-center mb-4">
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                       <Button
                         variant="outline"
                         className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 transition-all duration-300 px-6 py-3 rounded-full shadow-md hover:shadow-lg"
                         onClick={(e) => e.stopPropagation()}
                       >
                         <UploadCloud className="h-5 w-5 mr-2 text-blue-600" />
                         <span className="font-medium text-blue-700">Import from Cloud</span>
                         <svg className="w-4 h-4 ml-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                         </svg>
                       </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent className="w-56 p-2 bg-white border-2 border-blue-200 rounded-xl shadow-xl">
                       <div className="space-y-2">
                         {/* GitHub Option */}
                         <DropdownMenuItem
                           className="flex items-center p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-all duration-200"
                           onClick={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             handleGitHubAuth();
                           }}
                         >
                           <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center mr-3">
                             <Github className="h-5 w-5 text-white" />
                           </div>
                           <div>
                             <div className="font-medium text-gray-900">GitHub</div>
                             <div className="text-xs text-gray-500">Import from repositories</div>
                           </div>
                         </DropdownMenuItem>

                         {/* Dropbox Option */}
                         <DropdownMenuItem
                           className="flex items-center p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-all duration-200"
                           onClick={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             handleDropboxAuth();
                           }}
                         >
                           <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                             <Folder className="h-5 w-5 text-white" />
                           </div>
                           <div>
                             <div className="font-medium text-gray-900">Dropbox</div>
                             <div className="text-xs text-gray-500">Import from Dropbox</div>
                           </div>
                         </DropdownMenuItem>

                         {/* Google Drive Option */}
                         <DropdownMenuItem
                           className="flex items-center p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-all duration-200"
                           onClick={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             handleGoogleDriveAuth();
                           }}
                         >
                           <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center mr-3">
                             <ExternalLink className="h-5 w-5 text-white" />
                           </div>
                           <div>
                             <div className="font-medium text-gray-900">Google Drive</div>
                             <div className="text-xs text-gray-500">Import from Drive</div>
                           </div>
                         </DropdownMenuItem>
                       </div>
                     </DropdownMenuContent>
                   </DropdownMenu>
                 </div>

                

                {/* Drag & Drop Text */}
                <p className="text-gray-500 text-sm mt-4">
                  or drop SQL files here
                </p>

                {/* Supported Formats */}
                <p className="text-xs text-gray-400 mt-2">
                  Supported formats: .sql, .txt, .prc, .trg, .tab, .proc, .sp
                </p>

                {/* Hidden File Inputs */}
                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".sql,.txt,.tab,.prc,.trg,.proc,.sp"
                />
                <Input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFolderUpload}
                  accept=".sql,.txt,.tab,.prc,.trg,.proc,.sp"
                  webkitdirectory=""
                />
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manual-filename" className="mb-2">Filename</Label>
                    <Input
                      id="manual-filename"
                      value={manualFileName}
                      onChange={(e) => setManualFileName(e.target.value)}
                      placeholder="e.g., customers_table.sql"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-type" className="mb-2">Template Type</Label>
                    <Select value={templateType} onValueChange={(value: 'table' | 'procedure' | 'trigger') => setTemplateType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="table">Table</SelectItem>
                        <SelectItem value="procedure">Procedure</SelectItem>
                        <SelectItem value="trigger">Trigger</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => addTemplateCode('table')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Table Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addTemplateCode('procedure')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Procedure Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addTemplateCode('trigger')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Trigger Template
                  </Button>
                </div>
                
                <div>
                  <Label htmlFor="manual-content" className="mb-2">Code Content</Label>
                  <Textarea
                    id="manual-content"
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    placeholder="Paste your Sybase code here..."
                    className="font-mono min-h-[300px]"
                  />
                </div>
                <Button onClick={handleManualSubmit}>Add File</Button>
              </div>
            </TabsContent>

            <TabsContent value="mapping" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">T-SQL to PL/SQL Data Type Mapping</h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 font-semibold text-sm">
                    <div>T-SQL (Sybase)</div>
                    <div>PL/SQL (Oracle)</div>
                    <div>Usage in Code</div>
                    <div>Notes</div>
                  </div>
                  <ScrollArea className="max-h-96">
                    {dataTypeMappings.map((mapping, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 p-3 border-t text-sm">
                        <div className="font-mono bg-red-50 px-2 py-1 rounded">{mapping.tsql}</div>
                        <div className="font-mono bg-green-50 px-2 py-1 rounded">{mapping.plsql}</div>
                        <div className="text-gray-600">{mapping.usage}</div>
                        <div className="text-gray-500 text-xs">{mapping.notes}</div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="syntax" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Syntax Differences</h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 font-semibold text-sm">
                    <div>Category</div>
                    <div>T-SQL Syntax</div>
                    <div>PL/SQL Syntax</div>
                    <div>Example</div>
                  </div>
                  <ScrollArea className="max-h-96">
                    {syntaxDifferences.map((diff, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 p-3 border-t text-sm">
                        <div className="font-semibold text-blue-600">{diff.category}</div>
                        <div className="font-mono bg-red-50 px-2 py-1 rounded text-xs">{diff.tsql}</div>
                        <div className="font-mono bg-green-50 px-2 py-1 rounded text-xs">{diff.plsql}</div>
                        <div className="text-gray-600 text-xs">{diff.example}</div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {files.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Uploaded Files</h3>
              <Tabs defaultValue="tables">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="tables">
                    Tables
                    {getFilteredFiles('table').length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {getFilteredFiles('table').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="procedures">
                    Procedures
                    {getFilteredFiles('procedure').length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {getFilteredFiles('procedure').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="triggers">
                    Triggers
                    {getFilteredFiles('trigger').length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {getFilteredFiles('trigger').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="other">
                    Other
                    {getFilteredFiles('other').length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {getFilteredFiles('other').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                {files.length > 0 && (
                  <div className="flex justify-end mb-4">
                    <Button variant="destructive" onClick={() => {
                      setFiles([]);
                      toast({
                        title: 'Files Reset',
                        description: 'All uploaded files have been removed.'
                      });
                    }}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                )}

                {(['tables', 'procedures', 'triggers', 'other'] as const).map(tabValue => (
                  <TabsContent key={tabValue} value={tabValue}>
                    <ScrollArea className="h-[300px] rounded-md border p-4">
                      {getFilteredFiles(
                        tabValue === 'tables' ? 'table' : 
                        tabValue === 'procedures' ? 'procedure' : 
                        tabValue === 'triggers' ? 'trigger' : 'other'
                      ).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No {tabValue} uploaded yet
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {getFilteredFiles(
                            tabValue === 'tables' ? 'table' : 
                            tabValue === 'procedures' ? 'procedure' : 
                            tabValue === 'triggers' ? 'trigger' : 'other'
                          ).map(file => (
                            <div 
                              key={file.id} 
                              className="flex items-center justify-between p-3 bg-card rounded-md border"
                            >
                              <div className="flex items-center">
                                <File className="h-5 w-5 mr-3 text-muted-foreground" />
                                <span className="font-medium truncate max-w-[300px]">{file.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      Set Type
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleChangeFileType(file.id, 'table')}>
                                      Table
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleChangeFileType(file.id, 'procedure')}>
                                      Procedure
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleChangeFileType(file.id, 'trigger')}>
                                      Trigger
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleChangeFileType(file.id, 'other')}>
                                      Other
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleRemoveFile(file.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full"
            onClick={handleContinue}
            disabled={files.length === 0}
          >
            Continue to Conversion
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CodeUploader;
