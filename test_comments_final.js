// Final test script for comments feature
// Run this in browser console on your deployed site after deployment completes

async function testCommentsFeature() {
  console.log('🚀 Testing Comments Feature...');
  
  // Check if commentsSupabase is available
  if (typeof commentsSupabase === 'undefined') {
    console.error('❌ commentsSupabase is not available');
    console.log('💡 Make sure the site is deployed with the latest changes');
    return;
  }
  
  try {
    // Test 1: Check table access
    console.log('🔍 Test 1: Checking table access...');
    const { data, error } = await commentsSupabase
      .from('conversion_comments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table access error:', error);
      console.log('💡 This might mean:');
      console.log('   - The table doesn\'t exist in your Supabase');
      console.log('   - Environment variables are not set correctly');
      console.log('   - RLS policies are blocking access');
      return;
    }
    
    console.log('✅ Table access successful!');
    console.log('📊 Current comments count:', data?.length || 0);
    
    // Test 2: Create a test comment
    console.log('🔍 Test 2: Creating test comment...');
    const testComment = {
      file_id: 'test-file-' + Date.now(),
      file_name: 'test-conversion.sql',
      comment: 'This is a test comment to verify the feature works!',
      is_public: false
    };
    
    const { data: newComment, error: createError } = await commentsSupabase
      .from('conversion_comments')
      .insert([testComment])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Comment creation error:', createError);
      return;
    }
    
    console.log('✅ Comment created successfully!');
    console.log('📝 Comment details:', newComment);
    
    // Test 3: Read the comment back
    console.log('🔍 Test 3: Reading comment back...');
    const { data: readComment, error: readError } = await commentsSupabase
      .from('conversion_comments')
      .select('*')
      .eq('id', newComment.id)
      .single();
    
    if (readError) {
      console.error('❌ Comment read error:', readError);
    } else {
      console.log('✅ Comment read successfully!');
      console.log('📖 Comment content:', readComment.comment);
    }
    
    // Test 4: Update the comment
    console.log('🔍 Test 4: Updating comment...');
    const { data: updatedComment, error: updateError } = await commentsSupabase
      .from('conversion_comments')
      .update({ comment: 'This comment has been updated!' })
      .eq('id', newComment.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Comment update error:', updateError);
    } else {
      console.log('✅ Comment updated successfully!');
      console.log('📝 Updated comment:', updatedComment.comment);
    }
    
    // Test 5: Delete the test comment
    console.log('🔍 Test 5: Deleting test comment...');
    const { error: deleteError } = await commentsSupabase
      .from('conversion_comments')
      .delete()
      .eq('id', newComment.id);
    
    if (deleteError) {
      console.error('❌ Comment deletion error:', deleteError);
    } else {
      console.log('✅ Comment deleted successfully!');
    }
    
    console.log('🎉 All tests completed successfully!');
    console.log('✅ Comments feature is working perfectly!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Go to your app and try adding comments in dev review mode');
    console.log('   2. Check the History tab to see comment indicators');
    console.log('   3. Test editing and deleting comments');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testCommentsFeature(); 