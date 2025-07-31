import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Eye, Edit, Save, X, Trash2, Plus } from 'lucide-react';
import { commentUtils } from '@/utils/commentUtils';
import { ConversionComment, CreateCommentData } from '@/types/conversionComments';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CommentIndicatorProps {
  fileId: string;
  fileName: string;
}

const CommentIndicator: React.FC<CommentIndicatorProps> = ({ fileId, fileName }) => {
  const [comments, setComments] = useState<ConversionComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const { toast } = useToast();

  const loadComments = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const fileComments = await commentUtils.getCommentsForFile(fileId);
      setComments(fileComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    loadComments();
  }, [fileId, loadComments]);

  const handleEditComment = (comment: ConversionComment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.comment);
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId || !editText.trim()) return;

    setIsSaving(true);
    try {
      const result = await commentUtils.updateComment(editingCommentId, {
        comment: editText.trim()
      });
      
      if (result) {
        setComments(comments.map(c => 
          c.id === editingCommentId ? { ...c, comment: editText.trim(), updated_at: new Date().toISOString() } : c
        ));
        setEditingCommentId(null);
        setEditText('');
        toast({
          title: "Comment Updated",
          description: "Your comment has been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setIsDeleting(commentId);
    try {
      const result = await commentUtils.deleteComment(commentId);
      if (result) {
        setComments(comments.filter(c => c.id !== commentId));
        toast({
          title: "Comment Deleted",
          description: "Your comment has been deleted successfully.",
        });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please enter a comment before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingComment(true);
    try {
      const commentData: CreateCommentData = {
        file_id: fileId,
        file_name: fileName,
        comment: newComment.trim(),
        is_public: false
      };

      const result = await commentUtils.createComment(commentData);
      if (result) {
        setComments(prev => [result, ...prev]);
        setNewComment('');
        toast({
          title: "Comment Added",
          description: "Your comment has been saved successfully.",
        });
      } else {
        throw new Error('Failed to create comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to save comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingComment(false);
    }
  };

  // Always show the button, even when there are no comments
  // This allows users to add comments from the History page

  return (
    <>
      <Button
        size="sm"
        variant={comments.length === 0 ? "ghost" : "outline"}
        onClick={() => setShowComments(true)}
        className={`flex items-center gap-1 h-6 px-2 ${comments.length === 0 ? 'text-gray-500 hover:text-gray-700' : ''}`}
        title={comments.length === 0 ? "Add comments" : `${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
      >
        <MessageSquare className="h-3 w-3" />
        {comments.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {comments.length}
          </Badge>
        )}
      </Button>

      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Comments for {fileName}</DialogTitle>
          </DialogHeader>
          
          {/* Add Comment Section */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-start gap-3">
              <Plus className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add New Comment
                </label>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add your notes, reminders, or comments about this conversion..."
                  rows={2}
                  className="resize-none"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={handleAddComment}
                    disabled={isAddingComment || !newComment.trim()}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isAddingComment ? 'Saving...' : 'Save Comment'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-3 overflow-y-auto max-h-[40vh]">
            {isLoading ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No comments found</p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments ({comments.length})
                </h4>
                <ul className="space-y-2">
                  {comments.map((comment) => (
                    <li key={comment.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </Badge>
                            {comment.updated_at !== comment.created_at && (
                              <Badge variant="outline" className="text-xs">
                                Edited
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {editingCommentId === comment.id ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleSaveEdit}
                                  disabled={isSaving}
                                  className="h-6 w-6 p-0"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditComment(comment)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  disabled={isDeleting === comment.id}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        {editingCommentId === comment.id ? (
                          <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="resize-none"
                          />
                        ) : (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {comment.comment}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComments(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CommentIndicator; 