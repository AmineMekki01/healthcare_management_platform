import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { AuthContext } from './../../../features/auth/context/AuthContext';
import { ChatContext } from './../contexts/ChatContext'; 
 
import chatService from '../services/chatService';
import { formatChatTimestamp, getLocalizedChatRecipientName } from '../utils/chatI18n';

const Chats = styled.div`
    padding: 12px 0;
    background: transparent;
    flex: 1;
    overflow-y: auto;
    
    /* Custom scrollbar */
    &::-webkit-scrollbar {
        width: 6px;
    }
    
    &::-webkit-scrollbar-track {
        background: rgba(248, 250, 252, 0.5);
        border-radius: 3px;
        margin: 8px 0;
    }
    
    &::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
        border-radius: 3px;
        transition: background 0.2s ease;
    }
    
    &::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(102, 126, 234, 0.5) 0%, rgba(118, 75, 162, 0.5) 100%);
    }
`;

const UserChat = styled.div`
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    color: #000;
    cursor: pointer;
    margin: 4px 12px;
    border-radius: 16px;
    transition: all 0.3s ease;
    border: 1px solid transparent;
    position: relative;
    overflow: hidden;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 0;
    }
    
    &:hover {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        backdrop-filter: blur(10px);
        border-color: rgba(102, 126, 234, 0.2);
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        
        &::before {
            opacity: 1;
        }
    }
    
    ${props => props.$isSelected && `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-color: transparent;
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
        transform: translateY(-1px);
        
        &::before {
            display: none;
        }
        
        &:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }
    `}
    
    > * {
        position: relative;
        z-index: 1;
    }
`;
  
const UserChatImg = styled.img`
    width: 52px;
    height: 52px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(226, 232, 240, 0.6);
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    ${props => props.$isSelected && `
        border-color: rgba(255, 255, 255, 0.8);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    `}
    
    ${UserChat}:hover & {
        transform: scale(1.05);
        border-color: rgba(102, 126, 234, 0.4);
        
        ${props => props.$isSelected && `
            border-color: rgba(255, 255, 255, 0.9);
        `}
    }
`;

const UserChatInfo = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 100%;
    gap: 4px;
`; 

const UserName = styled.span`
    font-weight: 600;
    font-size: 16px;
    color: ${props => props.$isSelected ? 'white' : '#1a202c'};
    transition: all 0.3s ease;
    text-shadow: ${props => props.$isSelected ? '0 1px 2px rgba(0, 0, 0, 0.2)' : 'none'};
`;

const MessageAndTime = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-top: 2px;
    gap: 8px;
`;

const MessageContent = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${props => props.$isSelected ? 'rgba(255, 255, 255, 0.85)' : '#64748b'};
    font-size: 14px;
    flex: 1;
    transition: all 0.3s ease;
    font-weight: 400;
`;

const TimeAndBadge = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
`;

const MessageTime = styled.span`
    color: ${props => props.$isSelected ? 'rgba(255, 255, 255, 0.75)' : '#94a3b8'};
    font-size: 12px;
    white-space: nowrap;
    margin-left: 8px;
    transition: all 0.3s ease;
    font-weight: 500;
`;

const NotificationBadge = styled.div`
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    border-radius: 12px;
    min-width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    margin-left: auto;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
    border: 2px solid white;
    animation: pulse-badge 2s infinite;
    
    @keyframes pulse-badge {
        0% {
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }
        50% {
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5), 0 0 0 4px rgba(239, 68, 68, 0.2);
        }
        100% {
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }
    }
    
    ${props => props.$isSelected && `
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.8);
        animation: none;
    `}
`;

const ChatsComponent = ({onSelectChat}) => {
    const { t, i18n } = useTranslation('chat');
    const { userId } = useContext(AuthContext);
    const { state, dispatch } = useContext(ChatContext); 
    const { currentChat } = state;
    const [selectedChatId, setSelectedChatId] = useState(null);
    const { chats } = state;

    useEffect(() => {
        if (currentChat && currentChat.id) {
            console.log('ChatsComponent: Updating selectedChatId to:', currentChat.id);
            setSelectedChatId(currentChat.id);
        }
    }, [currentChat]);

    useEffect(() => {
        if (!userId) {
            return;
        }
        const fetchChats = async () => {
            try {
                const data = await chatService.fetchChats(userId);
                console.log("response.data : ", data)
                dispatch({ type: 'SET_CHATS', payload: data });
            } catch (error) {
                console.error("Failed to fetch chats: ", error);
            }
        };
        fetchChats();
    }, [userId, dispatch, currentChat]);
    

    const handleSelectChat = (chat) => {
        setSelectedChatId(chat.id);
        dispatch({ type: 'SET_CURRENT_CHAT', payload: chat }); 
        onSelectChat(chat)
    };

    const getDisplayLastMessage = (content) => {
        if (!content) return '';
        const text = String(content);
        const isUrl = text.startsWith('http://') || text.startsWith('https://');
        return isUrl ? t('messages.photo') : text;
    };

    return (
        <Chats>
            {Array.isArray(chats) && chats.map(chat => {
                const isSelected = selectedChatId === chat.id;
                console.log(`Chat ${chat.id}: isSelected=${isSelected}, selectedChatId=${selectedChatId}`);
                return (
                    <UserChat 
                        key={chat.id} 
                        onClick={() => handleSelectChat(chat)}
                        $isSelected={isSelected}
                    >                
                        <UserChatImg 
                            src={`${chat.recipientImageUrl}`} 
                            alt="" 
                            $isSelected={isSelected}
                        />
                        
                        <UserChatInfo>
                            <UserName $isSelected={isSelected}>
                                {getLocalizedChatRecipientName(chat, i18n.language)}
                            </UserName>
                            <MessageAndTime>
                                <MessageContent $isSelected={isSelected}>
                                    {getDisplayLastMessage(chat.latestMessageContent)}
                                </MessageContent>
                                <TimeAndBadge>
                                    <MessageTime $isSelected={isSelected}>
                                        {formatChatTimestamp(chat.latestMessageTime || chat.updatedAt, { t, language: i18n.language })}
                                    </MessageTime>
                                    {chat.unreadMessagesCount > 0 && (
                                        <NotificationBadge $isSelected={isSelected}>
                                            {chat.unreadMessagesCount > 9 ? '9+' : chat.unreadMessagesCount}
                                        </NotificationBadge>
                                    )}
                                </TimeAndBadge>
                            </MessageAndTime>
                        </UserChatInfo>
                    </UserChat>
                );
            })}
        </Chats>
    );
};

export default ChatsComponent;