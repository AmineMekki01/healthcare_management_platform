import React from 'react';
import styled from 'styled-components';
import MessageComponent from './Message'


const Messages = styled.div`
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    padding: 24px;
    height: calc(100% - 140px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: relative;
    direction: ltr; /* Force LTR for message container to maintain positioning */
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: 
            radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.03) 0%, transparent 50%);
        pointer-events: none;
    }
    
    /* Custom scrollbar */
    &::-webkit-scrollbar {
        width: 6px;
    }
    
    &::-webkit-scrollbar-track {
        background: rgba(248, 250, 252, 0.5);
        border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #cbd5e0 0%, #a0aec0 100%);
        border-radius: 3px;
        transition: background 0.2s ease;
    }
    
    &::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #a0aec0 0%, #718096 100%);
    }
`;

const MessagesComponent = ({ messages, currentUserId, senderImage, recipientImage }) => {
    return (
        <Messages>
            {messages &&
                messages.map((msg, index) => (
                        <MessageComponent
                        key={index}
                        message={msg}
                        isOwner={msg.senderId === currentUserId}
                        senderImage={senderImage}
                        recipientImage={recipientImage}
                    />
                ))}
        </Messages>
    );
};

export default MessagesComponent