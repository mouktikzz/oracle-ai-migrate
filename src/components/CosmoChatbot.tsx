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
  Zap,
  Settings,
  Minimize2
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
  const [isMinimized, setIsMinimized] = useState(false);
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
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
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
        className={`rounded-full w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 shadow-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white border-4 border-white/30 transition-all duration-500 transform ${
          isButtonAnimating ? 'scale-110 rotate-12' : 'scale-100 rotate-0'
        } ${isOpen ? 'animate-pulse' : 'hover:scale-105'}`}
        style={{
          animationDuration: isOpen ? '2s' : '0.5s'
        }}
      >
        {isOpen ? (
          <X className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 transition-transform duration-300" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 transition-transform duration-300" />
            <Sparkles className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`absolute bottom-20 sm:bottom-24 right-0 transition-all duration-300 ease-in-out ${
          isMinimized 
            ? 'w-[300px] h-[60px]' 
            : 'w-[320px] h-[500px] sm:w-[400px] sm:h-[580px] md:w-[450px] md:h-[620px] lg:w-[480px] lg:h-[650px]'
        } bg-white rounded-2xl border-2 border-blue-600 shadow-2xl overflow-hidden max-h-[80vh] max-w-[95vw] flex flex-col`}>
          
          {/* Enhanced Header */}
          <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
            {/* Main Header Bar */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bot className="h-6 w-6 text-white" />
                  <Sparkles className="h-2 w-2 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold tracking-wide">Cosmo AI Assistant</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-100 font-medium">Online & Ready</span>
                  </div>
                </div>
              </div>
              
              {/* Header Actions */}
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleMinimize}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={closeChat}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Header Bottom Border */}
            <div className="h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-700 opacity-60"></div>
          </div>

          {/* Minimized State */}
          {isMinimized ? (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="text-center">
                <Bot className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <p className="text-sm text-gray-600 font-medium">Click to expand chat</p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gradient-to-b from-gray-50 to-white">
                {messages.length === 0 ? (
                  // Enhanced Welcome Message
                  <div className="text-center py-6 sm:py-8">
                    <div className="relative mb-6">
                      <div className="relative">
                        <Bot className="h-16 w-16 sm:h-20 sm:w-20 mx-auto text-blue-600 mb-4" />
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 absolute top-2 right-1/3 text-yellow-500 animate-pulse" />
                        <Zap className="h-2 w-2 sm:h-3 sm:w-3 absolute bottom-2 left-1/3 text-blue-500 animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Welcome to Cosmo Agents</h3>
                    <p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto">
                      Your expert AI assistant for database technologies and development
                    </p>
                    
                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 gap-2 mb-6">
                      {[
                        { icon: '🔷', text: 'Oracle Database & PL/SQL', color: 'bg-blue-500' },
                        { icon: '🔶', text: 'SQL Queries & Optimization', color: 'bg-blue-600' },
                        { icon: '🔷', text: 'Sybase Database Migration', color: 'bg-blue-700' },
                        { icon: '🔶', text: 'Supabase Backend Services', color: 'bg-blue-800' },
                        { icon: '🔷', text: 'Git & GitHub Workflows', color: 'bg-blue-900' }
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors">
                          <div className={`w-3 h-3 ${feature.color} rounded-full`}></div>
                          <span className="text-sm font-medium text-gray-700">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Status Indicators */}
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>24/7 Available</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        <span>Expert Knowledge</span>
                      </div>
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
                          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                              : 'bg-white text-gray-800 border-2 border-blue-200 shadow-md'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {message.role === 'assistant' && (
                              <Bot className="h-4 w-4 mt-1 text-blue-600 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-2">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                            {message.role === 'user' && (
                              <User className="h-4 w-4 mt-1 text-white flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white rounded-2xl px-4 py-3 border-2 border-blue-200 shadow-md">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-blue-600" />
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Enhanced Input Area */}
              <div className="p-3 sm:p-4 border-t-2 border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about Oracle, SQL, Sybase..."
                    className="flex-1 h-10 text-sm border-blue-300 focus:border-blue-500 focus:ring-blue-500 bg-white rounded-xl"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-10 px-4 shadow-lg rounded-xl"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={startNewChat}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100 h-6 px-2"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      New Chat
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {messages.length} messages
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CosmoChatbot; 