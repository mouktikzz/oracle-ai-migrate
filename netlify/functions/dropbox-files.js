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
    const path = queryParams.get('path') || '';
    const limit = queryParams.get('limit') || '100';

    // Fetch files from Dropbox API
    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: path,
        limit: parseInt(limit),
        include_media_info: false,
        include_deleted: false,
        include_has_explicit_shared_members: false,
        include_mounted_folders: true,
        include_non_downloadable_files: true
      })
    });

    if (!response.ok) {
      console.error('Dropbox API error:', response.status, response.statusText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `Dropbox API error: ${response.status} ${response.statusText}` 
        })
      };
    }

    const data = await response.json();

    // Transform file data
    const files = data.entries.map(entry => ({
      id: entry.id,
      name: entry.name,
      type: entry['.tag'] === 'folder' ? 'folder' : 'file',
      size: entry.size,
      modified: entry.server_modified,
      path: entry.path_display,
      provider: 'dropbox'
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        files: files,
        cursor: data.cursor,
        has_more: data.has_more
      })
    };

  } catch (error) {
    console.error('Dropbox files function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 