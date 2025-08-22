import React, { useState } from 'react';
import { ChatProvider } from '../contexts/ChatContext';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import SidebarComponent from '../components/Sidebar';
import ChatComponent from '../components/Chat';
import WelcomeScreen from '../components/WelcomeScreen';
import { 
  Home, 
  Container, 
  SidebarContainer 
} from '../styles/ChatStyles';


const ChatPage = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <ChatProvider>
      <WebSocketProvider>
        <Home>
          <Container>
            {isSidebarVisible && (
              <SidebarContainer>
                <SidebarComponent 
                  onSelectChat={setSelectedChatId}
                  toggleSidebar={toggleSidebar}
                />
              </SidebarContainer>
            )}
            
            {selectedChatId ? (
                console.log('Rendering ChatComponent with selectedChatId:', selectedChatId) ||
              <ChatComponent 
                chatId={selectedChatId}
                isSidebarVisible={isSidebarVisible}
                toggleSidebar={toggleSidebar}
              />
            ) : (
              <WelcomeScreen 
                isSidebarVisible={isSidebarVisible}
                toggleSidebar={toggleSidebar}
              />
            )}
          </Container>
        </Home>
      </WebSocketProvider>
    </ChatProvider>
  );
};

export default ChatPage;
