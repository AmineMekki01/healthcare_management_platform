import React, { useState, useContext} from 'react';
import styled from 'styled-components'
import NavbarComponent from './Navbar';
import SearchComponent from './Search';
import ChatsComponent from './Chats';
import { ChatContext } from './ChatContext'; 

const Sidebar = styled.div`
    flex: 1;
    width: 35%; 
    background-color: #29355b;
    color: white;
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