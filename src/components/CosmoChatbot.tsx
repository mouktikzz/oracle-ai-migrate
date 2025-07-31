import React, { useState, useRef, useEffect } from 'react';
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
  Minimize2,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';


// Simulated responses for when the AI service is unavailable
const getSimulatedResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase();
  
  // React questions
  if (message.includes('react')) {
    if (message.includes('hook') || message.includes('use')) {
      return `**React Hooks** - Functions that let you use state and other React features in functional components.

**Core Hooks:**
• **useState** - Manage component state
• **useEffect** - Handle side effects and lifecycle
• **useContext** - Access React context
• **useRef** - Create mutable references

\`\`\`jsx
const [count, setCount] = useState(0);
useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);
\`\`\`

**What it is:** A way to add stateful logic to functional components without classes.`;
    }
    return `**React.js** - JavaScript library for building user interfaces.

**What it is:** A declarative, efficient library for creating interactive UIs using components.

**Key Concepts:**
• **Components** - Reusable UI pieces
• **Virtual DOM** - Efficient rendering
• **JSX** - JavaScript syntax extension
• **Unidirectional Data Flow** - Predictable state management

**Used in this project for:** Building the web interface with TypeScript and modern hooks.`;
  }
  
  // TypeScript questions
  if (message.includes('typescript')) {
    return `**TypeScript** - JavaScript with static typing.

**What it is:** A superset of JavaScript that adds optional static types, classes, and modules.

**Key Features:**
• **Static Typing** - Catch errors at compile time
• **Better IDE Support** - Enhanced autocomplete and IntelliSense
• **Interfaces** - Define object shapes and contracts
• **Generics** - Reusable type-safe code

\`\`\`typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}
\`\`\`

**Used in this project for:** Type-safe development and better code quality.`;
  }
  
  // Supabase questions
  if (message.includes('supabase')) {
    return `**Supabase** - Open-source Firebase alternative.

**What it is:** A backend-as-a-service platform built on PostgreSQL with real-time capabilities.

**Core Features:**
• **PostgreSQL Database** - Full SQL database with real-time
• **Authentication** - Built-in auth with multiple providers
• **File Storage** - Manage and serve files
• **Row-Level Security** - Fine-grained access control
• **Real-time Subscriptions** - Live data updates

**Used in this project for:** User authentication, database storage, and real-time features.`;
  }

  // AI/ML questions
  if (message.includes('ai') || message.includes('machine learning') || message.includes('langchain')) {
    return `**Artificial Intelligence (AI)** - Computer systems that can perform tasks requiring human intelligence.

**What it is:** Technology that enables machines to learn, reason, and make decisions.

**Key Areas:**
• **Machine Learning** - Algorithms that learn from data
• **Natural Language Processing** - Understanding human language
• **Computer Vision** - Interpreting visual information
• **Generative AI** - Creating new content (text, images, code)

**Used in this project for:** Chatbot conversations, code analysis, and automated code conversion.`;
  }

  // Database questions
  if (message.includes('oracle') || message.includes('sybase') || message.includes('database')) {
    return `**Database** - Organized collection of structured information stored electronically.

**What it is:** A system for storing, managing, and retrieving data efficiently.

**Types:**
• **Relational Databases** - Oracle, PostgreSQL, MySQL (structured data)
• **NoSQL Databases** - MongoDB, Redis (flexible schemas)
• **Cloud Databases** - AWS RDS, Google Cloud SQL (managed)

**Key Features:**
• **ACID Properties** - Atomicity, Consistency, Isolation, Durability
• **SQL** - Standard query language
• **Indexing** - Fast data retrieval
• **Backup & Recovery** - Data protection

**Used in this project for:** Storing user data, conversion logs, and file metadata.`;
  }

  // Code conversion questions
  if (message.includes('convert') || message.includes('migration') || message.includes('rewrite')) {
    return `**Code Conversion** - Process of translating code from one programming language to another.

**What it is:** Automated or manual translation of source code while preserving functionality and logic.

**Types:**
• **Language Migration** - Python to JavaScript, Java to C#
• **Framework Migration** - Angular to React, Vue to Svelte
• **Platform Migration** - Web to mobile, desktop to cloud
• **Version Migration** - Legacy to modern syntax

**Challenges:**
• **Syntax Differences** - Language-specific features
• **Library Mapping** - Finding equivalent libraries
• **Performance Optimization** - Adapting to new platforms
• **Testing** - Ensuring functionality preservation

**Used in this project for:** Converting Oracle/Sybase code to modern languages.`;
  }

  // Vite questions
  if (message.includes('vite')) {
    return `**Vite** - Modern build tool for web development.

**What it is:** A fast build tool that provides instant hot module replacement and optimized builds.

**Key Features:**
• **Fast Dev Server** - Instant hot module replacement
• **Optimized Builds** - Efficient production bundles
• **TypeScript Support** - Native TypeScript compilation
• **Plugin System** - Extensible architecture

**Benefits:**
• **Speed** - Lightning-fast development experience
• **Modern** - ES modules and modern browser features
• **Flexible** - Works with React, Vue, Svelte, and more

**Used in this project for:** Fast development server and optimized production builds.`;
  }

  // Tailwind CSS questions
  if (message.includes('tailwind') || message.includes('css')) {
    return `**Tailwind CSS** - Utility-first CSS framework.

**What it is:** A CSS framework that provides low-level utility classes for rapid UI development.

**Key Features:**
• **Utility-First** - Pre-built classes for common styles
• **Responsive Design** - Mobile-first breakpoint system
• **Customizable** - Configurable design system
• **JIT Compilation** - Only generates used styles

**Benefits:**
• **Speed** - Rapid UI development
• **Consistency** - Unified design system
• **Maintainability** - No custom CSS needed
• **Performance** - Optimized bundle sizes

**Used in this project for:** Styling the user interface with modern, responsive design.`;
  }

  // Git and GitHub questions
  if (message.includes('git') || message.includes('github')) {
    if (message.includes('difference') || message.includes('vs') || message.includes('compare')) {
      return `**Git vs GitHub:**

**Git** - Version control system (installed locally)
**GitHub** - Web platform for hosting Git repositories

**Key Differences:**
• **Git** tracks code changes on your computer
• **GitHub** hosts repositories in the cloud with collaboration tools
• **Git** handles version control
• **GitHub** adds issues, pull requests, and team features

**Used in this project for:** Local version control (Git) and cloud hosting (GitHub).`;
    }
    
    if (message.includes('git')) {
      return `**Git** - Distributed version control system.

**What it is:** A system that tracks changes in your code files over time.

**Key Features:**
• **Version Tracking** - History of all code changes
• **Branching** - Work on features separately
• **Merging** - Combine changes from branches
• **Collaboration** - Multiple developers working together

**Basic Commands:**
\`\`\`bash
git init          # Start repository
git add .         # Stage files
git commit -m "message"  # Save changes
git push          # Upload to remote
git pull          # Download changes
\`\`\`

**Used in this project for:** Tracking code changes and collaboration.`;
    }
    
    if (message.includes('github')) {
      return `**GitHub** - Web-based platform for hosting Git repositories.

**What it is:** A cloud service that hosts Git repositories with collaboration tools.

**Key Features:**
• **Repository Hosting** - Store code in the cloud
• **Collaboration** - Team tools and workflows
• **Issue Tracking** - Manage bugs and features
• **Pull Requests** - Code review system
• **Actions** - Automated workflows

**Used in this project for:** Hosting the repository and team collaboration.`;
    }
  }

  // Python questions
  if (message.includes('python')) {
    return `**Python** - High-level, interpreted programming language.

**What it is:** A versatile language known for its simple syntax and readability.

**Key Features:**
• **Easy to Learn** - Simple, readable syntax
• **Versatile** - Web dev, data science, automation
• **Rich Ecosystem** - Extensive libraries and frameworks
• **Cross-platform** - Runs on all major operating systems

**Common Uses:**
• **Web Development** - Django, Flask
• **Data Science** - Pandas, NumPy, Matplotlib
• **AI/ML** - TensorFlow, PyTorch, scikit-learn
• **Automation** - Scripts and tools

**Used in this project for:** AI integration and data processing.`;
  }

  // SQL questions
  if (message.includes('sql')) {
    return `**SQL** - Structured Query Language.

**What it is:** Standard language for managing and manipulating relational databases.

**Key Features:**
• **Data Querying** - Retrieve data from databases
• **Data Manipulation** - Insert, update, delete records
• **Data Definition** - Create and modify database structures
• **Data Control** - Manage permissions and security

**Common Commands:**
\`\`\`sql
SELECT * FROM users WHERE id = 1;
INSERT INTO table (column) VALUES (value);
UPDATE table SET column = value WHERE condition;
DELETE FROM table WHERE condition;
\`\`\`

**Used in this project for:** Database operations and data management.`;
  }

  // Comments feature questions
  if (message.includes('comment') || message.includes('note')) {
    return `**Comments** - Notes and annotations for code.

**What it is:** A way to add notes and explanations to your code for future reference.

**Features:**
• **Add Comments** - Write notes about code
• **Edit Comments** - Update notes anytime
• **View Comments** - See all comments in history
• **Delete Comments** - Remove unwanted notes

**Used in this project for:** Adding notes to code conversions and tracking decisions.`;
  }

  // General programming questions
  if (message.includes('programming') || message.includes('coding') || message.includes('development')) {
    return `**Programming** - Creating instructions for computers.

**What it is:** The process of writing code to solve problems and build applications.

**Key Concepts:**
• **Algorithms** - Step-by-step problem-solving
• **Data Structures** - Organizing and storing data
• **Logic** - Making decisions in code
• **Debugging** - Finding and fixing errors

**Popular Languages:**
• **Python** - Beginners, data science, AI
• **JavaScript** - Web development
• **Java** - Enterprise applications
• **C++** - System programming

**Used in this project for:** Building the web application and AI features.`;
  }

  // General technology questions
  if (message.includes('technology') || message.includes('tech') || message.includes('software')) {
    return `**Technology** - Tools and systems for solving problems.

**What it is:** The application of scientific knowledge to create tools and systems.

**Key Areas:**
• **Web Development** - Building websites and applications
• **Mobile Development** - Creating smartphone apps
• **Data Science** - Analyzing and interpreting data
• **Artificial Intelligence** - Creating intelligent systems
• **Cloud Computing** - Using remote servers and services

**Used in this project for:** Building modern web applications and AI features.`;
  }
  
  // Default response
  return `I'm Cosmo Agents, your AI assistant! 🚀

I can help you with any programming, technology, or general questions. Ask me about:

**Programming & Development:**
• Any programming language (Python, JavaScript, Java, C++, etc.)
• Web development frameworks and libraries
• Database technologies and SQL
• Cloud platforms and services

**Technology & Tools:**
• Software development methodologies
• Best practices and design patterns
• Debugging and troubleshooting
• Performance optimization

**General Questions:**
• Technology concepts and explanations
• Learning resources and tutorials
• Industry trends and insights

What would you like to know about? 💡`;
};

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const CosmoChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isButtonAnimating, setIsButtonAnimating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message on component mount - fresh start every time
  useEffect(() => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `👋 **Hi! I'm your AI assistant.**

I can help with any programming, technology, or general questions.

Ask me anything! 🚀`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []); // Empty dependency array means this runs only once on mount

  // Remove localStorage persistence - no longer needed for fresh start
  // useEffect(() => {
  //   const savedHistory = localStorage.getItem('cosmo-chatbot-history');
  //   if (savedHistory) {
  //     try {
  //       const parsedHistory = JSON.parse(savedHistory);
  //       setMessages(parsedHistory);
  //     } catch (error) {
  //       console.error('Error loading chat history:', error);
  //     }
  //   }
  // }, []);

  // Remove localStorage saving - no longer needed
  // useEffect(() => {
  //   if (messages.length > 0) {
  //     localStorage.setItem('cosmo-chatbot-history', JSON.stringify(messages));
  //   }
  // }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('Sending message to chatbot:', userMessage.content);
      
      // Call the chatbot API
      const response = await fetch('/.netlify/functions/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content
        }),
      });

      console.log('Chatbot response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chatbot error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('Chatbot response data:', data);
      
      if (data.error) {
        console.error('Chatbot returned error:', data.error);
        throw new Error(data.error);
      }

      if (!data.response || data.response.trim().length === 0) {
        console.error('Chatbot returned empty response');
        throw new Error('AI returned empty response');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error in chatbot:', error);
      
      // Always use simulated response for any error
      const fallbackContent = getSimulatedResponse(userMessage.content);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
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
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `👋 **Welcome to Cosmo Agents!** 

I'm your AI assistant specializing in all the technologies used in this website. I can help you with:

**🛠️ Technologies I know:**
• React.js, TypeScript, Vite, Tailwind CSS
• Supabase, PostgreSQL, Netlify Functions
• Google Generative AI, LangChain
• Git, GitHub, Oracle, Sybase, Python
• And much more!

**💡 What I can do:**
• Answer questions about any technology
• Explain code concepts and best practices
• Help with debugging and troubleshooting
• Provide guidance on features and implementation

Just ask me anything! 🚀`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    toast({
      title: 'New Chat Started',
      description: 'A fresh conversation has begun.',
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

  // Add a function to clear chat history (refresh)
  const refreshChat = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `👋 **Welcome to Cosmo Agents!** 

I'm your AI assistant specializing in all the technologies used in this website. I can help you with:

**🛠️ Technologies I know:**
• React.js, TypeScript, Vite, Tailwind CSS
• Supabase, PostgreSQL, Netlify Functions
• Google Generative AI, LangChain
• Git, GitHub, Oracle, Sybase, Python
• And much more!

**💡 What I can do:**
• Answer questions about any technology
• Explain code concepts and best practices
• Help with debugging and troubleshooting
• Provide guidance on features and implementation

Just ask me anything! 🚀`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    toast({
      title: 'Chat Refreshed',
      description: 'Chat history has been cleared.',
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Add a function to start a new migration
  const startNewMigration = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Migration started! Please provide details about your new migration task.',
        timestamp: new Date(),
      },
    ]);
    toast({
      title: 'New Migration',
      description: 'A new migration session has started.',
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  };



  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Animated Chat Toggle Button */}
      <div className="pointer-events-auto">
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
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto mt-2 w-[95vw] max-w-[380px] sm:max-w-[420px] md:max-w-[450px] lg:max-w-[480px] xl:max-w-[500px] rounded-2xl border-2 border-blue-700 shadow-2xl bg-white overflow-hidden flex flex-col" style={{minHeight: '480px', maxHeight: '80vh'}}>
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 border-b-2 border-blue-700 shadow-md">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bot className="h-6 w-6 text-white" />
                  <Sparkles className="h-2 w-2 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold tracking-wide text-white">Cosmo Agents</h3>
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
                  onClick={refreshChat}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                  title="Refresh Chat"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleButtonClick}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                  title={isOpen ? "Minimize" : "Expand"}
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
            <div className="h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-700 opacity-60"></div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 h-[250px] sm:h-[320px] md:h-[360px] lg:h-[380px] xl:h-[400px] overflow-y-auto p-2 sm:p-3 md:p-4 bg-white">
                        {/* Quick Actions */}
            <div className="flex items-center justify-between mt-2 mb-3">
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
                <Button
                  onClick={startNewMigration}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-green-600 hover:text-green-700 hover:bg-green-100 h-6 px-2"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Migration
                </Button>
              </div>
              <div className="text-xs text-gray-500">
                {messages.length} messages
              </div>
            </div>
            
            {/* Quick Question Buttons */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 mb-3">
                <Button
                  onClick={() => setInputMessage("How do I use React hooks?")}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2"
                >
                  React Hooks
                </Button>
                <Button
                  onClick={() => setInputMessage("Explain TypeScript")}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2"
                >
                  TypeScript
                </Button>
                <Button
                  onClick={() => setInputMessage("How to use Supabase?")}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2"
                >
                  Supabase
                </Button>
                <Button
                  onClick={() => setInputMessage("Code conversion features")}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2"
                >
                  Code Conversion
                </Button>
              </div>
            )}
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
                  Cosmo Agents is your comprehensive AI assistant for ALL technologies used in this platform!<br />
                  Ask questions about any programming language, framework, library, or technology.
                </p>
                {/* Feature Cards */}
                <div className="grid grid-cols-1 gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-4 md:mb-6">
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">React, TypeScript & Vite</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Tailwind CSS & shadcn/ui</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-700 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Oracle & Sybase Databases</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-800 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Supabase & PostgreSQL</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-900 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">AI/ML & LangChain</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-green-50 rounded-xl border border-green-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Git, GitHub & Netlify</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-green-50 rounded-xl border border-green-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-green-600 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">React Query & State Management</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-green-50 rounded-xl border border-green-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-green-700 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Monaco Editor & Code Analysis</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Any Programming Language</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-purple-600 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Any Framework or Library</span>
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
                      <div 
                        className={`${
                          message.role === 'assistant' ? 'chatbot-message' : ''
                        } prose prose-sm max-w-none`}
                        style={{
                          lineHeight: '1.5',
                          fontSize: '14px'
                        }}
                      >
                        {message.content}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs text-gray-400">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {message.role === 'assistant' && (
                          <Button
                            onClick={() => copyMessage(message.content, message.id)}
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
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
                ))}
                <div ref={messagesEndRef} />
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 bg-white text-gray-800 border-2 border-blue-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-2 sm:p-3 md:p-4 bg-white border-t-2 border-blue-700">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 p-0 text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-100"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CosmoChatbot; 