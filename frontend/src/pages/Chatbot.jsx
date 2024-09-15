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
  const [chats, setChats] = useState([]);

  let userId = userType === 'doctor' ? doctorId : patientId;

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

  const handleFileSelect = async (files) => {
    const formData = new FormData();
  
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
  
    formData.append('user_id', userId);
    formData.append('chat_id', currentChatId);
  
    try {
      const response = await axios.post('http://localhost:8000/v1/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });
      const uploadedFileInfo = response.data.files_names;
  
      const newFiles = Array.isArray(uploadedFileInfo) ? uploadedFileInfo : [uploadedFileInfo];
  
      setDocuments(prevDocuments => [...prevDocuments, ...newFiles]);
    } catch (error) {
      setError('There was an error uploading the file!');
      console.error('There was an error!', error);
    }
    console.log(formData);
  };


  if (error) {
    return <div>Error: {error}</div>;
  }

  const handleChatSelect = async (chatId) => {
    setCurrentChatId(chatId);
    setShowChatInterface(true);
    console.log("selected chat : ", chatId)

    try {
      const response = await axios.get(`http://localhost:8000/v1/documents/${chatId}`);
      if (response.status === 200) {
        const fileNames = response.data.documents.map(doc => doc.file_name);
        setDocuments(fileNames);
        console.log("fileNames", fileNames)
      }
    } catch (error) {
      setError('Error fetching documents for the selected chat.');
      console.error('Error fetching documents:', error);
    }
    console.log("selected chat : ", chatId);
  };

  return (   
    <Container>
      <FileContainer className="App-content">
      <ChatHistory 
          chats={chats}
          setChats={setChats}
          onChatSelect={handleChatSelect}
        />
        {showChatInterface && (
            <ChatContainer>
              <ChatInterface 
                chatId={currentChatId} 
                onFileSelect={handleFileSelect} 
                documents={documents}
                updateChatHistory={updateChatHistory}
              />
            </ChatContainer>
          )}
      </FileContainer>
    </Container>
  );
}

export default ChatbotChat;