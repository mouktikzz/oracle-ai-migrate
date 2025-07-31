# Backend Troubleshooting Guide

## 🔍 **How to Check Your Backend Issues:**

### **Step 1: Test Your API Keys**
Visit this URL to test if your API keys are working:
```
https://your-site.netlify.app/.netlify/functions/test-ai-functions
```

**Expected Response:**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
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
      "responseLength": 25,
      "model": "gemini-1.5-flash"
    },
    "openrouter": {
      "success": true,
      "responseLength": 30,
      "model": "qwen/qwen3-coder:free"
    }
  }
}
```

### **Step 2: Check Netlify Function Logs**
1. Go to **Netlify Dashboard**
2. Click on your site
3. Go to **Functions** tab
4. Look for any error logs

### **Step 3: Test Individual Functions**

**Test Chatbot:**
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/chatbot \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, this is a test"}'
```

**Test AI Rewrite:**
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/ai-rewrite \
  -H "Content-Type: application/json" \
  -d '{"code": "console.log(\"Hello World\");", "prompt": "Convert to TypeScript"}'
```

**Test AI Explain:**
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/ai-explain \
  -H "Content-Type: application/json" \
  -d '{"code": "console.log(\"Hello World\");"}'
```

## 🔧 **Environment Variables to Check:**

### **In Netlify Dashboard → Site Settings → Environment Variables:**

**Required Variables:**
```
CHATBOT_GEMINI_API_KEY=AIzaSy... (your Gemini API key)
OPENROUTER_API_KEY=sk-or-v1... (your OpenRouter API key)
```

**Optional Variables:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=AIzaSy... (for frontend)
```

## 🚨 **Common Issues and Solutions:**

### **Issue 1: "API key not configured"**
**Symptoms:**
- Chatbot shows error message
- AI functions return 500 errors
- Test function shows "API key not configured"

**Solution:**
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add the missing API key
3. Redeploy your site

### **Issue 2: "No explanation returned"**
**Symptoms:**
- AI Code Analyzer shows "No explanation returned"
- AI Rewrite shows "No rewritten code returned"

**Solution:**
1. Check if `OPENROUTER_API_KEY` is set correctly
2. Verify the API key starts with `sk-or-v1`
3. Check if you have credits in your OpenRouter account

### **Issue 3: "Failed to fetch"**
**Symptoms:**
- Network errors in browser console
- Functions not responding

**Solution:**
1. Check if functions are deployed correctly
2. Verify `netlify/functions/` directory exists
3. Check Netlify function logs

### **Issue 4: "CORS error"**
**Symptoms:**
- Browser console shows CORS errors
- Functions work in curl but not in browser

**Solution:**
- ✅ Fixed: Added CORS headers to all functions

## 📋 **Checklist for Working Backend:**

- [ ] `CHATBOT_GEMINI_API_KEY` is set and valid
- [ ] `OPENROUTER_API_KEY` is set and valid
- [ ] API keys have sufficient credits
- [ ] Functions are deployed to Netlify
- [ ] No errors in Netlify function logs
- [ ] Test function returns success for both APIs

## 🎯 **Quick Fix Steps:**

1. **Check API Keys:**
   ```
   https://your-site.netlify.app/.netlify/functions/test-ai-functions
   ```

2. **If API keys are missing:**
   - Go to Netlify Dashboard
   - Site Settings → Environment Variables
   - Add the missing keys
   - Redeploy

3. **If API keys are invalid:**
   - Get new API keys from:
     - Gemini: https://makersuite.google.com/app/apikey
     - OpenRouter: https://openrouter.ai/keys

4. **If functions are not deployed:**
   - Check `netlify/functions/` directory
   - Ensure `netlify.toml` has correct functions directory
   - Redeploy your site

## 📞 **If Issues Persist:**

1. **Check Netlify Function Logs:**
   - Go to Netlify Dashboard → Functions
   - Look for error messages

2. **Test Functions Directly:**
   - Use the curl commands above
   - Check response status and body

3. **Verify API Key Format:**
   - Gemini: Should start with `AIzaSy`
   - OpenRouter: Should start with `sk-or-v1`

4. **Check API Credits:**
   - Ensure you have sufficient credits in your accounts

The main issue is likely missing or invalid API keys. Use the test function to identify exactly what's wrong! 