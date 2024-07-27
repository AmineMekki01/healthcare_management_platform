import React from 'react';
import styled from 'styled-components';

const Chat = styled.button`
  padding: 10px;
  color: #fff;
  font-size: 17px;
  background-color: ${props => props.isSelected ? '#607ba0' : '#465B7A'}; // Default color and selected color
  &:hover {
    background-color: #607ba0; // Color on hover
  }
  transition: background-color 0.3s; // Smooth transition for background color change
`;

const ChatsList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px;
  overflow-y: auto;
  // hide scrollbar
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;  // IE and Edge
  scrollbar-width: none;  // Firefox

`;

const ChatList = ({ chats, onSelectChat, selectedChatId }) => {
  return (
    <ChatsList>
      {chats.map((chat) => (
        <Chat
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          isSelected={selectedChatId === chat.id} 
        >
          {chat.title}
        </Chat>
      ))}
    </ChatsList>
  );
};

export default ChatList;