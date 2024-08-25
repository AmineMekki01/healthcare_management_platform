import React from 'react';
import styled from 'styled-components';
import moment from 'moment';

const Chat = styled.button`
  padding: 10px;
  color: #fff;
  font-size: 17px;
  background-color: ${props => props.isSelected ? '#607ba0' : '#465B7A'};
  &:hover {
    background-color: #607ba0;
  }
  transition: background-color 0.3s;
`;

const ChatsList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px;
  overflow-y: auto;
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;

`;

const MessageAndTime = styled.p`
    display: flex;
    justify-content: space-between;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
    color: lightgray;
    width: 100%;  

`;

const MessageContent = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const MessageTime = styled.span`
    margin-left: 10px; 
    white-space: nowrap;
`;

const ChatList = ({ chats, onSelectChat, selectedChatId }) => {
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


  const sortedChat = [...chats].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

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
            <MessageTime>{formatMessageDate(chat.created_at)}</MessageTime>

        </MessageAndTime>
        </Chat>
      ))}
    </ChatsList>
  );
};

export default ChatList;