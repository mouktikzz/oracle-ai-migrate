# Chatbot Troubleshooting Guide

## Quick Test

First, test if your chatbot is working by visiting this URL after deployment:
```
https://your-site.netlify.app/.netlify/functions/test-chatbot
```

You should see a JSON response indicating if the chatbot is working.

## Common Issues & Solutions

### 1. **Chatbot Not Responding**

**Symptoms:**
- Chatbot shows "Thinking..." but never responds
- Error message about AI service connection

**Solutions:**
1. **Check Environment Variables:**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Ensure `CHATBOT_GEMINI_API_KEY` is set correctly
   - The key should start with `AIza...`

2. **Verify API Key:**
   - Get a fresh API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Make sure billing is enabled on your Google Cloud account
   - Ensure the API key has access to Gemini models

3. **Test the Function Directly:**
   ```bash
   curl -X POST https://your-site.netlify.app/.netlify/functions/chatbot \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello"}'
   ```

### 2. **HTTP 500 Errors**

**Symptoms:**
- Console shows HTTP 500 errors
- Function logs show API errors

**Solutions:**
1. **Check Netlify Function Logs:**
   - Go to Netlify Dashboard → Functions
   - Look for error logs in the chatbot function

2. **Verify Model Name:**
   - The function now uses `gemini-1.5-flash` (more stable)
   - If still failing, try `gemini-1.5-pro`

3. **Check API Quota:**
   - Ensure your Google AI API has sufficient quota
   - Check billing status in Google Cloud Console

### 3. **CORS Errors**

**Symptoms:**
- Browser console shows CORS errors
- "Failed to fetch" errors

**Solutions:**
1. **Check Function Headers:**
   - The function includes proper CORS headers
   - Ensure the function is deployed correctly

2. **Test from Same Domain:**
   - Make sure you're testing from your deployed site
   - Not from localhost or a different domain

### 4. **Environment Variable Issues**

**Symptoms:**
- "API key not configured" errors
- Function returns 500 with API_KEY_MISSING

**Solutions:**
1. **Redeploy After Adding Variables:**
   - Add environment variables in Netlify
   - Trigger a new deployment
   - Variables are only available after redeploy

2. **Check Variable Names:**
   - Must be exactly: `CHATBOT_GEMINI_API_KEY`
   - Case sensitive
   - No extra spaces

### 5. **Function Not Deployed**

**Symptoms:**
- 404 errors when calling the function
- Function URL returns "Not Found"

**Solutions:**
1. **Check Function Files:**
   - Ensure `netlify/functions/chatbot.js` exists
   - Ensure `netlify/functions/package.json` exists
   - Check `netlify.toml` configuration

2. **Redeploy:**
   - Push changes to your Git repository
   - Wait for Netlify to rebuild and deploy

## Debugging Steps

### Step 1: Check Browser Console
1. Open your website
2. Open browser developer tools (F12)
3. Go to Console tab
4. Try sending a message in the chatbot
5. Look for error messages

### Step 2: Check Network Tab
1. In developer tools, go to Network tab
2. Send a message in the chatbot
3. Look for the request to `/.netlify/functions/chatbot`
4. Check the response status and body

### Step 3: Test Function Directly
Visit: `https://your-site.netlify.app/.netlify/functions/test-chatbot`

Expected response:
```json
{
  "success": true,
  "message": "Chatbot is working correctly!",
  "testResponse": "...",
  "apiKeyStatus": "Present",
  "model": "gemini-1.5-flash"
}
```

### Step 4: Check Netlify Logs
1. Go to Netlify Dashboard
2. Select your site
3. Go to Functions tab
4. Check for error logs

## Environment Variables Checklist

Make sure you have these in Netlify:

| Variable | Value | Required |
|----------|-------|----------|
| `CHATBOT_GEMINI_API_KEY` | `AIza...` (your Google AI key) | ✅ Yes |
| `VITE_GEMINI_API_KEY` | `AIza...` (your Google AI key) | ✅ Yes |
| `OPENROUTER_API_KEY` | Your OpenRouter key | ✅ Yes |
| `VITE_SUPABASE_URL` | Your Supabase URL | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | ✅ Yes |

## Testing Commands

### Test Function Health
```bash
curl https://your-site.netlify.app/.netlify/functions/test-chatbot
```

### Test Chatbot Function
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/chatbot \
  -H "Content-Type: application/json" \
  -d '{"message": "What is React?"}'
```

## Still Having Issues?

1. **Check the test function** first to isolate the problem
2. **Look at browser console** for specific error messages
3. **Check Netlify function logs** for server-side errors
4. **Verify your API key** is valid and has quota
5. **Try a different Gemini model** if needed

## Emergency Fallback

If the chatbot still doesn't work, you can temporarily revert to the simulated response by commenting out the API call in `src/components/CosmoChatbot.tsx` and uncommenting the setTimeout section. 