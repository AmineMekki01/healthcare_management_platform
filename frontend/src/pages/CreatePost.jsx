import React, { useContext, useState } from 'react';
import { AuthContext } from './../components/Auth/AuthContext';
import Select from 'react-select';
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

const SpecialtySelect = styled(Select)`
  margin-bottom: 15px;
`;

const KeywordsInput = styled.input`
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  font-size: 1em;
  border: 1px solid #ccc;
`;


const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [specialty, setSpecialty] = useState(null);
  const [keywords, setKeywords] = useState('');
  const navigate = useNavigate();
  const {userId} = useContext(AuthContext)

  const specialtyOptions = [
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'neurology', label: 'Neurology' },
    { value: 'pediatrics', label: 'Pediatrics' },
    { value: 'radiology', label: 'Radiology' },
  ];

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !specialty || !keywords.trim()) {
      alert('Title and content are required.');
      return;
    }

    try {
      await axios.post(
        'http://localhost:3001/api/v1/blog-posts',
        { 
          title, 
          content, 
          userId, 
          specialty: specialty.value,
          keywords: keywords.split(',').map(k => k.trim())
        },
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
      <SpecialtySelect
        options={specialtyOptions}
        value={specialty}
        onChange={setSpecialty}
        placeholder="Select specialty"
      />
      <KeywordsInput
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        placeholder="Enter keywords (comma-separated)"
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
