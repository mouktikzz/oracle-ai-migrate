# AI Functions Troubleshooting Guide

## 🔍 **Issues Identified and Fixed:**

### **1. Missing Dependencies**
- **Problem**: `node-fetch` was missing from Netlify functions
- **Fix**: Added `node-fetch` to `netlify/functions/package.json`

### **2. Missing CORS Headers**
- **Problem**: `ai-rewrite.js` and `ai-explain.js` were missing CORS headers
- **Fix**: Added proper CORS headers to all functions

### **3. API Key Validation**
- **Problem**: No validation for missing API keys
- **Fix**: Added API key checks with helpful error messages

## 🧪 **Testing Your AI Functions:**

### **Step 1: Test API Keys**
Visit this URL to test your API keys:
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

### **Step 2: Test Individual Functions**

**Chatbot Function:**
```
POST https://your-site.netlify.app/.netlify/functions/chatbot
Content-Type: application/json

{
  "message": "Hello, this is a test message."
}
```

**AI Rewrite Function:**
```
POST https://your-site.netlify.app/.netlify/functions/ai-rewrite
Content-Type: application/json

{
  "code": "console.log('Hello World');",
  "prompt": "Convert to TypeScript"
}
```

**AI Explain Function:**
```
POST https://your-site.netlify.app/.netlify/functions/ai-explain
Content-Type: application/json

{
  "code": "console.log('Hello World');"
}
```

### **Step 3: Use the Debug Button**
1. Open your website
2. Click the chatbot button
3. Click "Test AI Functions" button
4. Check the console for detailed results

## 🔧 **Environment Variables Required:**

### **Frontend Variables (VITE_ prefix):**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=AIzaSy...
```

### **Backend Variables (no prefix):**
```
CHATBOT_GEMINI_API_KEY=AIzaSy...
OPENROUTER_API_KEY=sk-or-v1...
```

## 🚨 **Common Issues and Solutions:**

### **Issue 1: "API key not configured"**
**Solution:**
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add the missing API key
3. Redeploy your site

### **Issue 2: "CORS error"**
**Solution:**
- ✅ Fixed: Added CORS headers to all functions

### **Issue 3: "Function not found"**
**Solution:**
1. Check if functions are in `netlify/functions/` directory
2. Ensure `netlify.toml` has correct functions directory
3. Redeploy your site

### **Issue 4: "Module not found"**
**Solution:**
1. Check `netlify/functions/package.json` has all dependencies
2. Run `npm install` in the functions directory
3. Redeploy your site

## 📋 **Checklist for Working AI Functions:**

- [ ] `CHATBOT_GEMINI_API_KEY` is set in Netlify environment variables
- [ ] `OPENROUTER_API_KEY` is set in Netlify environment variables
- [ ] API keys start with correct prefixes (`AIzaSy` for Gemini, `sk-or-v1` for OpenRouter)
- [ ] Functions are deployed to Netlify
- [ ] No CORS errors in browser console
- [ ] Test function returns success for both APIs

## 🎯 **Next Steps:**

1. **Deploy the changes** to your repository
2. **Test the functions** using the debug button
3. **Check the console** for detailed error messages
4. **Verify API keys** are correctly set in Netlify

## 📞 **If Issues Persist:**

1. Check the browser console for specific error messages
2. Test the functions directly using the URLs above
3. Verify your API keys are valid and have sufficient credits
4. Check Netlify function logs in the dashboard

The fixes I've implemented should resolve the chatbot and AI function issues. The main problems were missing dependencies and CORS headers, which are now fixed! 