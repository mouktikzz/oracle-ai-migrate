
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CodeEditor from './CodeEditor';

interface CodeDiffViewerProps {
  originalCode: string;
  convertedCode: string;
  onUpdateConvertedCode?: (updatedCode: string) => void;
  readOnly?: boolean;
  originalFilename?: string;
  convertedFilename?: string;
}

const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({
  originalCode,
  convertedCode,
  onUpdateConvertedCode,
  readOnly = false,
  originalFilename,
  convertedFilename,
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Code Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">AI Generated Code</h3>
            <CodeEditor 
              initialCode={originalCode} 
              readOnly={true} 
              height="500px"
              language="sql"
              filename={originalFilename}
            />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">Final (Changed) Code</h3>
            <CodeEditor 
              initialCode={convertedCode} 
              readOnly={true} 
              height="500px"
              language="plsql"
              filename={convertedFilename}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeDiffViewer;
