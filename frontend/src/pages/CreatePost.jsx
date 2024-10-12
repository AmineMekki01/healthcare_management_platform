import React, { useContext, useState } from 'react';
import { AuthContext } from './../components/Auth/AuthContext';
import Select from 'react-select';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from './../components/axiosConfig';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const PageContainer = styled.div`
  background-color: #f0f2f5;
  min-height: 100vh;
  padding: 40px 0;
`;

const CreatePostContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 30px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled.h2`
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #444;
`;

const TitleInput = styled.input`
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: border-color 0.3s;

  &:focus {
    border-color: #4a90e2;
    outline: none;
  }
`;

const SpecialtySelect = styled(Select)`
  .react-select__control {
    border-color: #ddd;
    box-shadow: none;
    &:hover {
      border-color: #4a90e2;
    }
  }
  .react-select__control--is-focused {
    border-color: #4a90e2;
    box-shadow: 0 0 0 1px #4a90e2;
  }
`;

const KeywordsInput = styled(TitleInput)``;

const StyledReactQuill = styled(ReactQuill)`
  .ql-container {
    min-height: 200px;
    font-size: 16px;
  }
`;

const SubmitButton = styled.button`
  padding: 12px 20px;
  background-color: #4a90e2;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #3a7bc8;
  }
`;

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [specialty, setSpecialty] = useState(null);
  const [keywords, setKeywords] = useState('');
  const navigate = useNavigate();
  const { userId } = useContext(AuthContext);

  const specialtyOptions = [
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'neurology', label: 'Neurology' },
    { value: 'pediatrics', label: 'Pediatrics' },
    { value: 'radiology', label: 'Radiology' },
  ];

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !specialty || !keywords.trim()) {
      alert('All fields are required.');
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
    <PageContainer>
      <CreatePostContainer>
        <FormTitle>Create a New Post</FormTitle>
        <InputGroup>
          <Label htmlFor="title">Title</Label>
          <TitleInput
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title"
          />
        </InputGroup>
        <InputGroup>
          <Label htmlFor="specialty">Specialty</Label>
          <SpecialtySelect
            id="specialty"
            options={specialtyOptions}
            value={specialty}
            onChange={setSpecialty}
            placeholder="Select specialty"
            classNamePrefix="react-select"
          />
        </InputGroup>
        <InputGroup>
          <Label htmlFor="keywords">Keywords</Label>
          <KeywordsInput
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Enter keywords (comma-separated)"
          />
        </InputGroup>
        <InputGroup>
          <Label htmlFor="content">Content</Label>
          <StyledReactQuill
            id="content"
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
        </InputGroup>
        <SubmitButton onClick={handleSubmit}>Publish Post</SubmitButton>
      </CreatePostContainer>
    </PageContainer>
  );
};

export default CreatePost;
