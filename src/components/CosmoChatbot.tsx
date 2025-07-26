import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Send, 
  Search,
  Bot, 
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CosmoChatbotProps {
  onRefreshConversions?: () => void;
}

const CosmoChatbot: React.FC<CosmoChatbotProps> = ({ onRefreshConversions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load conversation history from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('cosmo-chatbot-history');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
        setIsChatStarted(parsedMessages.length > 0);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('cosmo-chatbot-history', JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current && isChatStarted) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isChatStarted]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/.netlify/functions/cosmo-chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      toast({
        title: 'Chat Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setIsChatStarted(true);
    localStorage.removeItem('cosmo-chatbot-history');
    toast({
      title: 'New Chat Started',
      description: 'Ready to help you with your questions!',
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const clearHistory = () => {
    setMessages([]);
    setIsChatStarted(false);
    localStorage.removeItem('cosmo-chatbot-history');
    toast({
      title: 'History Cleared',
      description: 'Chat history has been cleared.',
    });
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className="rounded-full w-12 h-12 shadow-md bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-72 h-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-800">Cosmo Agents</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={closeChat}
              className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex flex-col h-full">
            {!isChatStarted ? (
              // Welcome Screen
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="text-center">
                  <Bot className="h-10 w-10 mx-auto text-blue-600 mb-3" />
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">AI Assistant</h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Expert help with Oracle, SQL, Sybase, Supabase, Git & GitHub
                  </p>
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Oracle Database & PL/SQL
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      SQL Queries & Optimization
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      Sybase Database Migration
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                      Supabase Backend Services
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      Git & GitHub Workflows
                    </div>
                  </div>

                  <Button
                    onClick={startNewChat}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2"
                  >
                    Start Chat
                  </Button>
                </div>
              </div>
            ) : (
              // Chat Interface
              <>
                {/* Search Bar */}
                <div className="p-2 border-b border-gray-200 bg-gray-50">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search messages..."
                      className="pl-7 h-7 text-xs"
                    />
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-2">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-2">
                      <Bot className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                      <p className="text-xs">Hello! How can I help you today?</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {(searchQuery ? filteredMessages : messages).map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[90%] rounded-lg px-2 py-1.5 text-xs ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <div className="flex items-start gap-1.5">
                              {message.role === 'assistant' && (
                                <Bot className="h-2.5 w-2.5 mt-0.5 text-blue-600 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                <p className="text-xs opacity-70 mt-0.5">
                                  {message.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                              {message.role === 'user' && (
                                <User className="h-2.5 w-2.5 mt-0.5 text-white flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-lg px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <Bot className="h-2.5 w-2.5 text-blue-600" />
                              <div className="flex space-x-0.5">
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-2 border-t border-gray-200 bg-white">
                  <div className="flex gap-1.5">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 h-7 text-xs"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 h-7 px-2"
                    >
                      <Send className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CosmoChatbot; 