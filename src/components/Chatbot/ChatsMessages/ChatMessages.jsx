// import React, { useState, useEffect } from 'react';

// const ChatMessages = ({ chatId }) => {
//   const [messages, setMessages] = useState([]);

//   useEffect(() => {
//     const fetchMessages = async () => {
//         try {
//           const response = await fetch(`http://localhost:8000/v1/chat/${chatId}/messages`);
//           if (response.ok) {
//             const messagesData = await response.json();
//             setMessages(messagesData);
//           } else {
//             console.error('Failed to fetch messages');
//           }
//         } catch (error) {
//           console.error('Error fetching messages:', error);
//         }
//     };
    
//     if (chatId) {
//       fetchMessages();
//     }
//   }, [chatId]);

//   return (
//     <div>
//       {messages.map((message, index) => (
//         <div key={index}>
//             user :{message.user_message}
//             llm :{message.llm_message}
//         </div>
//       ))}
//     </div>
//   );
// };

// export default ChatMessages;