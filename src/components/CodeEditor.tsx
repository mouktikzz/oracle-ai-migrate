
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { sql } from '@codemirror/lang-sql';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { searchKeymap, search, SearchQuery } from '@codemirror/search';

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
          effects: SearchQuery.set(searchTerm, false)
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
    <div className="w-full">
      <div className="rounded-md border bg-card">
        <div className="flex flex-wrap items-center justify-between p-2 bg-muted gap-2">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              className="border rounded px-2 py-1 text-sm w-32"
              disabled={readOnly && !isEditing}
            />
            <Button size="sm" variant="outline" onClick={handleSearch} disabled={!searchTerm}>Find</Button>
            <input
              type="number"
              min={1}
              placeholder="Go to line"
              value={goToLine}
              onChange={e => setGoToLine(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleGoToLine(); }}
              className="border rounded px-2 py-1 text-sm w-20 ml-2"
              disabled={readOnly && !isEditing}
            />
            <Button size="sm" variant="outline" onClick={handleGoToLine} disabled={!goToLine}>Go</Button>
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
