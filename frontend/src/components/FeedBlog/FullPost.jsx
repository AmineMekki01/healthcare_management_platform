import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from './../axiosConfig';
import CommentsSection from './CommentsSection';
import {
    PostContainer,
    PostHeader,
    PostAuthorAvatar,
    PostAuthorName,
    PostTimestamp,
    PostTitle,
    PostContent,
    PostActions,
    ActionButton,
    LikesCount,
    CommentsCount,
    ActionButtonsContainer,
    PostStats,
} from './styles';
import { AuthContext } from './../Auth/AuthContext';

const FullPost = () => {
    const { postId } = useParams();
    const { userId, userType } = useContext(AuthContext);
    const [post, setPost] = useState(null);
    const [likes, setLikes] = useState(0);
    const [liked, setLiked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    console.log('postId : ', postId)
    
    useEffect(() => {
        const fetchPost = async () => {
            if (!userId && !userType) {
                return;
            }
            console.log('userId : ', userId)
            console.log('userType : ', userType)

            try {
                const response = await axios.get(`http://localhost:3001/api/v1/feed/posts/${postId}`, {
                    params: { userId, userType },
                  });

                setPost(response.data);
                console.log("fetched posts : ", response.data)
                setLikes(response.data.likes_count);

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
                await axios.post(`http://localhost:3001/api/v1/feed/posts/${postId}/like`, null, { params: { userType, userId } });
                setLikes(likes + 1);
            } else {
                await axios.post(`http://localhost:3001/api/v1/feed/posts/${postId}/unlike`, null, { params: { userType, userId } });
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
    console.log("post : ", post)
    if (!post) {
        return <div>Loading...</div>;
    }

    return (
        <PostContainer>
            <PostHeader>
                <PostAuthorAvatar src={`http://localhost:3001/${post.doctor_avatar}`} alt={`Dr. ${post.doctor_name}`} />
                <div>
                    <PostAuthorName>{post.doctor_name}</PostAuthorName>
                    <PostTimestamp>{new Date(post.created_at).toLocaleString()}</PostTimestamp>
                </div>
            </PostHeader>

            <PostContent dangerouslySetInnerHTML={{ __html: post.content }} />

            <PostActions>
                <PostStats>
                    <LikesCount>{likes} Likes</LikesCount>
                    <CommentsCount>{post.comments_count} Comments</CommentsCount>
                </PostStats>

                <ActionButtonsContainer>
                    <ActionButton onClick={handleLike}>{liked ? 'Unlike' : 'Like'}</ActionButton>
                    <ActionButton onClick={toggleComments}>Comments</ActionButton>
                </ActionButtonsContainer>
            </PostActions>

            {showComments && <CommentsSection postId={postId} />}
        </PostContainer>
    );
};

export default FullPost;
