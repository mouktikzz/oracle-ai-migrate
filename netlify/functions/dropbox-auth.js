const fetch = require('node-fetch');

const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID;
const DROPBOX_CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET;

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { code, redirect_uri } = JSON.parse(event.body);

    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Authorization code is required' })
      };
    }

    if (!DROPBOX_CLIENT_ID || !DROPBOX_CLIENT_SECRET) {
      console.error('Dropbox OAuth credentials not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Dropbox OAuth not configured' })
      };
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        client_id: DROPBOX_CLIENT_ID,
        client_secret: DROPBOX_CLIENT_SECRET,
        redirect_uri: redirect_uri || `${event.headers.origin}/cloud-callback`
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Dropbox token exchange error:', tokenData);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: tokenData.error_description || tokenData.error || 'Failed to exchange code for token' 
        })
      };
    }

    if (!tokenData.access_token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No access token received from Dropbox' })
      };
    }

    // Fetch user data using the access token
    const userResponse = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      console.error('Dropbox API error:', userResponse.status, userResponse.statusText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch user data from Dropbox' })
      };
    }

    const userData = await userResponse.json();

    // Return the access token and user data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        access_token: tokenData.access_token,
        token_type: 'bearer',
        scope: tokenData.scope,
        user: {
          id: userData.account_id,
          name: userData.name.display_name,
          email: userData.email,
          avatar_url: userData.profile_photo_url,
          provider: 'dropbox'
        }
      })
    };

  } catch (error) {
    console.error('Dropbox auth function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 