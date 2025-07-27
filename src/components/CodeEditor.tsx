
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { sql } from '@codemirror/lang-sql';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { searchKeymap, search, SearchQuery, setSearchQuery } from '@codemirror/search';
import { Search, Hash, X } from 'lucide-react';

interface CodeEditorProps {
  initialCode: string;
  readOnly?: boolean;
  onSave?: (updatedCode: string) => void;
  height?: string;
  language?: 'sql' | 'plsql' | 'js' | 'javascript';
  showLineNumbers?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode,
  readOnly = false,
  onSave,
  height = '400px',
  language = 'sql',
  showLineNumbers = true,
}) => {
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
    toast({
      title: 'Changes Discarded',
      description: 'Your code changes have been discarded.',
    });
  };

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
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleSave}>
                  Save
                </Button>
              </div>
            )}
          </div>
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
      </div>
    </div>
  );
};

export default CodeEditor;
