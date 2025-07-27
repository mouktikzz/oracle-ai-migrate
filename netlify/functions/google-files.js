const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    let accessToken;

    if (event.httpMethod === 'POST') {
      // Get token from request body
      const { access_token } = JSON.parse(event.body);
      accessToken = access_token;
    } else {
      // Get token from Authorization header
      const authHeader = event.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authorization header required' })
        };
      }
      accessToken = authHeader.replace('Bearer ', '');
    }

    if (!accessToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Access token is required' })
      };
    }

    // Get query parameters
    const queryParams = new URLSearchParams(event.queryStringParameters || {});
    const pageSize = queryParams.get('pageSize') || '100';
    const q = queryParams.get('q') || '';

    // Build query for Google Drive API
    let driveQuery = 'trashed=false';
    if (q) {
      driveQuery += ` and (${q})`;
    }

    // Fetch files from Google Drive API
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&q=${encodeURIComponent(driveQuery)}&fields=files(id,name,mimeType,size,modifiedTime,parents)`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('Google Drive API error:', response.status, response.statusText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `Google Drive API error: ${response.status} ${response.statusText}` 
        })
      };
    }

    const data = await response.json();

    // Transform file data
    const files = data.files.map(file => ({
      id: file.id,
      name: file.name,
      type: file.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
      size: file.size ? parseInt(file.size) : undefined,
      modified: file.modifiedTime,
      path: file.name, // Google Drive doesn't have explicit paths like Dropbox
      provider: 'google-drive'
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        files: files,
        nextPageToken: data.nextPageToken
      })
    };

  } catch (error) {
    console.error('Google Drive files function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 