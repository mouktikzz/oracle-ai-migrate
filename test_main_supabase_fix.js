// Test script to verify main Supabase fix
// Run this in browser console after deployment

async function testMainSupabaseFix() {
  console.log('🔧 Testing Main Supabase Fix...');
  
  // Test 1: Check if supabase is available
  console.log('📋 Test 1: Main Supabase Client');
  if (typeof supabase === 'undefined') {
    console.error('❌ supabase is undefined');
    return;
  }
  console.log('✅ supabase is available');
  
  // Test 2: Check authentication session
  console.log('\n📋 Test 2: Authentication Session');
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
  
  // Test 3: Check if conversion_comments table exists
  console.log('\n📋 Test 3: Table Access');
  try {
    const { data, error } = await supabase
      .from('conversion_comments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table access failed:', error.message);
      console.log('💡 This means the table does not exist in your main Supabase');
      console.log('💡 Please run the SQL script in your main Supabase SQL Editor');
      return;
    }
    
    console.log('✅ Table access successful!');
    console.log('📊 Current comments in table:', data?.length || 0);
    
  } catch (error) {
    console.error('❌ Table access failed:', error);
    return;
  }
  
  // Test 4: Test comment creation
  console.log('\n📋 Test 4: Comment Creation Test');
  try {
    const testComment = {
      file_id: 'test-file-' + Date.now(),
      file_name: 'test-oracle-conversion.sql',
      comment: 'Test comment using main Supabase!',
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
    
    console.log('\n🎉 MAIN SUPABASE FIX SUCCESSFUL!');
    console.log('✅ Comments feature should now work properly!');
    console.log('✅ No more authentication sync issues!');
    console.log('✅ Try adding comments in dev review mode');
    
  } catch (error) {
    console.error('❌ Comment creation test failed:', error);
  }
}

// Run the test
testMainSupabaseFix(); 