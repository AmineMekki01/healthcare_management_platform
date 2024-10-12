import React, { useState, useContext, useEffect } from 'react';
import BlogPost from './../components/FeedBlog/BlogPost';
import axios from './../components/axiosConfig';
import styled from 'styled-components';
import { AuthContext } from './../components/Auth/AuthContext';
import Select from 'react-select';
import { FaSearch } from 'react-icons/fa';


const PageContainer = styled.div`
  background-color: #f0f2f5;
  min-height: 100vh;
  padding: 40px 0;
`;

const FeedContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 40px 12px 12px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  outline: none;
  transition: all 0.3s;

  &:focus {
    border-color: #4a90e2;
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
  }
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #888;
`;

const SpecialtySelect = styled(Select)`
  margin-bottom: 20px;

  .react-select__control {
    border-radius: 24px;
    border: 1px solid #ddd;
    box-shadow: none;
  }

  .react-select__control:hover {
    border-color: #4a90e2;
  }

  .react-select__control--is-focused {
    border-color: #4a90e2;
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
  }

  .react-select__menu {
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
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
    <PageContainer>
      <FeedContainer>
        <SearchContainer>
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
          />
          <SearchIcon />
        </SearchContainer>
        <SpecialtySelect
          options={specialtyOptions}
          value={specialty}
          onChange={setSpecialty}
          placeholder="Filter by specialty"
          classNamePrefix="react-select"
        />
        {posts && posts.map((post) => (
          <BlogPost key={post.post_id} post={post} />
        ))}
      </FeedContainer>
    </PageContainer>
  );
};

export default Feed;
