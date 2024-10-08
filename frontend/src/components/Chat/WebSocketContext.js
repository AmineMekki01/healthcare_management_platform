// WebSocketContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { ChatContext } from './ChatContext'; 
import { AuthContext } from '../Auth/AuthContext';


export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({children}) => {
    const [websocket, setWebsocket] = useState(null);
    const { dispatch } = useContext(ChatContext);
    const {userId } = useContext(AuthContext);


    useEffect(() => {

        if (!userId) {
            return;
        }

        const ws = new WebSocket(`ws://localhost:3001/ws?userId=${userId}`);

        ws.onopen = () => {
            console.log("[Client] Connected to WebSocket");
        };

        ws.onmessage = (message) => {
            const msgData = JSON.parse(message.data);
            if (msgData.type === 'new_message') {
                dispatch({
                    type: 'UPDATE_LAST_MESSAGE',
                    payload: {
                        chatId: msgData.chat_id,
                        latest_message_content: msgData.content,
                        latest_message_time: msgData.created_at,
                    },
                });
            }
            dispatch({ type: 'ADD_MESSAGE', payload: msgData });
        };

        ws.onclose = (event) => {  
            console.log(`[Client] Disconnected from WebSocket server: ${event.code} - ${event.reason}`); 
        };

        ws.onerror = (event) => { 
            console.error("[Client] WebSocket error: ", event); 
        };

        setWebsocket(ws);

        return () => {
            console.log("[Client] Closing WebSocket connection"); 
            ws.close();
        };
    }, [userId, dispatch]);

    return (
        <WebSocketContext.Provider value={websocket}>
            {children}
        </WebSocketContext.Provider>
    );
};