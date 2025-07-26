# GitHub Integration Setup

## Overview
The upload files page now supports importing SQL files directly from GitHub repositories. This feature allows users to connect their GitHub account and import files without downloading them locally.

## Features
- **OAuth Authentication**: Secure GitHub login via popup window
- **Repository Selection**: Import files from any public or private repository
- **Branch Selection**: Choose specific branches (default: main)
- **File Filtering**: Automatically filters for SQL-related files (.sql, .prc, .trg, etc.)
- **Token Storage**: Access tokens stored in browser localStorage

## Setup Instructions

### 1. Create GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Cosmo Agents Migration
   - **Homepage URL**: `https://your-domain.netlify.app`
   - **Authorization callback URL**: `https://your-domain.netlify.app/github-callback`
4. Click "Register application"
5. Copy the **Client ID**

### 2. Update Environment Variables
Add the GitHub Client ID to your environment variables:

```env
VITE_GITHUB_CLIENT_ID=your_github_client_id_here
```

### 3. Update Code
In `src/components/CodeUploader.tsx`, update the GitHub Client ID:

```typescript
// Replace this line:
const GITHUB_CLIENT_ID = 'your_github_client_id';

// With this:
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
```

## How It Works

### 1. User Flow
1. User selects "GitHub Repository" from upload source dropdown
2. User enters repository URL (e.g., `https://github.com/username/repo`)
3. User clicks "Connect & Import"
4. GitHub OAuth popup opens
5. User authorizes the application
6. Files are automatically imported and processed

### 2. Technical Flow
1. **OAuth Initiation**: Opens GitHub OAuth popup with repository URL as state
2. **Authorization**: User authorizes on GitHub
3. **Callback**: GitHub redirects to `/github-callback` with authorization code
4. **Token Exchange**: Code is exchanged for access token (simulated for demo)
5. **File Fetching**: GitHub API fetches repository contents
6. **File Processing**: SQL files are filtered and processed
7. **Import**: Files are added to the upload list

### 3. File Processing
- **Supported Extensions**: .sql, .txt, .prc, .trg, .tab, .proc, .sp
- **File Type Detection**: Automatic detection of tables, procedures, triggers
- **Content Decoding**: Base64 encoded content is automatically decoded
- **Duplicate Prevention**: Prevents importing duplicate files

## Security Considerations

### Current Implementation (Demo)
- Uses mock token generation for demonstration
- No server-side token exchange
- Tokens stored in localStorage

### Production Implementation
For production use, you should:

1. **Server-side Token Exchange**: Implement proper OAuth token exchange on your backend
2. **Secure Token Storage**: Use secure HTTP-only cookies or server-side sessions
3. **Token Refresh**: Implement token refresh logic
4. **Rate Limiting**: Add rate limiting for GitHub API calls
5. **Error Handling**: Comprehensive error handling for API failures

## API Endpoints Used

### GitHub API
- `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1` - Get repository tree
- `GET /repos/{owner}/{repo}/git/blobs/{sha}` - Get file content

### Required Scopes
- `repo` - Access to private repositories
- `read:packages` - Read package files (optional)

## Troubleshooting

### Common Issues
1. **Invalid Repository URL**: Ensure URL format is `https://github.com/username/repo`
2. **Permission Denied**: Check repository visibility and user permissions
3. **No SQL Files**: Repository must contain files with supported extensions
4. **OAuth Error**: Verify callback URL matches GitHub OAuth app settings

### Debug Steps
1. Check browser console for errors
2. Verify GitHub OAuth app configuration
3. Test with public repositories first
4. Check network tab for API call failures

## Future Enhancements

### Planned Features
- **Dropbox Integration**: Import from Dropbox folders
- **Google Drive Integration**: Import from Google Drive
- **File Preview**: Preview files before importing
- **Bulk Operations**: Select multiple repositories
- **Branch Comparison**: Compare files across branches

### Technical Improvements
- **Real OAuth Implementation**: Proper server-side token exchange
- **Caching**: Cache repository contents for better performance
- **Progress Indicators**: Show import progress for large repositories
- **Error Recovery**: Retry failed imports automatically

## Support
For issues or questions about GitHub integration, please check:
1. GitHub API documentation
2. OAuth app configuration
3. Network connectivity
4. Repository permissions 