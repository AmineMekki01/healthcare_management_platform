import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../../auth/context/AuthContext';
import { MentionItem, MentionName, MentionDetails, MentionHighlight } from './PatientMention.styles';

const PatientMention = ({ 
  inputValue, 
  cursorPosition, 
  onPatientSelect, 
  onClose,
  inputRef 
}) => {
  const [patients, setPatients] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef();
  const { userId } = useContext(AuthContext);

  useEffect(() => {
    console.log("PatientMention useEffect triggered:", { inputValue, cursorPosition });
    
    if (inputRef.current && inputValue) {
      const beforeCursor = inputValue.substring(0, cursorPosition);
      const atIndex = beforeCursor.lastIndexOf('@');
      
      console.log("Checking for @ mention:", { beforeCursor, atIndex });
      
      if (atIndex !== -1) {
        const textAfterAt = beforeCursor.substring(atIndex + 1);
        console.log("Found @ mention, text after @:", textAfterAt);
        
        const nameMatch = textAfterAt.match(/^([A-Za-z]+(?:\s+[A-Za-z]+)*)/);
        const searchTerm = nameMatch ? nameMatch[1] : textAfterAt;
        
        setSearchTerm(searchTerm);
        setIsVisible(true);
        
        const rect = inputRef.current.getBoundingClientRect();
        const textBeforeMention = beforeCursor.substring(0, atIndex);
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const computedStyle = window.getComputedStyle(inputRef.current);
        context.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
        const textWidth = context.measureText(textBeforeMention).width;
        
        const newPosition = {
          top: rect.top + window.scrollY - 210,
          left: rect.left + window.scrollX + textWidth
        };
        
        console.log("Setting position:", newPosition);
        setPosition(newPosition);
      } else {
        console.log("No @ found, hiding dropdown");
        setIsVisible(false);
      }
    } else {
      console.log("No input value, hiding dropdown");
      setIsVisible(false);
    }
  }, [inputValue, cursorPosition, inputRef]);

  useEffect(() => {
    if (searchTerm !== undefined && userId) {
      searchPatients(searchTerm);
    }
  }, [searchTerm, userId]);

  const searchPatients = async (term) => {
    try {
      const response = await fetch(`http://localhost:8000/v1/chatbot/patients/search/${userId}?search=${encodeURIComponent(term)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        console.log("patient search data", data);
        console.log("setting patients:", data.patients || []);
        setPatients(data.patients || []);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setPatients([]);
    }
  };

  const handlePatientSelect = (patient) => {
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
  };

  const handleKeyDown = (e) => {
    if (!isVisible || patients.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % patients.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + patients.length) % patients.length);
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (patients[selectedIndex]) {
          handlePatientSelect(patients[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsVisible(false);
        onClose();
        break;
    }
  };

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.addEventListener('keydown', handleKeyDown);
      return () => {
        if (inputRef.current) {
          inputRef.current.removeEventListener('keydown', handleKeyDown);
        }
      };
    }
  }, [isVisible, patients, selectedIndex]);

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
            {patient.age && `Age: ${patient.age}`}
            {patient.age && patient.sex && ' • '}
            {patient.sex && `Sex: ${patient.sex}`}
          </MentionDetails>
        </MentionItem>
      ))}
    </div>
  );
};

export default PatientMention;
