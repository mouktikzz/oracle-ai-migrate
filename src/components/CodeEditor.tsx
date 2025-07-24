
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { sql } from '@codemirror/lang-sql';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

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
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const { toast } = useToast();

  // Language extensions
  const getExtensions = () => {
    if (language === 'sql' || language === 'plsql') return [sql()];
    if (language === 'js' || language === 'javascript') return [javascript()];
    return [];
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
    if (!selection || selection.from === selection.to) {
      toast({ title: 'No code selected', description: 'Please highlight code to rewrite.' });
      return;
    }
    setShowRewritePrompt(true);
  };

  const handleRewriteSubmit = async () => {
    if (!selection || selection.from === selection.to || !rewritePrompt.trim()) return;
    setRewriteLoading(true);
    try {
      const selectedCode = code.slice(selection.from, selection.to);
      // Call your backend AI API here
      const response = await fetch('/api/ai-rewrite', {
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
        toast({ title: 'Rewrite Failed', description: 'AI did not return a rewrite.' });
      }
    } catch (err) {
      toast({ title: 'Rewrite Failed', description: 'An error occurred during AI rewrite.' });
    } finally {
      setRewriteLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-md border bg-card">
        {!readOnly && (
          <div className="flex justify-between p-2 bg-muted">
            <div>
              {isEditing && (
                <Button variant="outline" size="sm" onClick={handleRewrite} disabled={rewriteLoading}>
                  Rewrite with AI
                </Button>
              )}
            </div>
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
        )}
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
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-2">Rewrite Selected Code with AI</h3>
              <textarea
                className="w-full border rounded p-2 mb-4"
                rows={3}
                placeholder="Describe how you want the code rewritten..."
                value={rewritePrompt}
                onChange={e => setRewritePrompt(e.target.value)}
                disabled={rewriteLoading}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowRewritePrompt(false)} disabled={rewriteLoading}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleRewriteSubmit} disabled={rewriteLoading || !rewritePrompt.trim()}>
                  {rewriteLoading ? 'Rewriting...' : 'Rewrite'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
