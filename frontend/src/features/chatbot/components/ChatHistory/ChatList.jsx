import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import moment from 'moment';

const ChatContainer = styled.div`
  position: relative;
  margin: 0 20px 8px;
  
  &:hover .delete-button {
    opacity: 1;
  }
`;

const Chat = styled.button`
  padding: 16px 20px;
  padding-right: 50px;
  width: 100%;
  border-radius: 12px;
  border: none;
  color: ${props => props.isSelected ? '#ffffff' : '#cbd5e1'};
  font-size: 14px;
  background: ${props => 
    props.isSelected 
      ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' 
      : 'rgba(255, 255, 255, 0.05)'
  };
  border: 1px solid ${props => 
    props.isSelected 
      ? 'transparent' 
      : 'rgba(255, 255, 255, 0.1)'
  };
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: ${props => 
    props.isSelected 
      ? '0 4px 12px rgba(79, 70, 229, 0.3)' 
      : 'none'
  };
  
  &:hover {
    background: ${props => 
      props.isSelected 
        ? 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)' 
        : 'rgba(255, 255, 255, 0.1)'
    };
    color: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

const DeleteButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(239, 68, 68, 0.8);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 10;
  
  &:hover {
    background: rgba(239, 68, 68, 1);
    transform: translateY(-50%) scale(1.1);
  }
  
  &:active {
    transform: translateY(-50%) scale(0.95);
  }
`;

const ChatsList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 0 20px;
  overflow-y: auto;
  flex: 1;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
`;

const MessageAndTime = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin: 0;
  width: 100%;
`;

const MessageContent = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  font-weight: 500;
  min-width: 0;
`;

const MessageTime = styled.span`
  font-size: 11px;
  opacity: 0.7;
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 400;
`;

const ChatList = ({ chats, onSelectChat, selectedChatId, onDeleteChat, userId }) => {
  const { t } = useTranslation('chatbot');
  const [deletingChatId, setDeletingChatId] = useState(null);
  
  const formatMessageDate = (dateString) => {
    if (!dateString) {
        return t('chatList.justNow');
    }
    return moment(dateString).calendar(null, {
        sameDay: 'LT',
        nextDay: '[Tomorrow at] LT',
        nextWeek: 'dddd [at] LT',
        lastDay: '[Yesterday at] LT',
        lastWeek: '[Last] dddd [at] LT',
        sameElse: 'L'
    });
  };

  const handleDeleteChat = async (e, chatId, chatTitle) => {
    e.stopPropagation();

    if (!window.confirm(t('chatList.confirmDelete', { chatTitle }))) {
      return;
    }
    
    setDeletingChatId(chatId);
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/chatbot/chats/${chatId}?user_id=${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        onDeleteChat(chatId);
      } else {
        const error = await response.json();
        alert(t('chatList.deleteError', { error: error.detail || t('chatList.unknownError') }));
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert(t('chatList.deleteFailure'));
    } finally {
      setDeletingChatId(null);
    }
  };

  const sortedChat = [...chats].sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));

  return (
    <ChatsList>
      {sortedChat.map((chat) => (
        <ChatContainer key={chat.id}>
          <Chat
            onClick={() => onSelectChat(chat.id)}
            isSelected={selectedChatId === chat.id} 
          >
            <MessageAndTime>
              <MessageContent>{chat.title}</MessageContent>
              <MessageTime>{formatMessageDate(chat.updated_at)}</MessageTime>
            </MessageAndTime>
          </Chat>
          <DeleteButton
            className="delete-button"
            onClick={(e) => handleDeleteChat(e, chat.id, chat.title)}
            disabled={deletingChatId === chat.id}
            title={t('chatList.deleteConversation')}
          >
            {deletingChatId === chat.id ? '...' : '×'}
          </DeleteButton>
        </ChatContainer>
      ))}
    </ChatsList>
  );
};

export default ChatList;
