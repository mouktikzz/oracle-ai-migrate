// Test script for NEW Supabase comments setup
// Run this in browser console on your deployed site after setting up new environment variables

async function testNewCommentsSetup() {
  console.log('🔍 Testing NEW Supabase comments setup...');
  
  try {
    // Test if we can access the comments table in new Supabase
    const { data, error } = await commentsSupabase
      .from('conversion_comments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing conversion_comments table in NEW Supabase:', error);
      console.log('💡 This means either:');
      console.log('   1. The table does not exist in the new Supabase account');
      console.log('   2. The environment variables are not set correctly');
      console.log('   3. There are permission issues');
      console.log('📋 Please check:');
      console.log('   - Run the SQL script in your NEW Supabase Dashboard');
      console.log('   - Set VITE_SUPABASE_URL_COMMENTS and VITE_SUPABASE_ANON_KEY_COMMENTS in Netlify');
      return false;
    }
    
    console.log('✅ conversion_comments table exists and is accessible in NEW Supabase!');
    console.log('📊 Current comments count:', data?.length || 0);
    
    // Test creating a comment
    const testComment = {
      file_id: 'test-file-' + Date.now(),
      file_name: 'test-file.sql',
      comment: 'This is a test comment from NEW Supabase',
      is_public: false
    };
    
    const { data: newComment, error: createError } = await commentsSupabase
      .from('conversion_comments')
      .insert([testComment])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating test comment:', createError);
      return false;
    }
    
    console.log('✅ Test comment created successfully in NEW Supabase:', newComment);
    
    // Clean up - delete the test comment
    await commentsSupabase
      .from('conversion_comments')
      .delete()
      .eq('id', newComment.id);
    
    console.log('🧹 Test comment cleaned up');
    console.log('🎉 NEW Supabase comments setup is working perfectly!');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the test
testNewCommentsSetup(); 