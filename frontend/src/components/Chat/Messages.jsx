import React from 'react'
import styled from 'styled-components'
import MessageComponent from './Message'


const Messages = styled.div`
    background-color: #ddddf7;
    padding: 10px;
    height: calc(100% - 100px);
    overflow-y: scroll;
`;

const MessagesComponent = ({ messages, currentUserId, senderImage, recipientImage }) => {
    console.log("messages : ", messages)
  return (
      <Messages>
          {messages &&
              messages.map((msg, index) => (
                    <MessageComponent
                    key={index}
                    message={msg}
                    isOwner={msg.sender_id === currentUserId}
                    senderImage={senderImage}
                    recipientImage={recipientImage}
                />
              ))}
      </Messages>
  );
};

export default MessagesComponent