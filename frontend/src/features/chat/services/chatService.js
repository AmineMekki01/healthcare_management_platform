import axios from '../../../components/axiosConfig';

class ChatService {
  async fetchChats(userId) {
    try {
      const response = await axios.get('/api/v1/chats', {
        params: { userID: userId }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      throw error;
    }
  }

  async fetchMessages(chatId) {
    try {
      const response = await axios.get(`/api/v1/chats/${chatId}/messages`);
      console.log('Fetched messages:', response);
      return response.data.messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async sendMessage(message) {
    try {
      const response = await axios.post('/api/v1/chats/send-message', message);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async fetchUserImage(userId, userType) {
    try {
      const response = await axios.get(
        `/api/v1/users/image/${userId}/${userType}`
      );
      console.log('Fetched user image:', response);
      return response.data.imageUrl;
    } catch (error) {
      console.error('Error fetching user image:', error);
      return 'default-avatar.png';
    }
  }

  async uploadImage(formData) {
    try {
      const response = await axios.post('/api/v1/chats/upload-image', formData);
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async searchUsers(username, userId, userType) {
    try {
      const encodedUsername = encodeURIComponent(username);
      const encodedUserId = encodeURIComponent(userId);
      const response = await axios.get(`/api/v1/chats/search/${encodedUsername}/${encodedUserId}`, {
        params: {
          userType: userType
        }
      });
      return response.data.users || [];
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }


  async findOrCreateChat(currentUserId, selectedUserId, currentUserType, selectedUserType) {
    try {
      const response = await axios.get('/api/v1/chats/find-or-create', {
        params: {
          currentUserId,
          selectedUserId,
          currentUserType,
          selectedUserType,
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to find or create chat:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();
export default chatService;
