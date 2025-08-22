import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import feedService from '../services/feedService';
import CommentsSection from './CommentsSection';
import {
    PostContainer,
    PostHeader,
    PostAuthorAvatar,
    PostAuthorName,
    PostTimestamp,
    PostContent,
    PostActions,
    ActionButton,
    LikesCount,
    CommentsCount,
    ActionButtonsContainer,
    PostStats,
} from '../styles/styles';
import { AuthContext } from './../../../features/auth/context/AuthContext';

const FullPost = () => {
    const { postId } = useParams();
    const { userId, userType } = useContext(AuthContext);
    const [post, setPost] = useState(null);
    const [likes, setLikes] = useState(0);
    const [liked, setLiked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentsCount, setCommentsCount] = useState(null)

    
    useEffect(() => {
        const fetchPost = async () => {
            if (!userId && !userType) {
                return;
            }
            try {
                const response = await feedService.getPost(postId);

                setPost(response);
                setLikes(response.likes_count);
                setCommentsCount(response.comments_count)
                if (likes > 0) {
                    setLiked(true);

                } else {
                    setLiked(false);
                }
            } catch (error) {
                console.error('Error fetching post:', error);
            }
        };

        fetchPost();
    }, [postId, userId, userType, likes]);

    const handleLike = async () => {
        if (!userId || !userType) {
            return;
        }
        try {
            if (!liked) {
                await feedService.likePost(postId);
                setLikes(likes + 1);
            } else {
                await feedService.unlikePost(postId);
                setLikes(likes - 1);
            }
            setLiked(!liked);
        } catch (error) {
            console.error('Error updating like status:', error);
        }
    };

    const toggleComments = () => {
        setShowComments(!showComments);
    };
    const updateCommentsCount = () => {
        setCommentsCount((prevCount) => prevCount + 1);
    };

    if (!post) {
        return <div>Loading...</div>;
    }

    return (
        <PostContainer>
            <PostHeader>
                <PostAuthorAvatar src={feedService.getImageUrl(post.doctorAvatar)} alt={`Dr. ${post.doctorName}`} />
                <div>
                    <PostAuthorName>{post.doctorName}</PostAuthorName>
                    <PostTimestamp>{new Date(post.createdAt).toLocaleString()}</PostTimestamp>
                </div>
            </PostHeader>

            <PostContent dangerouslySetInnerHTML={{ __html: post.content }} />

            <PostActions>
                <PostStats>
                    <LikesCount>{likes} Likes</LikesCount>
                    <CommentsCount>{commentsCount} Comments</CommentsCount>
                </PostStats>

                <ActionButtonsContainer>
                    <ActionButton onClick={handleLike}>{liked ? 'Unlike' : 'Like'}</ActionButton>
                    <ActionButton onClick={toggleComments}>Comments</ActionButton>
                </ActionButtonsContainer>
            </PostActions>

            {showComments && <CommentsSection postId={post.postId} onCommentAdded={updateCommentsCount} />}
        </PostContainer>
    );
};

export default FullPost;
