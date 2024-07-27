// WebSocketContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { ChatContext } from './ChatContext'; 

export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ userId, children }) => {
    const [websocket, setWebsocket] = useState(null);
    const { dispatch } = useContext(ChatContext);

    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:3001/ws?userId=${userId}`);

        ws.onopen = () => {
            console.log("Connected to WebSocket");
        };

        ws.onmessage = (message) => {
            console.log("Received message:", message.data);
            const msgData = JSON.parse(message.data);
            dispatch({ type: 'ADD_MESSAGE', payload: msgData });
        };

        ws.onclose = () => {
            console.log("Disconnected from WebSocket server");
        };

        setWebsocket(ws);

        return () => {
            ws.close();
        };
    }, [userId, dispatch]);

    return (
        <WebSocketContext.Provider value={websocket}>
            {children}
        </WebSocketContext.Provider>
    );
};
