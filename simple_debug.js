// Simple debug script - run this in browser console
console.log('🔍 Simple Debug for Comments Issue');

// Step 1: Check if commentsSupabase exists
if (typeof commentsSupabase === 'undefined') {
  console.error('❌ commentsSupabase is undefined');
  console.log('💡 The separate client was not created');
} else {
  console.log('✅ commentsSupabase exists');
}

// Step 2: Check environment variables
console.log('Environment Variables:');
console.log('- VITE_SUPABASE_URL_COMMENTS:', import.meta.env.VITE_SUPABASE_URL_COMMENTS ? 'SET' : 'NOT SET');
console.log('- VITE_SUPABASE_ANON_KEY_COMMENTS:', import.meta.env.VITE_SUPABASE_ANON_KEY_COMMENTS ? 'SET' : 'NOT SET');

// Step 3: Test table access
async function testTable() {
  try {
    const { data, error } = await commentsSupabase
      .from('conversion_comments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table access error:', error.message);
      return false;
    }
    
    console.log('✅ Table access successful');
    return true;
  } catch (error) {
    console.error('❌ Table access failed:', error);
    return false;
  }
}

// Step 4: Test authentication
async function testAuth() {
  try {
    const { data: { session } } = await commentsSupabase.auth.getSession();
    if (session) {
      console.log('✅ User authenticated:', session.user.email);
      return true;
    } else {
      console.warn('⚠️ No active session');
      return false;
    }
  } catch (error) {
    console.error('❌ Auth check failed:', error);
    return false;
  }
}

// Step 5: Test comment creation
async function testCreate() {
  try {
    const testComment = {
      file_id: 'test-' + Date.now(),
      file_name: 'test.sql',
      comment: 'Test comment',
      is_public: false
    };
    
    const { data, error } = await commentsSupabase
      .from('conversion_comments')
      .insert([testComment])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Create error:', error.message);
      return false;
    }
    
    console.log('✅ Comment created:', data);
    
    // Clean up
    await commentsSupabase
      .from('conversion_comments')
      .delete()
      .eq('id', data.id);
    
    return true;
  } catch (error) {
    console.error('❌ Create test failed:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Running tests...');
  
  const tableOk = await testTable();
  const authOk = await testAuth();
  
  if (tableOk && authOk) {
    await testCreate();
  }
  
  console.log('🏁 Tests completed');
}

runTests(); 