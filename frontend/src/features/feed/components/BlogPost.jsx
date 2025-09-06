import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaThumbsUp, FaComment, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import CommentsSection from './CommentsSection';
import { usePostInteractions } from '../hooks/usePostInteractions';
import {
    PostContainer,
    PostTitle,
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
  } from '../styles/styles';
import { useNavigate } from 'react-router-dom';

const BlogPost = ({post}) => {
    const { t } = useTranslation('feed');
    const [showMore, setShowMore] = useState(false);
    const navigate = useNavigate();
    
    const {
        likes,
        liked,
        commentsCount,
        showComments,
        handleLike,
        toggleComments,
        updateCommentsCount
    } = usePostInteractions(post);

    const handleShowMore = () => {
        setShowMore(!showMore)
    };

    const handleGoToPost = () => {
        navigate(`/posts/${post.postId}`);
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
                    <PostAuthorAvatar src={post.doctorAvatar} alt={`Dr. ${post.doctorName}`} />
                    <PostAuthorInfo>
                        <PostAuthorName>{post.doctorName}</PostAuthorName>
                        <PostTimestamp>{new Date(post.createdAt).toLocaleString()}</PostTimestamp>
                    </PostAuthorInfo>
                </PostAuthorInfoContainer>
                <GoToPostActionButton onClick={handleGoToPost}>
                    {t('post.viewFull')}
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
            <div style={{ padding: '20px 28px 16px' }}>
                <PostTitle>{post.title}</PostTitle>
            </div>
            <PostContent dangerouslySetInnerHTML={{ __html: showMore ? post.content : getSnippet(post.content) }} />
            {post.content.length > 250 && (
                <ActionButton 
                    onClick={handleShowMore}
                    style={{ 
                        margin: '0 28px 16px', 
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                        border: '2px solid rgba(102, 126, 234, 0.2)',
                        color: '#667eea',
                        fontWeight: '600'
                    }}
                >
                    {showMore ? (
                        <>
                            {t('post.showLess')} <FaChevronUp />
                        </>
                    ) : (
                        <>
                            {t('post.showMore')} <FaChevronDown />
                        </>
                    )}
                </ActionButton>
            )}
            <PostActions>
                <PostStats>
                    <LikesCount>{t('post.likesCount', { count: likes })}</LikesCount>
                    <CommentsCount>{t('post.commentsCount', { count: commentsCount })}</CommentsCount>
                </PostStats>
                <ActionButtonsContainer>
                    <ActionButton onClick={handleLike}>
                        <FaThumbsUp /> {liked ? t('post.unlike') : t('post.like')}
                    </ActionButton>
                    <ActionButton onClick={toggleComments}>
                        <FaComment /> {t('post.comments')}
                    </ActionButton>
                </ActionButtonsContainer>
            </PostActions>
            {showComments && <CommentsSection postId={post.postId} onCommentAdded={updateCommentsCount} />}
        </PostContainer>
    );
};

export default BlogPost;
