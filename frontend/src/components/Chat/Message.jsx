import React from 'react'
import styled from 'styled-components'
import moment from 'moment';

const Message = styled.div`
    display: flex;
    gap : 20px;
    margin-bottom: 20px;

    &.owner {
        flex-direction: row-reverse; // Right-align the message if it's the user's own message
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
    
    &.owner {
        align-items: flex-end; 
        p {
            background-color: #29355b;
        }
    }
    

    p {
        color: white;
        padding: 10px;
        border-radius: 10px 0px 10px 10px;
        font-size: 14px;
        max-width: max-content;
        background-color: #b44b8e;

`;


const MessageComponent = React.memo(({ message, isOwner }) => {
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
        <Message className={isOwner ? 'owner' : 'not-owner'}>
            <MessageInfo>
                <UserImg src="https://images.pexels.com/photos/15835264/pexels-photo-15835264/free-photo-of-woman-wearing-a-hat.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load" alt=""/>
                <span>{formatMessageDate(message.created_at)}</span>
            </MessageInfo>
            <MessageContent className={isOwner ? 'owner' : 'not-owner'}>
                <p>{message.content}</p>
            </MessageContent>
        </Message>
    );
});

export default MessageComponent