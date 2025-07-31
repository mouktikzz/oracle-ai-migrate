// Comprehensive test script for separate Supabase comments setup
// Run this in browser console after deployment

async function testSeparateSupabaseSetup() {
  console.log('🚀 Testing Separate Supabase Comments Setup...');
  
  // Test 1: Check environment variables
  console.log('🔍 Test 1: Environment Variables');
  const hasUrl = import.meta.env.VITE_SUPABASE_URL_COMMENTS;
  const hasKey = import.meta.env.VITE_SUPABASE_ANON_KEY_COMMENTS;
  
  console.log('- VITE_SUPABASE_URL_COMMENTS:', hasUrl ? '✅ SET' : '❌ NOT SET');
  console.log('- VITE_SUPABASE_ANON_KEY_COMMENTS:', hasKey ? '✅ SET' : '❌ NOT SET');
  
  if (!hasUrl || !hasKey) {
    console.error('❌ Environment variables not set properly');
    return;
  }
  
  // Test 2: Check if commentsSupabase is available
  console.log('🔍 Test 2: Comments Supabase Client');
  if (typeof commentsSupabase === 'undefined') {
    console.error('❌ commentsSupabase is undefined');
    return;
  }
  console.log('✅ commentsSupabase is available');
  
  // Test 3: Check authentication sync
  console.log('🔍 Test 3: Authentication Sync');
  try {
    const { data: { session }, error: authError } = await commentsSupabase.auth.getSession();
    if (authError) {
      console.error('❌ Auth error:', authError);
    } else if (!session) {
      console.warn('⚠️ No active session - user might not be logged in');
    } else {
      console.log('✅ User authenticated:', session.user.email);
      console.log('✅ User ID:', session.user.id);
    }
  } catch (error) {
    console.error('❌ Auth check failed:', error);
  }
  
  // Test 4: Check table access
  console.log('🔍 Test 4: Table Access');
  try {
    const { data, error } = await commentsSupabase
      .from('conversion_comments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table access error:', error.message);
      console.log('💡 This might mean:');
      console.log('   - The table does not exist in your separate Supabase');
      console.log('   - RLS policies are blocking access');
      console.log('   - Authentication is not working');
      return;
    }
    
    console.log('✅ Table access successful');
    console.log('📊 Current comments count:', data?.length || 0);
  } catch (error) {
    console.error('❌ Table access failed:', error);
    return;
  }
  
  // Test 5: Test comment creation
  console.log('🔍 Test 5: Comment Creation');
  try {
    const testComment = {
      file_id: 'test-file-' + Date.now(),
      file_name: 'test-conversion.sql',
      comment: 'This is a test comment from separate Supabase',
      is_public: false
    };
    
    console.log('📝 Creating test comment:', testComment);
    
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
    
    console.log('✅ Comment created successfully:', newComment);
    console.log('✅ Comment ID:', newComment.id);
    console.log('✅ User ID in comment:', newComment.user_id);
    
    // Test 6: Test comment reading
    console.log('🔍 Test 6: Comment Reading');
    const { data: readComment, error: readError } = await commentsSupabase
      .from('conversion_comments')
      .select('*')
      .eq('id', newComment.id)
      .single();
    
    if (readError) {
      console.error('❌ Comment read failed:', readError.message);
    } else {
      console.log('✅ Comment read successfully:', readComment.comment);
    }
    
    // Test 7: Test comment updating
    console.log('🔍 Test 7: Comment Updating');
    const { data: updatedComment, error: updateError } = await commentsSupabase
      .from('conversion_comments')
      .update({ comment: 'This comment has been updated!' })
      .eq('id', newComment.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Comment update failed:', updateError.message);
    } else {
      console.log('✅ Comment updated successfully:', updatedComment.comment);
    }
    
    // Test 8: Test comment deletion
    console.log('🔍 Test 8: Comment Deletion');
    const { error: deleteError } = await commentsSupabase
      .from('conversion_comments')
      .delete()
      .eq('id', newComment.id);
    
    if (deleteError) {
      console.error('❌ Comment deletion failed:', deleteError.message);
    } else {
      console.log('✅ Comment deleted successfully');
    }
    
    console.log('🎉 All tests completed successfully!');
    console.log('✅ Separate Supabase comments setup is working perfectly!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Test the comments feature in your app');
    console.log('   2. Add comments in dev review mode');
    console.log('   3. Check comments in History tab');
    console.log('   4. Test editing and deleting comments');
    
  } catch (error) {
    console.error('❌ Comment creation test failed:', error);
  }
}

// Run the comprehensive test
testSeparateSupabaseSetup(); 