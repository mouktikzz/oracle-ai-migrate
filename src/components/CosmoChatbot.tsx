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
  Sparkles,
  Zap
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

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className="rounded-full w-16 h-16 shadow-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white border-2 border-white/20 transition-all duration-300 hover:scale-110 hover:shadow-purple-500/25"
      >
        {isOpen ? (
          <X className="h-7 w-7" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-7 w-7" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="absolute bottom-20 right-0 w-96 h-[500px] shadow-2xl border-2 border-purple-200 bg-gradient-to-b from-white to-purple-50/30">
          <CardHeader className="pb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white border-b border-purple-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bot className="h-6 w-6 text-white" />
                  <Zap className="h-2 w-2 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                </div>
                <CardTitle className="text-lg font-bold text-white">
                  Cosmo Agents
                </CardTitle>
                <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                  AI Assistant
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRefreshConversions}
                  disabled={isRefreshing}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  title="Refresh Conversions"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearHistory}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  title="Clear History"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-purple-100 mt-1">
              Ask me about Oracle, SQL, Sybase, Supabase, Git, GitHub, or this website
            </p>
          </CardHeader>

          <CardContent className="p-0 h-full flex flex-col">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {!isChatStarted ? (
                <div className="text-center text-gray-600 mt-8">
                  <div className="relative mb-4">
                    <Bot className="h-16 w-16 mx-auto text-purple-400" />
                    <Sparkles className="h-4 w-4 absolute top-0 right-1/4 text-yellow-400 animate-pulse" />
                    <Zap className="h-3 w-3 absolute bottom-2 left-1/4 text-blue-400 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome to Cosmo Agents!</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    I'm your AI assistant specialized in database technologies and development tools.
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Oracle & PL/SQL
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      SQL Queries
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      Sybase Database
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                      Supabase
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      Git & GitHub
                    </div>
                  </div>

                  <Button
                    onClick={startNewChat}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start New Chat
                  </Button>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <Bot className="h-12 w-12 mx-auto mb-3 text-purple-400" />
                  <p className="text-sm">Hi! I'm Cosmo Agents. How can I help you today?</p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    <Badge variant="outline" className="text-xs border-purple-200 text-purple-600">
                      Oracle & PL/SQL
                    </Badge>
                    <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
                      SQL Queries
                    </Badge>
                    <Badge variant="outline" className="text-xs border-green-200 text-green-600">
                      Sybase Database
                    </Badge>
                    <Badge variant="outline" className="text-xs border-pink-200 text-pink-600">
                      Supabase
                    </Badge>
                    <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-600">
                      Git & GitHub
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-800'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.role === 'assistant' && (
                            <Bot className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
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
                      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-purple-600" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            {isChatStarted && (
              <div className="border-t border-gray-200 p-3 bg-gradient-to-r from-gray-50 to-purple-50/30">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about Oracle, SQL, Sybase, Supabase, Git, GitHub..."
                    className="flex-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    size="sm"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CosmoChatbot; 