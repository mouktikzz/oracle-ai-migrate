const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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

  try {
    // Get the chatbot API key
    const apiKey = process.env.CHATBOT_GEMINI_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Chatbot API key not configured. Please set CHATBOT_GEMINI_API_KEY environment variable.',
          status: 'API_KEY_MISSING'
        })
      };
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Simple test message
    const testMessage = "Hello! Can you tell me what technologies are used in the Cosmo Agents website?";

    console.log('Testing chatbot with message:', testMessage);

    // Generate response
    const result = await model.generateContent([
      { role: "user", parts: [{ text: "You are Cosmo Agents, an AI assistant. Please respond briefly to this test message: " + testMessage }] }
    ]);

    const response = await result.response;
    const text = response.text();

    console.log('Test response generated successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Chatbot is working correctly!',
        testResponse: text,
        apiKeyStatus: 'Present',
        model: 'gemini-1.5-flash',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Test chatbot error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Test failed: ' + error.message,
        status: 'TEST_FAILED',
        details: {
          message: error.message,
          stack: error.stack,
          apiKey: process.env.CHATBOT_GEMINI_API_KEY ? 'Present' : 'Missing'
        },
        timestamp: new Date().toISOString()
      })
    };
  }
}; 