const { Pinecone } = require('@pinecone-database/pinecone');

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
      },
      body: ''
    };
  }

  // Add a simple GET endpoint for testing
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'RAG API is running!',
        hasPineconeKey: !!process.env.PINECONE_API_KEY,
        timestamp: new Date().toISOString()
      })
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

    // Extract key terms from the query for better matching
    const keyTerms = extractKeyTerms(query);
    
    // Try multiple search strategies
    let bestResults = null;
    let bestScore = 0;
    
    // Strategy 1: Original query
    try {
      const originalQueryEmbedding = generateSimpleEmbedding(query);
      const originalResults = await index.query({
        vector: originalQueryEmbedding,
        topK: 10,
        includeMetadata: true
      });
      
      if (originalResults.matches.length > 0) {
        const avgScore = originalResults.matches.reduce((sum, m) => sum + m.score, 0) / originalResults.matches.length;
        if (avgScore > bestScore) {
          bestResults = originalResults;
          bestScore = avgScore;
        }
      }
    } catch (error) {
      // Original query search failed
    }
    
    // Strategy 2: Key terms search
    for (const term of keyTerms) {
      try {
        const termEmbedding = generateSimpleEmbedding(term);
        const termResults = await index.query({
          vector: termEmbedding,
          topK: 5,
          includeMetadata: true
        });
        
        if (termResults.matches.length > 0) {
          const avgScore = termResults.matches.reduce((sum, m) => sum + m.score, 0) / termResults.matches.length;
          if (avgScore > bestScore) {
            bestResults = termResults;
            bestScore = avgScore;
          }
        }
      } catch (error) {
        // Term search failed
      }
    }

    // Extract context from results
    let context = '';
    if (bestResults && bestResults.matches.length > 0) {
      context = bestResults.matches
        .map(match => match.metadata?.text || match.metadata?.content || '')
        .filter(content => content.length > 0)
        .join('\n\n');
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        context,
        matches: bestResults?.matches.length || 0,
        query: query,
        keyTerms: keyTerms,
        debug: {
          totalMatches: bestResults?.matches.length || 0,
          contextLength: context.length,
          hasResults: (bestResults?.matches.length || 0) > 0,
          bestScore: bestScore
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

// Extract key terms from query for better search
function extractKeyTerms(query) {
  const words = query.toLowerCase().split(/\s+/);
  const stopWords = new Set(['how', 'do', 'i', 'you', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall']);
  
  const keyTerms = words
    .filter(word => word.length > 2 && !stopWords.has(word))
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length > 0);
  
  // Add common variations
  const variations = [];
  keyTerms.forEach(term => {
    variations.push(term);
    if (term.endsWith('ing')) {
      variations.push(term.slice(0, -3)); // remove 'ing'
    }
    if (term.endsWith('ed')) {
      variations.push(term.slice(0, -2)); // remove 'ed'
    }
    if (term.endsWith('s')) {
      variations.push(term.slice(0, -1)); // remove 's'
    }
  });
  
  return [...new Set(variations)]; // remove duplicates
}

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