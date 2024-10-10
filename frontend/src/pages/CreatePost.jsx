import React, { useContext, useState } from 'react';
import { AuthContext } from './../components/Auth/AuthContext';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from './../components/axiosConfig';
import { useNavigate } from 'react-router-dom';
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

const SubmitButton = styled.button`
  padding: 12px 20px;
  background-color: #007bff;
  color: #fff;
  border: none;
  cursor: pointer;
  margin-top: 15px;
`;

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();
  const {userId} = useContext(AuthContext)

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required.');
      return;
    }

    try {
      await axios.post(
        'http://localhost:3001/api/v1/blog-posts',
        { title, content, userId },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      alert('Post created successfully!');
      navigate('/feed');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('An error occurred while creating the post.');
    }
  };

  return (
    <CreatePostContainer>
      <TitleInput
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter post title"
      />
      <ReactQuill
        value={content}
        onChange={setContent}
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
        placeholder="Compose your post here..."
      />
      <SubmitButton onClick={handleSubmit}>Publish</SubmitButton>
    </CreatePostContainer>
  );
};

export default CreatePost;
