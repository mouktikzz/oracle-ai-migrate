# Cosmo Agents Chatbot Setup

## Overview
The Cosmo Agents chatbot now uses a dedicated `CHATBOT_GEMINI_API_KEY` for answering questions about the technologies and features used in the website.

## Environment Variables Setup

### For Netlify Backend (Environment Variables)
Add these as **Key/Value pairs** in your Netlify environment variables:

1. **`CHATBOT_GEMINI_API_KEY`** - Your Google Generative AI API key for the chatbot
   - This is used exclusively for the chatbot functionality
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

2. **`VITE_GEMINI_API_KEY`** - Your Google Generative AI API key for code conversion features
   - This is used for the main AI conversion features (Sybase to Oracle conversion)

3. **`OPENROUTER_API_KEY`** - Your OpenRouter API key for Netlify functions
   - This is used for AI explanation and rewriting services

4. **`VITE_SUPABASE_URL`** - Your Supabase project URL
5. **`VITE_SUPABASE_ANON_KEY`** - Your Supabase anonymous key

## Chatbot Features

The chatbot is comprehensively trained to answer questions about ALL technologies used in the Cosmo Agents platform:

### Frontend Technologies
- **React.js (v18.3.1)**: Hooks, state management, component architecture, functional components
- **TypeScript (v5.8.3)**: Type safety, interfaces, advanced features, generics, utility types
- **Vite (v5.4.1)**: Build tool, development server, hot module replacement, optimization
- **Tailwind CSS (v3.4.11)**: Utility-first CSS, responsive design, custom configurations
- **shadcn/ui**: Component library, Radix UI primitives, accessible components
- **React Router DOM (v6.26.2)**: Client-side routing, navigation, route protection
- **React Hook Form (v7.53.0)**: Form handling, validation, performance optimization
- **Lucide React (v0.462.0)**: Icon library, SVG icons, consistent design system

### UI/UX Libraries
- **Radix UI**: Headless UI primitives (accordion, dialog, dropdown, tabs, etc.)
- **Sonner (v1.5.0)**: Toast notifications, user feedback
- **Embla Carousel React (v8.3.0)**: Carousel/slider components
- **React Day Picker (v8.10.1)**: Date picker components
- **React Resizable Panels (v2.1.3)**: Resizable layout components
- **Vaul (v0.9.3)**: Drawer/sheet components
- **Input OTP (v1.2.4)**: One-time password input components

### State Management & Data
- **TanStack React Query (v5.56.2)**: Server state management, caching, synchronization
- **React Query**: Data fetching, background updates, optimistic updates
- **Local Storage**: Client-side data persistence, chat history

### Backend & Database
- **Supabase (v2.50.2)**: PostgreSQL database, real-time subscriptions, authentication
- **PostgreSQL**: Database engine, SQL queries, performance optimization
- **Netlify Functions**: Serverless functions, API endpoints, backend logic

### AI & Machine Learning
- **Google Generative AI (v0.24.1)**: Gemini models, AI-powered conversions
- **LangChain (v0.3.66)**: AI/ML integration, prompt engineering, chain management
- **LangChain Google GenAI (v0.2.15)**: Google AI integration for LangChain

### Development Tools
- **ESLint (v9.9.0)**: Code linting, code quality, TypeScript support
- **TypeScript ESLint (v8.0.1)**: TypeScript-specific linting rules
- **SWC**: Fast JavaScript/TypeScript compiler
- **PostCSS (v8.4.47)**: CSS processing, autoprefixer
- **Autoprefixer (v10.4.20)**: CSS vendor prefixing

### Utility Libraries
- **Zod (v3.25.76)**: Schema validation, runtime type checking
- **date-fns (v3.6.0)**: Date manipulation, formatting, utilities
- **clsx (v2.1.1)**: Conditional CSS class names
- **class-variance-authority (v0.7.1)**: Component variant management
- **tailwind-merge (v2.5.2)**: Tailwind class merging utilities
- **UUID (v11.1.0)**: Unique identifier generation
- **JSZip (v3.10.1)**: File compression, ZIP handling
- **diff (v8.0.2)**: Text difference comparison
- **node-fetch (v2.6.7)**: HTTP client for server-side requests

### Database Technologies
- **Oracle Database**: PL/SQL, SQL optimization, database design, stored procedures
- **Sybase Database**: Migration strategies, compatibility issues, legacy systems
- **SQL**: Query optimization, performance tuning, database administration

### Version Control & Deployment
- **Git**: Version control, branching strategies, collaboration
- **GitHub**: Repository hosting, workflows, CI/CD integration
- **Netlify**: Hosting, deployment, serverless functions, environment variables
- **Docker**: Containerization, deployment consistency

### Code Analysis & Migration
- **Monaco Editor (v4.7.0)**: Code editor, syntax highlighting, IntelliSense
- **Code diff visualization**: Side-by-side comparison, change highlighting
- **Batch processing**: Multiple file handling, bulk operations
- **Performance metrics**: Code analysis, optimization recommendations

### Security & Authentication
- **Supabase Auth**: User authentication, session management
- **Environment variables**: Secure configuration management
- **CORS handling**: Cross-origin request security
- **Input validation**: Data sanitization, security best practices

### Performance & Optimization
- **Vite build optimization**: Code splitting, tree shaking, minification
- **React optimization**: Memoization, lazy loading, performance monitoring
- **Database optimization**: Query performance, indexing strategies
- **Bundle optimization**: Chunk splitting, dependency management

### Universal Capabilities
- **Any Programming Language**: JavaScript, Python, Java, C++, Go, Rust, etc.
- **Any Framework**: Next.js, Vue.js, Angular, Svelte, etc.
- **Any Library**: Express, FastAPI, Django, Flask, etc.
- **Any Technology**: The chatbot can answer questions about any technology not specifically listed above

## How to Use

1. **Deploy your site** with the environment variables configured
2. **Open the chatbot** by clicking the chat button in the bottom-right corner
3. **Ask questions** about any of the technologies or features listed above
4. **Get expert answers** from the AI assistant

## Example Questions

### Frontend & React
- "How do I use React hooks effectively?"
- "What are the best practices for TypeScript in React?"
- "How does Vite improve build performance?"
- "What's the difference between Tailwind CSS and regular CSS?"
- "How do I implement shadcn/ui components?"

### Database & Backend
- "How does the Sybase to Oracle conversion work?"
- "What are the best practices for PostgreSQL optimization?"
- "How do I set up Supabase authentication?"
- "What's the difference between Supabase and traditional databases?"

### AI & Machine Learning
- "How does LangChain work with Google AI?"
- "What are the best practices for prompt engineering?"
- "How do I integrate AI into my React application?"

### Development & Tools
- "How do I set up Git workflows for this project?"
- "What ESLint rules should I use for TypeScript?"
- "How do I optimize my Vite build configuration?"
- "What are the best practices for Netlify deployment?"

### General Programming
- "How do I implement authentication in a React app?"
- "What are the best practices for state management?"
- "How do I optimize database queries?"
- "What are the security best practices for web applications?"

### Any Technology
- "How do I use Python with FastAPI?"
- "What are the benefits of using Next.js?"
- "How do I implement GraphQL with Apollo?"
- "What are the best practices for Docker containerization?"
- "How do I set up CI/CD with GitHub Actions?"
- "What are the differences between Vue.js and React?"
- "How do I implement WebSocket connections?"
- "What are the best practices for API design?"

## Troubleshooting

### Chatbot Not Responding
1. Check that `CHATBOT_GEMINI_API_KEY` is set in Netlify environment variables
2. Verify the API key is valid and has sufficient quota
3. Check the browser console for any error messages

### API Key Issues
- Ensure you're using the correct API key format
- Check that your Google AI Studio account has billing enabled
- Verify the API key has access to the Gemini model

### Deployment Issues
- Make sure all environment variables are set in Netlify
- Check that the Netlify functions are properly deployed
- Verify the function directory structure is correct

## Security Notes

- The `CHATBOT_GEMINI_API_KEY` is only used for the chatbot functionality
- API keys are stored securely in Netlify environment variables
- The chatbot function includes proper error handling and CORS configuration
- No sensitive data is logged or stored in the chatbot responses 