import React, { useContext, useState } from 'react';
import { AuthContext } from './../components/Auth/AuthContext';
import Select from 'react-select';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from './../components/axiosConfig';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const PageContainer = styled.div`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  padding: 60px 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const CreatePostContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 50px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
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

  @media (max-width: 768px) {
    padding: 30px;
  }

  @media (max-width: 480px) {
    padding: 20px;
  }
`;

const FormTitle = styled.h2`
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 40px;
  text-align: center;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    border-radius: 2px;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 32px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 12px;
  font-weight: 600;
  color: #34495e;
  font-size: 15px;
  letter-spacing: 0.5px;
`;

const TitleInput = styled.input`
  width: 100%;
  padding: 16px 20px;
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

const KeywordsInput = styled(TitleInput)``;

const StyledReactQuill = styled(ReactQuill)`
  .ql-container {
    min-height: 250px;
    font-size: 16px;
    border-radius: 0 0 12px 12px;
    border: 2px solid #e8ecf0;
    border-top: none;
  }
  
  .ql-toolbar {
    border-radius: 12px 12px 0 0;
    border: 2px solid #e8ecf0;
    border-bottom: none;
    background: #f8fafc;
  }
  
  &:focus-within .ql-container,
  &:focus-within .ql-toolbar {
    border-color: #667eea;
  }
  
  .ql-editor {
    line-height: 1.7;
    color: #2c3e50;
  }
  
  .ql-editor::before {
    color: #a0aec0;
    font-style: normal;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 16px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.5px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Enhanced Submit Button with loading state
const EnhancedSubmitButton = styled(SubmitButton)`
  position: relative;
  overflow: hidden;
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [specialty, setSpecialty] = useState(null);
  const [keywords, setKeywords] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { userId } = useContext(AuthContext);

  const specialtyOptions = [
    { value: 'cardiology', label: '❤️ Cardiology' },
    { value: 'neurology', label: '🧠 Neurology' },
    { value: 'pediatrics', label: '👶 Pediatrics' },
    { value: 'radiology', label: '🔬 Radiology' },
    { value: 'oncology', label: '🎗️ Oncology' },
    { value: 'dermatology', label: '🧴 Dermatology' },
    { value: 'orthopedics', label: '🦴 Orthopedics' },
    { value: 'psychiatry', label: '🧘 Psychiatry' },
  ];

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !specialty || !keywords.trim()) {
      alert('All fields are required.');
      return;
    }

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
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
        <EnhancedSubmitButton onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Publishing...' : 'Publish Post'}
        </EnhancedSubmitButton>
      </CreatePostContainer>
    </PageContainer>
  );
};

export default CreatePost;
