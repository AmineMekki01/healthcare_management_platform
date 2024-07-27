import React from 'react'
import styled from 'styled-components'

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
    align-items: flex-start; // Left-align the message content

    &.owner {
        align-items: flex-end; // Right-align the message content for the user's own message
    }

    p {
        background-color: #29355b;
        color: white;
        padding: 10px;
        border-radius: 10px 0px 10px 10px;
        font-size: 14px;
        max-width: max-content;
    }
`;


const MessageComponent = React.memo(({ message, isOwner }) => {
    return (
        <Message className={isOwner ? 'owner' : ''}>
            <MessageInfo>
                <UserImg src="https://images.pexels.com/photos/15835264/pexels-photo-15835264/free-photo-of-woman-wearing-a-hat.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load" alt=""/>
                <span>Just Now</span>
            </MessageInfo>
            <MessageContent className={isOwner ? 'owner' : ''}>
                <p>{message.content}</p>
            </MessageContent>
        </Message>
    );
});

export default MessageComponent