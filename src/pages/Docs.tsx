import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, BookOpen, FileText, Settings, Database, Code, Users, BarChart3, HelpCircle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  files: DocFile[];
  category: string;
}

interface DocFile {
  name: string;
  path: string;
  title: string;
  description?: string;
  category: string;
}

const Docs: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocFile | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const docSections: DocSection[] = [
    {
      title: 'Getting Started',
      description: 'Essential guides to get you started with the migration tool',
      icon: <BookOpen className="h-5 w-5" />,
      category: 'getting-started',
      files: [
        { name: 'README.md', path: 'docs/README.md', title: 'Main Documentation', category: 'getting-started' },
        { name: 'MAIN-README.md', path: 'docs/MAIN-README.md', title: 'Main Guide', category: 'getting-started' },
        { name: 'quick-start.md', path: 'docs/user-guide/quick-start.md', title: 'Quick Start Guide', category: 'getting-started' }
      ]
    },
    {
      title: 'User Guide',
      description: 'Comprehensive user documentation and tutorials',
      icon: <Users className="h-5 w-5" />,
      category: 'user-guide',
      files: [
        { name: 'README.md', path: 'docs/user-guide/README.md', title: 'User Guide', category: 'user-guide' },
        { name: 'history-page.md', path: 'docs/history-page.md', title: 'History Page Guide', category: 'user-guide' },
        { name: 'file-tree-viewer.md', path: 'docs/file-tree-viewer.md', title: 'File Tree Viewer', category: 'user-guide' }
      ]
    },
    {
      title: 'Configuration',
      description: 'System configuration and setup documentation',
      icon: <Settings className="h-5 w-5" />,
      category: 'configuration',
      files: [
        { name: 'README.md', path: 'docs/configuration/README.md', title: 'Configuration Guide', category: 'configuration' },
        { name: 'ai-models.md', path: 'docs/ai-models.md', title: 'AI Models Documentation', category: 'configuration' },
        { name: 'cache-implementation.md', path: 'docs/cache-implementation.md', title: 'Cache Implementation', category: 'configuration' }
      ]
    },
    {
      title: 'Development',
      description: 'Developer documentation and technical guides',
      icon: <Code className="h-5 w-5" />,
      category: 'development',
      files: [
        { name: 'architecture.md', path: 'docs/architecture.md', title: 'System Architecture', category: 'development' },
        { name: 'database-schema.md', path: 'docs/database-schema.md', title: 'Database Schema', category: 'development' },
        { name: 'developer-review-panel.md', path: 'docs/developer-review-panel.md', title: 'Developer Review Panel', category: 'development' },
        { name: 'README.md', path: 'docs/developer-guide/README.md', title: 'Developer Guide', category: 'development' }
      ]
    },
    {
      title: 'Administration',
      description: 'Admin panel and system administration guides',
      icon: <BarChart3 className="h-5 w-5" />,
      category: 'administration',
      files: [
        { name: 'README-ADMIN.md', path: 'docs/README-ADMIN.md', title: 'Admin Guide', category: 'administration' },
        { name: 'performance-metrics-dashboard.md', path: 'docs/performance-metrics-dashboard.md', title: 'Performance Metrics', category: 'administration' }
      ]
    },
    {
      title: 'API & Integration',
      description: 'API documentation and integration guides',
      icon: <Zap className="h-5 w-5" />,
      category: 'api',
      files: [
        { name: 'README.md', path: 'docs/api/README.md', title: 'API Documentation', category: 'api' }
      ]
    },
    {
      title: 'Deployment & Troubleshooting',
      description: 'Deployment guides and troubleshooting information',
      icon: <HelpCircle className="h-5 w-5" />,
      category: 'deployment',
      files: [
        { name: 'README.md', path: 'docs/deployment/README.md', title: 'Deployment Guide', category: 'deployment' },
        { name: 'README.md', path: 'docs/troubleshooting/README.md', title: 'Troubleshooting Guide', category: 'deployment' }
      ]
    }
  ];

  const allFiles = docSections.flatMap(section => section.files);

  const filteredSections = docSections.map(section => ({
    ...section,
    files: section.files.filter(file =>
      file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.files.length > 0);

  const loadFileContent = async (file: DocFile) => {
    setLoading(true);
    try {
      // Change the path to use the correct public URL for the docs
      const response = await fetch(`/docs/${file.path.replace('docs/', '')}`);
      if (response.ok) {
        const content = await response.text();
        setFileContent(content);
        setSelectedFile(file);
      } else {
        throw new Error('Failed to load file');
      }
    } catch (error) {
      console.error('Error loading file:', error);
      toast({
        title: "Error",
        description: "Failed to load documentation file. Please check if the file exists in the public directory.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering - you might want to use a proper markdown library
    return content
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Documentation</h1>
        <p className="text-muted-foreground">
          Comprehensive guides and documentation for the Oracle AI Migration Tool
        </p>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar - Documentation sections */}
        <div className="w-1/3">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            {filteredSections.map((section) => (
              <Card key={section.category} className="mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {section.icon}
                    {section.title}
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {section.files.map((file) => (
                      <Button
                        key={file.path}
                        variant={selectedFile?.path === file.path ? "default" : "ghost"}
                        className="w-full justify-start h-auto p-3"
                        onClick={() => loadFileContent(file)}
                      >
                        <div className="text-left">
                          <div className="font-medium">{file.title}</div>
                          {file.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {file.description}
                            </div>
                          )}
                          <Badge variant="secondary" className="mt-2">
                            {file.name}
                          </Badge>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </div>

        {/* Right content area */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedFile ? selectedFile.title : 'Select a document'}
              </CardTitle>
              {selectedFile && (
                <CardDescription>
                  {selectedFile.description || `Viewing ${selectedFile.name}`}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : selectedFile ? (
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: renderMarkdown(fileContent) 
                    }}
                  />
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a document from the sidebar to view its content</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Docs;