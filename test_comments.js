// Test script to check if conversion_comments table exists
// Run this in browser console on your deployed site

async function testCommentsTable() {
  console.log('🔍 Testing conversion_comments table...');
  
  try {
    // Test if we can access the table
    const { data, error } = await supabase
      .from('conversion_comments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing conversion_comments table:', error);
      console.log('💡 This means the table does not exist or there are permission issues.');
      console.log('📋 Please run the SQL script in your Supabase Dashboard → SQL Editor');
      return false;
    }
    
    console.log('✅ conversion_comments table exists and is accessible!');
    console.log('📊 Current comments count:', data?.length || 0);
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Test creating a comment
async function testCreateComment() {
  console.log('🔍 Testing comment creation...');
  
  try {
    const testComment = {
      file_id: 'test-file-' + Date.now(),
      file_name: 'test-file.sql',
      comment: 'This is a test comment',
      is_public: false
    };
    
    const { data, error } = await supabase
      .from('conversion_comments')
      .insert([testComment])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating test comment:', error);
      return false;
    }
    
    console.log('✅ Test comment created successfully:', data);
    
    // Clean up - delete the test comment
    await supabase
      .from('conversion_comments')
      .delete()
      .eq('id', data.id);
    
    console.log('🧹 Test comment cleaned up');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting comments table tests...');
  
  const tableExists = await testCommentsTable();
  if (tableExists) {
    await testCreateComment();
  }
  
  console.log('🏁 Tests completed!');
}

// Run the tests
runTests(); 