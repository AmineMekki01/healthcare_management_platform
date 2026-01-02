import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import feedService from '../services/feedService';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from './../../../features/auth/context/AuthContext';

import Select from 'react-select';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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

const StyledSelect = styled(Select)`
  margin-bottom: 15px;

  .react-select__control {
    border: 1px solid #ccc;
    border-radius: 4px;
    min-height: 44px;
  }
`;

const KeywordsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  margin-bottom: 15px;
`;

const KeywordTag = styled.span`
  background: #007bff;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  display: inline-flex;
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
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  margin-bottom: 15px;
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
  const { t: tMedical, i18n: i18nMedical } = useTranslation('medical');
  const { postId } = useParams();
  const { userId, userType } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    specialty: null,
    keywords: [],
  });
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const specialtyOptions = [
    { value: 'cardiology', label: tMedical('specialties.cardiology') },
    { value: 'neurology', label: tMedical('specialties.neurology') },
    { value: 'pediatrics', label: tMedical('specialties.pediatrics') },
    { value: 'radiology', label: tMedical('specialties.radiology') },
    { value: 'dermatology', label: tMedical('specialties.dermatology') },
    { value: 'oncology', label: tMedical('specialties.oncology') },
    { value: 'psychiatry', label: tMedical('specialties.psychiatry') },
    { value: 'orthopedics', label: tMedical('specialties.orthopedics') },
    { value: 'general', label: tMedical('specialties.generalPractice') },
  ];

  useEffect(() => {
    if (!userId || !userType) {
      return;
    }
    const fetchPost = async () => {
      try {
        const response = await feedService.getPost(postId);
        const selectedSpecialty = specialtyOptions.find((opt) => opt.value === response.specialty) || null;
        setFormData({
          title: response.title || '',
          content: response.content || '',
          specialty: selectedSpecialty,
          keywords: Array.isArray(response.keywords) ? response.keywords : [],
        });
      } catch (error) {
        console.error('Error fetching post:', error);
      }
    };

    fetchPost();
  }, [postId, userId, userType, i18nMedical.language]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContentChange = (content) => {
    setFormData((prev) => ({
      ...prev,
      content,
    }));
  };

  const handleSpecialtyChange = (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      specialty: selectedOption,
    }));
  };

  const handleAddKeyword = (e) => {
    if (e.key === 'Enter' && currentKeyword.trim()) {
      e.preventDefault();
      const newKw = currentKeyword.trim();
      if (!formData.keywords.includes(newKw)) {
        setFormData((prev) => ({
          ...prev,
          keywords: [...prev.keywords, newKw],
        }));
      }
      setCurrentKeyword('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keywordToRemove),
    }));
  };

  const handleSave = async () => {
    try {
      setError('');

      if (!formData.title.trim() || !formData.content.trim() || !formData.specialty) {
        setError(t('create.validation.titleRequired'));
        return;
      }

      setIsSubmitting(true);
      await feedService.updatePost(postId, {
        title: formData.title.trim(),
        content: formData.content,
        specialty: formData.specialty.value,
        keywords: formData.keywords,
      });
      navigate('/doctor-posts');
    } catch (error) {
      console.error('Error saving post:', error);
      const editError = t('edit.error');
      setError(editError === 'edit.error' ? t('create.error') : editError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CreatePostContainer>
      <h1>{t('edit.title')}</h1>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <TitleInput
        type="text"
        name="title"
        value={formData.title}
        onChange={handleInputChange}
        placeholder={t('create.titlePlaceholder')}
      />

      <StyledSelect
        options={specialtyOptions}
        value={formData.specialty}
        onChange={handleSpecialtyChange}
        placeholder={t('create.categoryPlaceholder')}
        classNamePrefix="react-select"
      />

      <TitleInput
        type="text"
        value={currentKeyword}
        onChange={(e) => setCurrentKeyword(e.target.value)}
        onKeyDown={handleAddKeyword}
        placeholder={t('create.tagsPlaceholder')}
      />

      {formData.keywords.length > 0 && (
        <KeywordsContainer>
          {formData.keywords.map((keyword, index) => (
            <KeywordTag key={index}>
              {keyword}
              <RemoveKeyword type="button" onClick={() => handleRemoveKeyword(keyword)}>
                ×
              </RemoveKeyword>
            </KeywordTag>
          ))}
        </KeywordsContainer>
      )}

      <ReactQuill
        value={formData.content}
        onChange={handleContentChange}
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
      <SaveButton onClick={handleSave} disabled={isSubmitting}>
        {isSubmitting ? t('edit.updating') : t('edit.update')}
      </SaveButton>
    </CreatePostContainer>
  );
};

export default EditPost;
