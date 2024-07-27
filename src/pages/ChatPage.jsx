import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Chat/Sidebar'
import Chat from '../components/Chat/Chat'
import styled from 'styled-components'
import SidebarComponent from '../components/Chat/Sidebar';
import ChatComponent from '../components/Chat/Chat';
import { ChatProvider } from './../components/Chat/ChatContext'; // Adjust the path as necessary
import { AuthContext } from './../components/Auth/AuthContext';
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
  const { patientId, doctorId, userType } = useContext(AuthContext);
  const userId = userType === 'doctor' ? doctorId : patientId;

  const handleChatSelect = (chat) => {
    setCurrentChat(chat);
    console.log("Selected chat in ChatPage: ", chat);
    console.log("Selected chat in ChatPage (after set): ", currentChat);
};
  return (
    <ChatProvider>
      <WebSocketProvider userId={userId}>
        <Home>
            <Container>
                <SidebarComponent onChatSelect={handleChatSelect}/>
                {currentChat && <ChatComponent currentChat={currentChat} />}
            </Container>
        </Home>
      </WebSocketProvider>
    </ChatProvider>



  )
}

export default ChatPage