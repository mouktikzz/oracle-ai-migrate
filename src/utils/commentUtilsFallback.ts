// Fallback commentUtils using main Supabase client
import { supabase } from '@/integrations/supabase/client';
import { ConversionComment, CreateCommentData, UpdateCommentData } from '@/types/conversionComments';

export const commentUtilsFallback = {
  // Get comments for a specific file
  async getCommentsForFile(fileId: string): Promise<ConversionComment[]> {
    try {
      const { data, error } = await supabase
        .from('conversion_comments')
        .select('*')
        .eq('file_id', fileId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCommentsForFile:', error);
      return [];
    }
  },

  // Get comments for a specific conversion
  async getCommentsForConversion(conversionId: string): Promise<ConversionComment[]> {
    try {
      const { data, error } = await supabase
        .from('conversion_comments')
        .select('*')
        .eq('conversion_id', conversionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversion comments:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCommentsForConversion:', error);
      return [];
    }
  },

  // Create a new comment
  async createComment(commentData: CreateCommentData): Promise<ConversionComment | null> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error getting user for comment creation:', userError);
        throw new Error('User not authenticated');
      }
      
      // Ensure user_id is set
      const commentWithUserId = {
        ...commentData,
        user_id: user.id
      };
      
      console.log('Creating comment with user_id:', user.id);
      
      const { data, error } = await supabase
        .from('conversion_comments')
        .insert([commentWithUserId])
        .select()
        .single();

      if (error) {
        console.error('Error creating comment:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createComment:', error);
      return null;
    }
  },

  // Update an existing comment
  async updateComment(commentId: string, updateData: UpdateCommentData): Promise<ConversionComment | null> {
    try {
      const { data, error } = await supabase
        .from('conversion_comments')
        .update(updateData)
        .eq('id', commentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating comment:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateComment:', error);
      return null;
    }
  },

  // Delete a comment
  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversion_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteComment:', error);
      return false;
    }
  },

  // Get all comments for the current user
  async getUserComments(): Promise<ConversionComment[]> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error getting user for fetching comments:', userError);
        return [];
      }
      
      const { data, error } = await supabase
        .from('conversion_comments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user comments:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserComments:', error);
      return [];
    }
  }
}; 