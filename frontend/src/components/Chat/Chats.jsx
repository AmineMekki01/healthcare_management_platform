import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components'
import { AuthContext } from '../Auth/AuthContext';
import { ChatContext } from './ChatContext'; 

import moment from 'moment';


const Chats = styled.div`

`;

const UserChat = styled.div`
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: white;
    cursor: pointer;
    &:hover {
      background-color: #121F49;
    }
    background-color: ${props => props.$isSelected ? '#b44b8e' : 'transparent'};
`;
  

const UserChatImg = styled.img`
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
`;

const UserChatInfo = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 100%;  
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

const ChatsComponent = ({onChatSelect}) => {
    const { patientId, doctorId, userType } = useContext(AuthContext);
    const userId = userType === 'doctor' ? doctorId : patientId;
    const { state, dispatch } = useContext(ChatContext); 
    const { currentChat } = state;
    const [selectedChatId, setSelectedChatId] = useState(null);
    const { chats } = state;

    useEffect(() => {
        console.log("Fetching chats for user ID:", userId);
        const fetchChats = async () => {
          try {
            const response = await fetch(`http://localhost:3001/api/v1/chats?userID=${userId}`);
            const data = await response.json();
            console.log("Chats fetched:", data);
            dispatch({ type: 'SET_CHATS', payload: data });

          } catch (error) {
            console.error("Failed to fetch chats: ", error);
          }
        };
        fetchChats();
        
      }, [userId, dispatch, currentChat]);

    const handleSelectChat = (chat) => {
        console.log("Attempting to select chat:", chat.id);
        setSelectedChatId(chat.id);
        dispatch({ type: 'SET_CURRENT_CHAT', payload: chat }); 
        onChatSelect(chat)
        console.log("Chat selected, state should now be updated.", chat);
    };
    useEffect(() => {
        console.log("Current selectedChatId:", selectedChatId);
    }, [selectedChatId]);

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

    console.log("Rendering UserChat, selectedChatId:", selectedChatId);

    return (
        <Chats>
            {Array.isArray(chats) && chats.map(chat => (
                <UserChat 
                    key={chat.id} 
                    onClick={() => handleSelectChat(chat)}
                    $isSelected={selectedChatId === chat.id}
                >                
                    <UserChatImg src="https://images.pexels.com/photos/15835264/pexels-photo-15835264/free-photo-of-woman-wearing-a-hat.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load" alt=""/>

                    <UserChatInfo>
                        <span>{chat.first_name_recipient} {chat.last_name_recipient}</span>
                        <MessageAndTime>
                            <MessageContent>{chat.latest_message_content}</MessageContent>
                            <MessageTime>{formatMessageDate(chat.latest_message_time)}</MessageTime>
                        </MessageAndTime>
                    </UserChatInfo>
                </UserChat>
            ))}
        </Chats>
    );
};

export default ChatsComponent;