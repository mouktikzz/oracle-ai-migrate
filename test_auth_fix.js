// Test script to verify authentication fix
// Run this in browser console after deployment

async function testAuthFix() {
  console.log('🔐 Testing Authentication Fix...');
  
  // Test 1: Check if commentsSupabase is available
  console.log('📋 Test 1: Comments Supabase Client');
  if (typeof commentsSupabase === 'undefined') {
    console.error('❌ commentsSupabase is undefined');
    return;
  }
  console.log('✅ commentsSupabase is available');
  
  // Test 2: Check authentication session
  console.log('\n📋 Test 2: Authentication Session');
  try {
    const { data: { session }, error: sessionError } = await commentsSupabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }
    
    if (!session) {
      console.warn('⚠️ No active session - please log in first');
      console.log('💡 Please log in to your account and try again');
      return;
    }
    
    if (!session.user) {
      console.error('❌ No user in session');
      return;
    }
    
    console.log('✅ User authenticated successfully!');
    console.log('👤 User ID:', session.user.id);
    console.log('📧 User Email:', session.user.email);
    
  } catch (error) {
    console.error('❌ Auth check failed:', error);
    return;
  }
  
  // Test 3: Test comment creation
  console.log('\n📋 Test 3: Comment Creation Test');
  try {
    const testComment = {
      file_id: 'test-file-' + Date.now(),
      file_name: 'test-oracle-conversion.sql',
      comment: 'Test comment to verify authentication fix!',
      is_public: false
    };
    
    console.log('📝 Creating test comment...');
    
    const { data: newComment, error: createError } = await commentsSupabase
      .from('conversion_comments')
      .insert([testComment])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Comment creation failed:', createError.message);
      console.log('💡 Error details:', createError);
      return;
    }
    
    console.log('✅ Comment created successfully!');
    console.log('🆔 Comment ID:', newComment.id);
    console.log('👤 User ID in comment:', newComment.user_id);
    console.log('💬 Comment text:', newComment.comment);
    
    // Clean up - delete the test comment
    const { error: deleteError } = await commentsSupabase
      .from('conversion_comments')
      .delete()
      .eq('id', newComment.id);
    
    if (deleteError) {
      console.warn('⚠️ Could not clean up test comment:', deleteError.message);
    } else {
      console.log('✅ Test comment cleaned up');
    }
    
    console.log('\n🎉 AUTHENTICATION FIX SUCCESSFUL!');
    console.log('✅ Comments feature should now work properly!');
    console.log('✅ Try adding comments in dev review mode');
    
  } catch (error) {
    console.error('❌ Comment creation test failed:', error);
  }
}

// Run the test
testAuthFix(); 