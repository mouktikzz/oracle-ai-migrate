#!/usr/bin/env node

/**
 * Backend Test Script
 * 
 * This script helps you test your Netlify functions locally or remotely.
 * Run this to verify your AI functions are working properly.
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.NETLIFY_URL || 'https://cosmoagents.netlify.app';
const FUNCTIONS = {
  test: '/.netlify/functions/test-ai-functions',
  chatbot: '/.netlify/functions/chatbot',
  aiExplain: '/.netlify/functions/ai-explain',
  aiRewrite: '/.netlify/functions/ai-rewrite'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testFunction(url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${url}`, options);
    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  log('🚀 Starting Backend Function Tests', 'bright');
  log(`📍 Testing against: ${BASE_URL}`, 'cyan');
  log('');

  // Test 1: Test AI Functions
  log('1️⃣ Testing AI Functions Status...', 'bright');
  const testResult = await testFunction(FUNCTIONS.test);
  
  if (testResult.success) {
    logSuccess('Test function is accessible');
    console.log('API Keys Status:');
    console.log(`  Chatbot (Gemini): ${testResult.data.apiKeys.chatbot.present ? '✅ Present' : '❌ Missing'}`);
    console.log(`  OpenRouter: ${testResult.data.apiKeys.openrouter.present ? '✅ Present' : '❌ Missing'}`);
    
    if (testResult.data.tests) {
      console.log('\nAPI Tests:');
      console.log(`  Chatbot: ${testResult.data.tests.chatbot?.success ? '✅ Working' : '❌ Failed'}`);
      console.log(`  OpenRouter: ${testResult.data.tests.openrouter?.success ? '✅ Working' : '❌ Failed'}`);
    }
  } else {
    logError(`Test function failed: ${testResult.error || testResult.status}`);
  }
  log('');

  // Test 2: Chatbot Function
  log('2️⃣ Testing Chatbot Function...', 'bright');
  const chatbotResult = await testFunction(FUNCTIONS.chatbot, 'POST', {
    message: 'Hello, this is a test message from the backend test script.'
  });
  
  if (chatbotResult.success) {
    logSuccess('Chatbot function is working');
    if (chatbotResult.data.response) {
      logInfo(`Response length: ${chatbotResult.data.response.length} characters`);
      logInfo(`Response preview: ${chatbotResult.data.response.substring(0, 100)}...`);
    }
  } else {
    logError(`Chatbot function failed: ${chatbotResult.data?.error || chatbotResult.error}`);
  }
  log('');

  // Test 3: AI Explain Function
  log('3️⃣ Testing AI Explain Function...', 'bright');
  const explainResult = await testFunction(FUNCTIONS.aiExplain, 'POST', {
    code: 'SELECT * FROM users WHERE active = 1;',
    language: 'sql'
  });
  
  if (explainResult.success) {
    logSuccess('AI Explain function is working');
    if (explainResult.data.explanation) {
      logInfo(`Explanation length: ${explainResult.data.explanation.length} characters`);
      logInfo(`Explanation preview: ${explainResult.data.explanation.substring(0, 100)}...`);
    }
  } else {
    logError(`AI Explain function failed: ${explainResult.data?.error || explainResult.error}`);
  }
  log('');

  // Test 4: AI Rewrite Function
  log('4️⃣ Testing AI Rewrite Function...', 'bright');
  const rewriteResult = await testFunction(FUNCTIONS.aiRewrite, 'POST', {
    code: 'SELECT * FROM users WHERE active = 1;',
    prompt: 'Add comments to explain what this query does',
    language: 'sql'
  });
  
  if (rewriteResult.success) {
    logSuccess('AI Rewrite function is working');
    if (rewriteResult.data.rewrittenCode) {
      logInfo(`Rewritten code length: ${rewriteResult.data.rewrittenCode.length} characters`);
      logInfo(`Rewritten code preview: ${rewriteResult.data.rewrittenCode.substring(0, 100)}...`);
    }
  } else {
    logError(`AI Rewrite function failed: ${rewriteResult.data?.error || rewriteResult.error}`);
  }
  log('');

  // Summary
  log('📊 Test Summary', 'bright');
  log('All tests completed. Check the results above for any issues.');
  log('');
  log('🔧 If you see errors:', 'yellow');
  log('1. Check your environment variables in Netlify');
  log('2. Verify your API keys are valid and have credits');
  log('3. Check the Netlify function logs for detailed error messages');
  log('4. Ensure your site is properly deployed');
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    logError(`Test script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests, testFunction }; 