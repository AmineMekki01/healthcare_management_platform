import React, { useState, useContext, useEffect } from 'react';
import BlogPost from './../components/FeedBlog/BlogPost';
import axios from './../components/axiosConfig';
import styled from 'styled-components';
import { AuthContext } from './../components/Auth/AuthContext';
import Select from 'react-select';
import { FaSearch, FaFilter } from 'react-icons/fa';

const PageContainer = styled.div`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  padding: 60px 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const FeedContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const FeedHeader = styled.div`
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

const FeedTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 32px;
  text-align: center;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 3px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    border-radius: 2px;
  }
`;

const SearchFilterContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  align-items: end;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const SearchContainer = styled.div`
  position: relative;
`;

const SearchLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #34495e;
  font-size: 15px;
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

const FilterContainer = styled.div`
  position: relative;
  z-index: 100;
`;

const FilterLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #34495e;
  font-size: 15px;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SpecialtySelect = styled(Select)`
  .react-select__control {
    border: 2px solid #e8ecf0;
    border-radius: 12px;
    box-shadow: none;
    min-height: 56px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      border-color: #cbd5e0;
      transform: translateY(-1px);
    }
  }
  
  .react-select__control--is-focused {
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
  }
  
  .react-select__value-container {
    padding: 8px 20px;
  }
  
  .react-select__menu {
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border: 1px solid #e8ecf0;
    z-index: 9999;
  }
  
  .react-select__option {
    padding: 12px 20px;
    transition: all 0.2s;
  }
  
  .react-select__option--is-focused {
    background: #f7fafc;
    color: #2c3e50;
  }
  
  .react-select__option--is-selected {
    background: #667eea;
  }
`;

const PostsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
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
        <FeedHeader>
          <FeedTitle>Medical Knowledge Feed</FeedTitle>
          <SearchFilterContainer>
            <SearchContainer>
              <SearchLabel htmlFor="search">Search Posts</SearchLabel>
              <SearchInput
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, content, or keywords..."
              />
              <SearchIcon />
            </SearchContainer>
            <FilterContainer>
              <FilterLabel htmlFor="specialty">
                <FaFilter />
                Filter by Specialty
              </FilterLabel>
              <SpecialtySelect
                id="specialty"
                options={specialtyOptions}
                value={specialty}
                onChange={setSpecialty}
                placeholder="All Specialties"
                classNamePrefix="react-select"
                isClearable
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  menu: (base) => ({ ...base, zIndex: 9999 })
                }}
              />
            </FilterContainer>
          </SearchFilterContainer>
        </FeedHeader>
        
        <PostsContainer>
          {posts && posts.map((post) => (
            <BlogPost key={post.post_id} post={post} />
          ))}
        </PostsContainer>
      </FeedContainer>
    </PageContainer>
  );
};

export default Feed;
