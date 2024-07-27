import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './../components/Auth/AuthContext';
import ChatInterface from './../components/Chatbot/ChatInterface/ChatInterface';
import {FileContainer, Container, ChatContainer} from './styles/ChatbotStyles';
import ChatHistory from './../components/Chatbot/ChatsMessages/ChatHistory'; 
import {useNavigate} from 'react-router-dom';



function ChatbotChat() {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  const { doctorId, patientId, userType } = useContext(AuthContext);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const navigate = useNavigate();
  const DOCUMENTS_API = 'http://localhost:8000/v1/documents';

  let userId = userType === 'doctor' ? doctorId : patientId;
  console.log('userId', userId);

  const handleFileSelect = async (files) => {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    
    formData.append('userId', userId);
    try {
      const response = await axios.post('http://localhost:8000/v1/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });
      const uploadedFileInfo = response.data.files_names;
      setDocuments([...documents, uploadedFileInfo]);
    } catch (error) {
      setError('There was an error uploading the file!');
      console.error('There was an error!', error);
    }
    console.log(formData)
  };


  if (error) {
    return <div>Error: {error}</div>;
  }

  const handleChatSelect = (chatId) => {
    setCurrentChatId(chatId);
    setShowChatInterface(true);
  };

  return (   
    <Container className="app">
      <FileContainer className="App-content">
        <ChatHistory 
        onChatSelect={handleChatSelect}
        />
        {showChatInterface && (
            <ChatContainer>
              <ChatInterface chatId={currentChatId} onFileSelect={handleFileSelect} documents={documents} />
            </ChatContainer>
          )}
      </FileContainer>
    </Container>
  );
}

export default ChatbotChat;