import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components'
import { AuthContext } from '../Auth/AuthContext';
import { ChatContext } from './ChatContext'; 

import moment from 'moment';
import axios from './../axiosConfig';


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
    const { userId } = useContext(AuthContext);
    const { state, dispatch } = useContext(ChatContext); 
    const { currentChat } = state;
    const [selectedChatId, setSelectedChatId] = useState(null);
    const { chats } = state;

    useEffect(() => {
        if (!userId) {
            return;
        }
        const fetchChats = async () => {
          try {
            const response = await axios.get(`http://localhost:3001/api/v1/chats`, {
                params : {
                    userID: userId
                }
            });
            console.log("response.data : ", response.data)
            dispatch({ type: 'SET_CHATS', payload: response.data });
          } catch (error) {
            console.error("Failed to fetch chats: ", error);
          }
        };
        fetchChats();
    }, [userId, dispatch, currentChat]);
    

    const handleSelectChat = (chat) => {
        setSelectedChatId(chat.id);
        dispatch({ type: 'SET_CURRENT_CHAT', payload: chat }); 
        onChatSelect(chat)
    };

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
    return (
        <Chats>
            {Array.isArray(chats) && chats.map(chat => (
                <UserChat 
                    key={chat.id} 
                    onClick={() => handleSelectChat(chat)}
                    $isSelected={selectedChatId === chat.id}
                >                
                    <UserChatImg src={`${chat.recipient_image_url}`} alt="" />
                    
                    <UserChatInfo>
                        <span>{chat.first_name_recipient} {chat.last_name_recipient}</span>
                        <MessageAndTime>
                            <MessageContent>{chat.latest_message_content}</MessageContent>
                            <MessageTime>{formatMessageDate(chat.latest_message_time || chat.updated_at)}</MessageTime>

                        </MessageAndTime>
                    </UserChatInfo>
                </UserChat>
            ))}
        </Chats>
    );
};

export default ChatsComponent;