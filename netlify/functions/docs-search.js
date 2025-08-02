const fs = require('fs').promises;
const path = require('path');

// Documentation paths
const DOCS_PATH = path.join(__dirname, '../../docs');

// Documentation structure
const DOCS_STRUCTURE = {
  'architecture.md': 'System architecture and component overview',
  'ai-models.md': 'AI model configuration and usage guidelines',
  'database-schema.md': 'Database schema and table structures',
  'user-guide/quick-start.md': 'Quick start guide for users',
  'user-guide/README.md': 'Complete user guide',
  'developer-guide/README.md': 'Developer documentation and setup',
  'api/README.md': 'API documentation and endpoints',
  'troubleshooting/': 'Troubleshooting guides and solutions',
  'deployment/': 'Deployment instructions and configuration',
  'configuration/': 'System configuration options'
};

// Search through documentation files
async function searchDocs(query) {
  const results = [];
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
  
  try {
    // Search through main documentation files
    for (const [filePath, description] of Object.entries(DOCS_STRUCTURE)) {
      try {
        const fullPath = path.join(DOCS_PATH, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        
        // Check if any search terms match the content
        const matches = searchTerms.filter(term => 
          content.toLowerCase().includes(term) || 
          description.toLowerCase().includes(term)
        );
        
        if (matches.length > 0) {
          // Extract relevant sections
          const relevantSections = extractRelevantSections(content, searchTerms);
          results.push({
            file: filePath,
            description: description,
            relevance: matches.length,
            sections: relevantSections
          });
        }
      } catch (err) {
        // Skip files that can't be read
        continue;
      }
    }
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    return results.slice(0, 3); // Return top 3 most relevant results
  } catch (error) {
    console.error('Error searching docs:', error);
    return [];
  }
}

// Extract relevant sections from documentation
function extractRelevantSections(content, searchTerms) {
  const sections = [];
  const lines = content.split('\n');
  let currentSection = '';
  let inCodeBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for code blocks
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    
    // Skip code blocks for now
    if (inCodeBlock) continue;
    
    // Check for headers
    if (line.startsWith('#')) {
      currentSection = line.replace(/^#+\s*/, '');
      continue;
    }
    
    // Check if line contains search terms
    const hasMatch = searchTerms.some(term => line.toLowerCase().includes(term));
    if (hasMatch && line.trim().length > 10) {
      sections.push({
        section: currentSection,
        content: line.trim(),
        lineNumber: i + 1
      });
    }
  }
  
  return sections.slice(0, 5); // Return top 5 relevant sections
}

// Get specific documentation content
async function getDocContent(filePath) {
  try {
    const fullPath = path.join(DOCS_PATH, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading doc file:', error);
    return null;
  }
}

// Main handler
exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { query, action, filePath } = JSON.parse(event.body || '{}');
    
    if (action === 'search' && query) {
      const results = await searchDocs(query);
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          results: results
        })
      };
    }
    
    if (action === 'getContent' && filePath) {
      const content = await getDocContent(filePath);
      if (content) {
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            content: content
          })
        };
      }
    }
    
    // Return documentation structure
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        structure: DOCS_STRUCTURE,
        message: 'Documentation search service available'
      })
    };
    
  } catch (error) {
    console.error('Docs search error:', error);
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
}; 