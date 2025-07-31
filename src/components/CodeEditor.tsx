
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, X, ChevronUp, ChevronDown, Replace, ChevronRight, ChevronLeft, Maximize2, Minimize2, Moon, Sun, Edit } from 'lucide-react';
import * as monaco from 'monaco-editor';
import { CodeEditorThemeContext } from '@/contexts/CodeEditorThemeContext';

interface CodeEditorProps {
  initialCode: string;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  onSave?: (updatedCode: string) => void;
  height?: string;
  language?: 'sql' | 'plsql' | 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'csharp' | 'php' | 'html' | 'css' | 'json' | 'xml' | 'yaml' | 'markdown';
  showLineNumbers?: boolean;
  selection?: { start: number; end: number };
  onSelectionChange?: (sel: { start: number; end: number }) => void;
  filename?: string;
  actions?: (isDarkMode: boolean) => React.ReactNode;
  editorId?: string; // Add unique identifier for each editor instance
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode,
  value,
  onChange,
  readOnly = false,
  onSave,
  height = '400px',
  language = 'sql',
  showLineNumbers = true,
  selection,
  onSelectionChange,
  filename,
  actions,
  editorId = 'default', // Default ID if not provided
}) => {
  const [code, setCode] = useState<string>(value !== undefined ? value : initialCode);
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [replaceTerm, setReplaceTerm] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [matches, setMatches] = useState<monaco.FindMatch[]>([]);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [useRegex, setUseRegex] = useState<boolean>(false);
  const [showReplace, setShowReplace] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showGoToLine, setShowGoToLine] = useState<boolean>(false);
  const [lineNumber, setLineNumber] = useState<string>('');
  const { toast } = useToast();
  
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const goToLineInputRef = useRef<HTMLInputElement>(null);
  const prevFullScreenRef = useRef(isFullScreen);

  const { isDarkMode, toggleDarkMode } = useContext(CodeEditorThemeContext);

  // Force Monaco to update theme on global dark mode change
  useEffect(() => {
    if (isDarkMode) {
      monaco.editor.setTheme('vs-dark');
    } else {
      monaco.editor.setTheme('vs');
    }
  }, [isDarkMode]);

  // When exiting full screen, force light mode
  useEffect(() => {
    // Only force light mode when exiting full screen
    if (prevFullScreenRef.current && !isFullScreen && isDarkMode) {
      toggleDarkMode();
    }
    prevFullScreenRef.current = isFullScreen;
  }, [isFullScreen, isDarkMode, toggleDarkMode]);

  // Create unique data attributes for this editor instance
  const editorDataAttr = { 'data-editor-id': editorId };
  const darkModeDataAttr = { 'data-dark-mode': isDarkMode.toString() };

  useEffect(() => {
    if (value !== undefined && value !== code) setCode(value);
  }, [value]);

  // Handle full screen keyboard shortcut - only for this editor instance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle F11 if this editor is focused or in fullscreen
      const isThisEditorFocused = document.activeElement?.closest(`[data-editor-id="${editorId}"]`);
      if (e.key === 'F11' && (isThisEditorFocused || isFullScreen)) {
        e.preventDefault();
        setIsFullScreen(!isFullScreen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, editorDataAttr]);

  // Handle keyboard shortcuts - only for this editor instance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if this editor is focused
      const isThisEditorFocused = document.activeElement?.closest(`[data-editor-id="${editorId}"]`);
      if (!isThisEditorFocused && !isFullScreen) return;

      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        setShowGoToLine(true);
        setTimeout(() => {
          goToLineInputRef.current?.focus();
        }, 100);
      }
      
      if (e.key === 'Escape' && showSearch) {
        e.preventDefault();
        setShowSearch(false);
        setSearchTerm('');
        setMatches([]);
        setCurrentMatchIndex(-1);
        if (editorRef.current) {
          editorRef.current.getAction('actions.find')?.run();
        }
      }
      
      if (e.key === 'Escape' && showGoToLine) {
        e.preventDefault();
        setShowGoToLine(false);
        setLineNumber('');
      }
      
      if (showSearch && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          navigateToPreviousMatch();
        } else {
          navigateToNextMatch();
        }
      }
      
      if (showGoToLine && e.key === 'Enter') {
        e.preventDefault();
        goToLine();
      }
      
      if (showSearch && e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        setShowReplace(!showReplace);
        setTimeout(() => {
          if (showReplace) {
            searchInputRef.current?.focus();
          } else {
            replaceInputRef.current?.focus();
          }
        }, 100);
      }
      
      if (showSearch && e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        replaceCurrent();
      }
      
      if (showSearch && e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.select();
        }
      }
      
      if (showSearch && e.ctrlKey && e.shiftKey && e.key === 'l') {
        e.preventDefault();
        replaceAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSearch, matches, currentMatchIndex, showGoToLine, editorDataAttr, isFullScreen]);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    
    // Set initial value
    editor.setValue(code);
    
    // Handle selection changes
    editor.onDidChangeCursorSelection((e) => {
      if (onSelectionChange) {
        const selection = e.selection;
        const model = editor.getModel();
        if (model && selection) {
          const start = model.getOffsetAt({ lineNumber: selection.startLineNumber, column: selection.startColumn });
          const end = model.getOffsetAt({ lineNumber: selection.endLineNumber, column: selection.endColumn });
          onSelectionChange({ start, end });
        }
      }
    });

    // Handle content changes
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      setCode(value);
      if (onChange) onChange(value);
    });

    // Set initial selection if provided
    if (selection && editor.getModel()) {
      const startPosition = editor.getModel()?.getPositionAt(selection.start);
      const endPosition = editor.getModel()?.getPositionAt(selection.end);
      if (startPosition && endPosition) {
        editor.setSelection({
          startLineNumber: startPosition.lineNumber,
          startColumn: startPosition.column,
          endLineNumber: endPosition.lineNumber,
          endColumn: endPosition.column,
        });
      }
    }
  };

  const goToLine = () => {
    const lineNum = parseInt(lineNumber);
    if (isNaN(lineNum) || lineNum < 1) {
      toast({
        title: "Invalid line number",
        description: "Please enter a valid line number",
        variant: "destructive",
      });
      return;
    }
    
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(lineNum);
      editorRef.current.setPosition({ lineNumber: lineNum, column: 1 });
      editorRef.current.focus();
    }
    
    setShowGoToLine(false);
    setLineNumber('');
  };

  const navigateToNextMatch = () => {
    if (editorRef.current) {
      editorRef.current.getAction('actions.findNext')?.run();
    }
  };

  const navigateToPreviousMatch = () => {
    if (editorRef.current) {
      editorRef.current.getAction('actions.findPrevious')?.run();
    }
  };

  const replaceCurrent = () => {
    if (editorRef.current) {
      editorRef.current.getAction('actions.replace')?.run();
    }
  };

  const replaceAll = () => {
    if (editorRef.current) {
      editorRef.current.getAction('actions.replaceAll')?.run();
    }
  };

  const handleSave = () => {
    if (onSave) onSave(code);
    toast({
      title: 'Changes Saved',
      description: 'Your code changes have been saved.',
    });
  };

  const handleRewriteWithAI = async () => {
    setIsRewriting(true);
    try {
      const response = await fetch('/.netlify/functions/ai-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, prompt: 'Rewrite and optimize this code', language }),
      });
      if (!response.ok) throw new Error('AI rewrite failed');
      const data = await response.json();
      const newCode = data.rewrittenCode || code;
      setCode(newCode);
      if (onChange) onChange(newCode);
      if (editorRef.current) {
        editorRef.current.setValue(newCode);
      }
      toast({
        title: 'AI Rewrite Complete',
        description: 'Your code has been rewritten by AI.',
      });
    } catch (err) {
      toast({
        title: 'AI Rewrite Failed',
        description: 'Could not rewrite code with AI.',
        variant: 'destructive',
      });
    } finally {
      setIsRewriting(false);
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Monaco Editor options
  const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    readOnly,
    lineNumbers: showLineNumbers ? 'on' : 'off',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    wordWrap: 'on',
    folding: true,
    lineDecorationsWidth: 10,
    lineNumbersMinChars: 3,
    renderLineHighlight: 'all',
    selectOnLineNumbers: true,
    roundedSelection: false,
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      verticalScrollbarSize: 12,
      horizontalScrollbarSize: 12,
    },
    theme: isDarkMode ? 'vs-dark' : 'vs',
  };

  const editorContainer = (
    <div className="w-full h-full">
      <Editor
        height={height}
        language={language}
        value={code}
        options={editorOptions}
        onMount={handleEditorDidMount}
        onChange={(value) => {
          setCode(value || '');
          if (onChange) onChange(value || '');
        }}
      />
    </div>
  );

  if (isFullScreen) {
    return (
      <div 
        className={`fixed inset-0 z-50 flex flex-col ${isDarkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`} 
        data-code-editor
        style={{ height: '100vh' }}
        {...editorDataAttr}
        {...darkModeDataAttr}
      >
        {/* Minimal Top Bar with filename on left and full-screen button on right */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${isDarkMode ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white'}`}
          style={{ flexShrink: 0 }}
        >
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>{filename || 'main.py'}</span>
          </div>
          <div className="flex items-center gap-2">
            {typeof actions === 'function' && <div className="flex items-center gap-2 mr-2">{actions(isDarkMode)}</div>}
            {/* Only show dark mode toggle in full screen */}
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleDarkMode}
              className="h-8 w-8 p-0"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-700" />}
            </Button>
            <span className="text-xs text-gray-500">Press F11 to exit</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullScreen}
              className={`h-8 w-8 p-0 ${isDarkMode ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'}`}
              title={isFullScreen ? 'Exit Full Screen (F11)' : 'Full Screen (F11)'}
            >
              {isFullScreen
                ? <Minimize2 className={`h-4 w-4 ${isDarkMode ? 'text-gray-100 hover:text-gray-300' : 'text-gray-700 hover:text-black'}`} />
                : <Maximize2 className={`h-4 w-4 ${isDarkMode ? 'text-gray-100 hover:text-gray-300' : 'text-gray-700 hover:text-black'}`} />}
            </Button>
          </div>
        </div>
        
        {/* Full Screen Code Editor */}
        <div className="flex-1 overflow-hidden relative h-full">
          <Editor
            height="100%"
            language={language}
            value={code}
            options={editorOptions}
            onMount={handleEditorDidMount}
            onChange={(value) => {
              setCode(value || '');
              if (onChange) onChange(value || '');
            }}
          />
        </div>

        {/* Full Screen Search Overlay - Only show when search is active */}
        {showSearch && (
          <div className="absolute top-16 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-xl p-3 z-50 min-w-[400px]">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="flex-1 h-8 text-sm bg-white/80"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSearch(false);
                  setSearchTerm('');
                  setMatches([]);
                  setCurrentMatchIndex(-1);
                }}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {showReplace && (
              <div className="flex items-center gap-2 mb-2">
                <Replace className="h-4 w-4 text-gray-500" />
                <Input
                  ref={replaceInputRef}
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  placeholder="Replace with..."
                  className="flex-1 h-8 text-sm bg-white/80"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplace(false)}
                  className="h-8 w-8 p-0"
                  title="Collapse replace"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCaseSensitive(!caseSensitive)}
                  className={`px-2 py-1 rounded ${caseSensitive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                >
                  Aa
                </button>
                <button
                  onClick={() => setUseRegex(!useRegex)}
                  className={`px-2 py-1 rounded ${useRegex ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                >
                  .*
                </button>
                {showReplace && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={replaceCurrent}
                      className="h-6 text-xs"
                    >
                      Replace
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={replaceAll}
                      className="h-6 text-xs"
                    >
                      Replace All
                    </Button>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={navigateToPreviousMatch}
                  className="h-6 w-6 p-0"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={navigateToNextMatch}
                  className="h-6 w-6 p-0"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Go to Line Overlay */}
        {showGoToLine && (
          <div className={`absolute top-16 right-4 backdrop-blur-sm border rounded-lg shadow-xl p-3 z-50 min-w-[300px] ${isDarkMode ? 'bg-[#2d2d30]/95 border-gray-700' : 'bg-white/95 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>Go to Line</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowGoToLine(false);
                  setLineNumber('');
                }}
                className="h-8 w-8 p-0 ml-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                ref={goToLineInputRef}
                value={lineNumber}
                onChange={(e) => setLineNumber(e.target.value)}
                placeholder="Enter line number"
                className="flex-1 h-8 text-sm bg-white/80"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    goToLine();
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={goToLine}
                className="h-8 text-xs"
              >
                Go
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="w-full relative h-full overflow-hidden" 
      data-code-editor
             {...editorDataAttr}
       {...darkModeDataAttr}
    >
      <div className={`rounded-md border h-full flex flex-col overflow-hidden ${isDarkMode ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Header with filename and controls */}
        <div className={`flex items-center justify-between p-2 border-b flex-shrink-0 ${isDarkMode ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>{filename || 'main.py'}</div>
          <div className="flex items-center gap-2">
            {typeof actions === 'function' && <div className="flex items-center gap-2 mr-2">{actions(isDarkMode)}</div>}
            {/* Remove dark mode toggle from normal header */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullScreen}
              className={`h-8 w-8 p-0 ${isDarkMode ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'}`}
              title={isFullScreen ? 'Exit Full Screen (F11)' : 'Full Screen (F11)'}
            >
              {isFullScreen
                ? <Minimize2 className={`h-4 w-4 ${isDarkMode ? 'text-gray-100 hover:text-gray-300' : 'text-gray-700 hover:text-black'}`} />
                : <Maximize2 className={`h-4 w-4 ${isDarkMode ? 'text-gray-100 hover:text-gray-300' : 'text-gray-700 hover:text-black'}`} />}
            </Button>
          </div>
        </div>
        
        {/* Code Editor */}
        <div className="flex-1 overflow-hidden">
          {editorContainer}
        </div>
      </div>

      {/* Search Overlay */}
      {showSearch && (
        <div className={`absolute top-2 right-2 border rounded-lg shadow-lg p-3 z-50 min-w-[400px] ${isDarkMode ? 'bg-[#2d2d30] border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="flex-1 h-8 text-sm"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowSearch(false);
                setSearchTerm('');
                setMatches([]);
                setCurrentMatchIndex(-1);
              }}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {showReplace && (
            <div className="flex items-center gap-2 mb-2">
              <Replace className="h-4 w-4 text-gray-500" />
              <Input
                ref={replaceInputRef}
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                placeholder="Replace with..."
                className="flex-1 h-8 text-sm"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplace(false)}
                className="h-8 w-8 p-0"
                title="Collapse replace"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCaseSensitive(!caseSensitive)}
                className={`px-2 py-1 rounded ${caseSensitive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
              >
                Aa
              </button>
              <button
                onClick={() => setUseRegex(!useRegex)}
                className={`px-2 py-1 rounded ${useRegex ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
              >
                .*
              </button>
              {showReplace && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={replaceCurrent}
                    className="h-6 text-xs"
                  >
                    Replace
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={replaceAll}
                    className="h-6 text-xs"
                  >
                    Replace All
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={navigateToPreviousMatch}
                className="h-6 w-6 p-0"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={navigateToNextMatch}
                className="h-6 w-6 p-0"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

        {/* Go to Line Overlay */}
        {showGoToLine && (
        <div className={`absolute top-2 right-2 border rounded-lg shadow-lg p-3 z-50 min-w-[300px] ${isDarkMode ? 'bg-[#2d2d30] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>Go to Line</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowGoToLine(false);
                  setLineNumber('');
                }}
                className="h-8 w-8 p-0 ml-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                ref={goToLineInputRef}
                value={lineNumber}
                onChange={(e) => setLineNumber(e.target.value)}
              placeholder="Enter line number"
                className="flex-1 h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    goToLine();
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={goToLine}
                className="h-8 text-xs"
              >
                Go
              </Button>
            </div>
          </div>
        )}
      </div>
    );
};

export default CodeEditor;
