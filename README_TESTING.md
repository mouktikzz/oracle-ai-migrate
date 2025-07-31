# Backend Testing Guide

This guide will help you test and troubleshoot your AI functions.

## Quick Test

### 1. Test Your API Keys
Visit this URL in your browser:
```
https://your-site.netlify.app/.netlify/functions/test-ai-functions
```

This will show you if your API keys are working.

### 2. Run the Test Script

First, install the required dependency:
```bash
npm install node-fetch
```

Then run the test script:
```bash
# Test against your deployed site
node test-backend.js

# Or test against a specific URL
NETLIFY_URL=https://your-site.netlify.app node test-backend.js
```

## Manual Testing

### Test Chatbot
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/chatbot \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, this is a test"}'
```

### Test AI Explain
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/ai-explain \
  -H "Content-Type: application/json" \
  -d '{"code": "SELECT * FROM users;", "language": "sql"}'
```

### Test AI Rewrite
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/ai-rewrite \
  -H "Content-Type: application/json" \
  -d '{"code": "SELECT * FROM users;", "prompt": "Add comments", "language": "sql"}'
```

## Common Issues

### 1. "API key not configured"
- Check your Netlify environment variables
- Ensure variable names are exactly: `CHATBOT_GEMINI_API_KEY` and `OPENROUTER_API_KEY`
- Redeploy after adding variables

### 2. "API rate limit exceeded"
- Wait a few minutes and try again
- Check your API usage limits

### 3. "AI model returned empty response"
- Your API key might be invalid or expired
- Regenerate your API keys
- Check if your account has sufficient credits

### 4. Network errors
- Check your internet connection
- Verify the function URLs are correct
- Check if Netlify is experiencing issues

## Getting API Keys

### Google Generative AI (Gemini)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to Netlify as `CHATBOT_GEMINI_API_KEY`

### OpenRouter
1. Go to [OpenRouter](https://openrouter.ai/keys)
2. Create a new API key
3. Add to Netlify as `OPENROUTER_API_KEY`

## Check Netlify Logs

1. Go to your Netlify dashboard
2. Navigate to your site
3. Go to **Functions** tab
4. Click on any function to see its logs
5. Look for error messages

## Expected Results

When everything is working correctly, you should see:

✅ **Test function**: Shows API keys are present and working
✅ **Chatbot**: Returns a helpful response about technologies
✅ **AI Explain**: Provides detailed code explanation
✅ **AI Rewrite**: Returns rewritten code with improvements

If you see ❌ errors, follow the troubleshooting steps above. 