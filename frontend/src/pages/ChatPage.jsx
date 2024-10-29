import React, { useState } from 'react';
import styled from 'styled-components';
import SidebarComponent from '../components/Chat/Sidebar';
import ChatComponent from '../components/Chat/Chat';
import { ChatProvider } from './../components/Chat/ChatContext';
import { WebSocketProvider } from './../components/Chat/WebSocketContext';

const Home = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  height: 100vh;
`;

const Container = styled.div`
  border: 1px solid black;
  border-radius: 10px;
  width: 90%;
  height: 90%;
  display: flex;
  overflow: hidden;
`;

const ChatPage = () => {
  const [currentChat, setCurrentChat] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const handleChatSelect = (chat) => {
    setCurrentChat(chat);
    setIsSidebarVisible(false);
  };

  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  return (
    <ChatProvider>
      <WebSocketProvider>
        <Home>
          <Container>
            {isSidebarVisible && (
              <SidebarComponent onChatSelect={handleChatSelect} />
            )}
            {currentChat && (
              <ChatComponent
                currentChat={currentChat}
                toggleSidebar={toggleSidebar}
                isSidebarVisible={isSidebarVisible}
              />
            )}
          </Container>
        </Home>
      </WebSocketProvider>
    </ChatProvider>
  );
};

export default ChatPage;
