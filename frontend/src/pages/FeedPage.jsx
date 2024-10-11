import React, { useState, useContext, useEffect } from 'react';
import BlogPost from './../components/FeedBlog/BlogPost';
import axios from './../components/axiosConfig';
import styled from 'styled-components';
import { AuthContext } from './../components/Auth/AuthContext';
import Select from 'react-select';

const FeedContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  font-size: 1em;
`;

const SpecialtySelect = styled(Select)`
  margin-bottom: 15px;
`;


const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [specialty, setSpecialty] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const {userId, userType} = useContext(AuthContext)

  const specialtyOptions = [
    { value: '', label: 'All Specialties' },
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'neurology', label: 'Neurology' },
    { value: 'pediatrics', label: 'Pediatrics' },
    { value: 'radiology', label: 'Radiology' },

  ];
  useEffect(() => {
    fetchFeed();
  }, [userId, userType, specialty, searchQuery]);

  const fetchFeed = async () => {
    if (!userId || !userType) return;

    try {
      const response = await axios.get('http://localhost:3001/api/v1/feed', {
        params: { 
          userId, 
          userType,
          specialty: specialty ? specialty.value : '',
          search: searchQuery
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching the feed:', error);
    }
  };


  return (
    <FeedContainer>
      <SearchInput
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search posts..."
      />
      <SpecialtySelect
        options={specialtyOptions}
        value={specialty}
        onChange={setSpecialty}
        placeholder="Filter by specialty"
      />
      {posts && posts.map((post) => (
        <BlogPost key={post.post_id} post={post} />
      ))}
    </FeedContainer>
  );
};

export default Feed;
