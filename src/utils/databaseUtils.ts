
import { DatabaseConnection, Comment, CommentInsert, CommentUpdate } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Simulated function to save database connection details
export const saveConnection = (connection: DatabaseConnection): Promise<boolean> => {
  // In a real app, this would save to localStorage, IndexedDB, or a backend
  localStorage.setItem(`${connection.type}-connection`, JSON.stringify(connection));
  return Promise.resolve(true);
};

// Simulated function to load saved database connection details
export const loadConnection = (type: 'sybase' | 'oracle'): DatabaseConnection | null => {
  const savedConnection = localStorage.getItem(`${type}-connection`);
  return savedConnection ? JSON.parse(savedConnection) : null;
};

// Simulated function to test database connection
export const testConnection = async (connection: DatabaseConnection): Promise<{ success: boolean; message: string }> => {
  // In a real app, this would attempt to connect to the database
  // For this demo, we'll simulate a connection test
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Randomly succeed or fail for demo purposes
  const success = Math.random() > 0.2;
  
  return {
    success,
    message: success ? 'Connection successful!' : 'Connection failed. Please check your credentials and try again.'
  };
};

// Simulated function to deploy code to Oracle database
export const deployToOracle = async (
  connection: DatabaseConnection, 
  code: string
): Promise<{ success: boolean; message: string }> => {
  // In a real app, this would execute the code against the Oracle database
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // For demo purposes, always succeed unless there's a syntax error
  // This provides a more realistic experience while avoiding random false failures
  // that could confuse users about deployment status
  const hasSyntaxError = code.includes('SYNTAX_ERROR') || code.includes('INVALID_SQL');
  const success = !hasSyntaxError;
  
  return {
    success,
    message: success ? 'Code deployed successfully!' : 'Deployment failed due to syntax error in the code.'
  };
};

// Comment-related database functions
export const getComments = async (fileId: string, fileName?: string): Promise<Comment[]> => {
  try {
    // Get current user for debugging
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.id);
    console.log('Fetching comments for fileId:', fileId, 'fileName:', fileName);

    // First try to get comments by file_id
    let { data, error } = await supabase
      .from('conversion_comments')
      .select('*')
      .eq('file_id', fileId)
      .order('created_at', { ascending: false });

    // If no comments found by file_id and we have fileName, try to find by file_name and user_id
    if ((!data || data.length === 0) && fileName && user?.id) {
      console.log('No comments found by file_id, trying file_name and user_id');
      const { data: nameData, error: nameError } = await supabase
        .from('conversion_comments')
        .select('*')
        .eq('file_name', fileName)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (nameError) {
        console.error('Supabase error (file_name search):', nameError);
      } else {
        data = nameData;
        error = nameError;
      }
    }

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Fetched comments:', data);
    
    // Transform the data to include user name from auth
    return (data || []).map(comment => ({
      ...comment,
      user_email: comment.user_id === user?.id ? (user?.user_metadata?.full_name || user?.email || 'You') : 'Unknown User',
      user_name: comment.user_id === user?.id ? (user?.user_metadata?.full_name || 'You') : 'Unknown User'
    }));
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

export const addComment = async (comment: CommentInsert): Promise<Comment | null> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('conversion_comments')
      .insert([{
        ...comment,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding comment:', error);
    return null;
  }
};

export const updateComment = async (comment: CommentUpdate): Promise<Comment | null> => {
  try {
    const { data, error } = await supabase
      .from('conversion_comments')
      .update({ 
        comment: comment.comment,
        updated_at: new Date().toISOString()
      })
      .eq('id', comment.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating comment:', error);
    return null;
  }
};

export const deleteComment = async (commentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('conversion_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
};
