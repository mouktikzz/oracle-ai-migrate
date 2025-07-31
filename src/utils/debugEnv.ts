// Debug Environment Variables
// This utility helps identify the exact issue with environment variables

export const debugEnvironmentVariables = () => {
  console.log('🔍 DEBUG: Environment Variables Check');
  console.log('=====================================');
  
  // Check each variable individually
  const variables = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY', 
    'VITE_GEMINI_API_KEY'
  ];
  
  variables.forEach(varName => {
    const value = import.meta.env[varName];
    console.log(`🔍 ${varName}:`);
    console.log(`   Type: ${typeof value}`);
    console.log(`   Length: ${value?.length || 0}`);
    console.log(`   Value: ${value ? value.substring(0, 30) + '...' : 'undefined'}`);
    console.log(`   Valid: ${value && value !== 'undefined' && value !== '' ? '✅' : '❌'}`);
    console.log('');
  });
  
  // Check if we're in the right environment
  console.log('🌍 Environment Info:');
  console.log(`   Hostname: ${window.location.hostname}`);
  console.log(`   Protocol: ${window.location.protocol}`);
  console.log(`   Is Netlify: ${window.location.hostname.includes('netlify.app')}`);
  console.log(`   Is Localhost: ${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'}`);
  console.log('');
  
  // Test Supabase client creation
  console.log('🧪 Testing Supabase Client Creation:');
  try {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (url && key) {
      console.log('✅ Both URL and Key are present');
      console.log(`   URL starts with https://: ${url.startsWith('https://')}`);
      console.log(`   Key starts with eyJ: ${key.startsWith('eyJ')}`);
      console.log(`   URL length: ${url.length}`);
      console.log(`   Key length: ${key.length}`);
    } else {
      console.log('❌ Missing URL or Key');
      console.log(`   URL present: ${!!url}`);
      console.log(`   Key present: ${!!key}`);
    }
  } catch (error) {
    console.error('❌ Error testing Supabase client:', error);
  }
  
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. If variables show as "undefined", redeploy your site');
  console.log('2. If variables show but are invalid, check the values');
  console.log('3. If everything looks good, test the functions directly');
};

// Function to test chatbot function
export const testChatbotFunction = async () => {
  console.log('🧪 Testing Chatbot Function...');
  
  try {
    const response = await fetch('/.netlify/functions/test-chatbot');
    const data = await response.json();
    console.log('✅ Chatbot test response:', data);
    return data;
  } catch (error) {
    console.error('❌ Chatbot test failed:', error);
    return null;
  }
};

// Function to test chatbot with a message
export const testChatbotMessage = async (message: string) => {
  console.log('🧪 Testing Chatbot with message:', message);
  
  try {
    const response = await fetch('/.netlify/functions/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    });
    
    const data = await response.json();
    console.log('✅ Chatbot response:', data);
    return data;
  } catch (error) {
    console.error('❌ Chatbot message test failed:', error);
    return null;
  }
}; 