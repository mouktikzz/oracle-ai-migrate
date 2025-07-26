
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CodeEditorProps {
  initialCode: string;
  readOnly?: boolean;
  onSave?: (updatedCode: string) => void;
  height?: string;
  language?: 'sql' | 'plsql';
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
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const { toast } = useToast();
  
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
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
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    setCode(initialCode);
    setIsEditing(false);
    
    toast({
      title: 'Changes Discarded',
      description: 'Your code changes have been discarded.',
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
  
  // Simple syntax highlighting function (a real implementation would use a library like Prism)
  const getHighlightedCode = () => {
    if (!showLineNumbers) return code;
    
    const lines = code.split('\n');
    const paddingLength = lines.length.toString().length;
    
    return lines
      .map((line, index) => {
        const lineNumber = (index + 1).toString().padStart(paddingLength, ' ');
        return `${lineNumber} | ${line}`;
      })
      .join('\n');
  };
  
  return (
    <div className="w-full">
      <div className="rounded-md border bg-card">
        {!readOnly && (
          <div className="flex justify-end p-2 bg-muted gap-2">
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={handleEdit}>
                Edit
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleSave}>
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleRewriteWithAI} disabled={isRewriting}>
                  {isRewriting ? 'Rewriting...' : 'Rewrite with AI'}
                </Button>
              </>
            )}
          </div>
        )}
        
        <ScrollArea style={{ height }}>
          <Textarea
            value={isEditing ? code : getHighlightedCode()}
            onChange={handleCodeChange}
            className={`font-mono text-sm w-full h-full p-4 resize-none border-none focus-visible:ring-0 ${
              readOnly || !isEditing ? 'bg-slate-900 text-white' : ''
            }`}
            readOnly={readOnly || !isEditing}
            style={{ minHeight: height }}
          />
        </ScrollArea>
      </div>
    </div>
  );
};

export default CodeEditor;
