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
      return { ...state, chats: action.payload };
    case 'SET_CURRENT_CHAT':
      return { ...state, currentChat: action.payload };
    case 'SET_MESSAGES':
        if(!action.payload || !Array.isArray(action.payload)) {
            console.error("Invalid messages payload: ", action.payload);
            return state; // Return current state if payload is invalid
        }
        return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
        return {
            ...state, 
            messages: Array.isArray(state.messages) ? [...state.messages, action.payload] : [action.payload]
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
