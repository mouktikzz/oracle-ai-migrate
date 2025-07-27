
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, X, ChevronUp, ChevronDown, Replace, ChevronRight, ChevronLeft, Maximize2, Minimize2 } from 'lucide-react';

interface CodeEditorProps {
  initialCode: string;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  onSave?: (updatedCode: string) => void;
  height?: string;
  language?: 'sql' | 'plsql';
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
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
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

  // Handle full screen keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        setIsFullScreen(!isFullScreen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Find all matches in the code
  const findMatches = useCallback((searchText: string): SearchMatch[] => {
    if (!searchText) return [];
    
    const matches: SearchMatch[] = [];
    const lines = code.split('\n');
    let charIndex = 0;
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      let searchString = searchText;
      let lineText = line;
      
      if (!caseSensitive) {
        searchString = searchString.toLowerCase();
        lineText = line.toLowerCase();
      }
      
      if (useRegex) {
        try {
          const flags = caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(searchString, flags);
          let match;
          while ((match = regex.exec(line)) !== null) {
            matches.push({
              start: charIndex + match.index,
              end: charIndex + match.index + match[0].length,
              line: lineIndex,
              column: match.index
            });
          }
        } catch (e) {
          // Invalid regex, ignore
        }
      } else {
        let index = 0;
        while ((index = lineText.indexOf(searchString, index)) !== -1) {
          matches.push({
            start: charIndex + index,
            end: charIndex + index + searchString.length,
            line: lineIndex,
            column: index
          });
          index += 1;
        }
      }
      
      charIndex += line.length + 1; // +1 for newline
    }
    
    return matches;
  }, [code, caseSensitive, useRegex]);

  // Update matches when search term changes
  useEffect(() => {
    const newMatches = findMatches(searchTerm);
    setMatches(newMatches);
    setCurrentMatchIndex(newMatches.length > 0 ? 0 : -1);
    
    // Auto-scroll to first match when search term changes
    if (newMatches.length > 0) {
      setTimeout(() => scrollToMatch(newMatches[0]), 100);
    }
  }, [searchTerm, findMatches]);

  // Auto-scroll to first match when search is opened
  useEffect(() => {
    if (showSearch && matches.length > 0 && currentMatchIndex === 0) {
      setTimeout(() => scrollToMatch(matches[0]), 150);
    }
  }, [showSearch, matches, currentMatchIndex]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      
      if (e.key === 'Escape' && showSearch) {
        e.preventDefault();
        setShowSearch(false);
        setSearchTerm('');
        setMatches([]);
        setCurrentMatchIndex(-1);
      }
      
      if (showSearch && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          navigateToPreviousMatch();
        } else {
          navigateToNextMatch();
        }
      }
      
      if (showSearch && e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        setShowReplace(!showReplace);
        setTimeout(() => {
          if (showReplace) {
            // If we're hiding replace, focus back to search
            searchInputRef.current?.focus();
          } else {
            // If we're showing replace, focus to replace input
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
        // Select all text in the search input
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
  }, [showSearch, matches, currentMatchIndex]);

  const navigateToNextMatch = () => {
    if (matches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIndex);
    scrollToMatch(matches[nextIndex]);
  };

  const navigateToPreviousMatch = () => {
    if (matches.length === 0) return;
    const prevIndex = currentMatchIndex <= 0 ? matches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    scrollToMatch(matches[prevIndex]);
  };

  const scrollToMatch = (match: SearchMatch) => {
    // Find the scrollable container (ScrollArea's viewport)
    const scrollContainer = scrollContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!scrollContainer) return;
    
    if (!readOnly && textareaRef.current) {
      // Set selection to highlight the match for editable mode
      textareaRef.current.setSelectionRange(match.start, match.end);
      textareaRef.current.focus();
    }
    
    // Calculate the actual position of the match
    const lines = code.split('\n');
    const lineHeight = 24; // More accurate line height including padding
    const lineNumberWidth = showLineNumbers ? 48 : 0; // Width of line numbers column
    const padding = 16; // Top and bottom padding
    
    // Calculate the match position relative to the scroll container
    const matchTop = (match.line * lineHeight) + padding;
    const matchBottom = matchTop + lineHeight;
    
    const scrollTop = scrollContainer.scrollTop;
    const clientHeight = scrollContainer.clientHeight;
    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + clientHeight;
    
    // Check if match is outside viewport and scroll accordingly
    if (matchTop < viewportTop) {
      // Match is above viewport - scroll to show it at top with some margin
      scrollContainer.scrollTop = Math.max(0, matchTop - 20);
    } else if (matchBottom > viewportBottom) {
      // Match is below viewport - scroll to show it at bottom with some margin
      scrollContainer.scrollTop = matchBottom - clientHeight + 20;
    }
  };

  const replaceCurrent = () => {
    if (currentMatchIndex === -1 || matches.length === 0) return;
    
    const match = matches[currentMatchIndex];
    const newCode = code.slice(0, match.start) + replaceTerm + code.slice(match.end);
    setCode(newCode);
    if (onChange) onChange(newCode);
    
    // Update matches after replacement
    const newMatches = findMatches(searchTerm);
    setMatches(newMatches);
    setCurrentMatchIndex(Math.min(currentMatchIndex, newMatches.length - 1));
  };

  const replaceAll = () => {
    if (matches.length === 0) return;
    
    let newCode = code;
    let offset = 0;
    
    // Replace all matches from end to start to maintain indices
    const sortedMatches = [...matches].sort((a, b) => b.start - a.start);
    
    for (const match of sortedMatches) {
      newCode = newCode.slice(0, match.start + offset) + replaceTerm + newCode.slice(match.end + offset);
      offset += replaceTerm.length - (match.end - match.start);
    }
    
    setCode(newCode);
    if (onChange) onChange(newCode);
    setMatches([]);
    setCurrentMatchIndex(-1);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    if (onChange) onChange(e.target.value);
  };

  const handleSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    if (onSelectionChange) {
      const target = e.target as HTMLTextAreaElement;
      onSelectionChange({ start: target.selectionStart, end: target.selectionEnd });
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
      setCode(data.rewrittenCode || code);
      if (onChange) onChange(data.rewrittenCode || code);
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

  // Highlight matches in the code
  const highlightMatches = (text: string) => {
    if (!searchTerm || matches.length === 0) return text;
    
    const lines = text.split('\n');
    const highlightedLines = lines.map((line, lineIndex) => {
      let highlightedLine = line;
      const lineMatches = matches.filter(m => m.line === lineIndex);
      
      // Apply highlights from end to start to maintain indices
      const sortedMatches = lineMatches.sort((a, b) => b.column - a.column);
      
      for (const match of sortedMatches) {
        const before = highlightedLine.slice(0, match.column);
        const matchText = highlightedLine.slice(match.column, match.column + (match.end - match.start));
        const after = highlightedLine.slice(match.column + (match.end - match.start));
        
        const isCurrentMatch = matches[currentMatchIndex]?.start === match.start && 
                              matches[currentMatchIndex]?.end === match.end;
        
        const highlightClass = isCurrentMatch ? 'bg-yellow-400' : 'bg-yellow-200';
        highlightedLine = before + `<span class="${highlightClass}">${matchText}</span>` + after;
      }
      
      return highlightedLine;
    });
    
    return highlightedLines.join('\n');
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Minimal Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{filename || 'main.py'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Press F11 to exit</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullScreen}
              className="h-8 w-8 p-0 hover:bg-gray-200"
              title="Exit Full Screen (F11)"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Full Screen Code Editor */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full bg-white">
            <ScrollArea ref={scrollContainerRef} className="h-full">
              <div className="flex font-mono text-sm w-full h-full p-0 bg-white">
                {/* Line numbers column */}
                {showLineNumbers && (
                  <div
                    className="select-none text-right pr-4 py-4 bg-gray-50/30 border-r border-gray-200/50 text-gray-400 sticky left-0"
                    style={{ userSelect: 'none', minWidth: '3.5em' }}
                    aria-hidden="true"
                  >
                    {code.split('\n').map((_, i) => (
                      <div key={i} style={{ height: '1.5em', lineHeight: '1.5em' }}>{i + 1}</div>
                    ))}
                  </div>
                )}
                {/* Code column */}
                <div className="flex-1 py-4 px-4 relative">
                  {readOnly ? (
                    <pre
                      ref={preRef}
                      className="w-full h-full bg-transparent text-gray-900 whitespace-pre-wrap focus:outline-none"
                      style={{ fontFamily: 'inherit', fontSize: 'inherit', margin: 0 }}
                      tabIndex={0}
                      dangerouslySetInnerHTML={{ __html: highlightMatches(code) }}
                    />
                  ) : (
                    <Textarea
                      ref={textareaRef}
                      value={code}
                      onChange={handleCodeChange}
                      onSelect={handleSelection}
                      className="w-full h-full p-0 border-none focus-visible:ring-0 bg-transparent text-gray-900 resize-none"
                      style={{ fontFamily: 'inherit', fontSize: 'inherit' }}
                    />
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
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
                {matches.length > 0 && (
                  <span>
                    {currentMatchIndex + 1} of {matches.length}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={navigateToPreviousMatch}
                  disabled={matches.length === 0}
                  className="h-6 w-6 p-0"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={navigateToNextMatch}
                  disabled={matches.length === 0}
                  className="h-6 w-6 p-0"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div className="rounded-md border bg-card">
        {/* Full Screen Button */}
        <div className="flex items-center justify-between p-2 border-b bg-gray-50">
          <div className="text-sm text-gray-600">Code Editor</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullScreen}
            className="h-8 w-8 p-0"
            title="Full Screen (F11)"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea ref={scrollContainerRef} style={{ height }}>
          <div
            className={`flex font-mono text-sm w-full h-full p-0 bg-white`}
            style={{ minHeight: height }}
          >
            {/* Line numbers column */}
            {showLineNumbers && (
              <div
                className="select-none text-right pr-4 py-4 bg-gray-50 border-r border-gray-200 text-gray-400"
                style={{ userSelect: 'none', minWidth: '3em' }}
                aria-hidden="true"
              >
                {code.split('\n').map((_, i) => (
                  <div key={i} style={{ height: '1.5em', lineHeight: '1.5em' }}>{i + 1}</div>
                ))}
              </div>
            )}
            {/* Code column */}
            <div className="flex-1 py-4 relative">
              {readOnly ? (
                <pre
                  ref={preRef}
                  className="w-full h-full bg-white text-black whitespace-pre-wrap focus:outline-none"
                  style={{ minHeight: height, fontFamily: 'inherit', fontSize: 'inherit', margin: 0 }}
                  tabIndex={0}
                  dangerouslySetInnerHTML={{ __html: highlightMatches(code) }}
                />
              ) : (
                <Textarea
                  ref={textareaRef}
                  value={code}
                  onChange={handleCodeChange}
                  onSelect={handleSelection}
                  className="w-full h-full p-0 border-none focus-visible:ring-0 bg-white text-black"
                  style={{ minHeight: height, fontFamily: 'inherit', fontSize: 'inherit' }}
                />
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Search Overlay */}
      {showSearch && (
        <div className="absolute top-2 right-2 bg-white border rounded-lg shadow-lg p-3 z-50 min-w-[400px]">
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
              {matches.length > 0 && (
                <span>
                  {currentMatchIndex + 1} of {matches.length}
                </span>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={navigateToPreviousMatch}
                disabled={matches.length === 0}
                className="h-6 w-6 p-0"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={navigateToNextMatch}
                disabled={matches.length === 0}
                className="h-6 w-6 p-0"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
