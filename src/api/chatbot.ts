import { ChatMessage, ChatbotResponse } from '@/types/chatbot';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8888/.netlify/functions' 
  : '/.netlify/functions';

export interface ChatbotRequest {
  message: string;
  conversationHistory: ChatMessage[];
  model?: 'qwen' | 'gemini';
}

export interface ChatbotAPIResponse {
  message: string;
  intent: string;
  suggestions: string[];
  timestamp: string;
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

export const sendChatMessage = async (request: ChatbotRequest): Promise<ChatbotResponse> => {
  try {
    console.log('Sending request to:', `${API_BASE_URL}/chatbot`);
    console.log('Request payload:', request);
    
    const response = await fetch(`${API_BASE_URL}/chatbot?t=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      body: JSON.stringify(request),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data: ChatbotAPIResponse = await response.json();
    console.log('Response data:', data);

    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: data.message,
      role: 'assistant',
      timestamp: new Date(data.timestamp),
      type: 'text',
      metadata: {
        suggestions: data.suggestions,
        source: data.source,
      },
    };

    return {
      message: assistantMessage,
      suggestions: data.suggestions,
      docsContext: data.docsContext,
    };
  } catch (error) {
    console.error('Chatbot API error:', error);
    throw new Error('Failed to send message to chatbot');
  }
};

export const analyzeCodeWithChatbot = async (
  code: string,
  language: string = 'sql',
  context?: string
): Promise<ChatbotResponse> => {
  const message = context 
    ? `${context}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``
    : `Please analyze this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``;

  return sendChatMessage({
    message,
    conversationHistory: [],
    model: 'gemini',
  });
};

export const getMigrationHelp = async (topic: string): Promise<ChatbotResponse> => {
  const message = `I need help with ${topic} in my Sybase to Oracle migration. Can you provide guidance and best practices?`;

  return sendChatMessage({
    message,
    conversationHistory: [],
    model: 'gemini',
  });
}; 