import React, { useState, useContext, useEffect } from 'react';
import axios from './../axiosConfig';
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
} from './styles';
import { AuthContext } from './../Auth/AuthContext';

const CommentsSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const {userId, userType} = useContext(AuthContext)

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/v1/feed/posts/${postId}/comments`);
        setComments(response.data.comments);
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
        const response = await axios.post(
            `http://localhost:3001/api/v1/feed/posts/${postId}/add-comment`,
            { content: newComment },
            { params: { userId, userType } }
        );
      setComments([...comments, response.data.comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <CommentsContainer>
      {comments && comments.map((comment) => (
        <Comment key={comment.comment_id}>
          <CommentAvatar src={`http://localhost:3001/${comment.user_avatar}`} alt={comment.user_name} />
          <CommentContent>
            <CommentAuthor>{comment.user_name}</CommentAuthor>
            <CommentText>{comment.content}</CommentText>
            <CommentTimestamp>{new Date(comment.created_at).toLocaleString()}</CommentTimestamp>
          </CommentContent>
        </Comment>
      ))}
      <AddCommentForm>
        <AddCommentInput
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
        />
        <AddCommentButton onClick={handleAddComment}>Post</AddCommentButton>
      </AddCommentForm>
    </CommentsContainer>
  );
};

export default CommentsSection;
