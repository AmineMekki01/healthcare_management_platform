import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('feed');
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
        <ErrorMessage>{t('error.message', { error })}</ErrorMessage>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <FeedContainer>
        <FeedHeader>
          <FeedTitle>{t('title')}</FeedTitle>
          <SearchFilterContainer>
            <SearchContainer>
              <SearchLabel htmlFor="search">{t('search.label')}</SearchLabel>
              <SearchInput
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search.placeholder')}
              />
              <SearchIcon />
            </SearchContainer>
            <FilterContainer>
              <FilterLabel htmlFor="specialty">
                <FaFilter />
                {t('filter.label')}
              </FilterLabel>
              <SpecialtySelect
                id="specialty"
                options={specialtyOptions}
                value={specialty}
                onChange={setSpecialty}
                placeholder={t('filter.placeholder')}
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
          <LoadingSpinner>{t('loading')}</LoadingSpinner>
        ) : (
          <PostsContainer>
            {posts && posts.length > 0 ? (
              posts.map((post) => (
                <BlogPost key={post.postId} post={post} />
              ))
            ) : (
              <NoPostsMessage>{t('noPosts')}</NoPostsMessage>
            )}
          </PostsContainer>
        )}
      </FeedContainer>
    </PageContainer>
  );
};

export default FeedPage;
