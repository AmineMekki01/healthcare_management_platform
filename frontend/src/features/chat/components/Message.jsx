import React, {useContext} from 'react'
import styled from 'styled-components'
import moment from 'moment';
import { AuthContext } from './../../../features/auth/context/AuthContext';

const Message = styled.div`
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    align-items: flex-end;

    &.owner {
        flex-direction: row-reverse; 
        
        .message-info {
            display: none;
        }
    }
`;

const MessageInfo = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 36px;
`;

const UserImg = styled.img`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(226, 232, 240, 0.8);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    
    &:hover {
        transform: scale(1.05);
        border-color: rgba(102, 126, 234, 0.4);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
`;

const MessageTime = styled.span`
    font-size: 12px;
    color: #a0aec0;
    text-align: center;
    opacity: 0;
    position: absolute;
    bottom: -22px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 6px 10px;
    border-radius: 8px;
    white-space: nowrap;
    pointer-events: none;
    transition: all 0.3s ease;
    z-index: 10;
    font-weight: 500;
    backdrop-filter: blur(10px);
    
    &::before {
        content: '';
        position: absolute;
        top: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 5px solid rgba(0, 0, 0, 0.85);
    }
`;

const MessageContent = styled.div`
    max-width: 75%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
    position: relative;
    cursor: pointer;
    
    p {
        color: #ffffff;
        padding: 14px 18px;
        border-radius: 20px 20px 20px 6px;
        font-size: 15px;
        line-height: 1.5;
        max-width: max-content;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
        position: relative;
        margin: 0;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);
        }
    }

    &:hover ${MessageTime} {
        opacity: 1;
    }

    &.owner {
        align-items: flex-end; 
        p {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            border-radius: 20px 20px 6px 20px;
            
            &:hover {
                box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
            }
        }
        
        ${MessageTime} {
            bottom: -22px;
            right: 0;
            left: auto;
            transform: none;
        }
    }
`;

const MessageImage = styled.img`
    max-width: 280px;
    max-height: 220px;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover {
        transform: scale(1.02);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }
`;

const MessageComponent = React.memo(({ message, isOwner, senderImage, recipientImage }) => {

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

    const renderMessageContent = (content) => {
        console.log("content : ", content)
        if (content) {
            if (content.startsWith("http")) {
                return <MessageImage src={content} alt="uploaded image" />;
            } else {
                return <p>{content}</p>;
            }
        }
        
    };
    return (
        <Message className={isOwner ? 'owner' : 'not-owner'}>
            {!isOwner && (
                <MessageInfo className="message-info">
                    <UserImg src={recipientImage} alt=""/>
                </MessageInfo>
            )}
            <MessageContent className={isOwner ? 'owner' : 'not-owner'}>
                {renderMessageContent(message.content)}
                <MessageTime>{formatMessageDate(message.createdAt)}</MessageTime>
            </MessageContent>
        </Message>
    );
});

export default MessageComponent;
