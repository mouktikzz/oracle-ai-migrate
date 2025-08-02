const { Pinecone } = require('@pinecone-database/pinecone');

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { query } = JSON.parse(event.body);
    
    if (!query) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Query is required' })
      };
    }

    // Initialize Pinecone
    if (!process.env.PINECONE_API_KEY) {
      console.error('❌ PINECONE_API_KEY environment variable is not set');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'PINECONE_API_KEY environment variable is not configured',
          details: 'Please set PINECONE_API_KEY in your Netlify environment variables'
        })
      };
    }

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });

    // Generate query embedding using simple text similarity
    const queryEmbedding = generateSimpleEmbedding(query);

    // Get the index
    const indexName = 'oracle-migration-docs';
    let index;
    
    try {
      index = pinecone.index(indexName);
    } catch (error) {
      console.error('Index not found:', error.message);
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'RAG index not found. Please run the upload script first.',
          details: error.message 
        })
      };
    }

    // Search Pinecone
    console.log('🔍 Searching Pinecone with query:', query);
    const results = await index.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true
    });

    console.log('📊 Pinecone results:', {
      totalMatches: results.matches.length,
      matches: results.matches.map(m => ({ id: m.id, score: m.score, hasContent: !!m.metadata?.content }))
    });

    // Extract context from results
    const context = results.matches
      .map(match => match.metadata?.content || '')
      .filter(content => content.length > 0)
      .join('\n\n');

    console.log('📄 Context length:', context.length);
    if (context.length === 0) {
      console.log('⚠️ No context found - this might indicate an issue with the RAG system');
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        context,
        matches: results.matches.length,
        query: query,
        debug: {
          totalMatches: results.matches.length,
          contextLength: context.length,
          hasResults: results.matches.length > 0
        }
      })
    };

  } catch (error) {
    console.error('RAG API error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};

// Simple text similarity function (no external API needed)
function generateSimpleEmbedding(text) {
  // Create a simple hash-based embedding (384 dimensions like Hugging Face)
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0);
  
  words.forEach((word, index) => {
    const hash = word.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const position = Math.abs(hash) % 384;
    embedding[position] += 1;
  });
  
  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    embedding.forEach((val, i) => {
      embedding[i] = val / magnitude;
    });
  }
  
  return embedding;
} 