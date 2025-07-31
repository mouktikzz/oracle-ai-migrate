// Comprehensive debug script for comments issue
// Run this in browser console on your deployed site

async function debugCommentsIssue() {
  console.log('🔍 Starting comprehensive debug...');
  
  // Check 1: Environment Variables
  console.log('🔍 Check 1: Environment Variables');
  console.log('VITE_SUPABASE_URL_COMMENTS:', import.meta.env.VITE_SUPABASE_URL_COMMENTS ? '✅ Set' : '❌ Not Set');
  console.log('VITE_SUPABASE_ANON_KEY_COMMENTS:', import.meta.env.VITE_SUPABASE_ANON_KEY_COMMENTS ? '✅ Set' : '❌ Not Set');
  
  // Check 2: commentsSupabase availability
  console.log('🔍 Check 2: commentsSupabase Client');
  if (typeof commentsSupabase === 'undefined') {
    console.error('❌ commentsSupabase is undefined');
    console.log('💡 This means the separate client was not created properly');
    return;
  }
  console.log('✅ commentsSupabase is available');
  
  // Check 3: Authentication status
  console.log('🔍 Check 3: Authentication Status');
  try {
    const { data: { session }, error: authError } = await commentsSupabase.auth.getSession();
    if (authError) {
      console.error('❌ Auth error:', authError);
    } else if (!session) {
      console.warn('⚠️ No active session - this might cause RLS issues');
    } else {
      console.log('✅ User is authenticated:', session.user.email);
    }
  } catch (error) {
    console.error('❌ Auth check failed:', error);
  }
  
  // Check 4: Table access
  console.log('🔍 Check 4: Table Access');
  try {
    const { data, error } = await commentsSupabase
      .from('conversion_comments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table access error:', error);
      console.log('💡 Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Check if it's a table not found error
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('💡 SOLUTION: The table does not exist. Run the SQL script in Supabase.');
      }
      
      // Check if it's an RLS error
      if (error.message.includes('policy') || error.message.includes('RLS')) {
        console.log('💡 SOLUTION: RLS policies issue. Check if policies were created correctly.');
      }
      
      return;
    }
    
    console.log('✅ Table access successful');
    console.log('📊 Current comments count:', data?.length || 0);
  } catch (error) {
    console.error('❌ Table access failed:', error);
  }
  
  // Check 5: Try to create a comment with detailed error handling
  console.log('🔍 Check 5: Comment Creation Test');
  try {
    const testComment = {
      file_id: 'debug-test-' + Date.now(),
      file_name: 'debug-test.sql',
      comment: 'Debug test comment',
      is_public: false
    };
    
    console.log('📝 Attempting to create comment:', testComment);
    
    const { data: newComment, error: createError } = await commentsSupabase
      .from('conversion_comments')
      .insert([testComment])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Comment creation failed:', createError);
      console.log('💡 Error details:', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint
      });
      
      // Specific error handling
      if (createError.message.includes('new row violates row-level security policy')) {
        console.log('💡 SOLUTION: RLS policy is blocking the insert. Check if user_id is being set correctly.');
      }
      
      if (createError.message.includes('null value in column "user_id"')) {
        console.log('💡 SOLUTION: user_id is null. The user might not be authenticated properly.');
      }
      
      return;
    }
    
    console.log('✅ Comment created successfully:', newComment);
    
    // Clean up
    await commentsSupabase
      .from('conversion_comments')
      .delete()
      .eq('id', newComment.id);
    
    console.log('🧹 Test comment cleaned up');
    
  } catch (error) {
    console.error('❌ Comment creation test failed:', error);
  }
  
  // Check 6: Check if main supabase is working
  console.log('🔍 Check 6: Main Supabase Status');
  try {
    if (typeof supabase !== 'undefined') {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('✅ Main Supabase is available');
      console.log('👤 Main auth session:', session ? 'Active' : 'None');
    } else {
      console.log('⚠️ Main supabase is not available');
    }
  } catch (error) {
    console.error('❌ Main Supabase check failed:', error);
  }
  
  console.log('🏁 Debug completed. Check the results above.');
}

// Run the debug
debugCommentsIssue(); 