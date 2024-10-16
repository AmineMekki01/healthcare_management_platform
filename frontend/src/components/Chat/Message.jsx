import React from 'react'
import styled from 'styled-components'
import moment from 'moment';

const Message = styled.div`
    display: flex;
    gap : 20px;
    margin-bottom: 20px;

    &.owner {
        flex-direction: row-reverse; 
    }
`;

const MessageInfo = styled.div`
    display: flex;
    flex-direction: column;
    color: gray;
    font-weight: 300;
    max-width: 20%;
`;

const UserImg = styled.img`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
`;

const MessageContent = styled.div`
    max-width: 80%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-start; 
    
    p {
        color: white;
        padding: 10px;
        border-radius: 0px 10px 10px 10px;
        font-size: 14px;
        max-width: max-content;
        background-color: #b44b8e;
    }

    &.owner {
        align-items: flex-end; 
        p {
            background-color: #29355b;
            border-radius: 10px 0px 10px 10px;
        }
    }
`;

const MessageImage = styled.img`
    max-width: 300px;
    border-radius: 10px;
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
            <MessageInfo>

                <UserImg src={isOwner ? `http://localhost:3001/${senderImage}` : `http://localhost:3001/${recipientImage}` } alt=""/>

            </MessageInfo>
            <MessageContent className={isOwner ? 'owner' : 'not-owner'}>
                {renderMessageContent(message.content)}
                <span>{formatMessageDate(message.created_at)}</span>
            </MessageContent>
        </Message>
    );
});

export default MessageComponent;
