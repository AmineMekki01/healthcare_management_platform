import React, { useState, useEffect, useContext } from 'react';
import feedService from '../services/feedService';
import { AuthContext } from './../../../features/auth/context/AuthContext';
import {
  PostContainer,
  PostTitle,
  PostContent,
  PostStats,
  LikesCount,
  CommentsCount,
  DoctorPostsTitle,
  PostMetadata,
  SpecialtyTag,
  KeywordTag,
  KeywordsContainer,
} from '../styles/styles';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaEdit, FaTrashAlt, FaEye, FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';

const DoctorPostsPageContainer = styled.div`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  padding: 60px 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const EnhancedDoctorPostsContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: 24px;
  margin-bottom: 32px;
  box-shadow: 
    0 32px 64px rgba(0, 0, 0, 0.08),
    0 16px 32px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    border-radius: 24px 24px 0 0;
  }
`;

const EnhancedPostContainer = styled(PostContainer)`
  margin-bottom: 32px;
  position: relative;
  overflow: visible;
`;

const PostHeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 28px 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
`;

const PostTitleSection = styled.div`
  flex: 1;
  margin-right: 20px;
`;

const PostActionsSection = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;
`;

const ActionButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 16px 28px 20px;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
`;

const EnhancedEditButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    font-size: 12px;
  }
`;

const EnhancedDeleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    font-size: 12px;
  }
`;

const ViewPostButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    font-size: 12px;
  }
`;

const PostStatsSection = styled(PostStats)`
  margin: 0 28px 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.6);
`;

const ShowMoreButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 16px 28px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: calc(100% - 56px);

  &:hover {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
    border-color: rgba(102, 126, 234, 0.4);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    font-size: 14px;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 24px;
`;

const SearchLabel = styled.label`
  display: block;
  margin-bottom: 12px;
  font-weight: 600;
  color: #34495e;
  font-size: 16px;
  letter-spacing: 0.5px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 16px 50px 16px 20px;
  font-size: 16px;
  border: 2px solid #e8ecf0;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  color: #2c3e50;
  font-family: inherit;

  &:focus {
    border-color: #667eea;
    outline: none;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
  }

  &::placeholder {
    color: #a0aec0;
  }
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  font-size: 18px;
  transition: color 0.3s;
  
  ${SearchInput}:focus ~ & {
    color: #667eea;
  }
`;

const SearchStats = styled.div`
  margin-bottom: 20px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
`;

const DoctorPosts = () => {
  const { userId } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPosts, setExpandedPosts] = useState(new Set());
  const navigate = useNavigate();
  
  useEffect(() => {    
    const fetchDoctorPosts = async () => {
        try {
            const response = await feedService.getDoctorPosts(userId);
            setPosts(response.posts);
            setFilteredPosts(response.posts);
        } catch (error) {
            console.error('Error fetching doctor posts:', error);
        }
    };

    if (userId) {
        fetchDoctorPosts();
    }
}, [userId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(post => {
        const searchLower = searchQuery.toLowerCase();
        return (
          post.title.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower) ||
          post.specialty.toLowerCase().includes(searchLower) ||
          post.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
        );
      });
      setFilteredPosts(filtered);
    }
  }, [searchQuery, posts]);

  const handleEditPost = (postId) => {
    navigate(`/edit-post/${postId}`);
  };

  const handleViewPost = (postId) => {
    navigate(`/posts/${postId}`);
  };

  const toggleShowMore = (postId) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const getSnippet = (content) => {
    const maxLength = 250;
    if (content.length > maxLength) {
        return `${content.substring(0, maxLength)}...`
    }
    return content;
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await feedService.deletePost(postId);
        const updatedPosts = posts.filter((post) => post.postId !== postId);
        setPosts(updatedPosts);
        setFilteredPosts(updatedPosts.filter(post => {
          if (!searchQuery.trim()) return true;
          const searchLower = searchQuery.toLowerCase();
          return (
            post.title.toLowerCase().includes(searchLower) ||
            post.content.toLowerCase().includes(searchLower) ||
            post.specialty.toLowerCase().includes(searchLower) ||
            post.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
          );
        }));
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <DoctorPostsPageContainer>
      <EnhancedDoctorPostsContainer>
        <PageHeader>
          <DoctorPostsTitle>Your Medical Posts</DoctorPostsTitle>
          <SearchContainer>
            <SearchLabel htmlFor="search-posts">Search Your Posts</SearchLabel>
            <SearchInput
              id="search-posts"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by title, content, specialty, or keywords..."
            />
            <SearchIcon />
          </SearchContainer>
        </PageHeader>
        
        {searchQuery && (
          <SearchStats>
            {filteredPosts.length === 0 ? (
              `No posts found for "${searchQuery}"`
            ) : filteredPosts.length === 1 ? (
              `Found 1 post matching "${searchQuery}"`
            ) : (
              `Found ${filteredPosts.length} posts matching "${searchQuery}"`
            )}
          </SearchStats>
        )}
        
        {filteredPosts && filteredPosts.length > 0 ? (
          filteredPosts.map((post) => {
            const isExpanded = expandedPosts.has(post.postId);
            const shouldShowButton = post.content.length > 250;
            
            return (
              <EnhancedPostContainer key={post.postId}>
                <PostMetadata>
                  <SpecialtyTag>{post.specialty}</SpecialtyTag>
                  <KeywordsContainer>
                    {post.keywords.map((keyword, index) => (
                      <KeywordTag key={index}>{keyword}</KeywordTag>
                    ))}
                  </KeywordsContainer>
                </PostMetadata>
                
                <PostHeaderSection>
                  <PostTitleSection>
                    <PostTitle>{post.title}</PostTitle>
                  </PostTitleSection>
                  <PostActionsSection>
                    <ViewPostButton onClick={() => handleViewPost(post.postId)}>
                      <FaEye /> View
                    </ViewPostButton>
                    <EnhancedEditButton onClick={() => handleEditPost(post.postId)}>
                      <FaEdit /> Edit
                    </EnhancedEditButton>
                    <EnhancedDeleteButton onClick={() => handleDeletePost(post.postId)}>
                      <FaTrashAlt /> Delete
                    </EnhancedDeleteButton>
                  </PostActionsSection>
                </PostHeaderSection>
                
                <PostContent 
                  dangerouslySetInnerHTML={{ 
                    __html: isExpanded ? post.content : getSnippet(post.content) 
                  }} 
                />
                
                {shouldShowButton && (
                  <ActionButtonContainer>
                    <ShowMoreButton onClick={() => toggleShowMore(post.postId)}>
                      {isExpanded ? (
                        <>
                          Show Less <FaChevronUp />
                        </>
                      ) : (
                        <>
                          Show More <FaChevronDown />
                        </>
                      )}
                    </ShowMoreButton>
                  </ActionButtonContainer>
                )}
                
                <PostStatsSection>
                  <LikesCount>{post.likesCount} Likes</LikesCount>
                  <CommentsCount>{post.commentsCount} Comments</CommentsCount>
                </PostStatsSection>
              </EnhancedPostContainer>
            );
          })
        ) : (
          <EnhancedPostContainer>
            <PostContent style={{ textAlign: 'center', padding: '60px 28px', color: '#64748b' }}>
              {searchQuery ? (
                <>
                  <h3>No posts found</h3>
                  <p>No posts match your search for "{searchQuery}". Try different keywords or clear the search to see all posts.</p>
                </>
              ) : (
                <>
                  <h3>No posts yet</h3>
                  <p>You haven't created any posts yet. Start sharing your medical knowledge!</p>
                </>
              )}
            </PostContent>
          </EnhancedPostContainer>
        )}
      </EnhancedDoctorPostsContainer>
    </DoctorPostsPageContainer>
  );
};

export default DoctorPosts;
