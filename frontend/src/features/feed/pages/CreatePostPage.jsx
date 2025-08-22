import React, { useContext, useState } from 'react';
import { AuthContext } from './../../../features/auth/context/AuthContext';
import Select from 'react-select';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import feedService from '../services/feedService';
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
`;

const CreatePostTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 40px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
`;

const Input = styled.input`
  padding: 16px 20px;
  border: 2px solid #e1e8ed;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    background: rgba(255, 255, 255, 1);
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 32px;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const StyledSelect = styled(Select)`
  .react-select__control {
    border: 2px solid #e1e8ed;
    border-radius: 12px;
    padding: 8px 4px;
    background: rgba(255, 255, 255, 0.8);
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #667eea;
    }
    
    &.react-select__control--is-focused {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
`;

const KeywordsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

const KeywordTag = styled.span`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RemoveKeyword = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  
  &:hover {
    opacity: 0.7;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(231, 76, 60, 0.2);
  font-size: 14px;
`;

const CreatePostPage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    specialty: null,
    keywords: []
  });
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const specialtyOptions = [
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'neurology', label: 'Neurology' },
    { value: 'pediatrics', label: 'Pediatrics' },
    { value: 'radiology', label: 'Radiology' },
    { value: 'dermatology', label: 'Dermatology' },
    { value: 'oncology', label: 'Oncology' },
    { value: 'psychiatry', label: 'Psychiatry' },
    { value: 'orthopedics', label: 'Orthopedics' },
    { value: 'general', label: 'General Medicine' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({
      ...prev,
      content
    }));
  };

  const handleSpecialtyChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      specialty: selectedOption
    }));
  };

  const handleAddKeyword = (e) => {
    if (e.key === 'Enter' && currentKeyword.trim()) {
      e.preventDefault();
      if (!formData.keywords.includes(currentKeyword.trim())) {
        setFormData(prev => ({
          ...prev,
          keywords: [...prev.keywords, currentKeyword.trim()]
        }));
      }
      setCurrentKeyword('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(keyword => keyword !== keywordToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.specialty) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        title: formData.title.trim(),
        content: formData.content,
        specialty: formData.specialty.value,
        keywords: formData.keywords
      };

      await feedService.createPost(postData);

      navigate('/feed');
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <CreatePostContainer>
        <CreatePostTitle>Create New Post</CreatePostTitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter your post title..."
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="specialty">Specialty *</Label>
            <StyledSelect
              id="specialty"
              options={specialtyOptions}
              value={formData.specialty}
              onChange={handleSpecialtyChange}
              placeholder="Select a specialty..."
              classNamePrefix="react-select"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="keywords">Keywords (Press Enter to add)</Label>
            <Input
              id="keywords"
              type="text"
              value={currentKeyword}
              onChange={(e) => setCurrentKeyword(e.target.value)}
              onKeyDown={handleAddKeyword}
              placeholder="Add keywords to help others find your post..."
            />
            {formData.keywords.length > 0 && (
              <KeywordsContainer>
                {formData.keywords.map((keyword, index) => (
                  <KeywordTag key={index}>
                    {keyword}
                    <RemoveKeyword
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                    >
                      ×
                    </RemoveKeyword>
                  </KeywordTag>
                ))}
              </KeywordsContainer>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="content">Content *</Label>
            <ReactQuill
              value={formData.content}
              onChange={handleContentChange}
              placeholder="Write your post content here..."
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['link'],
                  ['clean']
                ],
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '12px',
                minHeight: '200px'
              }}
            />
          </FormGroup>

          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Post...' : 'Create Post'}
          </SubmitButton>
        </Form>
      </CreatePostContainer>
    </PageContainer>
  );
};

export default CreatePostPage;
