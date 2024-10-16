import React, { useState, useEffect, useContext } from 'react';
import axios from '../axiosConfig';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../Auth/AuthContext';

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
        const response = await axios.get(`http://localhost:3001/api/v1/feed/posts/${postId}`, {
          params: { userId, userType },
        });
        setPostTitle(response.data.title);
        setPostContent(response.data.content);
      } catch (error) {
        console.error('Error fetching post:', error);
      }
    };

    fetchPost();
  }, [postId, userId, userType]);

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:3001/api/v1/posts/${postId}/edit`, {
        title: postTitle,
        content: postContent,
      }, {
        params: { userId, userType },
      });
      navigate('/doctor-posts');
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  return (
    <CreatePostContainer>
      <h1>Edit Post</h1>
      <TitleInput
        type="text"
        value={postTitle}
        onChange={(e) => setPostTitle(e.target.value)}
        placeholder="Post Title"
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
        placeholder="Post Content"
      />
      <SaveButton onClick={handleSave}>Save Changes</SaveButton>
    </CreatePostContainer>
  );
};

export default EditPost;
