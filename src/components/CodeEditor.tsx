
<<<<<<< HEAD
import React, { useState, useRef, useEffect } from 'react';
=======
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
>>>>>>> 71985dc3a7b1d56ab2ab9c63463807d7eb1f2fbe
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
<<<<<<< HEAD
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { sql } from '@codemirror/lang-sql';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { searchKeymap, search, SearchQuery, setSearchQuery } from '@codemirror/search';
import { Search, Hash, X } from 'lucide-react';
=======
import { Search, X, ChevronUp, ChevronDown, Replace, ChevronRight, ChevronLeft, Maximize2, Minimize2 } from 'lucide-react';
>>>>>>> 71985dc3a7b1d56ab2ab9c63463807d7eb1f2fbe

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
<<<<<<< HEAD
  const [code, setCode] = useState<string>(initialCode);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showRewritePrompt, setShowRewritePrompt] = useState(false);
  const [rewritePrompt, setRewritePrompt] = useState('');
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [selection, setSelection] = useState<{ from: number; to: number } | null>(null);
  const [rewriteInProgress, setRewriteInProgress] = useState(false);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [goToLine, setGoToLine] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showGoTo, setShowGoTo] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const goToInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts for search/go-to
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSearch(true);
        setShowGoTo(false);
        setTimeout(() => searchInputRef.current?.focus(), 10);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setShowGoTo(true);
        setShowSearch(false);
        setTimeout(() => goToInputRef.current?.focus(), 10);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowGoTo(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close overlays
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        showSearch && searchInputRef.current && !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSearch(false);
      }
      if (
        showGoTo && goToInputRef.current && !goToInputRef.current.contains(e.target as Node)
      ) {
        setShowGoTo(false);
      }
    }
    if (showSearch || showGoTo) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSearch, showGoTo]);

  // Language extensions
  const getExtensions = () => {
    let exts = [];
    if (language === 'sql' || language === 'plsql') exts.push(sql());
    if (language === 'js' || language === 'javascript') exts.push(javascript());
    exts.push(search({ top: true }));
    exts.push(EditorView.lineWrapping);
    return exts;
  };

  // Save logic
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
=======
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
>>>>>>> 71985dc3a7b1d56ab2ab9c63463807d7eb1f2fbe
    toast({
      title: 'Changes Saved',
      description: 'Your code changes have been saved.',
    });
  };

<<<<<<< HEAD
  // Selection logic for CodeMirror
  const handleSelection = (view: EditorView) => {
    const sel = view.state.selection.main;
    if (sel.from !== sel.to) {
      setSelection({ from: sel.from, to: sel.to });
    } else {
      setSelection(null);
    }
  };

  // AI Rewrite logic
  const handleRewrite = () => {
    if (rewriteInProgress) return;
    if (!selection || selection.from === selection.to) {
      toast({ title: 'No code selected', description: 'Please highlight code to rewrite.' });
      return;
    }
    setShowRewritePrompt(true);
  };

  const handleRewriteSubmit = async () => {
    if (rewriteInProgress) return;
    if (!selection || selection.from === selection.to || !rewritePrompt.trim()) return;
    setRewriteLoading(true);
    setRewriteInProgress(true);
    try {
      const selectedCode = code.slice(selection.from, selection.to);
      // Call your Netlify function AI API here
      const response = await fetch('/.netlify/functions/ai-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: selectedCode, prompt: rewritePrompt, language }),
      });
      const data = await response.json();
      if (data.rewrittenCode) {
        const newCode = code.slice(0, selection.from) + data.rewrittenCode + code.slice(selection.to);
        setCode(newCode);
        setShowRewritePrompt(false);
        setRewritePrompt('');
        setSelection(null);
        toast({ title: 'AI Rewrite Complete', description: 'The selected code was rewritten by AI.' });
      } else {
        toast({ title: 'Rewrite Failed', description: data.error || 'AI did not return a rewrite.' });
      }
    } catch (err) {
      toast({ title: 'Rewrite Failed', description: 'An error occurred during AI rewrite.' });
    } finally {
      setRewriteLoading(false);
      setRewriteInProgress(false);
    }
  };

  const handleSearch = () => {
    if (editorRef.current && searchTerm) {
      const view = editorRef.current.view;
      if (view) {
        view.dispatch({
          effects: setSearchQuery.of(new SearchQuery({ search: searchTerm }))
        });
      }
    }
  };

  const handleGoToLine = () => {
    if (editorRef.current && goToLine) {
      const view = editorRef.current.view;
      if (view) {
        const line = Math.max(1, Math.min(Number(goToLine), view.state.doc.lines));
        const pos = view.state.doc.line(line).from;
        view.dispatch({ selection: { anchor: pos }, scrollIntoView: true });
      }
    }
  };

  return (
    <div className="w-full relative">
      {/* Floating search/go-to icons */}
      <div className="absolute top-2 right-2 z-20 flex gap-2">
        <button
          type="button"
          className="p-1 rounded hover:bg-muted/70"
          title="Search (Ctrl+F)"
          onClick={() => {
            setShowSearch(true);
            setShowGoTo(false);
            setTimeout(() => searchInputRef.current?.focus(), 10);
          }}
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="p-1 rounded hover:bg-muted/70"
          title="Go to Line (Ctrl+G)"
          onClick={() => {
            setShowGoTo(true);
            setShowSearch(false);
            setTimeout(() => goToInputRef.current?.focus(), 10);
          }}
        >
          <Hash className="h-4 w-4" />
        </button>
      </div>
      {/* Floating Search Overlay */}
      {showSearch && (
        <div className="absolute top-2 right-12 z-30 bg-white/95 dark:bg-slate-900/95 border rounded shadow flex items-center px-2 py-1 gap-2" style={{ minWidth: 180 }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { handleSearch(); setShowSearch(false); } if (e.key === 'Escape') setShowSearch(false); }}
            className="border rounded px-2 py-1 text-sm w-28 bg-transparent outline-none"
            autoFocus
          />
          <button onClick={() => { handleSearch(); setShowSearch(false); }} className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80">Find</button>
          <button onClick={() => setShowSearch(false)} className="ml-1"><X className="h-4 w-4" /></button>
        </div>
      )}
      {/* Floating Go To Line Overlay */}
      {showGoTo && (
        <div className="absolute top-2 right-12 z-30 bg-white/95 dark:bg-slate-900/95 border rounded shadow flex items-center px-2 py-1 gap-2" style={{ minWidth: 180 }}>
          <input
            ref={goToInputRef}
            type="number"
            min={1}
            placeholder="Go to line"
            value={goToLine}
            onChange={e => setGoToLine(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { handleGoToLine(); setShowGoTo(false); } if (e.key === 'Escape') setShowGoTo(false); }}
            className="border rounded px-2 py-1 text-sm w-20 bg-transparent outline-none"
            autoFocus
          />
          <button onClick={() => { handleGoToLine(); setShowGoTo(false); }} className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80">Go</button>
          <button onClick={() => setShowGoTo(false)} className="ml-1"><X className="h-4 w-4" /></button>
        </div>
      )}
      <div className="rounded-md border bg-card">
        <div className="flex flex-wrap items-center justify-between p-2 bg-muted gap-2">
          <div className="flex gap-2 items-center">
            {/* Search and Go To Line inputs are now floating */}
          </div>
          {!readOnly && (
            <div>
              {isEditing && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRewrite}
                          disabled={!selection || selection.from === selection.to || rewriteLoading || rewriteInProgress}
                        >
                          {rewriteLoading || rewriteInProgress ? 'Rewriting...' : 'Rewrite with AI'}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Select code to rewrite
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
          <div>
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={handleEdit}>
                Edit
=======
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
        {/* Minimal Top Bar with filename on left and full-screen button on right */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{filename || 'main.py'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Press F11 to exit</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullScreen}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="Exit Full Screen (F11)"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Full Screen Code Editor */}
        <div className="flex-1 overflow-hidden relative">
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
>>>>>>> 71985dc3a7b1d56ab2ab9c63463807d7eb1f2fbe
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
<<<<<<< HEAD
        </div>
        <div style={{ height }}>
          <CodeMirror
            value={code}
            height={height}
            theme={oneDark}
            extensions={getExtensions()}
            readOnly={readOnly || !isEditing}
            onChange={(value) => setCode(value)}
            onUpdate={(viewUpdate) => {
              if (isEditing && viewUpdate.view) handleSelection(viewUpdate.view);
            }}
            basicSetup={{ lineNumbers: showLineNumbers }}
            ref={editorRef}
          />
        </div>
        {/* AI Rewrite Prompt Modal */}
        {showRewritePrompt && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[80vh] flex flex-col">
              <h3 className="text-lg font-semibold mb-2">Rewrite Selected Code with AI</h3>
              <textarea
                className="w-full border rounded p-2 mb-4"
                rows={3}
                placeholder="Describe how you want the code rewritten..."
                value={rewritePrompt}
                onChange={e => setRewritePrompt(e.target.value)}
                disabled={rewriteLoading}
              />
              <ScrollArea className="flex-1 min-h-[60px] max-h-[40vh] mb-2">
                {/* If you want to show the AI response here, add it as needed */}
              </ScrollArea>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowRewritePrompt(false)} disabled={rewriteLoading}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleRewriteSubmit} disabled={rewriteLoading || rewriteInProgress || !rewritePrompt.trim()}>
                  {rewriteLoading || rewriteInProgress ? 'Rewriting...' : 'Rewrite'}
                </Button>
              </div>
              {/* Error message for failed rewrite */}
              {rewriteLoading === false && selection && selection.from !== selection.to && !rewritePrompt.trim() && (
                <div className="text-red-600 mt-2 text-sm">Please enter a suggestion for the rewrite.</div>
              )}
            </div>
          </div>
        )}
=======
        )}
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div className="rounded-md border bg-card">
        {/* Full Screen Button */}
        <div className="flex items-center justify-between p-2 border-b bg-white">
          <div className="text-sm text-gray-700">{filename || 'main.py'}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullScreen}
            className="h-8 w-8 p-0 hover:bg-gray-100"
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
                 className="select-none text-right pr-4 py-4 bg-white border-r border-gray-200 text-gray-400"
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
>>>>>>> 71985dc3a7b1d56ab2ab9c63463807d7eb1f2fbe
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
