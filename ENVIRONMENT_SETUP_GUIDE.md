# Environment Setup Guide - Fix Supabase & Chatbot Issues

## 🚨 Current Issues
1. **Supabase Authentication Not Working** - "Supabase not configured" error
2. **Chatbot Not Responding** - No answers from AI

## 🔍 Quick Diagnosis

### Step 1: Check Browser Console
1. Open your website
2. Press `F12` to open developer tools
3. Go to **Console** tab
4. Look for these messages:
   - `❌ Supabase not configured properly!`
   - `🔍 Environment Variables Check:`
   - `❌ CHATBOT_GEMINI_API_KEY: Missing/Invalid`

### Step 2: Test Functions Directly
Visit these URLs to test your functions:
- **Test Chatbot:** `https://your-site.netlify.app/.netlify/functions/test-chatbot`
- **Chatbot Function:** `https://your-site.netlify.app/.netlify/functions/chatbot`

## 🔧 Fix Environment Variables

### For Netlify (Production)

1. **Go to Netlify Dashboard:**
   - Visit: https://app.netlify.com/
   - Select your site
   - Go to **Site Settings** → **Environment Variables**

2. **Add These Variables as Key/Value pairs:**

| Key | Value | Description |
|-----|-------|-------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Your Supabase anonymous key |
| `VITE_GEMINI_API_KEY` | `AIzaSy...` | Your Google AI API key |
| `CHATBOT_GEMINI_API_KEY` | `AIzaSy...` | Your Google AI API key (for chatbot) |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | Your OpenRouter API key |

3. **Redeploy Your Site:**
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**

### For Local Development

1. **Create `.env` file** in your project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_google_ai_key
```

2. **Restart your development server:**
```bash
npm run dev
```

## 📋 How to Get Your API Keys

### 1. Supabase Keys
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 2. Google AI API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **Create API Key**
3. Copy the key → Use for both `VITE_GEMINI_API_KEY` and `CHATBOT_GEMINI_API_KEY`

### 3. OpenRouter API Key
1. Go to [OpenRouter](https://openrouter.ai/keys)
2. Create a new API key
3. Copy the key → `OPENROUTER_API_KEY`

## ✅ Verification Steps

### 1. Check Browser Console
After adding variables, refresh your site and check console for:
```
✅ Supabase configured successfully
✅ All required environment variables are configured!
```

### 2. Test Authentication
1. Try to sign up/login
2. Should work without "Supabase not configured" error

### 3. Test Chatbot
1. Open chatbot
2. Send a message
3. Should get AI response instead of error

### 4. Test Functions
Visit: `https://your-site.netlify.app/.netlify/functions/test-chatbot`
Should see: `{"success": true, "message": "Chatbot is working correctly!"}`

## 🚨 Common Issues & Solutions

### Issue: "Supabase not configured"
**Solution:**
- Check `VITE_SUPABASE_URL` starts with `https://`
- Check `VITE_SUPABASE_ANON_KEY` starts with `eyJ`
- Redeploy after adding variables

### Issue: "Chatbot API key not configured"
**Solution:**
- Add `CHATBOT_GEMINI_API_KEY` in Netlify environment variables
- Make sure it's the same as your Google AI API key
- Redeploy site

### Issue: Functions return 404
**Solution:**
- Check that `netlify/functions/` folder exists
- Verify `netlify.toml` is configured
- Redeploy site

### Issue: Variables not updating
**Solution:**
- Variables only update after redeploy
- Go to **Deploys** → **Trigger deploy**
- Wait for deployment to complete

## 🔗 Useful Links

- **Netlify Dashboard:** https://app.netlify.com/
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Google AI Studio:** https://makersuite.google.com/app/apikey
- **OpenRouter:** https://openrouter.ai/keys

## 📞 Still Having Issues?

1. **Check the browser console** for specific error messages
2. **Test the functions directly** using the URLs above
3. **Verify your API keys** are valid and have quota
4. **Make sure you redeployed** after adding environment variables

## 🎯 Expected Results

After fixing the environment variables:
- ✅ Authentication works (sign up/login)
- ✅ Chatbot responds with AI answers
- ✅ All Supabase features work
- ✅ No "not configured" errors in console 