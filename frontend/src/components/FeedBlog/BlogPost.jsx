import React, { useState, useContext } from 'react';
import axios from './../axiosConfig';
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
    PostMetadata,
    SpecialtyTag,
    KeywordTag,
    KeywordsContainer,
    PostAuthorInfoContainer,
    PostAuthorInfo,
    GoToPostActionButton
  } from './styles';
import { AuthContext } from './../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaThumbsUp, FaComment, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const BlogPost = ({post}) => {
    const [likes, setLikes] = useState(post.likes_count)
    const [liked, setLiked] = useState(post.is_liked)
    const [commentsCount, setCommentsCount] = useState(post.comments_count)
    const [showComments, setShowComments] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const {userId, userType} = useContext(AuthContext)
    const navigate = useNavigate();
    
    const handleLike = async () => {
        if (!userId && !userType) {
            return
          }
        try {
            if (!liked) {
                await axios.post(`http://localhost:3001/api/v1/feed/posts/${post.post_id}/like`, null, {params : {userType, userId}});
                setLikes(likes + 1)
            } else {
                await axios.post(`http://localhost:3001/api/v1/feed/posts/${post.post_id}/unlike`, null, {params : {userType, userId}});
                setLikes(likes - 1)
            }
            setLiked(!liked);
            console.log("liked : ", liked)

        } catch (error) {
            console.error('Error updating like status : ', error)
        }
    };

    const toggleComments = () => {
        setShowComments(!showComments);
    };

    const handleShowMore = () => {
        setShowMore(!showMore)
    };

    const handleGoToPost = () => {
        navigate(`/posts/${post.post_id}`);
    };

    const updateCommentsCount = () => {
        setCommentsCount((prevCount) => prevCount + 1);
    };

    const getSnippet = (content) => {
        const maxLength = 250;
        if (content.length > maxLength) {
            return `${content.substring(0, maxLength)}...`
        }
        return content;
    };

    return (
        <PostContainer>
            <PostHeader>
                <PostAuthorInfoContainer>
                    <PostAuthorAvatar src={`http://localhost:3001/${post.doctor_avatar}`} alt={`Dr. ${post.doctor_name}`} />
                    <PostAuthorInfo>
                        <PostAuthorName>{post.doctor_name}</PostAuthorName>
                        <PostTimestamp>{new Date(post.created_at).toLocaleString()}</PostTimestamp>
                    </PostAuthorInfo>
                </PostAuthorInfoContainer>
                <GoToPostActionButton onClick={handleGoToPost}>
                    View Full Post
                </GoToPostActionButton>
            </PostHeader>
            <PostMetadata>
                <SpecialtyTag>{post.specialty}</SpecialtyTag>
                <KeywordsContainer>
                {post.keywords.map((keyword, index) => (
                    <KeywordTag key={index}>{keyword}</KeywordTag>
                ))}
                </KeywordsContainer>
            </PostMetadata>
            <PostContent dangerouslySetInnerHTML={{ __html: showMore ? post.content : getSnippet(post.content) }} />
            <ActionButton onClick={handleShowMore}>
                {showMore ? (
                    <>
                        Show Less <FaChevronUp />
                    </>
                ) : (
                    <>
                        Show More <FaChevronDown />
                    </>
                )}
            </ActionButton>
            <PostActions>
                <PostStats>
                    <LikesCount>{likes} Likes</LikesCount>
                    <CommentsCount>{commentsCount} Comments</CommentsCount>
                </PostStats>
                <ActionButtonsContainer>
                    <ActionButton onClick={handleLike}>
                        <FaThumbsUp /> {liked ? 'Unlike' : 'Like'}
                    </ActionButton>
                    <ActionButton onClick={toggleComments}>
                        <FaComment /> Comments
                    </ActionButton>
                </ActionButtonsContainer>
            </PostActions>
            {showComments && <CommentsSection postId={post.post_id} onCommentAdded={updateCommentsCount} />}
        </PostContainer>
    );
};

export default BlogPost;
