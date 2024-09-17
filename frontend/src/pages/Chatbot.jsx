import React, { useState, useContext, useEffect  } from 'react';
import axios from 'axios';
import { AuthContext } from './../components/Auth/AuthContext';
import ChatInterface from './../components/Chatbot/ChatInterface/ChatInterface';
import {FileContainer, Container, ChatContainer, ToggleButton} from './styles/ChatbotStyles';
import ChatHistory from './../components/Chatbot/ChatsMessages/ChatHistory'; 
import {useNavigate} from 'react-router-dom';



function ChatbotChat() {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  const { doctorId, patientId, userType } = useContext(AuthContext);
  const [currentChatId, setCurrentChatId] = useState(null);
  const navigate = useNavigate();
  const DOCUMENTS_API = 'http://localhost:8000/v1/documents';
  const [chats, setChats] = useState([]);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 650);
  const [view, setView] = useState('history'); // 'history', 'chat', or 'both'

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



  const handleChatSelect = async (chatId, shouldSetView = true) => {
    setCurrentChatId(chatId);
    setView('chat');
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

  const toggleChatHistory = () => {
    if (isSmallScreen) {
      setView((prevView) => (prevView === 'chat' ? 'history' : 'chat'));
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const smallScreen = window.innerWidth < 650;
      setIsSmallScreen(smallScreen);
      if (!smallScreen) {
        setView('both');
      } else if (view !== 'chat') {
        setView('history');
      }
    };
  
    window.addEventListener('resize', handleResize);
  
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [view]);

  if (error) {
    return <div>Error: {error}</div>;
  }

return (
  <FileContainer className="App-content" isSmallScreen={isSmallScreen}>
    {isSmallScreen ? (
      view === 'history' ? (
        <ChatHistory
          chats={chats}
          setChats={setChats}
          onChatSelect={handleChatSelect}
          selectedChatId={currentChatId}
          isSmallScreen={isSmallScreen}
          setView={setView}
        />
      ) : view === 'chat' ? (
        <ChatContainer>
          <ChatInterface
            chatId={currentChatId}
            onFileSelect={handleFileSelect}
            documents={documents}
            updateChatHistory={updateChatHistory}
            toggleChatHistory={toggleChatHistory}
            isSmallScreen={isSmallScreen}
          />
        </ChatContainer>
      ) : null
    ) : (
      <>
        <ChatHistory
          chats={chats}
          setChats={setChats}
          onChatSelect={handleChatSelect}
          selectedChatId={currentChatId}
          isSmallScreen={isSmallScreen}
          setView={setView}

        />
        <ChatContainer>
          <ChatInterface
            chatId={currentChatId}
            onFileSelect={handleFileSelect}
            documents={documents}
            updateChatHistory={updateChatHistory}
            toggleChatHistory={toggleChatHistory}
            isSmallScreen={isSmallScreen}
          />
        </ChatContainer>
      </>
    )}
  </FileContainer>
);

}

export default ChatbotChat;