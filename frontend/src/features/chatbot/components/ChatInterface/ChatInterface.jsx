import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../../../auth/context/AuthContext';
import remarkGfm from 'remark-gfm';
import { ChatInterfaceContainer, ChatInterfaceMessages, ChatInterfaceMessageLlm, ChatInterfaceMessageUser, ChatInterfaceInput, ChatInterfaceSubmitButton, ChatInterfaceForm, FileUploadButton, FileUploadContainer, FilesUploadTitle, ChatInputContainer, FileUpload, Header, BackButton, ChatTitle} from './ChatInterface.styles';
import ReactMarkdown from 'react-markdown';
import DocumentList from '../DocumentUpload/DocumentList';
import FileUploadComponent from '../DocumentUpload/FileUpload';
import { PatientMention } from '../PatientMention';

const ChatInterface = ({ onFileSelect, documents, chatId, toggleChatHistory, isSmallScreen }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [mentionedPatients, setMentionedPatients] = useState(new Map());
  const [cursorPosition, setCursorPosition] = useState(0);
  const [chats, setChats] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [files, setFiles] = useState([]);
  const fileUploadRef = useRef();
  const inputRef = useRef();

  const { userId, userRole } = useContext(AuthContext);

  const updateChatHistory = (chatId, lastMessageDate) => {
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat.id === chatId) {
          return { ...chat, last_message_date: lastMessageDate };
        }
        return chat;
      });
      return updatedChats.sort((a, b) => new Date(b.last_message_date) - new Date(a.last_message_date));
    });
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/v1/chatbot/message/${messageId}?user_id=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
      } else {
        const error = await response.json();
        alert(`Failed to delete message: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };
  const handleInputChange = (event) => {
    const newValue = event.target.value;
    const newCursorPos = event.target.selectionStart;
    
    console.log("ChatInterface handleInputChange:", { newValue, newCursorPos });
    
    setUserInput(newValue);
    setCursorPosition(newCursorPos);
  };

  const handlePatientSelect = (patient, newValue, newCursorPos) => {
    setUserInput(newValue);
    setMentionedPatients(prev => {
      const updated = new Map(prev);
      updated.set(patient.full_name, patient);
      return updated;
    });
    
    if (inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => {
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const extractMentionedPatients = (message) => {
    const mentions = [];
    
    for (const [patientName, patientData] of mentionedPatients.entries()) {
      const mentionPattern = new RegExp(`@${patientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`, 'g');
      if (mentionPattern.test(message)) {
        mentions.push(patientData);
      }
    }
    
    return mentions;
  };
    
  const chat_id = chatId;

  const handleSelectDocument = (document) => {
    setSelectedDocument(document);
  };

  const handleFileSelect = (selectedFiles) => {
    setFiles(selectedFiles);
    onFileSelect(selectedFiles);
  };

  useEffect(() => {
    setFiles([]);
    if (fileUploadRef.current) {
      fileUploadRef.current.clearFiles();
    }
  }, [chatId]);



  const handleSendMessage = async (event) => {
    console.log("handleSendMessage");
    console.log("userInput", userInput);
    console.log("chatId", chatId);
    console.log("userId", userId);
    event.preventDefault();
    if (!userInput.trim()) return;

    if (!userId || userId === 'null' || userId === null || userId === undefined) {
      alert('Please log in to send messages');
      return;
    }

    const mentionedPatientsList = extractMentionedPatients(userInput);
    const patientId = mentionedPatientsList.length > 0 ? mentionedPatientsList[0].patient_id : null;
  
    const userMessage = { agent_role: 'user', user_message: userInput };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    const originalInput = userInput;
    setUserInput('');

    try {
      const endpoint = 'http://localhost:8000/v1/chatbot/agent-response';
      const requestBody = {
        user_message: originalInput,
        user_id: userId,
        chat_id: chat_id,
        ...(patientId && { patient_id: patientId })
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      if (response.ok) {
        const data = await response.json();
        const now = new Date().toISOString();
        setMessages(prevMessages => [
          ...prevMessages.filter(msg => msg.user_message !== originalInput), 
          userMessage,
          { agent_role: 'assistant', answer: data.answer }
        ]);
        
        updateChatHistory(chat_id, now);
        
      } else {
        console.error('Failed to get the answer');
      }
    } catch (error) {
      console.error('Error during chat interaction:', error);
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (chatId && userId && userId !== 'null' && userId !== null && userId !== undefined) {
        try {
          const response = await fetch(`http://localhost:8000/v1/chatbot/${chatId}/messages`);
          if (response.ok) {
            const messagesData = await response.json();
            setMessages(messagesData);
          } else {
            console.error('Failed to fetch messages - Response not ok:', response.status);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      } else {
        setMessages([]);
      }
    };

    fetchMessages();
  }, [chatId, userId]);
  
  return (
    <ChatInterfaceContainer>
      {isSmallScreen && (
        <Header>
          <BackButton onClick={toggleChatHistory}>
            &#8592;
          </BackButton>
          <ChatTitle>Chat</ChatTitle>
        </Header>
      )}
      <FileUploadContainer>
        <FilesUploadTitle>Documents</FilesUploadTitle>
        <DocumentList documents={documents} onSelectDocument={handleSelectDocument} />
        <div style={{ marginTop: '12px' }}>
          <FileUploadComponent ref={fileUploadRef} onFileSelect={handleFileSelect} />
        </div>
      </FileUploadContainer>
      <ChatInterfaceMessages>
        {messages.map((msg, index) => (
          <div key={index} style={{ position: 'relative', marginBottom: '16px' }}>
            {msg.user_message && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <ChatInterfaceMessageUser style={{ flex: 1 }}>
                  {msg.user_message}
                </ChatInterfaceMessageUser>
                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.8)',
                    border: 'none',
                    color: 'white',
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '4px',
                    opacity: 0.7,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.target.style.opacity = '1'; e.target.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={(e) => { e.target.style.opacity = '0.7'; e.target.style.transform = 'scale(1)'; }}
                  title="Delete message"
                >
                  ×
                </button>
              </div>
            )}
            {msg.answer && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <ChatInterfaceMessageLlm style={{ flex: 1 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.answer}
                 </ReactMarkdown>
                </ChatInterfaceMessageLlm>
                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.8)',
                    border: 'none',
                    color: 'white',
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '4px',
                    opacity: 0.7,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.target.style.opacity = '1'; e.target.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={(e) => { e.target.style.opacity = '0.7'; e.target.style.transform = 'scale(1)'; }}
                  title="Delete message"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </ChatInterfaceMessages>

      
      <ChatInputContainer>
        <ChatInterfaceForm onSubmit={handleSendMessage}>
          <ChatInterfaceInput
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            onSelect={(e) => setCursorPosition(e.target.selectionStart)}
            placeholder="Type your message... Use @patient_name to mention patients"
          />
          <ChatInterfaceSubmitButton type="submit">
            <span className='span1'>→</span>
          </ChatInterfaceSubmitButton>
        </ChatInterfaceForm>
        <PatientMention
          inputValue={userInput}
          cursorPosition={cursorPosition}
          onPatientSelect={handlePatientSelect}
          onClose={() => {}}
          inputRef={inputRef}
        />
      </ChatInputContainer>
      
    </ChatInterfaceContainer>
  );
};

export default ChatInterface;
