import React from 'react';
import {FaFilter } from 'react-icons/fa';
import BlogPost from '../components/BlogPost';
import { useFeed } from '../hooks/useFeed';
import {
  PageContainer,
  FeedContainer,
  FeedHeader,
  FeedTitle,
  SearchFilterContainer,
  SearchContainer,
  SearchLabel,
  SearchInput,
  SearchIcon,
  FilterContainer,
  FilterLabel,
  SpecialtySelect,
  PostsContainer,
  LoadingSpinner,
  ErrorMessage,
  NoPostsMessage
} from '../styles/styles';

const FeedPage = () => {
  const {
    posts,
    loading,
    error,
    specialty,
    setSpecialty,
    searchQuery,
    setSearchQuery,
    specialtyOptions
  } = useFeed();

  if (error) {
    return (
      <PageContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </PageContainer>
    );
  }

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
        
        {loading ? (
          <LoadingSpinner>Loading posts...</LoadingSpinner>
        ) : (
          <PostsContainer>
            {posts && posts.length > 0 ? (
              posts.map((post) => (
                <BlogPost key={post.postId} post={post} />
              ))
            ) : (
              <NoPostsMessage>No posts found</NoPostsMessage>
            )}
          </PostsContainer>
        )}
      </FeedContainer>
    </PageContainer>
  );
};

export default FeedPage;
