import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components'
import Cam from '../../assets/images/ChatImages/videocam.png'
import Add from '../../assets/images/ChatImages/add-user.png'
import More from '../../assets/images/ChatImages/more.png'
import MessagesComponent from './Messages'
import InputComponent from './Input'
import { AuthContext } from '../Auth/AuthContext';
import { ChatContext } from './ChatContext'; 
import { WebSocketContext } from './WebSocketContext';

const Chat = styled.div`
    flex: 2;
    width: 65%;

`;

const ChatInfo = styled.div`
    height: 50px;
    background-color: #29355b;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    color: lightgray;
`;

const ChatIcons = styled.div`
    display: flex;
    gap: 10px;
`;

const ChatIconsImg = styled.img`
    height: 24px;
`;

const ChatComponent = ({ currentChat }) => {
    const { patientId, doctorId, userType } = useContext(AuthContext);
    const userId = userType === 'doctor' ? doctorId : patientId;
    const { state, dispatch } = useContext(ChatContext);
    const { messages } = state;
    const websocket = useContext(WebSocketContext);

    console.log("Current chat in ChatComponent:", currentChat);
    const fetchMessages = (chatId) => {
        fetch(`http://localhost:3001/api/v1/messages/${chatId}`)
            .then(response => response.json())
            .then(data => {
                const fetchedMessages = data.messages;
                console.log("Fetched messages:", fetchedMessages);
                dispatch({ type: 'SET_MESSAGES', payload: fetchedMessages });
            })
            .catch(error => console.error('Error fetching messages:', error));
    };

    useEffect(() => {
        console.log("Effect running for currentChat: ", currentChat);
        if (currentChat && currentChat.id) {
            console.log("Fetching messages for chat: ", currentChat.id);
            fetchMessages(currentChat.id);
        } else {
            console.log("Invalid or null currentChat: ", currentChat);
        }
    }, [currentChat]);


    const sendMessage = (content) => {
        if (!currentChat || !websocket || websocket.readyState !== WebSocket.OPEN) {
            console.error("[Client] No chat or WebSocket is not open.");
            return;
        }
    
        const message = {
            chat_id: currentChat.id, 
            sender_id: userId,
            recipient_id: currentChat.recipient_user_id,
            content: content,
            created_at: new Date().toISOString()
        };
    
        websocket.send(JSON.stringify(message));
        dispatch({ type: 'ADD_MESSAGE', payload: message });
        dispatch({
            type: 'UPDATE_LAST_MESSAGE',
            payload: {
                chatId: currentChat.id,
                latest_message_content: content,
                latest_message_time: new Date().toISOString(),
            },
        });
        fetch('http://localhost:3001/api/v1/SendMessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        })
        .then(response => response.json())
        .then(data => {
            console.log("Message saved:", data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    };

    console.log("Messages in ChatComponent:", messages);
    return (
        <Chat>
            <ChatInfo>
                <span>{currentChat.first_name_recipient} {currentChat.last_name_recipient}</span>
                <ChatIcons>
                    <ChatIconsImg src={Cam} alt=""/>
                    <ChatIconsImg src={Add} alt=""/>
                    <ChatIconsImg src={More} alt=""/>
                </ChatIcons>
            </ChatInfo>
            <MessagesComponent messages={messages} currentUserId={userId} />
            <InputComponent sendMessage={sendMessage} />
        </Chat>
    )
}

export default ChatComponent
