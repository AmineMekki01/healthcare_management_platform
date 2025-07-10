import React from 'react';
import styled from 'styled-components';
import moment from 'moment';

const Chat = styled.button`
  padding: 16px 20px;
  margin: 0 20px 8px;
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

const ChatList = ({ chats, onSelectChat, selectedChatId }) => {
  // Debug logging to track selection state
  console.log('ChatList render - selectedChatId:', selectedChatId, 'chats count:', chats.length);
  
  const formatMessageDate = (dateString) => {
    if (!dateString) {
        return 'just now';
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

  const sortedChat = [...chats].sort((a,b) => new Date(b.last_message_date) - new Date(a.last_message_date));

  return (
    <ChatsList>
      {sortedChat.map((chat) => (
        <Chat
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          isSelected={selectedChatId === chat.id} 
        >
          <MessageAndTime>
            <MessageContent>{chat.title}</MessageContent>
            <MessageTime>{formatMessageDate(chat.last_message_date)}</MessageTime>
          </MessageAndTime>
        </Chat>
      ))}
    </ChatsList>
  );
};

export default ChatList;