# Backend Troubleshooting Guide

This guide will help you diagnose and fix issues with your AI functions (chatbot, AI explain, and AI rewrite).

## 1. Check Your Environment Variables

First, verify that your environment variables are properly set in Netlify:

### Required Environment Variables:
- `CHATBOT_GEMINI_API_KEY` - For the chatbot (Google Generative AI)
- `OPENROUTER_API_KEY` - For AI explain and rewrite functions

### How to Check:
1. Go to your Netlify dashboard
2. Navigate to your site
3. Go to **Site settings** → **Environment variables**
4. Verify both keys are present and have valid values

## 2. Test Your API Keys

Visit this URL to test your API keys:
```
https://your-site.netlify.app/.netlify/functions/test-ai-functions
```

This will show you:
- Whether your API keys are present
- The length of each key
- Test results for both Gemini and OpenRouter APIs

### Expected Output:
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "production",
  "apiKeys": {
    "chatbot": {
      "present": true,
      "length": 39,
      "startsWith": "AIzaSy..."
    },
    "openrouter": {
      "present": true,
      "length": 51,
      "startsWith": "sk-or-v1..."
    }
  },
  "tests": {
    "chatbot": {
      "success": true,
      "responseLength": 150,
      "model": "gemini-1.5-flash"
    },
    "openrouter": {
      "success": true,
      "responseLength": 200,
      "model": "qwen/qwen3-coder:free"
    }
  }
}
```

## 3. Check Netlify Function Logs

### Method 1: Netlify Dashboard
1. Go to your Netlify dashboard
2. Navigate to your site
3. Go to **Functions** tab
4. Click on any function to see its logs
5. Look for error messages or API key issues

### Method 2: Netlify CLI
```bash
# Install Netlify CLI if you haven't
npm install -g netlify-cli

# Login to Netlify
netlify login

# View function logs
netlify functions:logs --name chatbot
netlify functions:logs --name ai-explain
netlify functions:logs --name ai-rewrite
```

## 4. Test Individual Functions

### Test Chatbot Function:
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/chatbot \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, this is a test message"}'
```

### Test AI Explain Function:
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/ai-explain \
  -H "Content-Type: application/json" \
  -d '{"code": "console.log(\"Hello World\");", "language": "javascript"}'
```

### Test AI Rewrite Function:
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/ai-rewrite \
  -H "Content-Type: application/json" \
  -d '{"code": "console.log(\"Hello World\");", "prompt": "Add comments", "language": "javascript"}'
```

## 5. Common Issues and Solutions

### Issue: "API key not configured"
**Solution:** 
- Check your Netlify environment variables
- Ensure the variable names are exactly correct (case-sensitive)
- Redeploy your site after adding variables

### Issue: "API rate limit exceeded"
**Solution:**
- Wait a few minutes and try again
- Check your API usage limits
- Consider upgrading your API plan

### Issue: "AI model returned empty response"
**Solution:**
- This usually means the API key is invalid or expired
- Regenerate your API keys
- Check if your API account has sufficient credits

### Issue: "Network error" or "fetch failed"
**Solution:**
- Check your internet connection
- Verify the function URLs are correct
- Check if Netlify is experiencing issues

## 6. API Key Sources

### Google Generative AI (Gemini):
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and add it to Netlify as `CHATBOT_GEMINI_API_KEY`

### OpenRouter:
1. Go to [OpenRouter](https://openrouter.ai/keys)
2. Create a new API key
3. Copy the key and add it to Netlify as `OPENROUTER_API_KEY`

## 7. Debugging Steps

1. **Check the test function first** - This will tell you if your API keys are working
2. **Check function logs** - Look for specific error messages
3. **Test with curl** - This bypasses the frontend and tests the backend directly
4. **Check browser console** - Look for network errors or CORS issues

## 8. Redeploy After Changes

After making any changes to environment variables or function code:
1. Commit and push your changes to GitHub
2. Netlify will automatically redeploy
3. Wait for the deployment to complete
4. Test your functions again

## 9. Contact Support

If you're still having issues:
1. Check the Netlify status page for any service issues
2. Look at the specific error messages in the function logs
3. Verify your API keys are valid and have sufficient credits
4. Test with a simple curl command to isolate the issue

## 10. Quick Checklist

- [ ] Environment variables set in Netlify
- [ ] API keys are valid and have credits
- [ ] Functions are deployed and accessible
- [ ] Test function returns success
- [ ] Individual functions work with curl
- [ ] Browser console shows no errors
- [ ] Network tab shows successful requests

Follow this guide step by step to identify and fix any backend issues with your AI functions. 