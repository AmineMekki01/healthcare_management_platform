import React, { useState } from 'react';
import styled from 'styled-components'
import NavbarComponent from './Navbar';
import SearchComponent from './Search';
import ChatsComponent from './Chats';

const Sidebar = styled.div`
    flex: 1;
    width: 35%; // remember to remove this if something goes wrong

    background-color: #29355b;
    color: white;
`;


const SidebarComponent = ({onChatSelect }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);

  const handleUserSelect = (user, chatId) => {
    setSelectedUser(user);
    setCurrentChat(chatId);
    console.log("Selected user in Sidebar: ", user);
    console.log("Current chat in Sidebar: ", chatId);
  };
  return (
    <Sidebar>
      <NavbarComponent />
      <SearchComponent onUserSelect={handleUserSelect} />
      <ChatsComponent onChatSelect={onChatSelect} />
    </Sidebar>
  );
};

export default SidebarComponent