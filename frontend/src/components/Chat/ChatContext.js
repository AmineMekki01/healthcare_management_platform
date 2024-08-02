import React, { createContext, useReducer } from 'react';

export const ChatContext = createContext();

const initialState = {
  chats: [],
  currentChat: null,
  messages: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CHATS':
      return { ...state, chats: Array.isArray(action.payload) ? action.payload : [] };

    case 'SET_CURRENT_CHAT':
      return { ...state, currentChat: action.payload };
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
      return {
          ...state,
          chats: state.chats.map((chat) =>
              chat.id === action.payload.chatId
                  ? { 
                      ...chat, 
                      latest_message_content: action.payload.latest_message_content, 
                      latest_message_time: action.payload.latest_message_time
                    }
                  : chat
          ),
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
