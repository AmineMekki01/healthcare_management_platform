import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/context/AuthContext';
import ChatInterface from '../components/ChatInterface/ChatInterface';
import {FileContainer, ChatContainer} from '../styles/ChatbotPage.styles';
import ChatHistory from '../components/ChatHistory/ChatHistory';
import { documentService } from '../services'; 


function ChatbotPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(chatId || null);
  const [chats, setChats] = useState([]);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 650);
  const [view, setView] = useState(chatId ? 'chat' : 'history');

  const {userId} = useContext(AuthContext);

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
    try {
      console.log('[UPLOAD] Starting upload for chatId:', currentChatId, 'userId:', userId);
      await documentService.uploadDocuments(currentChatId, userId, files);
      console.log('[UPLOAD] Upload completed, fetching documents...');
      const documentsData = await documentService.getChatDocuments(currentChatId, userId);
      console.log('[UPLOAD] Documents fetched:', documentsData);
      setDocuments(documentsData);
    } catch (error) {
      setError('There was an error uploading the file!');
      console.error('There was an error!', error);
    }
  };

  const handleChatSelect = useCallback(async (chatId, shouldSetView = true) => {
    setCurrentChatId(chatId);
    setView('chat');
    navigate(`/chatbot/${chatId}`);
    try {
      const documentsData = await documentService.getChatDocuments(chatId, userId);
      setDocuments(documentsData);
    } catch (error) {
      setError('Error fetching documents for the selected chat.');
      console.error('Error fetching documents:', error);
    }
  }, [navigate, userId]);

  const toggleChatHistory = () => {
    if (isSmallScreen) {
      setView((prevView) => (prevView === 'chat' ? 'history' : 'chat'));
    }
  };

  useEffect(() => {
    if (currentChatId && currentChatId !== chatId) {
      handleChatSelect(currentChatId);
    }
  }, [currentChatId, chatId, handleChatSelect]);

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

export default ChatbotPage;
