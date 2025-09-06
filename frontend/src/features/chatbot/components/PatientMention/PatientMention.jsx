import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../../auth/context/AuthContext';
import { MentionItem, MentionName, MentionDetails, MentionHighlight } from './PatientMention.styles';

const PatientMention = ({ 
  inputValue, 
  cursorPosition, 
  onPatientSelect, 
  onClose,
  inputRef 
}) => {
  const { t } = useTranslation('chatbot');
  const [patients, setPatients] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const dropdownRef = useRef();
  const { userId } = useContext(AuthContext);

  useEffect(() => {
    
    if (inputRef.current && inputValue) {
      const beforeCursor = inputValue.substring(0, cursorPosition);
      const atIndex = beforeCursor.lastIndexOf('@');
      
      
      if (atIndex !== -1) {
        const textAfterAt = beforeCursor.substring(atIndex + 1);
        
        const nameMatch = textAfterAt.match(/^([A-Za-z]+(?:\s+[A-Za-z]+)*)/);
        const searchTerm = nameMatch ? nameMatch[1] : textAfterAt;
        
        setSearchTerm(searchTerm);
        setIsVisible(true);
        
      } else {
        setIsVisible(false);
      }
    } else {
      setIsVisible(false);
    }
  }, [inputValue, cursorPosition, inputRef]);

  const searchPatients = useCallback(async (term) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/chatbot/patients/search/${userId}?search=${encodeURIComponent(term)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setPatients([]);
    }
  }, [userId]);

  useEffect(() => {
    if (searchTerm.length > 0) {
      searchPatients(searchTerm);
    } else {
      setPatients([]);
    }
  }, [searchTerm, searchPatients]);

  const handlePatientSelect = useCallback((patient) => {
    const beforeCursor = inputValue.substring(0, cursorPosition);
    const afterCursor = inputValue.substring(cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const beforeMention = beforeCursor.substring(0, mentionMatch.index);
      const patientMention = `@${patient.full_name}`;
      const newValue = beforeMention + patientMention + ' ' + afterCursor;
      const newCursorPos = beforeMention.length + patientMention.length + 1;
      
      onPatientSelect(patient, newValue, newCursorPos);
      setIsVisible(false);
    }
  }, [inputValue, cursorPosition, onPatientSelect]);

  const handleKeyDown = useCallback((e) => {
    if (!isVisible || patients.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < patients.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && patients[selectedIndex]) {
          handlePatientSelect(patients[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsVisible(false);
        break;
      default:
        break;
    }
  }, [isVisible, patients, selectedIndex, handlePatientSelect]);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      const currentInput = inputRef.current;
      currentInput.addEventListener('keydown', handleKeyDown);
      return () => {
        currentInput.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isVisible, handleKeyDown, inputRef]);

  const highlightMatch = (text, term) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? <MentionHighlight key={index}>{part}</MentionHighlight> : part
    );
  };

  if (!isVisible || patients.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: -105,
        left: 0,
        zIndex: 999999,
        background: 'white',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        maxHeight: '200px',
        overflowY: 'auto',
        minWidth: '280px'
      }}
      ref={dropdownRef}
    >
      {patients.map((patient, index) => (
        <MentionItem
          key={patient.patient_id}
          isSelected={index === selectedIndex}
          onClick={() => handlePatientSelect(patient)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <MentionName>
            {highlightMatch(patient.full_name, searchTerm)}
          </MentionName>
          <MentionDetails>
            {patient.age && `${t('patientMention.age')}: ${patient.age}`}
            {patient.age && patient.sex && ' • '}
            {patient.sex && `${t('patientMention.sex')}: ${patient.sex}`}
          </MentionDetails>
        </MentionItem>
      ))}
    </div>
  );
};

export default PatientMention;
