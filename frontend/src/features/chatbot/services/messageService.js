import axiosInstance from '../../../components/axiosConfig';

const API_BASE_URL = 'http://localhost:8000/api/v1/chatbot';

class MessageService {

  async sendMessage({ content, chatId, userId, patientId, patientMentions }) {
    try {
      const requestBody = {
        chat_id: chatId,
        user_id: userId,
        content: content,
        role: 'user',
        patient_mentions: patientMentions,
        ...(patientId && { patient_id: patientId })
      };

      const response = await axiosInstance.post(`${API_BASE_URL}/agent-response`, requestBody);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async deleteMessage(messageId, userId) {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/message/${messageId}`, {
        params: { user_id: userId }
      });

      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  async getChatMessages(chatId, userId) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/chats/${chatId}`, {
        params: { user_id: userId }
      });
      
      const chatData = response.data;
      return (chatData.messages || []).map(m => ({ ...m, role: m.role || m.role }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  extractMentionedPatients(content, mentionedPatients) {
    const mentions = [];
    
    for (const [patientName, patientData] of mentionedPatients.entries()) {
      const mentionPattern = new RegExp(`@${patientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`, 'g');
      if (mentionPattern.test(content)) {
        mentions.push(patientData);
      }
    }
    
    return mentions;
  }
}

const messageService = new MessageService();
export default messageService;
