const fetch = require('node-fetch');

// Test Oracle connection via API endpoints
async function testOracleConnectivity() {
  console.log('🧪 Testing Oracle Database Connectivity via API...\n');
  
  // Test connection parameters (you'll need to replace these with real values)
  const testConnection = {
    type: 'oracle',
    host: 'localhost',
    port: 1521,
    username: 'test_user',
    password: 'test_password',
    database: 'ORCL',
    serviceName: null
  };

  const baseUrl = 'http://localhost:8082'; // Netlify dev server URL

  try {
    console.log('1. Testing Oracle Connection...');
    
    const connectionResponse = await fetch(`${baseUrl}/.netlify/functions/oracle-test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ connection: testConnection })
    });

    const connectionResult = await connectionResponse.json();
    
    if (connectionResult.success) {
      console.log('✅ Connection successful!');
      console.log(`   Message: ${connectionResult.message}`);
      if (connectionResult.details?.version) {
        console.log(`   Oracle Version: ${connectionResult.details.version}`);
      }
    } else {
      console.log('❌ Connection failed');
      console.log(`   Error: ${connectionResult.message}`);
      if (connectionResult.details?.suggestion) {
        console.log(`   Suggestion: ${connectionResult.details.suggestion}`);
      }
    }
    
    console.log('\n2. Testing Oracle Deployment...');
    const testSQL = `
      CREATE TABLE test_migration (
        id NUMBER PRIMARY KEY,
        name VARCHAR2(100),
        created_date DATE DEFAULT SYSDATE
      );
      
      INSERT INTO test_migration (id, name) VALUES (1, 'Test Record');
    `;
    
    const deployResponse = await fetch(`${baseUrl}/.netlify/functions/oracle-deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        connection: testConnection,
        code: testSQL,
        fileName: 'test_migration.sql'
      })
    });

    const deployResult = await deployResponse.json();
    
    if (deployResult.success) {
      console.log('✅ Deployment successful!');
      console.log(`   Message: ${deployResult.message}`);
    } else {
      console.log('❌ Deployment failed');
      console.log(`   Error: ${deployResult.message}`);
      if (deployResult.details) {
        console.log('   Details:', JSON.stringify(deployResult.details, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Netlify dev server is running (netlify dev)');
    console.log('   2. Oracle database is accessible');
    console.log('   3. Connection parameters are correct');
  }
}

// Run the test
testOracleConnectivity(); 