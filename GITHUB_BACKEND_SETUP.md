# GitHub OAuth Backend Setup Guide

This guide explains how to set up the backend environment variables and configuration for the GitHub OAuth integration in your Netlify deployment.

## Prerequisites

1. **GitHub OAuth App**: You should have already created a GitHub OAuth App following the instructions in `GITHUB_OAUTH_SETUP.md`
2. **Netlify Account**: Your project should be deployed on Netlify
3. **GitHub Client ID and Secret**: From your GitHub OAuth App

## Backend Environment Variables

You need to add the following environment variables to your Netlify deployment:

### Required Variables

1. **`GITHUB_CLIENT_ID`**: Your GitHub OAuth App Client ID
2. **`GITHUB_CLIENT_SECRET`**: Your GitHub OAuth App Client Secret

### How to Add Environment Variables in Netlify

1. **Go to your Netlify Dashboard**
   - Visit [netlify.com](https://netlify.com) and sign in
   - Navigate to your project

2. **Access Site Settings**
   - Click on your site
   - Go to **Site settings** → **Environment variables**

3. **Add the Variables**
   - Click **Add a variable**
   - Add each variable:
     ```
     GITHUB_CLIENT_ID = your_github_client_id_here
     GITHUB_CLIENT_SECRET = your_github_client_secret_here
     ```

4. **Save and Deploy**
   - Click **Save**
   - Trigger a new deployment to apply the changes

## Backend Function Details

### `netlify/functions/github-auth.js`

This serverless function handles:

1. **Token Exchange**: Exchanges the authorization code for an access token
2. **User Data Fetching**: Retrieves user information from GitHub API
3. **CORS Handling**: Enables cross-origin requests
4. **Error Handling**: Provides detailed error messages

### Function Endpoint

- **URL**: `/.netlify/functions/github-auth`
- **Method**: `POST`
- **Content-Type**: `application/json`

### Request Body

```json
{
  "code": "authorization_code_from_github",
  "redirect_uri": "https://yourdomain.com/github-callback"
}
```

### Response Format

**Success Response:**
```json
{
  "access_token": "ghp_...",
  "token_type": "bearer",
  "scope": "user,repo",
  "user": {
    "id": 123456,
    "login": "username",
    "name": "User Name",
    "email": "user@example.com",
    "avatar_url": "https://avatars.githubusercontent.com/...",
    "bio": "User bio",
    "location": "City, Country",
    "company": "Company Name",
    "created_at": "2020-01-01T00:00:00Z",
    "public_repos": 10,
    "followers": 5,
    "following": 3
  }
}
```

**Error Response:**
```json
{
  "error": "Error description"
}
```

## Security Considerations

### 1. **Client Secret Protection**
- Never expose `GITHUB_CLIENT_SECRET` in frontend code
- Only use it in serverless functions
- Keep it secure in environment variables

### 2. **Token Security**
- Access tokens are sensitive and should be handled securely
- Consider implementing token storage in your database
- Implement token refresh logic for long-term access

### 3. **CORS Configuration**
- The function includes CORS headers for cross-origin requests
- In production, consider restricting the `Access-Control-Allow-Origin` to your specific domain

## Testing the Backend

### 1. **Local Testing**
To test the function locally:

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Set environment variables locally
export GITHUB_CLIENT_ID=your_client_id
export GITHUB_CLIENT_SECRET=your_client_secret

# Start local development
netlify dev
```

### 2. **Test the Function**
Use curl or Postman to test:

```bash
curl -X POST http://localhost:8888/.netlify/functions/github-auth \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test_code",
    "redirect_uri": "http://localhost:3000/github-callback"
  }'
```

## Troubleshooting

### Common Issues

1. **"GitHub OAuth not configured"**
   - Check that both `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set
   - Verify the environment variables are correctly named

2. **"Authorization code is required"**
   - Ensure the `code` parameter is being sent in the request body
   - Check that the authorization code hasn't expired

3. **"Failed to exchange code for token"**
   - Verify your GitHub OAuth App settings
   - Check that the redirect URI matches exactly
   - Ensure the client ID and secret are correct

4. **CORS Errors**
   - The function includes CORS headers, but check browser console for specific errors
   - Verify the request is coming from an allowed origin

### Debugging

1. **Check Netlify Function Logs**
   - Go to Netlify Dashboard → Functions
   - View the logs for the `github-auth` function

2. **Test with Postman**
   - Use Postman to test the function directly
   - Check request/response headers and body

3. **Browser Developer Tools**
   - Check Network tab for failed requests
   - Look for CORS errors in Console

## Next Steps

After setting up the backend:

1. **Test the Complete Flow**
   - Try the GitHub authentication from your frontend
   - Verify the popup opens and authentication completes

2. **Implement Token Storage**
   - Store GitHub tokens securely in your database
   - Implement token refresh logic

3. **Add Repository Access**
   - Use the access token to fetch user repositories
   - Implement repository selection and code import

4. **Enhance Security**
   - Add rate limiting to the function
   - Implement proper error logging
   - Add request validation

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Netlify function logs
3. Verify GitHub OAuth App configuration
4. Test with a simple curl request first

For additional help, refer to:
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/get-started/) 