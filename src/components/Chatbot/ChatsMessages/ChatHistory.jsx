import React, { useState, useEffect, useContext } from 'react';
import ChatList from './ChatList';
import { AuthContext } from './../../Auth/AuthContext';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

const CreateNewChat = styled.button`
  background-color: #AD687E;
  border: none; 
  color: white;
  padding: 15px 32px; 
  text-decoration: none;  
  font-size: 16px;
  cursor: pointer;
  border-radius: 12px;
  width: 50%;
  margin : 10px auto;
  max-width: 150px;
  &:hover { 
    background-color: #994962;  
  }
`;

const ChatHist = styled.div`    
    display: flex;
    flex-direction: column; 
    width: 30%; 
    background-color: #465B7A;   
`;

const ChatHistory = ({onChatSelect}) => {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const { doctorId, patientId, userType } = useContext(AuthContext);
  let userId = userType === 'doctor' ? doctorId : patientId;
  
  const onClickCreateChat = async () => {
    const chatName = prompt("Please enter the name of the chat : ", "New Chat");
    if (chatName) {
      const chat_id = uuidv4();
      const newChat = {
        id : chat_id,
        user_id: userId,
        title: chatName,
        model : "",
        agent_role : "",
        created_at : new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at : new Date().toISOString().slice(0, 19).replace('T', ' '),
      
      };
      try {
        const response = await fetch('http://localhost:8000/v1/chat-create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newChat),
        });
        if (response.ok) {
          const data = await response.json();
          setChats([...chats, newChat]);
          handleSelectChat(chat_id);
          
        } else {
          console.error('Failed to create chat');
        }
      } catch (error) {
        console.error('Error creating Chat:', error);
      }
      handleSelectChat(newChat.id);
      localStorage.setItem('chatId', newChat.id);
    }
  };

  useEffect(() => {

    const fetchChats = async () => {
      console.log("userId type : ", typeof(userId) )
      
        const response = await fetch(`http://localhost:8000/v1/chats/${userId}`);

        if (response.ok) {
          const data = await response.json();
          setChats(data);
          if (data.length > 0) {
            handleSelectChat(data[0].id);
          }
        } else {
          console.error('Failed to fetch chats');
        }
    };

    fetchChats();
  }, []);

  const handleSelectChat = (chatId) => {
    onChatSelect(chatId); 
    setSelectedChatId(chatId);
  };

  return (
    <ChatHist>
      <CreateNewChat
        onClick={onClickCreateChat}  
        >New Chat
      </CreateNewChat>
      <ChatList chats={chats} onSelectChat={handleSelectChat} selectedChatId={selectedChatId} />
    </ChatHist>
  );
};

export default ChatHistory;