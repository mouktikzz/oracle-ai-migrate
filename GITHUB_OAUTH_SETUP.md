# GitHub OAuth Setup Guide

This guide will help you set up GitHub OAuth authentication for the Sybase to Oracle Migration Tool.

## Prerequisites

- A GitHub account
- Access to GitHub Developer Settings

## Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: `Sybase to Oracle Migration Tool`
   - **Homepage URL**: `http://localhost:5173` (for development) or your production URL
   - **Application description**: `AI-powered Sybase to Oracle database migration tool`
   - **Authorization callback URL**: `http://localhost:5173/github-callback` (for development) or `https://yourdomain.com/github-callback` (for production)

## Step 2: Get Your Client ID

After creating the OAuth app, you'll get a Client ID. Copy this value.

## Step 3: Configure Environment Variables

Create a `.env` file in your project root and add:

```env
VITE_GITHUB_CLIENT_ID=your_github_client_id_here
```

Replace `your_github_client_id_here` with the actual Client ID from Step 2.

## Step 4: Update Production Settings

For production deployment:

1. Go back to your GitHub OAuth App settings
2. Update the **Homepage URL** to your production domain
3. Update the **Authorization callback URL** to `https://yourdomain.com/github-callback`
4. Update your production environment variables

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Click the "Connect GitHub" button in the application
3. You should see a popup window with GitHub's authorization page
4. Authorize the application
5. The popup should close and you should see a success message

## Troubleshooting

### Popup Blocked
If the popup is blocked by your browser:
1. Allow popups for your localhost domain
2. Try clicking the "Connect GitHub" button again

### Invalid Redirect URI
If you get an "Invalid redirect URI" error:
1. Check that the callback URL in your GitHub OAuth App matches exactly
2. Make sure there are no trailing slashes or extra characters

### Environment Variable Not Found
If you get an error about the client ID:
1. Make sure your `.env` file is in the project root
2. Restart your development server after adding the environment variable
3. Check that the variable name is exactly `VITE_GITHUB_CLIENT_ID`

## Security Notes

- Never commit your `.env` file to version control
- Keep your Client ID secure
- For production, use environment variables provided by your hosting platform
- Consider implementing PKCE (Proof Key for Code Exchange) for additional security

## Next Steps

Once GitHub OAuth is working, you can:
1. Store the GitHub user data in your database
2. Implement repository access features
3. Add code import from GitHub repositories
4. Enable version control integration

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your GitHub OAuth App settings
3. Ensure your environment variables are correctly set
4. Check that your callback URL is accessible 