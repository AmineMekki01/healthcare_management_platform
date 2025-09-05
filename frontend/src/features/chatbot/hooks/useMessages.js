import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../auth/context/AuthContext';
import { messageService } from '../services';

const useMessages = (chatId) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { userId } = useContext(AuthContext);

  const fetchMessages = async () => {
    if (!chatId || !userId || userId === 'null' || userId === null || userId === undefined) {
      setMessages([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const fetchedMessages = await messageService.getChatMessages(chatId, userId);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async ({ content, patientId }) => {
    if (!userId || userId === 'null' || userId === null || userId === undefined) {
      throw new Error('Please log in to send messages');
    }

    const userMessage = { 
      role: 'user', 
      content, 
      created_at: new Date().toISOString() 
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);

    try {
      const aiMessage = await messageService.sendMessage({
        content,
        chatId,
        userId,
        patientId
      });
      
      const normalizedAiMessage = { ...aiMessage, role: aiMessage.role };
      setMessages(prevMessages => [
        ...prevMessages.filter(msg => msg.content !== content),
        userMessage,
        normalizedAiMessage
      ]);
      
      return aiMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      setMessages(prevMessages => prevMessages.filter(msg => msg.content !== content));
      throw error;
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await messageService.deleteMessage(messageId, userId);
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message');
      throw error;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [chatId, userId]);

  return {
    messages,
    setMessages,
    isLoading,
    error,
    sendMessage,
    deleteMessage,
    fetchMessages
  };
};

export default useMessages;
