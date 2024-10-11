import React, { useState, useEffect, useContext } from 'react';
import axios from './../axiosConfig';
import { AuthContext } from './../Auth/AuthContext';
import {
  PostContainer,
  PostHeader,
  PostActions,
  PostTitle,
  PostContent,
  PostStats,
  EditButton,
  DeleteButton,
  LikesCount,
  CommentsCount,
  DoctorPostsContainer,
  DoctorPostsTitle,
  PostMetadata,
  SpecialtyTag,
  KeywordTag,
  KeywordsContainer,
  ActionButton
} from './styles';
import { useNavigate } from 'react-router-dom';

const DoctorPosts = () => {
  const { userId } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  
  useEffect(() => {
    console.log("userId before making API call: ", userId);
    
    const fetchDoctorPosts = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/api/v1/doctor/posts/${userId}`);
            console.log("response.data : ", response.data);
            setPosts(response.data.posts);
        } catch (error) {
            console.error('Error fetching doctor posts:', error);
        }
    };

    if (userId) {
        fetchDoctorPosts();
    }
}, [userId]);


  const handleEditPost = (postId) => {
    navigate(`/edit-post/${postId}`);
  };

  const handleShowMore = () => {
      setShowMore(!showMore)
  };

  const getSnippet = (content) => {
    const maxLength = 250;
    if (content.length > maxLength) {
        return `${content.substring(0, maxLength)}...`
    }
    return content;
  };


  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`http://localhost:3001/api/v1/posts/${postId}`);
      setPosts((prevPosts) => prevPosts.filter((post) => post.post_id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <DoctorPostsContainer>
      <DoctorPostsTitle>Your Posts</DoctorPostsTitle>
      {posts && posts.map((post) => (

        <PostContainer key={post.post_id}>
          <PostMetadata>
            <SpecialtyTag>{post.specialty}</SpecialtyTag>
            <KeywordsContainer>
            {post.keywords.map((keyword, index) => (
                <KeywordTag key={index}>{keyword}</KeywordTag>
            ))}
            </KeywordsContainer>
          </PostMetadata>
          <PostHeader>
            <PostTitle>{post.title}</PostTitle>
          </PostHeader>
          <PostContent dangerouslySetInnerHTML={{ __html: showMore ? post.content : getSnippet(post.content) }} />
          <ActionButton onClick={handleShowMore}>
                {showMore ? 'Show Less' : 'Show More'}
          </ActionButton>
          <PostStats>
                    <LikesCount>{post.likes_count} Likes</LikesCount>
                    <CommentsCount>{post.comments_count} Comments</CommentsCount>
                </PostStats>
                
          <PostActions>
            <EditButton onClick={() => handleEditPost(post.post_id)}>Edit</EditButton>
            <DeleteButton onClick={() => handleDeletePost(post.post_id)}>Delete</DeleteButton>
          </PostActions>
        </PostContainer>
      ))}
    </DoctorPostsContainer>
  );
};

export default DoctorPosts;
