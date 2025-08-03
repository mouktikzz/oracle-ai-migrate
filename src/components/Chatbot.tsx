import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '@/contexts/ChatbotContext';
import { sendChatMessage } from '@/api/chatbot';
import { ChatMessage, ChatbotSuggestion } from '@/types/chatbot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Bot, 
  User, 
  MessageSquare, 
  X, 
  Trash2, 
  Plus,
  Loader2,
  Code,
  Lightbulb,
  BookOpen,
  Settings,
  Minimize2,
  Maximize2,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Clock,
  Star
} from 'lucide-react';
import { ChatbotSettings } from './ChatbotSettings';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const quickSuggestions: ChatbotSuggestion[] = [
  {
    id: '1',
    text: 'How does the conversion process work in this project?',
    intent: 'migration_help',
    icon: 'Code'
  },
  {
    id: '2',
    text: 'Explain the project architecture and file structure',
    intent: 'code_explanation',
    icon: 'BookOpen'
  },
  {
    id: '3',
    text: 'How to use the AI conversion features in this app?',
    intent: 'best_practices',
    icon: 'Lightbulb'
  },
  {
    id: '4',
    text: 'What are the supported file formats and conversion types?',
    intent: 'data_type_mapping',
    icon: 'MessageSquare'
  }
];

const MessageBubble: React.FC<{ 
  message: ChatMessage; 
  onCopy?: (content: string, messageId: string) => void;
  copiedMessageId?: string | null;
  docsContext?: {
    file: string;
    description: string;
    sections: Array<{
      section: string;
      content: string;
      lineNumber: number;
    }>;
  }[];
}> = ({ message, onCopy, copiedMessageId, docsContext }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn(
      'flex gap-3 mb-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'flex gap-3 max-w-[85%]',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}>
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm',
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
            : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800'
        )}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
        
        <div className={cn(
          'rounded-2xl px-4 py-3 shadow-sm border',
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        )}>
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </div>
          {message.metadata?.codeBlock && (
            <div className="mt-3">
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto border border-gray-700">
                <code>{message.metadata.codeBlock}</code>
              </pre>
            </div>
          )}
          {docsContext && docsContext.length > 0 && !isUser && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                📚 Relevant Documentation
              </div>
              {docsContext.map((doc, index) => (
                <div key={index} className="mb-2 last:mb-0">
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {doc.file} - {doc.description}
                  </div>
                  {doc.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      <div className="font-medium">{section.section}</div>
                      <div className="mt-1">{section.content}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className={cn(
              'text-xs opacity-60',
              isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
            )}>
              {message.timestamp.toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-2">
              {!isUser && onCopy && (
                <Button
                  onClick={() => onCopy(message.content, message.id)}
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {copiedMessageId === message.id ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SuggestionButton: React.FC<{ 
  suggestion: ChatbotSuggestion; 
  onClick: (text: string) => void;
  disabled?: boolean;
}> = ({ suggestion, onClick, disabled }) => {
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Code': return <Code className="w-4 h-4" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4" />;
      case 'Lightbulb': return <Lightbulb className="w-4 h-4" />;
      case 'MessageSquare': return <MessageSquare className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const handleClick = () => {
    if (!disabled) {
      onClick(suggestion.text);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className="h-auto p-3 text-left whitespace-normal hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30 dark:hover:border-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900/30">
          {getIcon(suggestion.icon)}
        </div>
        <span className="text-xs leading-relaxed font-medium">{suggestion.text}</span>
      </div>
    </Button>
  );
};

export const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, className }) => {
  const { toast } = useToast();
  const {
    currentConversation,
    conversations,
    isLoading,
    error,
    createConversation,
    setCurrentConversation,
    addMessage,
    setLoading,
    setError
  } = useChatbot();

  const [showSettings, setShowSettings] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [size, setSize] = useState({ width: 600, height: 500 });

  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [docsContext, setDocsContext] = useState<{
    file: string;
    description: string;
    sections: Array<{
      section: string;
      content: string;
      lineNumber: number;
    }>;
  }[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    // Reset minimize state when chatbot opens
    if (isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  // Debug minimize state changes
  useEffect(() => {
    console.log('Minimize state changed to:', isMinimized);
  }, [isMinimized]);



  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && resizeRef.current) {
        const rect = resizeRef.current.getBoundingClientRect();
        const newWidth = Math.max(320, Math.min(800, e.clientX - rect.left));
        const newHeight = Math.max(400, Math.min(800, e.clientY - rect.top));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);





    const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Create conversation if needed
    if (!currentConversation) {
      const newConversationId = createConversation('New Conversation');
      
      // Create the user message first
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: messageText,
        role: 'user',
        timestamp: new Date(),
        type: 'text'
      };

      // Add the message to the new conversation immediately
      addMessage(newConversationId, userMessage);
      setInputValue('');
      setLoading(true);
      setError(null);

      try {
        const response = await sendChatMessage({
          message: messageText,
          conversationHistory: [userMessage], // Use the message we just created
          model: 'gemini'
        });

        addMessage(newConversationId, response.message);
        setSuggestions(response.suggestions || []);
        setDocsContext(response.docsContext || null);
      } catch (err) {
        console.error('Chatbot error:', err);
        setError('Failed to send message');
        toast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: messageText,
      role: 'user',
      timestamp: new Date(),
      type: 'text'
    };
    
    addMessage(currentConversation.id, userMessage);
    setInputValue('');
    setLoading(true);
    setError(null);

    try {
             const response = await sendChatMessage({
        message: messageText,
        conversationHistory: currentConversation.messages,
        model: 'gemini'
      });

      addMessage(currentConversation.id, response.message);
      setSuggestions(response.suggestions || []);
    } catch (err) {
      console.error('Chatbot error:', err);
      setError('Failed to send message');
      
      // Fallback response for common migration questions
      const fallbackResponse = getFallbackResponse(messageText);
      
      const fallbackMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: fallbackResponse,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
      
      addMessage(currentConversation.id, fallbackMessage);
      
      toast({
        title: 'AI Service Unavailable',
        description: 'Using fallback response. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const handleNewConversation = () => {
    createConversation('New Conversation');
    setSuggestions([]);
    setInputValue('');
    setDocsContext(null);
  };

  // Fallback responses for when AI is unavailable
  const getFallbackResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('conversion') || message.includes('process')) {
      return `**Migration Conversion Process:**

This project uses a multi-step conversion process:

1. **File Upload**: SQL files are uploaded through the web interface
2. **AI Analysis**: Google Gemini AI analyzes the Sybase code structure
3. **Code Conversion**: AI converts Sybase syntax to Oracle syntax
4. **Validation**: Converted code is validated for Oracle compatibility
5. **Download**: Users can download the converted Oracle code

**Key Features:**
- Supports stored procedures, functions, and DDL statements
- Handles data type mappings automatically
- Preserves business logic during conversion
- Provides detailed conversion reports

The process is designed to be accurate and efficient for Oracle migration projects.`;
    }
    
    if (message.includes('architecture') || message.includes('structure')) {
      return `**Project Architecture:**

**Frontend (React/TypeScript):**
- Built with Vite for fast development
- Uses Tailwind CSS for styling
- shadcn/ui components for UI consistency
- Monaco Editor for code editing

**Backend (Netlify Functions):**
- Serverless API endpoints
- AI integration with Google Gemini
- File processing and conversion logic

**Database (Supabase):**
- PostgreSQL-based database
- User authentication and data storage
- Real-time features and subscriptions

**AI Integration:**
- Google Gemini for code analysis
- OpenRouter as fallback AI service
- Custom prompts for migration context

This architecture ensures scalability, performance, and reliability.`;
    }
    
    if (message.includes('ai') || message.includes('features')) {
      return `**AI Conversion Features:**

**Core AI Capabilities:**
- **Code Analysis**: Understands Sybase syntax and structure
- **Syntax Conversion**: Converts to Oracle-compatible syntax
- **Data Type Mapping**: Automatically maps Sybase types to Oracle
- **Error Detection**: Identifies potential conversion issues

**Advanced Features:**
- **Context Awareness**: Understands your specific project
- **Smart Suggestions**: Provides follow-up questions and suggestions
- **Code Optimization**: Suggests Oracle-specific optimizations
- **Documentation**: Generates conversion notes and explanations

**Integration:**
- Seamless integration with the web interface
- Real-time processing and feedback
- Batch processing for multiple files
- Export capabilities for converted code

The AI is specifically trained for Oracle migration scenarios.`;
    }
    
    if (message.includes('file') || message.includes('format')) {
      return `**Supported File Formats:**

**Input Formats:**
- **SQL Files** (.sql): Sybase stored procedures and functions
- **DDL Scripts**: Database schema definitions
- **DML Scripts**: Data manipulation statements
- **Text Files**: Plain text with SQL code

**Conversion Types:**
- **Stored Procedures**: Convert Sybase procedures to Oracle PL/SQL
- **Functions**: Transform Sybase functions to Oracle functions
- **Data Types**: Map Sybase data types to Oracle equivalents
- **Syntax**: Convert Sybase-specific syntax to Oracle syntax

**Output Formats:**
- **Oracle SQL**: Ready-to-execute Oracle code
- **PL/SQL**: Oracle procedural language code
- **Documentation**: Conversion notes and explanations
- **Reports**: Detailed conversion analysis

All conversions maintain the original business logic while adapting to Oracle's syntax and features.`;
    }
    
    return `I'm the Migration Assistant, your AI-powered Oracle migration expert! 

I can help you with:
- **Code Conversion**: Sybase to Oracle migration
- **Architecture**: Project structure and setup
- **AI Features**: Understanding AI capabilities
- **File Formats**: Supported input/output types

Currently, I'm using a fallback response system. For the best experience, please try again when the AI service is available.

What would you like to know about your migration project?`;
  };

  const handleToggleMinimize = () => {
    console.log('Toggle minimize clicked, current state:', isMinimized);
    const newMinimizedState = !isMinimized;
    console.log('Setting minimized to:', newMinimizedState);
    setIsMinimized(newMinimizedState);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };



  // Copy message to clipboard
  const copyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast({
        title: 'Copied!',
        description: 'Message copied to clipboard.',
      });
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy message.',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={cn(
        'fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg flex flex-col z-50 transition-all duration-300 ease-in-out',
        isMinimized ? 'w-80 h-16' : 'min-w-[320px] max-w-[800px] min-h-[400px] max-h-[800px]',
        className
      )}
      style={{
        width: isMinimized ? '320px' : `${size.width}px`,
        height: isMinimized ? '64px' : `${size.height}px`,
        cursor: isResizing ? 'nw-resize' : 'default'
      }}
      ref={resizeRef}
    >
             {/* Header */}
                <div 
           className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20"
         >
         <div className="flex items-center gap-3">
           <div className="relative">
             <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
               <Bot className="w-5 h-5 text-white" />
             </div>
             <div className={cn(
               "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white transition-all duration-300",
               isMinimized ? "bg-yellow-400" : "bg-green-400 animate-pulse"
             )}></div>
           </div>
           <div>
             <h3 className="font-bold text-gray-900 dark:text-gray-100">
               {isMinimized ? 'Migration Assistant' : 'Migration Assistant'}
             </h3>
             <p className={cn(
               'text-xs text-gray-500 dark:text-gray-400 transition-opacity duration-300',
               isMinimized ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'
             )}>
               AI-Powered Oracle Migration
             </p>
           </div>
         </div>
         <div className="flex items-center gap-1">
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setShowSettings(true)}
             title="Settings"
             className="hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
           >
             <Settings className="w-4 h-4" />
           </Button>
           <Button
             variant="ghost"
             size="sm"
             onClick={handleNewConversation}
             title="New conversation"
             className="hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
           >
             <Plus className="w-4 h-4" />
           </Button>
           <Button
             variant="ghost"
             size="sm"
             onClick={handleToggleMinimize}
             title={isMinimized ? "Maximize Chatbot" : "Minimize Chatbot"}
             aria-label={isMinimized ? "Maximize chatbot" : "Minimize chatbot"}
             className={cn(
               "transition-all duration-200",
               isMinimized 
                 ? "hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600" 
                 : "hover:bg-blue-100 dark:hover:bg-blue-900/30"
             )}
           >
             {isMinimized ? (
               <Maximize2 className="w-4 h-4" />
             ) : (
               <Minimize2 className="w-4 h-4" />
             )}
           </Button>
           <Button
             variant="ghost"
             size="sm"
             onClick={onClose}
             title="Close"
             className="hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
           >
             <X className="w-4 h-4" />
           </Button>
         </div>
       </div>

       {/* Quick Actions Bar */}
       {!isMinimized && currentConversation && (
         <div className="flex items-center justify-between px-4 py-2 border-b bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-950/20">
           <div className="flex items-center gap-2">
             <Button
               onClick={handleNewConversation}
               variant="ghost"
               size="sm"
               className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 h-6 px-2"
             >
               <Plus className="h-3 w-3 mr-1" />
               New Chat
             </Button>
             <Button
               onClick={() => handleSendMessage("How does the conversion process work in this project?")}
               variant="ghost"
               size="sm"
               className="text-xs text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30 h-6 px-2"
             >
               <Zap className="h-3 w-3 mr-1" />
               Migration Help
             </Button>
           </div>
           <div className="text-xs text-gray-500 dark:text-gray-400">
             {currentConversation.messages.length} messages
           </div>
         </div>
       )}

                           {/* Messages */}
        {!isMinimized && (
          <ScrollArea className="flex-1 p-4">
                     {!currentConversation || currentConversation.messages.length === 0 ? (
             <div className="text-center py-8">
               <h4 className="font-bold text-xl mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                 Welcome to Migration Assistant
               </h4>
               <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 max-w-sm mx-auto">
                 I'm here to help you with your Sybase to Oracle migration. Ask me anything!
               </p>
               
               {/* Quick Question Buttons */}
               <div className="flex flex-wrap gap-2 mb-4 justify-center">
                 <Button
                   onClick={() => handleSendMessage("How does the conversion process work in this project?")}
                   variant="outline"
                   size="sm"
                   className="text-xs h-7 px-2"
                 >
                   Conversion Process
                 </Button>
                 <Button
                   onClick={() => handleSendMessage("Explain the project architecture and file structure")}
                   variant="outline"
                   size="sm"
                   className="text-xs h-7 px-2"
                 >
                   Architecture
                 </Button>
                 <Button
                   onClick={() => handleSendMessage("How to use the AI conversion features in this app?")}
                   variant="outline"
                   size="sm"
                   className="text-xs h-7 px-2"
                 >
                   AI Features
                 </Button>
                 <Button
                   onClick={() => handleSendMessage("What are the supported file formats and conversion types?")}
                   variant="outline"
                   size="sm"
                   className="text-xs h-7 px-2"
                 >
                   File Formats
                 </Button>
               </div>
               
               <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto"></div>
             </div>
          ) : (
                         <div>
               {currentConversation.messages.map((message, index) => (
                 <MessageBubble 
                   key={message.id} 
                   message={message} 
                   onCopy={copyMessage}
                   copiedMessageId={copiedMessageId}
                   docsContext={message.role === 'assistant' && index === currentConversation.messages.length - 1 ? docsContext : undefined}
                 />
               ))}
                           {isLoading && (
               <div className="flex gap-3 mb-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-sm">
                   <Bot className="w-4 h-4" />
                 </div>
                 <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-sm">
                   <div className="flex items-center gap-3">
                     <div className="flex space-x-1">
                       <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                       <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                       <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                     </div>
                     <span className="text-sm text-gray-600 dark:text-gray-300">Thinking...</span>
                   </div>
                 </div>
               </div>
             )}
              <div ref={messagesEndRef} />
            </div>
          )}
          </ScrollArea>
        )}

               {/* Quick Suggestions - Only visible when no conversation exists */}
        {!isMinimized && !currentConversation && (
         <div className="p-4 border-t">
           <p className="text-xs text-muted-foreground mb-2">Quick Start:</p>
           <div className="grid grid-cols-2 gap-2">
             {quickSuggestions.map((suggestion) => (
               <SuggestionButton
                 key={suggestion.id}
                 suggestion={suggestion}
                 onClick={handleSuggestionClick}
                 disabled={isLoading}
               />
             ))}
           </div>
         </div>
       )}

             {/* Suggestions - Only show when there are suggestions and no messages yet */}
       {!isMinimized && suggestions.length > 0 && (!currentConversation || currentConversation.messages.length === 0) && (
         <div className="p-4 border-t">
           <p className="text-xs text-muted-foreground mb-2">Suggestions:</p>
           <div className="flex flex-wrap gap-2">
             {suggestions.map((suggestion, index) => (
               <Button
                 key={index}
                 variant="outline"
                 size="sm"
                 onClick={() => handleSuggestionClick(suggestion)}
                 className="text-xs"
               >
                 {suggestion}
               </Button>
             ))}
           </div>
         </div>
       )}

             {/* Input */}
       {!isMinimized && (
         <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-950/20">
         <div className="flex gap-3">
           <Input
             ref={inputRef}
             value={inputValue}
             onChange={(e) => setInputValue(e.target.value)}
             onKeyPress={handleKeyPress}
             placeholder="Ask about migration, code, or best practices..."
             disabled={isLoading}
             className="flex-1 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 rounded-xl shadow-sm"
           />
           <Button
             onClick={() => handleSendMessage(inputValue)}
             disabled={!inputValue.trim() || isLoading}
             size="icon"
             className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
           >
             <Send className="w-4 h-4" />
           </Button>
         </div>
       </div>
       )}

      {/* Resize handle */}
      {!isMinimized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize opacity-50 hover:opacity-100 transition-opacity"
          onMouseDown={handleResizeStart}
          style={{ cursor: 'nw-resize' }}
        >
          <div className="w-full h-full flex items-end justify-end">
            <div className="w-2 h-2 border-r-2 border-b-2 border-muted-foreground rounded-br-sm"></div>
          </div>
        </div>
      )}

      <ChatbotSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
}; 