export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  type: 'text' | 'code' | 'error' | 'success';
  metadata?: {
    codeBlock?: string;
    language?: string;
    fileId?: string;
    conversionId?: string;
    suggestions?: string[];
  };
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface ChatbotConfig {
  model: 'gemini' | 'openai' | 'qwen';
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface ChatbotContext {
  currentConversation: ChatConversation | null;
  conversations: ChatConversation[];
  isLoading: boolean;
  error: string | null;
  config: ChatbotConfig;
  createConversation: (title: string) => string;
  setCurrentConversation: (conversation: ChatConversation | null) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateConversationTitle: (conversationId: string, title: string) => void;
  deleteConversation: (conversationId: string) => void;
  clearConversation: (conversationId: string) => void;
  updateConfig: (config: Partial<ChatbotConfig>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface ChatbotResponse {
  message: ChatMessage;
  suggestions?: string[];
  relatedFiles?: string[];
  codeExamples?: {
    code: string;
    language: string;
    description: string;
  }[];
  docsContext?: {
    file: string;
    description: string;
    sections: Array<{
      section: string;
      content: string;
      lineNumber: number;
    }>;
  }[];
}

export type ChatbotIntent = 
  | 'code_explanation'
  | 'migration_help'
  | 'data_type_mapping'
  | 'syntax_help'
  | 'error_resolution'
  | 'best_practices'
  | 'general_question'
  | 'file_analysis';

export interface ChatbotSuggestion {
  id: string;
  text: string;
  intent: ChatbotIntent;
  icon?: string;
} 