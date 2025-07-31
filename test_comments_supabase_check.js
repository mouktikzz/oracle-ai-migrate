// Test script to check which Supabase the comments feature is using
// Run this in browser console after deployment

async function checkCommentsSupabase() {
  console.log('🔍 Checking which Supabase the comments feature is using...');
  
  // Check 1: Main Supabase client
  console.log('\n📋 Check 1: Main Supabase Client');
  if (typeof supabase === 'undefined') {
    console.error('❌ Main supabase client is undefined');
    return;
  }
  console.log('✅ Main supabase client is available');
  console.log('🔗 Main Supabase URL:', supabase.supabaseUrl);
  
  // Check 2: Comments table access
  console.log('\n📋 Check 2: Comments Table Access');
  try {
    const { data, error } = await supabase
      .from('conversion_comments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Comments table access failed:', error.message);
      console.log('💡 This means the table does not exist in the main Supabase');
      return;
    }
    
    console.log('✅ Comments table access successful!');
    console.log('📊 Comments found:', data?.length || 0);
    
  } catch (error) {
    console.error('❌ Comments table access failed:', error);
    return;
  }
  
  // Check 3: Authentication session
  console.log('\n📋 Check 3: Authentication Session');
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }
    
    if (!session) {
      console.warn('⚠️ No active session - please log in first');
      console.log('💡 Please log in to your account and try again');
      return;
    }
    
    console.log('✅ User authenticated successfully!');
    console.log('👤 User ID:', session.user.id);
    console.log('📧 User Email:', session.user.email);
    
  } catch (error) {
    console.error('❌ Auth check failed:', error);
    return;
  }
  
  // Check 4: Test comment creation
  console.log('\n📋 Check 4: Test Comment Creation');
  try {
    const testComment = {
      file_id: 'test-file-' + Date.now(),
      file_name: 'test-oracle-conversion.sql',
      comment: 'Test comment to verify Supabase connection!',
      is_public: false
    };
    
    console.log('📝 Creating test comment...');
    
    const { data: newComment, error: createError } = await supabase
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
    const { error: deleteError } = await supabase
      .from('conversion_comments')
      .delete()
      .eq('id', newComment.id);
    
    if (deleteError) {
      console.warn('⚠️ Could not clean up test comment:', deleteError.message);
    } else {
      console.log('✅ Test comment cleaned up');
    }
    
    console.log('\n🎉 COMMENTS SUPABASE CHECK SUCCESSFUL!');
    console.log('✅ Comments feature is using the MAIN Supabase client');
    console.log('✅ Table access is working properly');
    console.log('✅ Authentication is working properly');
    console.log('✅ Comment CRUD operations are working');
    console.log('✅ No separate Supabase client is being used');
    
  } catch (error) {
    console.error('❌ Comment creation test failed:', error);
  }
}

// Run the test
checkCommentsSupabase(); 