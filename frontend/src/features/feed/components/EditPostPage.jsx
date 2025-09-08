import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import feedService from '../services/feedService';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from './../../../features/auth/context/AuthContext';

import ReactQuill from 'react-quill';

import styled from 'styled-components';

const CreatePostContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const TitleInput = styled.input`
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  font-size: 1.2em;
`;

const SaveButton = styled.button`
  padding: 12px 20px;
  background-color: #007bff;
  color: #fff;
  border: none;
  cursor: pointer;
  margin-top: 15px;
`;

const EditPost = () => {
  const { t } = useTranslation('feed');
  const { postId } = useParams();
  const { userId, userType } = useContext(AuthContext);
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId && userType) {
      return;
    }
    const fetchPost = async () => {
      try {
        const response = await feedService.getPost(postId);
        setPostTitle(response.title);
        setPostContent(response.content);
      } catch (error) {
        console.error('Error fetching post:', error);
      }
    };

    fetchPost();
  }, [postId, userId, userType]);

  const handleSave = async () => {
    try {
      await feedService.updatePost(postId, {
        title: postTitle,
        content: postContent,
      });
      navigate('/doctor-posts');
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  return (
    <CreatePostContainer>
      <h1>{t('edit.title')}</h1>
      <TitleInput
        type="text"
        value={postTitle}
        onChange={(e) => setPostTitle(e.target.value)}
        placeholder={t('create.titlePlaceholder')}
      />
      <ReactQuill
        value={postContent}
        onChange={setPostContent}
        modules={{
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean'],
          ],
        }}
        formats={[
          'header',
          'bold',
          'italic',
          'underline',
          'strike',
          'list',
          'bullet',
          'link',
          'image',
        ]}
        placeholder={t('create.contentPlaceholder')}
      />
      <SaveButton onClick={handleSave}>{t('edit.update')}</SaveButton>
    </CreatePostContainer>
  );
};

export default EditPost;
