import React, { createContext, useReducer } from 'react';

export const ChatContext = createContext();

const initialState = {
  chats: [],
  currentChat: null,
  messages: [],
};

const sortChatsByLatestMessage = (chats) => {
  return chats.sort((a, b) => {
    const timeA = new Date(a.latest_message_time || a.updated_at || 0);
    const timeB = new Date(b.latest_message_time || b.updated_at || 0);
    return timeB - timeA; // Descending order (newest first)
  });
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CHATS':
      const chatsArray = Array.isArray(action.payload) ? action.payload : [];
      const sortedChats = sortChatsByLatestMessage([...chatsArray]);
      console.log('SET_CHATS: Sorted chats by latest message time', sortedChats.map(c => ({
        id: c.id, 
        name: `${c.first_name_recipient} ${c.last_name_recipient}`, 
        time: c.latest_message_time
      })));
      return { ...state, chats: sortedChats };

    case 'SET_CURRENT_CHAT':
      return { ...state, currentChat: action.payload };
      
    case 'ADD_OR_UPDATE_CHAT':
      const existingChatIndex = state.chats.findIndex(chat => chat.id === action.payload.id);
      let updatedChats;
      
      if (existingChatIndex >= 0) {
        updatedChats = [...state.chats];
        updatedChats[existingChatIndex] = action.payload;
      } else {
        updatedChats = [action.payload, ...state.chats];
      }
      
      const sortedUpdatedChats = sortChatsByLatestMessage(updatedChats);
      console.log('ADD_OR_UPDATE_CHAT: Sorted chats after adding/updating', sortedUpdatedChats.map(c => ({
        id: c.id, 
        name: `${c.first_name_recipient} ${c.last_name_recipient}`, 
        time: c.latest_message_time
      })));
      
      return { ...state, chats: sortedUpdatedChats };
      
    case 'SET_MESSAGES':
      if (!action.payload || !Array.isArray(action.payload)) {
        return { ...state, messages: [] };
      }
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return {
          ...state, 
          messages: Array.isArray(state.messages) ? [...state.messages, action.payload] : [action.payload]
      };
    case 'UPDATE_LAST_MESSAGE':
      const updatedChatsWithMessage = state.chats.map((chat) =>
          chat.id === action.payload.chatId
              ? { 
                  ...chat, 
                  latest_message_content: action.payload.latest_message_content, 
                  latest_message_time: action.payload.latest_message_time
                }
              : chat
      );
      
      const sortedChatsAfterMessage = sortChatsByLatestMessage(updatedChatsWithMessage);
      console.log('UPDATE_LAST_MESSAGE: Reordered chats after new message', sortedChatsAfterMessage.map(c => ({
        id: c.id, 
        name: `${c.first_name_recipient} ${c.last_name_recipient}`, 
        time: c.latest_message_time
      })));
      
      return {
          ...state,
          chats: sortedChatsAfterMessage,
      };
    default:
      return state;
  }
}

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};
