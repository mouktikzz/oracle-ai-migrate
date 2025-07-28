import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Send, 
  RefreshCw,
  Plus,
  Bot, 
  User,
  Sparkles,
  Clock,
  Star,
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
  const [isButtonAnimating, setIsButtonAnimating] = useState(false);
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
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
    // Suspend current conversation by saving it with timestamp
    if (messages.length > 0) {
      const conversationId = Date.now().toString();
      const conversationData = {
        id: conversationId,
        messages: messages,
        timestamp: new Date().toISOString(),
        title: messages[0]?.content.substring(0, 50) + '...' || 'Conversation'
      };
      
      // Save to localStorage with unique ID
      const savedConversations = JSON.parse(localStorage.getItem('cosmo-chatbot-conversations') || '[]');
      savedConversations.push(conversationData);
      localStorage.setItem('cosmo-chatbot-conversations', JSON.stringify(savedConversations));
    }
    
    // Start fresh conversation
    setMessages([]);
    localStorage.removeItem('cosmo-chatbot-history');
    toast({
      title: 'New Chat Started',
      description: 'Previous conversation saved. Ready for new questions!',
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const handleButtonClick = () => {
    setIsButtonAnimating(true);
    setTimeout(() => {
      setIsOpen(!isOpen);
      setIsButtonAnimating(false);
    }, 200);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Animated Chat Toggle Button */}
      <Button
        onClick={handleButtonClick}
        size="lg"
        className={`rounded-full w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shadow-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white border-4 border-white/30 transition-all duration-500 transform ${
          isButtonAnimating ? 'scale-110 rotate-12' : 'scale-100 rotate-0'
        } ${isOpen ? 'animate-pulse' : 'hover:scale-105'}`}
        style={{
          animationDuration: isOpen ? '2s' : '0.5s'
        }}
      >
        {isOpen ? (
          <X className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 transition-transform duration-300" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 transition-transform duration-300" />
            <Sparkles className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 sm:bottom-20 right-0 w-[300px] h-[450px] sm:w-[380px] sm:h-[520px] md:w-[420px] md:h-[560px] lg:w-[450px] lg:h-[580px] xl:w-[480px] xl:h-[600px] bg-white rounded-2xl shadow-2xl border-2 border-blue-200 overflow-hidden max-h-[80vh] max-w-[90vw]">
          {/* Header */}
          <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                <Zap className="h-1 w-1 sm:h-2 sm:w-2 absolute -top-0.5 -right-0.5 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold">Cosmo Agents</h3>
                <p className="text-xs sm:text-sm text-blue-100">AI Database Expert</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={closeChat}
              className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0 text-white hover:bg-white/20"
            >
              <X className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4" />
            </Button>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
            <div className="flex gap-1 sm:gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefreshConversions}
                disabled={isRefreshing}
                className="h-6 sm:h-7 md:h-8 text-xs sm:text-sm border-blue-300 text-blue-700 hover:bg-blue-50 px-1.5 sm:px-2 md:px-3"
              >
                <RefreshCw className={`h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 mr-0.5 sm:mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={startNewChat}
                className="h-6 sm:h-7 md:h-8 text-xs sm:text-sm border-blue-300 text-blue-700 hover:bg-blue-50 px-1.5 sm:px-2 md:px-3"
              >
                <Plus className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">New</span>
              </Button>
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Clock className="h-3 w-3" />
              <span className="hidden sm:inline">24/7</span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 h-[250px] sm:h-[320px] md:h-[360px] lg:h-[380px] xl:h-[400px] overflow-y-auto p-2 sm:p-3 md:p-4 bg-gradient-to-b from-gray-50 to-blue-50/30">
            {messages.length === 0 ? (
              // Welcome Message - Always Displayed
              <div className="text-center py-3 sm:py-4 md:py-6">
                <div className="relative mb-3 sm:mb-4 md:mb-6">
                  <Bot className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 mx-auto text-blue-600 mb-2 sm:mb-3" />
                  <Sparkles className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 absolute top-1 right-1/3 text-yellow-500 animate-pulse" />
                  <Zap className="h-1 w-1 sm:h-2 sm:w-2 md:h-3 md:w-3 absolute bottom-1 left-1/3 text-blue-500 animate-pulse" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-2 sm:mb-3">Welcome to Cosmo Agents</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 md:mb-6">
                  Your expert AI assistant for database technologies and development
                </p>
                
                <div className="grid grid-cols-1 gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-4 md:mb-6">
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Oracle Database & PL/SQL</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">SQL Queries & Optimization</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-700 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Sybase Database Migration</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-800 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Supabase Backend Services</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-900 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Git & GitHub Workflows</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="hidden sm:inline">Always Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    <span className="hidden sm:inline">Expert Knowledge</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                          : 'bg-white text-gray-800 border-2 border-blue-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-1.5 sm:gap-2">
                        {message.role === 'assistant' && (
                          <Bot className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 mt-1 text-blue-600 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1 sm:mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        {message.role === 'user' && (
                          <User className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 mt-1 text-white flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 border-2 border-blue-200 shadow-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Bot className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-600" />
                        <div className="flex space-x-0.5 sm:space-x-1">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
          <div className="p-2 sm:p-3 md:p-4 border-t-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex gap-1.5 sm:gap-2 md:gap-3">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about Oracle, SQL, Sybase..."
                className="flex-1 h-8 sm:h-9 md:h-10 text-xs sm:text-sm border-blue-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 shadow-lg"
              >
                <Send className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CosmoChatbot; 