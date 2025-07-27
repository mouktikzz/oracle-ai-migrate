# Cloud Storage Integration Setup Guide

This guide explains how to set up OAuth integration for GitHub, Dropbox, and Google Drive in your migration tool.

## Overview

The application now supports three cloud storage providers:
- **GitHub**: Access repositories and import code
- **Dropbox**: Access files and folders
- **Google Drive**: Access documents and files

All integrations use popup-based OAuth flows (no full page redirects) and include file browsing capabilities.

## Required Environment Variables

Add these environment variables to your Netlify deployment:

### Frontend Variables (Safe to expose)
```
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_DROPBOX_CLIENT_ID=your_dropbox_client_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend Variables (Keep secure)
```
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
DROPBOX_CLIENT_ID=your_dropbox_client_id
DROPBOX_CLIENT_SECRET=your_dropbox_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 1. GitHub OAuth Setup

### Step 1: Create GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the form:
   - **Application name**: `Your App Name`
   - **Homepage URL**: `https://your-site-name.netlify.app`
   - **Application description**: `AI-powered database migration tool`
   - **Authorization callback URL**: `https://your-site-name.netlify.app/cloud-callback`
4. Click **"Register application"**
5. Copy the **Client ID** and **Client Secret**

### Step 2: Add to Environment Variables
In Netlify Dashboard → Site Settings → Environment Variables:
```
VITE_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## 2. Dropbox OAuth Setup

### Step 1: Create Dropbox App
1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click **"Create app"**
3. Choose **"Scoped access"**
4. Choose **"Full Dropbox"** access
5. Enter app name: `Your Migration Tool`
6. Click **"Create app"**

### Step 2: Configure OAuth Settings
1. In your app settings, go to **"OAuth 2"** section
2. Add redirect URI: `https://your-site-name.netlify.app/cloud-callback`
3. Under **"Permissions"**, enable:
   - `files.metadata.read`
   - `files.content.read`
4. Click **"Submit"**
5. Copy the **App key** (Client ID) and **App secret** (Client Secret)

### Step 3: Add to Environment Variables
```
VITE_DROPBOX_CLIENT_ID=your_dropbox_app_key
DROPBOX_CLIENT_ID=your_dropbox_app_key
DROPBOX_CLIENT_SECRET=your_dropbox_app_secret
```

## 3. Google Drive OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Drive API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### Step 2: Create OAuth 2.0 Credentials
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. Choose **"Web application"**
4. Add authorized redirect URIs:
   - `https://your-site-name.netlify.app/cloud-callback`
5. Click **"Create"**
6. Copy the **Client ID** and **Client Secret**

### Step 3: Add to Environment Variables
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Backend Functions Created

The following Netlify serverless functions have been created:

### Authentication Functions
- `netlify/functions/github-auth.js` - GitHub OAuth token exchange
- `netlify/functions/dropbox-auth.js` - Dropbox OAuth token exchange  
- `netlify/functions/google-auth.js` - Google OAuth token exchange

### File Fetching Functions
- `netlify/functions/github-repos.js` - Fetch GitHub repositories
- `netlify/functions/dropbox-files.js` - Fetch Dropbox files/folders
- `netlify/functions/google-files.js` - Fetch Google Drive files

## Frontend Components

### New Components
- `src/components/CloudStorageAuth.tsx` - Unified cloud storage authentication modal
- `src/pages/CloudCallback.tsx` - Universal OAuth callback handler

### Updated Components
- `src/pages/Dashboard.tsx` - Now uses CloudStorageAuth
- `src/pages/Landing.tsx` - Now uses CloudStorageAuth
- `src/components/dashboard/DashboardHeader.tsx` - Updated button

## How It Works

### 1. Popup Authentication Flow
1. User clicks "Connect Cloud" button
2. Modal opens with tabs for GitHub, Dropbox, Google Drive
3. User selects provider and clicks connect
4. Popup window opens for OAuth authentication
5. After authentication, popup communicates back to main window
6. Popup closes automatically
7. User data and files are displayed in modal

### 2. File Browsing
- After authentication, the system fetches available files
- Files are displayed in a scrollable list
- Users can see file names, types, and sizes
- Support for pagination and folder navigation

### 3. Security Features
- All OAuth secrets stored securely in backend
- CORS properly configured
- Token validation and error handling
- Secure popup communication

## Testing the Integration

### 1. Deploy Your Changes
```bash
git add .
git commit -m "Add cloud storage integration"
git push origin main
```

### 2. Test Each Provider
1. **GitHub**: Should show repositories
2. **Dropbox**: Should show files and folders
3. **Google Drive**: Should show documents and files

### 3. Verify Popup Behavior
- Authentication should open in popup, not new tab
- Popup should close automatically after success
- No full page redirects should occur

## Troubleshooting

### Common Issues

1. **"OAuth not configured"**
   - Check environment variables are set correctly
   - Verify client IDs and secrets match

2. **"Popup blocked"**
   - Allow popups for your site
   - Check browser popup blocker settings

3. **"Invalid redirect URI"**
   - Ensure callback URLs match exactly in OAuth app settings
   - Check for trailing slashes or protocol mismatches

4. **CORS Errors**
   - Verify Netlify functions are deployed
   - Check function logs in Netlify Dashboard

### Debugging Steps

1. **Check Netlify Function Logs**
   - Go to Netlify Dashboard → Functions
   - View logs for auth functions

2. **Test Individual Functions**
   - Use Postman to test functions directly
   - Check request/response format

3. **Browser Developer Tools**
   - Check Network tab for failed requests
   - Look for CORS errors in Console

## Next Steps

After successful setup:

1. **Implement File Selection**
   - Add checkboxes to select files
   - Implement file download/import functionality

2. **Add File Preview**
   - Show file contents for supported formats
   - Add file type filtering

3. **Enhance Security**
   - Add token refresh logic
   - Implement proper token storage
   - Add rate limiting

4. **User Experience**
   - Add loading states for file fetching
   - Implement search and filtering
   - Add file upload capabilities

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Netlify function logs
3. Verify OAuth app configurations
4. Test with Postman first

For additional help, refer to:
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Dropbox API Documentation](https://www.dropbox.com/developers/documentation)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/) 