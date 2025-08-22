import axios from '../../../components/axiosConfig';

class FeedService {
  getImageUrl(imagePath) {
    if (!imagePath) return null;
    return `http://localhost:3001/${imagePath}`;
  }

  async getFeed(params) {
    try {
      const { userId, userType, ...filteredParams } = params || {};
      
      const response = await axios.get('/api/v1/feed', {
        params: filteredParams,
      });
      console.log('Feed fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching feed:', error);
      throw error;
    }
  }

  async getPost(postId, params) {
    try {
      const response = await axios.get(`/api/v1/feed/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  async createPost(postData) {
    try {
      const response = await axios.post('/api/v1/feed/posts', postData);
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async updatePost(postId, postData) {
    try {
      const response = await axios.put(`/api/v1/feed/posts/${postId}`, postData);
      return response.data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  async deletePost(postId) {
    try {
      const response = await axios.delete(`/api/v1/feed/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  async likePost(postId, params) {
    try {
      const response = await axios.post(`/api/v1/feed/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }

  async unlikePost(postId, params) {
    try {
      const response = await axios.delete(`/api/v1/feed/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  }

  async getComments(postId, params) {
    try {
      const response = await axios.get(`/api/v1/feed/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  async addComment(postId, commentData, params) {
    try {
      const response = await axios.post(`/api/v1/feed/posts/${postId}/comments`, commentData);
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  async getDoctorPosts(doctorId) {
    try {
      const response = await axios.get(`/api/v1/feed/doctor/${doctorId}/posts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor posts:', error);
      throw error;
    }
  }

  formatPostData(post) {
    return {
      ...post,
      doctor_avatar_url: this.getImageUrl(post.doctorAvatar),
      formatted_date: new Date(post.createdAt).toLocaleString()
    };
  }

  formatCommentData(comment) {
    return {
      ...comment,
      user_avatar_url: this.getImageUrl(comment.userAvatar),
      formatted_date: new Date(comment.createdAt).toLocaleString()
    };
  }
}

export default new FeedService();
