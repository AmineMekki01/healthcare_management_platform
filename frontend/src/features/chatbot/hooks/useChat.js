import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../auth/context/AuthContext';
import { chatService } from '../services';

const useChat = () => {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { userId } = useContext(AuthContext);

  const fetchChats = async () => {
    if (!userId || userId === 'null' || userId === null || userId === undefined) {
      console.log('Skipping chat fetch - no valid userId:', userId);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await chatService.getUserChats(userId);
      setChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to fetch chats');
    } finally {
      setIsLoading(false);
    }
  };

  const createChat = async (title) => {
    if (!userId || userId === 'null' || userId === null || userId === undefined) {
      throw new Error('Please log in to create a chat');
    }

    try {
      const newChat = await chatService.createChat(userId, title);
      setChats(prevChats => [...prevChats, {
        id: newChat.id,
        title: newChat.title,
        created_at: newChat.created_at,
        updated_at: newChat.updated_at,
        message_count: 0,
        last_message: null
      }]);
      return newChat;
    } catch (error) {
      console.error('Error creating chat:', error);
      setError('Failed to create chat');
      throw error;
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await chatService.deleteChat(chatId, userId);
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
      setError('Failed to delete chat');
      throw error;
    }
  };

  const updateChatHistory = (chatId, lastMessageDate) => {
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat.id === chatId) {
          return { ...chat, last_message_date: lastMessageDate };
        }
        return chat;
      });
      return updatedChats.sort((a, b) => new Date(b.last_message_date) - new Date(a.last_message_date));
    });
  };

  useEffect(() => {
    if (chats.length === 0 && userId) {
      fetchChats();
    } else if (chats.length > 0) {
      setIsLoading(false);
    }
  }, [userId, chats.length]);

  return {
    chats,
    setChats,
    isLoading,
    error,
    fetchChats,
    createChat,
    deleteChat,
    updateChatHistory
  };
};

export default useChat;
