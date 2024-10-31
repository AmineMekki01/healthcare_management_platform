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
  width: ${({ isSidebarVisible }) => (isSidebarVisible ? '65%' : '100%')};
  transition: width 0.3s ease;
`;

const ChatInfo = styled.div`
  height: 50px;
  background-color: #29355b;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  color: lightgray;
`;

const ToggleSidebarButton = styled.button`
  background: none;
  border: none;
  color: lightgray;
  cursor: pointer;
  font-size: 18px;
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
        <span>
          {currentChat.first_name_recipient} {currentChat.last_name_recipient}
        </span>
        <ToggleSidebarButton onClick={toggleSidebar}>
          {isSidebarVisible ? 'Hide Chats' : 'Show Chats'}
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
