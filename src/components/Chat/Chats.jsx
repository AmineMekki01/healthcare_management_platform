import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components'
import { AuthContext } from '../Auth/AuthContext';
import { ChatContext } from './ChatContext'; 
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
    &.selected {
        background-color: #2E5BFF; 
    }
`; 

const UserChatImg = styled.img`
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
`;

const UserChatInfo = styled.div`
    span {
        font-size: 18px;
        font-weight: 500;
    }

    p {
        font-size: 14px;
        color: lightgray;
    }
`; 
const ChatsComponent = ({onChatSelect}) => {
    const { patientId, doctorId, userType } = useContext(AuthContext);
    const userId = userType === 'doctor' ? doctorId : patientId;
    const { state, dispatch } = useContext(ChatContext); 

    useEffect(() => {
        const fetchChats = async () => {
          try {
            const response = await fetch(`http://localhost:3001/api/v1/chats?userID=${userId}`);
            const data = await response.json();
            dispatch({ type: 'SET_CHATS', payload: data });
            console.log("Fetched chats:", data);
          } catch (error) {
            console.error("Failed to fetch chats: ", error);
          }
        };
      
        fetchChats();
      }, [userId, dispatch]);

    const { chats } = state;

    const handleSelectChat = (chat) => {
        dispatch({ type: 'SET_CURRENT_CHAT', payload: chat }); 
        onChatSelect(chat)
        console.log("Selected chat in handleSelectChat in ChatsComponent :", chat);
    };
    
    return (
        <Chats>
            {Array.isArray(chats) && chats.map(chat => (
                <UserChat key={chat.id} onClick={() => handleSelectChat(chat)}>
                    <UserChatImg src="https://images.pexels.com/photos/15835264/pexels-photo-15835264/free-photo-of-woman-wearing-a-hat.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load" alt=""/>

                    <UserChatInfo>
                        <span>{chat.first_name}{chat.last_name}</span>
                        {/* <p>{chat.lastMessage}</p> */}
                    </UserChatInfo>
                </UserChat>
            ))}
        </Chats>
    );
};

export default ChatsComponent;