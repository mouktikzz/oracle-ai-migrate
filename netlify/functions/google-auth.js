const fetch = require('node-fetch');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

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

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth credentials not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Google OAuth not configured' })
      };
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirect_uri || `${event.headers.origin}/cloud-callback`
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Google token exchange error:', tokenData);
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
        body: JSON.stringify({ error: 'No access token received from Google' })
      };
    }

    // Fetch user data using the access token
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!userResponse.ok) {
      console.error('Google API error:', userResponse.status, userResponse.statusText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch user data from Google' })
      };
    }

    const userData = await userResponse.json();

    // Return the access token and user data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          avatar_url: userData.picture,
          provider: 'google-drive'
        }
      })
    };

  } catch (error) {
    console.error('Google auth function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 