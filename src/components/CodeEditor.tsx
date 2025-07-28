
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, ChevronUp, ChevronDown, Replace, ChevronRight, ChevronLeft, Maximize2, Minimize2 } from 'lucide-react';

interface CodeEditorProps {
  initialCode: string;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  onSave?: (updatedCode: string) => void;
  height?: string;
  language?: 'sql' | 'plsql' | 'js' | 'javascript';
  showLineNumbers?: boolean;
  selection?: { start: number; end: number };
  onSelectionChange?: (sel: { start: number; end: number }) => void;
  filename?: string;
}

interface SearchMatch {
  start: number;
  end: number;
  line: number;
  column: number;
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
}) => {
  const [code, setCode] = useState<string>(value !== undefined ? value : initialCode);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [replaceTerm, setReplaceTerm] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [useRegex, setUseRegex] = useState<boolean>(false);
  const [showReplace, setShowReplace] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const { toast } = useToast();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined && value !== code) setCode(value);
  }, [value]);

  useEffect(() => {
    if (onChange) onChange(code);
  }, [code, onChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 10);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setShowSearch(true);
        setShowReplace(true);
        setTimeout(() => searchInputRef.current?.focus(), 10);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowReplace(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close search
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        showSearch && 
        searchInputRef.current && 
        !searchInputRef.current.contains(e.target as Node) &&
        replaceInputRef.current && 
        !replaceInputRef.current.contains(e.target as Node)
      ) {
        setShowSearch(false);
        setShowReplace(false);
      }
    }
    if (showSearch) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSearch]);

  const findMatches = useCallback(() => {
    if (!searchTerm) {
      setMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    const lines = code.split('\n');
    const newMatches: SearchMatch[] = [];
    let charIndex = 0;

    lines.forEach((line, lineIndex) => {
      let searchString = searchTerm;
      let lineText = line;
      
      if (!caseSensitive) {
        searchString = searchTerm.toLowerCase();
        lineText = line.toLowerCase();
      }

      if (useRegex) {
        try {
          const regex = new RegExp(searchString, caseSensitive ? 'g' : 'gi');
          let match;
          while ((match = regex.exec(line)) !== null) {
            newMatches.push({
              start: charIndex + match.index,
              end: charIndex + match.index + match[0].length,
              line: lineIndex + 1,
              column: match.index + 1
            });
          }
        } catch (e) {
          // Invalid regex, ignore
        }
      } else {
        let index = lineText.indexOf(searchString);
        while (index !== -1) {
          newMatches.push({
            start: charIndex + index,
            end: charIndex + index + searchTerm.length,
            line: lineIndex + 1,
            column: index + 1
          });
          index = lineText.indexOf(searchString, index + 1);
        }
      }
      charIndex += line.length + 1; // +1 for newline
    });

    setMatches(newMatches);
    setCurrentMatchIndex(newMatches.length > 0 ? 1 : 0);
  }, [code, searchTerm, caseSensitive, useRegex]);

  useEffect(() => {
    findMatches();
  }, [findMatches]);

  const navigateToNextMatch = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex(prev => prev >= matches.length ? 1 : prev + 1);
  };

  const navigateToPreviousMatch = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex(prev => prev <= 1 ? matches.length : prev - 1);
  };

  const scrollToMatch = (match: SearchMatch) => {
    if (!textareaRef.current) return;
    
    const lines = code.split('\n');
    let charCount = 0;
    let lineCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lineCount === match.line - 1) {
        textareaRef.current.setSelectionRange(match.start, match.end);
        textareaRef.current.focus();
        break;
      }
      charCount += lines[i].length + 1;
      lineCount++;
    }
  };

  useEffect(() => {
    if (matches.length > 0 && currentMatchIndex > 0) {
      const currentMatch = matches[currentMatchIndex - 1];
      scrollToMatch(currentMatch);
    }
  }, [currentMatchIndex, matches]);

  const replaceCurrent = () => {
    if (matches.length === 0 || currentMatchIndex === 0) return;
    
    const currentMatch = matches[currentMatchIndex - 1];
    const beforeMatch = code.substring(0, currentMatch.start);
    const afterMatch = code.substring(currentMatch.end);
    const newCode = beforeMatch + replaceTerm + afterMatch;
    
    setCode(newCode);
    findMatches();
  };

  const replaceAll = () => {
    if (matches.length === 0) return;
    
    let newCode = code;
    let offset = 0;
    
    matches.forEach(match => {
      const beforeMatch = newCode.substring(0, match.start + offset);
      const afterMatch = newCode.substring(match.end + offset);
      newCode = beforeMatch + replaceTerm + afterMatch;
      offset += replaceTerm.length - (match.end - match.start);
    });
    
    setCode(newCode);
    setSearchTerm('');
    setMatches([]);
    setCurrentMatchIndex(0);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    if (onChange) onChange(newCode);
  };

  const handleSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    if (onSelectionChange) {
      onSelectionChange({
        start: target.selectionStart,
        end: target.selectionEnd
      });
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(code);
      setIsEditing(false);
      toast({
        title: 'Changes Saved',
        description: 'Your code changes have been saved.',
      });
    }
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setCode(initialCode);
    setIsEditing(false);
  };

  const handleSearch = () => {
    setShowSearch(true);
    setShowReplace(false);
    setTimeout(() => searchInputRef.current?.focus(), 10);
  };

  const handleReplace = () => {
    setShowSearch(true);
    setShowReplace(true);
    setTimeout(() => searchInputRef.current?.focus(), 10);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const getLineNumbers = () => {
    const lines = code.split('\n');
    return lines.map((_, index) => index + 1).join('\n');
  };

  const getHighlightedCode = () => {
    if (matches.length === 0) return code;
    
    let highlightedCode = code;
    let offset = 0;
    
    matches.forEach((match, index) => {
      const isCurrentMatch = index === currentMatchIndex - 1;
      const beforeMatch = highlightedCode.substring(0, match.start + offset);
      const afterMatch = highlightedCode.substring(match.end + offset);
      const matchText = highlightedCode.substring(match.start + offset, match.end + offset);
      
      const highlightClass = isCurrentMatch ? 'bg-yellow-400' : 'bg-yellow-200';
      const highlightedMatch = `<span class="${highlightClass}">${matchText}</span>`;
      
      highlightedCode = beforeMatch + highlightedMatch + afterMatch;
      offset += highlightedMatch.length - matchText.length;
    });
    
    return highlightedCode;
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${isFullScreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Header */}
      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {filename || `${language.toUpperCase()} Code`}
          </span>
          {!readOnly && (
            <div className="flex items-center gap-1">
              {!isEditing ? (
                <Button size="sm" variant="outline" onClick={handleEdit}>
                  Edit
                </Button>
              ) : (
                <>
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSearch}
            className="h-8 w-8 p-0"
            title="Search (Ctrl+F)"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReplace}
            className="h-8 w-8 p-0"
            title="Replace (Ctrl+H)"
          >
            <Replace className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullScreen}
            className="h-8 w-8 p-0"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Search/Replace Bar */}
      {showSearch && (
        <div className="bg-blue-50 px-4 py-2 border-b flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="flex-1 h-8 text-sm"
            />
            {matches.length > 0 && (
              <span className="text-sm text-gray-600">
                {currentMatchIndex} of {matches.length}
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={navigateToPreviousMatch}
              disabled={matches.length === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={navigateToNextMatch}
              disabled={matches.length === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          
          {showReplace && (
            <div className="flex items-center gap-2">
              <Replace className="h-4 w-4 text-gray-500" />
              <Input
                ref={replaceInputRef}
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                placeholder="Replace with..."
                className="w-40 h-8 text-sm"
              />
              <Button size="sm" onClick={replaceCurrent} disabled={matches.length === 0}>
                Replace
              </Button>
              <Button size="sm" onClick={replaceAll} disabled={matches.length === 0}>
                Replace All
              </Button>
            </div>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSearch(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Code Editor */}
      <div className="relative" style={{ height }}>
        {showLineNumbers && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-50 border-r text-xs text-gray-500 overflow-hidden">
            <pre className="p-2 font-mono leading-6">
              {getLineNumbers()}
            </pre>
          </div>
        )}
        
        <ScrollArea className="h-full">
          <div className="flex">
            {showLineNumbers && <div className="w-12 flex-shrink-0" />}
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={code}
                onChange={handleCodeChange}
                onSelect={handleSelection}
                readOnly={readOnly}
                className="w-full h-full resize-none border-0 font-mono text-sm leading-6 p-2 focus:ring-0"
                style={{ 
                  height: '100%',
                  paddingLeft: showLineNumbers ? '0.5rem' : '0.5rem'
                }}
              />
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default CodeEditor;
