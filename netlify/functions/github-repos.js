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
    const page = queryParams.get('page') || '1';
    const perPage = queryParams.get('per_page') || '30';
    const sort = queryParams.get('sort') || 'updated';
    const direction = queryParams.get('direction') || 'desc';

    // Fetch repositories from GitHub API
    const reposUrl = `https://api.github.com/user/repos?page=${page}&per_page=${perPage}&sort=${sort}&direction=${direction}`;
    
    const response = await fetch(reposUrl, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CosmoAgents-Migration-Tool'
      }
    });

    if (!response.ok) {
      console.error('GitHub API error:', response.status, response.statusText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `GitHub API error: ${response.status} ${response.statusText}` 
        })
      };
    }

    const repos = await response.json();

    // Get pagination info from headers
    const linkHeader = response.headers.get('link');
    const hasNextPage = linkHeader && linkHeader.includes('rel="next"');
    const hasPrevPage = linkHeader && linkHeader.includes('rel="prev"');

    // Transform repository data to include only necessary fields
    const transformedRepos = repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      fork: repo.fork,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      updated_at: repo.updated_at,
      created_at: repo.created_at,
      default_branch: repo.default_branch,
      size: repo.size,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      ssh_url: repo.ssh_url,
      topics: repo.topics || []
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        repositories: transformedRepos,
        pagination: {
          page: parseInt(page),
          per_page: parseInt(perPage),
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage
        },
        total_count: transformedRepos.length
      })
    };

  } catch (error) {
    console.error('GitHub repos function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 