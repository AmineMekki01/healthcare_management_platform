import React, { useEffect, useRef, useState } from 'react';
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

  const MOBILE_BREAKPOINT_PX = 768;
  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= MOBILE_BREAKPOINT_PX;
  };

  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);

    if (isMobile()) {
      setIsSidebarVisible(false);
    }
  };

  const wasMobileRef = useRef(false);

  useEffect(() => {
    wasMobileRef.current = isMobile();

    const handleResize = () => {
      const mobileNow = isMobile();

      if (wasMobileRef.current && !mobileNow) {
        setIsSidebarVisible(true);
      }

      if (!wasMobileRef.current && mobileNow && selectedChatId) {
        setIsSidebarVisible(false);
      }

      wasMobileRef.current = mobileNow;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedChatId]);

  return (
    <ChatProvider>
      <WebSocketProvider>
        <Home>
          <Container>
            {isSidebarVisible && (
              <SidebarContainer>
                <SidebarComponent 
                  onSelectChat={handleSelectChat}
                />
              </SidebarContainer>
            )}
            
            {selectedChatId ? (
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
