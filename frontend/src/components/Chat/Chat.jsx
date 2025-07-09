import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';

import MessagesComponent from './Messages';
import InputComponent from './Input';
import { AuthContext } from '../Auth/AuthContext';
import { ChatContext } from './ChatContext';
import { WebSocketContext } from './WebSocketContext';
import axios from './../axiosConfig';

const Chat = styled.div`
  flex: 2;
  width: ${({ isSidebarVisible }) => (isSidebarVisible ? '70%' : '100%')};
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.02) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.02) 0%, transparent 50%);
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ChatInfo = styled.div`
  height: 70px;
  min-height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 2;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    pointer-events: none;
  }
`;

const ChatInfoContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ChatUserName = styled.span`
  font-weight: 600;
  font-size: 16px;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
`;

const OnlineIndicator = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  box-shadow: 
    0 0 0 2px rgba(16, 185, 129, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.1);
  animation: pulse 2s infinite;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
  }
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7), 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    70% {
      box-shadow: 0 0 0 8px rgba(16, 185, 129, 0), 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0), 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }
`;

const ToggleSidebarButton = styled.button`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 25px;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  
  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ChatComponent = ({ currentChat, toggleSidebar, isSidebarVisible }) => {
  const { userId, userProfilePhotoUrl } = useContext(AuthContext);
  const { state, dispatch, userType} = useContext(ChatContext);
  const { messages } = state;
  const websocket = useContext(WebSocketContext);

  const [recipientImage, setRecipientImage] = useState('');

  const fetchMessages = async (chatId) => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/v1/messages/${chatId}`
      );
      const { messages: fetchedMessages } = response.data;
      dispatch({ type: 'SET_MESSAGES', payload: fetchedMessages });
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchUserImages = async () => {
    if (currentChat && currentChat.id) {
        console.log("currentChat : ", currentChat)
      try {
        const response = await axios.get(
            `http://localhost:3001/api/v1/users/image/${currentChat.recipient_user_id}`,
          {
            params: {
              userType: currentChat.recipient_user_type,
            },
          }
        );
        const { imageUrl } = response.data;
        console.log("fetchUserImages response.data:", response.data);
        setRecipientImage(imageUrl);
      } catch (error) {
        console.error('Error fetching user image:', error);
        setRecipientImage('default-avatar.png');
      }
    }
  };

  useEffect(() => {
    if (currentChat && currentChat.id) {
      fetchMessages(currentChat.id);
      fetchUserImages();
    }
  }, [currentChat]);

  const sendMessage = async (content, key) => {
    if (!currentChat || !websocket || websocket.readyState !== WebSocket.OPEN) {
      console.error('[Client] No chat or WebSocket is not open.');
      return;
    }

    const message = {
      chat_id: currentChat.id,
      sender_id: userId,
      recipient_id: currentChat.recipient_user_id,
      content: content,
      created_at: new Date().toISOString(),
      key: key,
    };

    websocket.send(JSON.stringify(message));
    dispatch({ type: 'ADD_MESSAGE', payload: message });
    dispatch({
      type: 'UPDATE_LAST_MESSAGE',
      payload: {
        chatId: currentChat.id,
        latest_message_content: content,
        latest_message_time: new Date().toISOString(),
      },
    });

    try {
      const response = await axios.post('/api/v1/SendMessage', message);
      console.log('Message saved:', response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Chat isSidebarVisible={isSidebarVisible}>
      <ChatInfo>
        <ChatInfoContent>
          <ChatUserName>
            {currentChat.first_name_recipient} {currentChat.last_name_recipient}
          </ChatUserName>
          <OnlineIndicator />
        </ChatInfoContent>
        <ToggleSidebarButton onClick={toggleSidebar}>
          {isSidebarVisible ? '← Hide' : '→ Show'}
        </ToggleSidebarButton>
      </ChatInfo>
      <MessagesComponent
        messages={messages}
        currentUserId={userId}
        senderImage={userProfilePhotoUrl}
        recipientImage={recipientImage}
      />
      <InputComponent sendMessage={sendMessage} />
    </Chat>
  );
};

export default ChatComponent;
