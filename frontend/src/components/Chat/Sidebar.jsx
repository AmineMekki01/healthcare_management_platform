import React, { useState, useContext} from 'react';
import styled from 'styled-components'
import NavbarComponent from './Navbar';
import SearchComponent from './Search';
import ChatsComponent from './Chats';
import { ChatContext } from './ChatContext'; 

const Sidebar = styled.div`
  flex: 1;
  min-width: 320px;
  max-width: 400px;
  background: #f8fafc;
  color: #1a202c;
  transition: all 0.3s ease;
  border-right: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  flex-direction: column;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 10% 20%, rgba(120, 119, 198, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 90% 80%, rgba(255, 119, 198, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    min-width: 100%;
    max-width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  }
`;

const SidebarComponent = ({onChatSelect }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const { state, dispatch } = useContext(ChatContext);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    dispatch({ type: 'SET_CURRENT_CHAT', payload: chat }); 
    onChatSelect(chat);
};
  return (
    <Sidebar>
      <NavbarComponent />
      <SearchComponent onUserSelect={handleUserSelect} onSelectChat={handleSelectChat} />
      <ChatsComponent onChatSelect={handleSelectChat} />
    </Sidebar>
  );
};

export default SidebarComponent