import { useState, useContext } from 'react';
import feedService from '../services/feedService';
import { AuthContext } from './../../../features/auth/context/AuthContext';

export const usePostInteractions = (initialPost) => {
  const [likes, setLikes] = useState(initialPost.likesCount);
  const [liked, setLiked] = useState(initialPost.isLiked);
  const [commentsCount, setCommentsCount] = useState(initialPost.commentsCount);
  const [showComments, setShowComments] = useState(false);
  const { userId, userType } = useContext(AuthContext);

  const handleLike = async () => {
    if (!userId || !userType) {
      return;
    }

    try {
      if (!liked) {
        await feedService.likePost(initialPost.postId);
        setLikes(likes + 1);
      } else {
        await feedService.unlikePost(initialPost.postId);
        setLikes(likes - 1);
      }
      setLiked(!liked);
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const updateCommentsCount = (newCount) => {
    setCommentsCount(newCount);
  };

  return {
    likes,
    liked,
    commentsCount,
    showComments,
    handleLike,
    toggleComments,
    updateCommentsCount
  };
};
