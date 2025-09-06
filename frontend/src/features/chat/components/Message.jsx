import React from 'react'
import { useTranslation } from 'react-i18next';
import styled from 'styled-components'
import moment from 'moment';

const Message = styled.div`
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    align-items: flex-end;

    &.owner {
        flex-direction: row-reverse; 
        justify-content: flex-start;
        
        .message-info {
            display: none;
        }
    }

    &.not-owner {
        flex-direction: row;
        justify-content: flex-start;
    }

    /* Force positioning regardless of RTL */
    &.owner {
        margin-left: auto;
        margin-right: 0;
    }

    &.not-owner {
        margin-left: 0;
        margin-right: auto;
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
        padding: 14px 18px;
        border-radius: 20px 20px 20px 6px;
        font-size: 15px;
        line-height: 1.5;
        max-width: max-content;
        color: #000000;
        background-color:rgba(220, 220, 220, 0.89);
        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
        position: relative;
        margin: 0;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        direction: ltr; /* Force LTR for message content */
        text-align: left; /* Force left alignment for message text */
        
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
            color: #ffffff;
            border-radius: 20px 20px 6px 20px;
            direction: ltr; /* Force LTR for user message content */
            text-align: left; /* Force left alignment for user message text */
            
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

    &.not-owner {
        align-items: flex-start;
        p {
            direction: ltr; /* Force LTR for other user message content */
            text-align: left; /* Force left alignment for other user message text */
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
    const { t } = useTranslation('chat');

    const formatMessageDate = (dateString) => {
        if (!dateString) {
            return t('ui.justNow');
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
                return <MessageImage src={content} alt={t('ui.uploadedImage')} />;
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
