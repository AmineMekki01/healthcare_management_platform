import React, { useState, useEffect, useContext } from 'react';
import ChatList from './ChatList';
import { AuthContext } from '../../../auth/context/AuthContext';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

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
      const chat_id = uuidv4();
      const newChat = {
        id : chat_id,
        user_id: userId,
        title: chatName,
        model : "",
        agent_role : "",
        created_at : new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at : new Date().toISOString().slice(0, 19).replace('T', ' '),
      
      };
      try {
        const response = await fetch('http://localhost:8000/v1/chat-create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newChat),
        });
        if (response.ok) {
          const data = await response.json();
          setChats(prevChats => [...prevChats, newChat]);
          handleSelectChat(newChat.id);
        } else {
          console.error('Failed to create chat - Response not ok:', response.status);
        }
      } catch (error) {
        console.error('Error creating Chat:', error);
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
        const response = await fetch(`http://localhost:8000/v1/chats/${userId}`);
    
        if (response.ok) {
          const data = await response.json();
          setChats(data);
        } else {
          console.error('Failed to fetch chats - Response not ok:', response.status);
        }
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
            <ChatList chats={chats} onSelectChat={handleSelectChat} selectedChatId={selectedChatId} />
          )}
        </>
      )}
    </ChatHist>
  );
};

export default ChatHistory;
