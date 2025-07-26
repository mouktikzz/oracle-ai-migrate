# Cosmo Agents Chatbot Setup Guide

## Overview
The Cosmo Agents chatbot is an AI assistant that helps users with questions about Oracle, SQL, Sybase, Supabase, Git, GitHub, and the Cosmo Agents website. It's positioned at the bottom right of every screen and maintains conversation history.

## Features
- ✅ **Persistent Chat History**: Conversations are saved in localStorage
- ✅ **Global Availability**: Available on every screen of the website
- ✅ **Refresh Conversions**: Built-in button to refresh conversions
- ✅ **Professional UI**: Modern, responsive design with smooth animations
- ✅ **Context Awareness**: Maintains conversation context for better responses
- ✅ **Error Handling**: Graceful error handling with user-friendly messages

## API Key Setup

### 1. Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 2. Configure Netlify Environment Variable
1. Go to your Netlify dashboard
2. Navigate to your site settings
3. Go to **Environment Variables**
4. Add a new variable:
   - **Key**: `CHATBOT_GEMINI_API_KEY`
   - **Value**: Your Gemini API key from step 1
5. Save the environment variable

### 3. Deploy to Netlify
The chatbot will automatically work once the environment variable is set and deployed.

## Technical Details

### Backend (Netlify Function)
- **File**: `netlify/functions/cosmo-chatbot.js`
- **Model**: `gemini-2.0-flash-exp`
- **API Key**: `CHATBOT_GEMINI_API_KEY`
- **Endpoint**: `/.netlify/functions/cosmo-chatbot`

### Frontend Component
- **File**: `src/components/CosmoChatbot.tsx`
- **Position**: Fixed bottom-right corner
- **Storage**: localStorage for conversation history
- **Styling**: Tailwind CSS with shadcn/ui components

### System Prompt
The chatbot is configured to only answer questions about:
1. Oracle Database and PL/SQL
2. SQL (all dialects)
3. Sybase Database
4. Supabase
5. Git and GitHub
6. The Cosmo Agents website and its features

## Usage

### For Users
1. Click the chat button (bottom-right corner) to open the chatbot
2. Type your question about Oracle, SQL, Sybase, Supabase, Git, GitHub, or the website
3. Press Enter or click Send
4. Use the refresh button to refresh conversions
5. Use the X button to clear chat history

### For Developers
The chatbot component can be customized by passing props:
```tsx
<CosmoChatbot onRefreshConversions={yourRefreshFunction} />
```

## Troubleshooting

### Chatbot Not Responding
1. Check if `CHATBOT_GEMINI_API_KEY` is set in Netlify
2. Verify the API key is valid
3. Check browser console for errors
4. Ensure the Netlify function is deployed

### Environment Variable Issues
- Make sure the variable name is exactly `CHATBOT_GEMINI_API_KEY`
- Redeploy your site after adding the environment variable
- Check Netlify function logs for API key errors

### UI Issues
- The chatbot uses z-index 50 to stay on top
- Ensure no other elements have higher z-index values
- Check for CSS conflicts with existing styles

## Model Configuration
- **Model**: `gemini-2.0-flash-exp`
- **Temperature**: 0.7 (balanced creativity and accuracy)
- **Max Tokens**: 1024 (reasonable response length)
- **Retry Logic**: 3 attempts with exponential backoff

## Security
- API key is stored securely in Netlify environment variables
- No API key exposure in frontend code
- Input validation and sanitization implemented
- Error messages don't expose sensitive information

## Performance
- Conversation history stored locally (no server storage)
- Efficient re-rendering with React hooks
- Optimized API calls with retry logic
- Smooth animations and transitions

## Future Enhancements
- [ ] Voice input/output
- [ ] File upload for code analysis
- [ ] Integration with conversion history
- [ ] Multi-language support
- [ ] Advanced conversation management 