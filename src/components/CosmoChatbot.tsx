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
  RefreshCw, 
  Bot, 
  User,
  Sparkles
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
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
      // Prepare conversation history for context
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

  const handleRefreshConversions = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      if (onRefreshConversions) {
        await onRefreshConversions();
      }
      toast({
        title: 'Refresh Complete',
        description: 'Conversions have been refreshed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Refresh Error',
        description: 'Failed to refresh conversions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
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
    // Focus input after a short delay
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

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className="rounded-full w-16 h-16 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-2 border-white/20 transition-all duration-300 hover:scale-110"
      >
        {isOpen ? (
          <X className="h-7 w-7" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-7 w-7" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300" />
          </div>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="absolute bottom-20 right-0 w-96 h-[500px] shadow-xl border border-gray-200 bg-white">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Cosmo Agents
                </CardTitle>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  AI Assistant
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRefreshConversions}
                  disabled={isRefreshing}
                  className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600"
                  title="Refresh Conversions"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={closeChat}
                  className="h-8 w-8 p-0 text-gray-600 hover:text-red-600"
                  title="Close Chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Expert assistance for Oracle, SQL, Sybase, Supabase, Git, GitHub, and database technologies
            </p>
          </CardHeader>

          <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
              {!isChatStarted ? (
                <div className="p-6 text-center">
                  <div className="mb-6">
                    <Bot className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Cosmo Agents AI</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Your expert assistant for database technologies and development tools
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 mb-6 max-w-xs mx-auto">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Oracle Database & PL/SQL</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">SQL Queries & Optimization</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Sybase Database Migration</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Supabase Backend Services</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Git & GitHub Workflows</span>
                    </div>
                  </div>

                  <Button
                    onClick={startNewChat}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg shadow-md font-medium"
                  >
                    Start Conversation
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-full p-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <Bot className="h-12 w-12 mx-auto mb-3 text-blue-500" />
                      <p className="text-sm mb-4">Hello! I'm ready to help you with database and development questions.</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge variant="outline" className="text-xs">Oracle & PL/SQL</Badge>
                        <Badge variant="outline" className="text-xs">SQL Queries</Badge>
                        <Badge variant="outline" className="text-xs">Sybase Database</Badge>
                        <Badge variant="outline" className="text-xs">Supabase</Badge>
                        <Badge variant="outline" className="text-xs">Git & GitHub</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {message.role === 'assistant' && (
                                <Bot className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {message.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                              {message.role === 'user' && (
                                <User className="h-4 w-4 mt-0.5 text-white flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-lg px-3 py-2 border border-gray-200">
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4 text-blue-600" />
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              )}
            </div>

            {/* Input Area - Integrated with the main content */}
            {isChatStarted && (
              <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 p-4">
                <div className="flex gap-3">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about Oracle, SQL, Sybase, Supabase, Git, GitHub..."
                    className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 shadow-md"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default CosmoChatbot; 