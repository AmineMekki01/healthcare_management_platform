import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import MessagesComponent from './Messages';
import InputComponent from './Input';
import { AuthContext } from './../../../features/auth/context/AuthContext';
import { ChatContext } from '../contexts/ChatContext';
import chatService from '../services/chatService';
import { getLocalizedChatRecipientName } from '../utils/chatI18n';

const Chat = styled.div`
  flex: 2;
  width: ${({ $isSidebarVisible }) => ($isSidebarVisible ? '70%' : '100%')};
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  position: relative;
  direction: ltr; /* Force LTR for chat container to maintain message positioning */
  
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

const ChatComponent = ({chatId, toggleSidebar, isSidebarVisible }) => {
  const { t, i18n } = useTranslation('chat');
  const { userId, userProfilePictureUrl } = useContext(AuthContext);
  const { state, dispatch} = useContext(ChatContext);
  const { messages, chats } = state;

  const [recipientImage, setRecipientImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchedChatId, setLastFetchedChatId] = useState(null);

  const actualCurrentChat = chatId ? chats.find(chat => chat.id === chatId) : null;

  const fetchMessages = async (chatId) => {
    if (isLoading || chatId === lastFetchedChatId) return;
    
    setIsLoading(true);
    try {
      const fetchedMessages = await chatService.fetchMessages(chatId);
      console.log('Fetched messages:', fetchedMessages);
      dispatch({ type: 'SET_MESSAGES', payload: fetchedMessages });
      setLastFetchedChatId(chatId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserImages = async () => {
    if (!actualCurrentChat || !actualCurrentChat.id) return;
    
    try {
      const imageUrl = await chatService.fetchUserImage(
        actualCurrentChat.recipientUserId, 
        actualCurrentChat.recipientUserType
      );
      setRecipientImage(imageUrl);
    } catch (error) {
      console.error('Error fetching user image:', error);
      setRecipientImage('default-avatar.png');
    }
  };

  useEffect(() => {
    if (actualCurrentChat && actualCurrentChat.id && actualCurrentChat.id !== lastFetchedChatId) {
      dispatch({ type: 'SET_MESSAGES', payload: [] });
      setRecipientImage('');
      
      fetchMessages(actualCurrentChat.id);
      fetchUserImages();
    }
  }, [actualCurrentChat?.id]);

  const sendMessage = async (content, key) => {
    if (!actualCurrentChat) {
      console.error('[Client] No chat selected.');
      return;
    }

    const message = {
      chatId: actualCurrentChat.id,
      senderId: userId,
      recipientId: actualCurrentChat.recipientUserId,
      content: content,
      createdAt: new Date().toISOString(),
      key: key,
    };

    dispatch({ type: 'ADD_MESSAGE', payload: message });
    dispatch({
      type: 'UPDATE_LAST_MESSAGE',
      payload: {
        chatId: actualCurrentChat.id,
        latestMessageContent: content,
        latestMessageTime: new Date().toISOString(),
      },
    });

    try {
      await chatService.sendMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: i should remove message from UI
    }
  };

  return (
    <Chat $isSidebarVisible={isSidebarVisible}>
      <ChatInfo>
        <ChatInfoContent>
          <ChatUserName>
            {actualCurrentChat ? getLocalizedChatRecipientName(actualCurrentChat, i18n.language) : t('header.selectChat')}
          </ChatUserName>
          {actualCurrentChat && <OnlineIndicator />}
        </ChatInfoContent>
        <ToggleSidebarButton onClick={toggleSidebar}>
          {isSidebarVisible ? t('header.hide') : t('header.show')}
        </ToggleSidebarButton>
      </ChatInfo>
      {actualCurrentChat ? (
        <>
          <MessagesComponent
            messages={messages}
            currentUserId={userId}
            senderImage={userProfilePictureUrl}
            recipientImage={recipientImage}
          />
          <InputComponent sendMessage={sendMessage} />
        </>
      ) : (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: '#64748b',
          fontSize: '16px'
        }}>
          {t('header.selectChat')}
        </div>
      )}
    </Chat>
  );
};

export default ChatComponent;
