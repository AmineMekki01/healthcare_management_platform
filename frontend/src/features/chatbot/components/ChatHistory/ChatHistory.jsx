import React, { useState, useEffect, useContext } from 'react';
import ChatList from './ChatList';
import { AuthContext } from '../../../auth/context/AuthContext';
import { chatService } from '../../services';
import styled from 'styled-components';

const CreateNewChat = styled.button`
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border: none;
  color: white;
  padding: 16px 24px;
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 12px;
  margin: 20px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  &:hover {
    background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.35);
  }

  &:active {
    transform: translateY(0);
  }

  /* Icon */
  &::before {
    content: '+';
    margin-right: 8px;
    font-size: 18px;
    font-weight: 700;
  }
`;

const ChatHist = styled.div`
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #1e293b 0%, #334155 100%);
  width: 30%;
  min-height: 100vh;
  border-radius: 16px 0 0 16px;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  border-right: 1px solid #475569;

  @media (max-width: 650px) {
    width: 100%;
    border-radius: 0;
  }
`;

const ChatHistoryHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #475569;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
`;

const ChatHistoryTitle = styled.h2`
  color: #f8fafc;
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  text-align: center;
`;

const LoadingMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #cbd5e1;
  font-style: italic;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const ChatHistory = ({ chats, setChats, onChatSelect, selectedChatId, isSmallScreen, setView }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { userId } = useContext(AuthContext);
  
  const onClickCreateChat = async () => {
    if (!userId || userId === 'null' || userId === null || userId === undefined) {
      alert('Please log in to create a chat');
      return;
    }

    const chatName = prompt("Please enter the name of the chat : ", "New Chat");
    if (chatName) {
      try {
        const newChat = await chatService.createChat(userId, chatName);
        setChats(prevChats => [...prevChats, {
          id: newChat.id,
          title: newChat.title,
          created_at: newChat.created_at,
          updated_at: newChat.updated_at,
          message_count: 0,
          last_message: null
        }]);
        handleSelectChat(newChat.id);
      } catch (error) {
        console.error('Error creating Chat:', error);
        alert('Failed to create chat. Please try again.');
      }
    }
  };

  useEffect(() => {
    const fetchChats = async () => {
      if (!userId || userId === 'null' || userId === null || userId === undefined) {
        console.log('Skipping chat fetch - no valid userId:', userId);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await chatService.getUserChats(userId);
        console.log('Fetched chats:', data);
        setChats(data);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (chats.length === 0 && userId) {
      fetchChats();
    } else if (chats.length > 0) {
      setIsLoading(false);
    }
  }, [userId, chats.length, setChats]);

  const handleSelectChat = (chatId) => {
    onChatSelect(chatId);
  
    if (isSmallScreen) {
      setView('chat');
    }
  };

  const handleDeleteChat = (chatId) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    
    if (selectedChatId === chatId) {
      onChatSelect(null);
    }
  };
  return (
    <ChatHist>
      <ChatHistoryHeader>
        <ChatHistoryTitle>Chat History</ChatHistoryTitle>
      </ChatHistoryHeader>
      
      {(!userId || userId === 'null') ? (
        <LoadingMessage>Please log in to view chats</LoadingMessage>
      ) : (
        <>
          <CreateNewChat onClick={onClickCreateChat}>
            New Chat
          </CreateNewChat>
          {isLoading ? (
            <LoadingMessage>Loading chats...</LoadingMessage>
          ) : (
            <ChatList 
              chats={chats} 
              onSelectChat={handleSelectChat} 
              selectedChatId={selectedChatId}
              onDeleteChat={handleDeleteChat}
              userId={userId}
            />
          )}
        </>
      )}
    </ChatHist>
  );
};

export default ChatHistory;
