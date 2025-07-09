import React, { useState } from 'react';
import styled from 'styled-components';
import SidebarComponent from '../components/Chat/Sidebar';
import ChatComponent from '../components/Chat/Chat';
import WelcomeScreen from '../components/Chat/WelcomeScreen';
import { ChatProvider } from './../components/Chat/ChatContext';
import { WebSocketProvider } from './../components/Chat/WebSocketContext';

const Home = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    pointer-events: none;
  }
`;

const Container = styled.div`
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  width: 100%;
  max-width: 1400px;
  height: 95vh;
  display: flex;
  overflow: hidden;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    width: 95%;
    height: 90vh;
    border-radius: 16px;
    margin: 10px;
  }
  
  @media (max-width: 480px) {
    width: 100%;
    height: 100vh;
    border-radius: 0;
    margin: 0;
    backdrop-filter: none;
    background: white;
  }
`;

const ChatPage = () => {
  const [currentChat, setCurrentChat] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(window.innerWidth > 768);

  const handleChatSelect = (chat) => {
    setCurrentChat(chat);
    if (window.innerWidth <= 768) {
      setIsSidebarVisible(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  return (
    <ChatProvider>
      <WebSocketProvider>
        <Home>
          <Container>
            {(isSidebarVisible || !currentChat) && (
              <SidebarComponent onChatSelect={handleChatSelect} />
            )}
            {currentChat && (
              <ChatComponent
                currentChat={currentChat}
                toggleSidebar={toggleSidebar}
                isSidebarVisible={isSidebarVisible}
              />
            )}
            {!currentChat && (
              <WelcomeScreen />
            )}
          </Container>
        </Home>
      </WebSocketProvider>
    </ChatProvider>
  );
};

export default ChatPage;
