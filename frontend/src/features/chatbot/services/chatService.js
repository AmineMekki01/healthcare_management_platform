import axiosInstance from '../../../components/axiosConfig';

const API_BASE_URL = 'http://localhost:8000/api/v1/chatbot';

class ChatService {
  async createChat(userId, title) {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/chats`, {
        title,
      }, {
        params: { user_id: userId }
      });
      console.log("User chats ", response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  async getUserChats(userId, limit = 20) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/users/${userId}/chats`);

      return response.data;
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  }

  async getChat(chatId, userId) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/chats/${chatId}`, {
        params: { user_id: userId }
      });
      console.log("User chat ", response.data);

      return response.data;
    } catch (error) {
      console.error('Error fetching chat:', error);
      throw error;
    }
  }

  async deleteChat(chatId, userId) {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/chats/${chatId}`, {
        params: { user_id: userId }
      });

      return response.data;
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }

  async updateChatTitle(chatId, userId, title) {
    try {
      const response = await axiosInstance.put(`${API_BASE_URL}/chats/${chatId}`, {
        title
      }, {
        params: { user_id: userId }
      });

      return response.data;
    } catch (error) {
      console.error('Error updating chat:', error);
      throw error;
    }
  }
}

const chatService = new ChatService();
export default chatService;
