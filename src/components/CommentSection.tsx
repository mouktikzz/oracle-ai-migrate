import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Edit, MessageSquare, Plus } from 'lucide-react';
import { Comment, CommentInsert } from '@/types';
import { addComment, updateComment, deleteComment } from '@/utils/databaseUtils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface CommentSectionProps {
  fileId: string;
  fileName: string;
  conversionId?: string;
  className?: string;
  onCommentCountChange?: (count: number) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  fileId,
  fileName,
  conversionId,
  className = '',
  onCommentCountChange
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [fileId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      // Get current user for user email handling
      const { data: { user } } = await supabase.auth.getUser();
      
      // First try to get comments by file_id
      let { data, error } = await supabase
        .from('conversion_comments')
        .select('*')
        .eq('file_id', fileId)
        .order('created_at', { ascending: false });
      
      // If no comments found by file_id, try by file_name and user_id
      if ((!data || data.length === 0) && fileName && user?.id) {
        const { data: nameData, error: nameError } = await supabase
          .from('conversion_comments')
          .select('*')
          .eq('file_name', fileName)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (!nameError && nameData !== null) {
          data = nameData;
          error = nameError;
        }
      }
      
      // If still no comments found, try by file_name only (for comments from other users or when user_id is not set)
      if ((!data || data.length === 0) && fileName) {
        const { data: nameOnlyData, error: nameOnlyError } = await supabase
          .from('conversion_comments')
          .select('*')
          .eq('file_name', fileName)
          .order('created_at', { ascending: false });
        
        if (!nameOnlyError && nameOnlyData !== null) {
          data = nameOnlyData;
          error = nameOnlyError;
        }
      }
      
      if (error) {
        console.error('Error fetching comments:', error);
        setComments([]);
      } else {
        // Transform the data to include user name from auth
        const transformedComments = (data || []).map(comment => ({
          ...comment,
          user_email: comment.user_id === user?.id ? (user?.user_metadata?.full_name || user?.email || 'You') : 'Unknown User',
          user_name: comment.user_id === user?.id ? (user?.user_metadata?.full_name || 'You') : 'Unknown User'
        }));
        setComments(transformedComments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    const commentData: CommentInsert = {
      file_id: fileId,
      file_name: fileName,
      comment: newComment.trim(),
      conversion_id: conversionId
    };

    const addedComment = await addComment(commentData);
    if (addedComment) {
      const newComments = [...comments, { ...addedComment, user_email: user.user_metadata?.full_name || user.email || 'You' }];
      setComments(newComments);
      onCommentCountChange?.(newComments.length);
      setNewComment('');
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editText.trim()) return;

    const updatedComment = await updateComment({
      id: commentId,
      comment: editText.trim()
    });

    if (updatedComment) {
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...updatedComment, user_email: c.user_email } : c
      ));
      setEditingComment(null);
      setEditText('');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const success = await deleteComment(commentId);
    if (success) {
      const newComments = comments.filter(c => c.id !== commentId);
      setComments(newComments);
      onCommentCountChange?.(newComments.length);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditText(comment.comment);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditText('');
  };

  const canEditComment = (comment: Comment) => {
    return user && comment.user_id === user.id;
  };

  const canDeleteComment = (comment: Comment) => {
    return user && comment.user_id === user.id;
  };

  return (
    <div className={`space-y-4 ${className}`}>

      {/* Add new comment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add Comment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Write your comment here..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleAddComment}
              disabled={!newComment.trim() || !user}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Comment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments list */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-4">
            <p className="text-gray-500">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="relative">
              <CardContent className="pt-4">
                {editingComment === comment.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button 
                        onClick={() => handleUpdateComment(comment.id)}
                        size="sm"
                        variant="outline"
                      >
                        Save
                      </Button>
                      <Button 
                        onClick={cancelEditing}
                        size="sm"
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.user_email}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {canEditComment(comment) && (
                          <Button
                            onClick={() => startEditing(comment)}
                            size="sm"
                            variant="ghost"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {canDeleteComment(comment) && (
                          <Button
                            onClick={() => handleDeleteComment(comment.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}; 