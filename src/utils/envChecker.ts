// Environment Variable Checker
// This utility helps debug environment variable issues

export const checkEnvironmentVariables = () => {
  const envVars = {
    // Supabase Variables
    VITE_SUPABASE_URL: {
      value: import.meta.env.VITE_SUPABASE_URL,
      required: true,
      description: 'Supabase project URL',
      format: 'https://your-project.supabase.co'
    },
    VITE_SUPABASE_ANON_KEY: {
      value: import.meta.env.VITE_SUPABASE_ANON_KEY,
      required: true,
      description: 'Supabase anonymous key',
      format: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    
    // AI Variables
    VITE_GEMINI_API_KEY: {
      value: import.meta.env.VITE_GEMINI_API_KEY,
      required: true,
      description: 'Google Generative AI API key for code conversion',
      format: 'AIzaSy...'
    },
    
    // Backend Variables (for Netlify Functions)
    CHATBOT_GEMINI_API_KEY: {
      value: 'Check Netlify Dashboard',
      required: true,
      description: 'Google Generative AI API key for chatbot (backend only)',
      format: 'AIzaSy...'
    },
    OPENROUTER_API_KEY: {
      value: 'Check Netlify Dashboard',
      required: true,
      description: 'OpenRouter API key for AI functions (backend only)',
      format: 'sk-or-v1-...'
    }
  };

  console.log('🔍 Environment Variables Check:');
  console.log('================================');

  let allValid = true;

  Object.entries(envVars).forEach(([key, config]) => {
    const isValid = config.value && 
                   config.value !== 'undefined' && 
                   config.value !== '' && 
                   typeof config.value === 'string';
    
    const status = isValid ? '✅' : '❌';
    const statusText = isValid ? 'Valid' : 'Missing/Invalid';
    
    console.log(`${status} ${key}: ${statusText}`);
    console.log(`   Description: ${config.description}`);
    console.log(`   Format: ${config.format}`);
    
    if (isValid) {
      // Show first few characters for validation
      const preview = config.value.substring(0, 20) + (config.value.length > 20 ? '...' : '');
      console.log(`   Value: ${preview}`);
    } else {
      console.log(`   Value: ${config.value || 'undefined'}`);
    }
    
    if (config.required && !isValid) {
      allValid = false;
    }
    
    console.log('');
  });

  console.log('📋 Summary:');
  console.log('============');
  
  if (allValid) {
    console.log('✅ All required environment variables are configured!');
  } else {
    console.log('❌ Some required environment variables are missing or invalid.');
    console.log('');
    console.log('🔧 To fix this:');
    console.log('1. Go to Netlify Dashboard → Site Settings → Environment Variables');
    console.log('2. Add the missing variables as Key/Value pairs');
    console.log('3. Redeploy your site');
    console.log('');
    console.log('📝 Required Variables:');
    Object.entries(envVars).forEach(([key, config]) => {
      if (config.required) {
        console.log(`   - ${key}: ${config.description}`);
      }
    });
  }

  return allValid;
};

// Function to check if we're in a browser environment
export const isBrowser = typeof window !== 'undefined';

// Function to get current environment
export const getEnvironment = () => {
  if (isBrowser) {
    return {
      isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
      isNetlify: window.location.hostname.includes('netlify.app'),
      hostname: window.location.hostname,
      protocol: window.location.protocol
    };
  }
  return { isLocalhost: false, isNetlify: false, hostname: 'server', protocol: 'https:' };
};

// Function to provide setup instructions
export const getSetupInstructions = () => {
  const env = getEnvironment();
  
  console.log('🚀 Setup Instructions:');
  console.log('======================');
  console.log(`Environment: ${env.isLocalhost ? 'Local Development' : 'Production'}`);
  console.log(`Hostname: ${env.hostname}`);
  console.log('');
  
  if (env.isLocalhost) {
    console.log('For Local Development:');
    console.log('1. Create a .env file in your project root');
    console.log('2. Add your environment variables:');
    console.log('   VITE_SUPABASE_URL=https://your-project.supabase.co');
    console.log('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
    console.log('   VITE_GEMINI_API_KEY=your_google_ai_key');
    console.log('3. Restart your development server');
  } else {
    console.log('For Production (Netlify):');
    console.log('1. Go to Netlify Dashboard → Site Settings → Environment Variables');
    console.log('2. Add these variables as Key/Value pairs:');
    console.log('   VITE_SUPABASE_URL = https://your-project.supabase.co');
    console.log('   VITE_SUPABASE_ANON_KEY = your_supabase_anon_key');
    console.log('   VITE_GEMINI_API_KEY = your_google_ai_key');
    console.log('   CHATBOT_GEMINI_API_KEY = your_google_ai_key');
    console.log('   OPENROUTER_API_KEY = your_openrouter_key');
    console.log('3. Redeploy your site');
  }
  
  console.log('');
  console.log('🔗 Useful Links:');
  console.log('- Supabase Dashboard: https://supabase.com/dashboard');
  console.log('- Google AI Studio: https://makersuite.google.com/app/apikey');
  console.log('- OpenRouter: https://openrouter.ai/keys');
  console.log('- Netlify Dashboard: https://app.netlify.com/');
}; 