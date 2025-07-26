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
  User,
  Sparkles,
  Zap,
  Clock,
  Star
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
  const [isButtonHovered, setIsButtonHovered] = useState(false);
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
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        size="lg"
        className={`rounded-full w-16 h-16 shadow-lg bg-gradient-to-r from-blue-600 to-amber-700 hover:from-blue-700 hover:to-amber-800 text-white border-2 border-white/20 transition-all duration-500 ${
          isButtonHovered ? 'scale-110 shadow-xl shadow-blue-500/25' : 'scale-100'
        }`}
      >
        {isOpen ? (
          <X className={`h-6 w-6 transition-transform duration-300 ${isButtonHovered ? 'rotate-90' : 'rotate-0'}`} />
        ) : (
          <div className="relative">
            <MessageCircle className={`h-6 w-6 transition-transform duration-300 ${isButtonHovered ? 'scale-110' : 'scale-100'}`} />
            <Sparkles className={`h-3 w-3 absolute -top-1 -right-1 text-yellow-300 transition-all duration-300 ${isButtonHovered ? 'animate-pulse scale-125' : 'animate-pulse'}`} />
          </div>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-amber-700 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className="h-5 w-5 text-white" />
                <Zap className="h-2 w-2 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Cosmo Agents</h3>
                <p className="text-xs text-blue-100">AI Database Expert</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                <Star className="h-2.5 w-2.5 mr-1" />
                Pro
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={closeChat}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex flex-col h-full">
            {!isChatStarted ? (
              // Welcome Screen
              <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-gray-50 to-blue-50/30">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Bot className="h-16 w-16 mx-auto text-blue-600 mb-2" />
                    <Sparkles className="h-4 w-4 absolute top-0 right-1/4 text-amber-500 animate-pulse" />
                    <Zap className="h-3 w-3 absolute bottom-2 left-1/4 text-blue-500 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome to Cosmo Agents</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Your expert AI assistant for database technologies and development tools
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3 mb-6 max-w-xs mx-auto">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Oracle Database & PL/SQL</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">SQL Queries & Optimization</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Sybase Database Migration</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Supabase Backend Services</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="w-3 h-3 bg-blue-700 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Git & GitHub Workflows</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={startNewChat}
                      className="w-full bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-700 hover:to-amber-700 text-white py-3 rounded-lg shadow-md font-medium"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Start Conversation
                    </Button>
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
                </div>
              </div>
            ) : (
              // Chat Interface
              <>
                {/* Search Bar */}
                <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search messages..."
                      className="pl-10 h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <Bot className="h-12 w-12 mx-auto mb-3 text-blue-500" />
                      <p className="text-sm mb-4">Hello! I'm ready to help you with database and development questions.</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">Oracle & PL/SQL</Badge>
                        <Badge variant="outline" className="text-xs border-amber-200 text-amber-600">SQL Queries</Badge>
                        <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">Sybase Database</Badge>
                        <Badge variant="outline" className="text-xs border-amber-200 text-amber-600">Supabase</Badge>
                        <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">Git & GitHub</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(searchQuery ? filteredMessages : messages).map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg px-3 py-2 ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-blue-600 to-amber-600 text-white'
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

                {/* Input Area */}
                <div className="p-3 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about Oracle, SQL, Sybase, Supabase, Git, GitHub..."
                      className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-700 hover:to-amber-700 text-white px-4 shadow-md"
                    >
                      <Send className="h-4 w-4" />
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