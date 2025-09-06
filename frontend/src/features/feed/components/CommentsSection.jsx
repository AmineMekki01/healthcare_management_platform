import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import feedService from '../services/feedService';
import {
  CommentsContainer,
  Comment,
  CommentAvatar,
  CommentContent,
  CommentAuthor,
  CommentText,
  CommentTimestamp,
  AddCommentForm,
  AddCommentInput,
  AddCommentButton,
} from '../styles/styles';
import { AuthContext } from './../../../features/auth/context/AuthContext';

const CommentsSection = ({ postId, onCommentAdded }) => {
  const { t } = useTranslation('feed');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const {userId, userType} = useContext(AuthContext)

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await feedService.getComments(postId);
        setComments(response.comments);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
        if (!userId && !userType) {
            return
          }
        const response = await feedService.addComment(postId, { 
          content: newComment 
        });
        setComments((prevComments) => [...prevComments || [], response.comment]);
        setNewComment('');

        if (onCommentAdded) {
          onCommentAdded();
        }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <CommentsContainer>
      {comments && comments.length > 0 ? (
        comments.map((comment) => (
          <Comment key={comment.commentId}>
            <CommentAvatar src={comment.userAvatar} alt={comment.userName} />
            <CommentContent>
              <CommentAuthor>{comment.userName}</CommentAuthor>
              <CommentText>{comment.content}</CommentText>
              <CommentTimestamp>{new Date(comment.createdAt).toLocaleString()}</CommentTimestamp>
            </CommentContent>
          </Comment>
        ))
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          {t('comments.noComments')}
        </div>
      )}
      <AddCommentForm>
        <AddCommentInput
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t('comments.placeholder')}
        />
        <AddCommentButton onClick={handleAddComment}>
          {t('comments.submit')}
        </AddCommentButton>
      </AddCommentForm>
    </CommentsContainer>
  );
};

export default CommentsSection;
