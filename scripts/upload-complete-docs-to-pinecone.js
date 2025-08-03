const { Pinecone } = require('@pinecone-database/pinecone');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Simple embedding function (same as used in external-rag.js)
function generateSimpleEmbedding(text) {
  const hash = require('crypto').createHash('sha256').update(text).digest('hex');
  const embedding = new Array(384).fill(0);
  
  for (let i = 0; i < Math.min(hash.length, 384); i++) {
    embedding[i] = (hash.charCodeAt(i) - 48) / 10; // Normalize to 0-1 range
  }
  
  return embedding;
}

// Function to read all documentation files
function getAllDocumentation() {
  const docsPath = path.join(__dirname, '..', 'docs');
  const documentation = [];
  
  function readDirectory(dirPath, relativePath = '') {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativeItemPath = path.join(relativePath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        readDirectory(fullPath, relativeItemPath);
      } else if (item.endsWith('.md') || item.endsWith('.json')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          
          // Add each line as a separate chunk for maximum granularity
          lines.forEach((line, index) => {
            if (line.trim()) { // Only add non-empty lines
              documentation.push({
                id: `${relativeItemPath}-line-${index + 1}`,
                text: line.trim(),
                metadata: {
                  source: relativeItemPath,
                  lineNumber: index + 1,
                  type: 'documentation',
                  category: getCategoryFromPath(relativeItemPath)
                }
              });
            }
          });
          
          console.log(`📄 Processed ${relativeItemPath}: ${lines.length} lines`);
        } catch (error) {
          console.error(`❌ Error reading ${fullPath}:`, error.message);
        }
      }
    }
  }
  
  readDirectory(docsPath);
  return documentation;
}

function getCategoryFromPath(filePath) {
  if (filePath.includes('user-guide')) return 'user-guide';
  if (filePath.includes('developer-guide')) return 'developer-guide';
  if (filePath.includes('deployment')) return 'deployment';
  if (filePath.includes('configuration')) return 'configuration';
  if (filePath.includes('api')) return 'api';
  if (filePath.includes('troubleshooting')) return 'troubleshooting';
  if (filePath.includes('architecture')) return 'architecture';
  if (filePath.includes('database-schema')) return 'database-schema';
  if (filePath.includes('ai-models')) return 'ai-models';
  if (filePath.includes('README')) return 'readme';
  if (filePath.includes('CHATBOT')) return 'chatbot';
  return 'general';
}

async function uploadToPinecone() {
  try {
    // Check for API key
    if (!process.env.PINECONE_API_KEY) {
      console.error('❌ PINECONE_API_KEY environment variable is not set');
      console.log('Please set your Pinecone API key:');
      console.log('export PINECONE_API_KEY=your_api_key_here');
      return;
    }

    console.log('🚀 Starting comprehensive documentation upload to Pinecone...');
    
    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });

    // Get or create index
    const indexName = 'oracle-migration-docs';
    let index;
    
    try {
      index = pinecone.index(indexName);
      console.log(`✅ Using existing index: ${indexName}`);
    } catch (error) {
      console.log(`📦 Creating new index: ${indexName}`);
      await pinecone.createIndex({
        name: indexName,
        dimension: 384,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      
      // Wait for index to be ready
      console.log('⏳ Waiting for index to be ready...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      index = pinecone.index(indexName);
    }

    // Get all documentation
    console.log('📚 Reading all documentation files...');
    const documentation = getAllDocumentation();
    
    console.log(`📊 Total documentation chunks: ${documentation.length}`);
    
    if (documentation.length === 0) {
      console.log('❌ No documentation found. Please check the docs/ directory.');
      return;
    }

    // Upload in batches
    const batchSize = 10;
    const totalBatches = Math.ceil(documentation.length / batchSize);
    
    console.log(`🔄 Uploading ${documentation.length} chunks in ${totalBatches} batches...`);
    
    for (let i = 0; i < documentation.length; i += batchSize) {
      const batch = documentation.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)...`);
      
      const vectors = batch.map(doc => ({
        id: doc.id,
        values: generateSimpleEmbedding(doc.text),
        metadata: {
          text: doc.text,
          source: doc.metadata.source,
          lineNumber: doc.metadata.lineNumber,
          type: doc.metadata.type,
          category: doc.metadata.category
        }
      }));
      
      try {
        await index.upsert(vectors);
        console.log(`✅ Batch ${batchNumber} uploaded successfully`);
        
        // Rate limiting
        if (batchNumber < totalBatches) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Error uploading batch ${batchNumber}:`, error.message);
      }
    }
    
    console.log('🎉 Comprehensive documentation upload completed!');
    console.log(`📊 Total chunks uploaded: ${documentation.length}`);
    
    // Show summary by category
    const categoryCounts = {};
    documentation.forEach(doc => {
      const category = doc.metadata.category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    console.log('\n📈 Upload Summary by Category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} chunks`);
    });
    
  } catch (error) {
    console.error('❌ Error during upload:', error);
  }
}

// Run the upload
uploadToPinecone(); 