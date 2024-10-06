import React, { useState, useContext, useEffect } from 'react';
import BlogPost from './../components/FeedBlog/BlogPost';
import axios from 'axios';
import styled from 'styled-components';
import { AuthContext } from './../components/Auth/AuthContext';

const FeedContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const {userId, userType} = useContext(AuthContext)

  useEffect(() => {

    if (!userId && !userType) {
      return
    }
    console.log("userId : ", userId)
    console.log("userType : ", userType)

    const fetchFeed = async () => {
        try {
          const response = await axios.get('http://localhost:3001/api/v1/feed', {
            params: { userId, userType },
          });
          console.log('response.data:', response.data);
          
          setPosts(response.data.posts);
        } catch (error) {
          console.error('Error fetching the feed:', error);
        }
      };

    fetchFeed();
  }, [userId, userType]);

  return (
    <FeedContainer>

      {posts && posts.map((post) => (
        <BlogPost key={post.post_id} post={post} />
      ))}
    </FeedContainer>
  );
};

export default Feed;
