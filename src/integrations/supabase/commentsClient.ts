// Separate Supabase client for comments feature
import { createClient } from '@supabase/supabase-js';
import { supabase } from './client'; // Import the main supabase client

// Get environment variables for comments database
const getCommentsSupabaseUrl = () => {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL_COMMENTS;
    if (!url || url === 'undefined' || url === '' || typeof url !== 'string') {
      console.warn('❌ Comments Supabase URL is missing or invalid');
      return null;
    }
    if (!url.startsWith('https://') || url.length < 10) {
      console.warn('❌ Comments Supabase URL format is invalid:', url);
      return null;
    }
    return url;
  } catch (error) {
    console.warn('❌ Error getting Comments Supabase URL:', error);
    return null;
  }
};

const getCommentsSupabaseKey = () => {
  try {
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY_COMMENTS;
    if (!key || key === 'undefined' || key === '' || typeof key !== 'string') {
      console.warn('❌ Comments Supabase key is missing or invalid');
      return null;
    }
    if (!key.startsWith('eyJ') || key.length < 50) {
      console.warn('❌ Comments Supabase key format is invalid');
      return null;
    }
    return key;
  } catch (error) {
    console.warn('❌ Error getting Comments Supabase key:', error);
    return null;
  }
};

const COMMENTS_SUPABASE_URL = getCommentsSupabaseUrl();
const COMMENTS_SUPABASE_KEY = getCommentsSupabaseKey();

// Log configuration status
if (!COMMENTS_SUPABASE_URL || !COMMENTS_SUPABASE_KEY) {
  console.error('❌ Comments Supabase not configured properly!');
  console.error('Missing or invalid environment variables:');
  console.error('- VITE_SUPABASE_URL_COMMENTS:', COMMENTS_SUPABASE_URL ? '✅ Present' : '❌ Missing/Invalid');
  console.error('- VITE_SUPABASE_ANON_KEY_COMMENTS:', COMMENTS_SUPABASE_KEY ? '✅ Present' : '❌ Missing/Invalid');
} else {
  console.log('✅ Comments Supabase configured successfully');
}

// Create mock client for comments
const createMockCommentsClient = () => {
  const mockResponse = (data: any = null, error: any = null) => Promise.resolve({ data, error });
  
  return {
    auth: {
      onAuthStateChange: () => ({ 
        data: { 
          subscription: { 
            unsubscribe: () => {} 
          } 
        } 
      }),
      getSession: () => mockResponse({ session: null }),
      getUser: () => mockResponse({ user: null }),
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: () => mockResponse(null, { message: 'Comments Supabase not configured' }),
          order: () => ({
            limit: () => mockResponse([])
          })
        }),
        order: () => ({
          limit: () => mockResponse([])
        }),
        limit: () => mockResponse([])
      }),
      insert: (data: any) => mockResponse(null, { message: 'Comments Supabase not configured' }),
      update: (data: any) => ({
        eq: (column: string, value: any) => mockResponse(null, { message: 'Comments Supabase not configured' })
      }),
      delete: () => ({
        eq: (column: string, value: any) => mockResponse(null, { message: 'Comments Supabase not configured' })
      }),
    }),
  } as any;
};

// Create the comments client with proper auth sync
let commentsSupabaseClient: any;

try {
  if (COMMENTS_SUPABASE_URL && COMMENTS_SUPABASE_KEY) {
    console.log('🔧 Creating Comments Supabase client...');
    
    // Create client with custom storage to avoid conflicts
    commentsSupabaseClient = createClient(COMMENTS_SUPABASE_URL, COMMENTS_SUPABASE_KEY, {
      auth: {
        storage: {
          getItem: (key: string) => {
            // Get session from main client's storage
            try {
              const item = localStorage.getItem(key);
              return item ? JSON.parse(item) : null;
            } catch (error) {
              console.warn('Error getting auth item:', error);
              return null;
            }
          },
          setItem: (key: string, value: string) => {
            // Set session in main client's storage
            try {
              localStorage.setItem(key, value);
            } catch (error) {
              console.warn('Error setting auth item:', error);
            }
          },
          removeItem: (key: string) => {
            // Remove session from main client's storage
            try {
              localStorage.removeItem(key);
            } catch (error) {
              console.warn('Error removing auth item:', error);
            }
          }
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    });
    
    console.log('✅ Comments Supabase client created successfully');
    
    // Sync authentication session from main client
    const syncAuthSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('🔄 Syncing auth session to comments client...');
          await commentsSupabaseClient.auth.setSession(session);
          console.log('✅ Auth session synced successfully');
        } else {
          console.log('⚠️ No active session to sync');
        }
      } catch (error) {
        console.warn('⚠️ Could not sync auth session:', error);
      }
    };
    
    // Initial sync with delay to ensure main client is ready
    setTimeout(syncAuthSession, 1000);
    
    // Listen for auth changes in main client and sync to comments client
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed in main client:', event);
      if (session) {
        try {
          await commentsSupabaseClient.auth.setSession(session);
          console.log('✅ Auth session synced to comments client');
        } catch (error) {
          console.warn('⚠️ Could not sync auth session:', error);
        }
      } else {
        try {
          await commentsSupabaseClient.auth.signOut();
          console.log('✅ Signed out from comments client');
        } catch (error) {
          console.warn('⚠️ Could not sign out from comments client:', error);
        }
      }
    });
    
  } else {
    console.log('⚠️ Creating mock Comments Supabase client...');
    commentsSupabaseClient = createMockCommentsClient();
    console.log('⚠️ Using mock Comments Supabase client - comments will not work');
  }
} catch (error) {
  console.error('❌ Error creating Comments Supabase client:', error);
  commentsSupabaseClient = createMockCommentsClient();
}

export const commentsSupabase = commentsSupabaseClient; 