import { apiClientV1 } from './api';

/**
 * RAG Service - Frontend API calls
 */
export const ragService = {
  /**
   * Chat với RAG system
   */
  async chat(message, history = []) {
    try {
      const response = await apiClientV1.post('/rag/chat', {
        message,
        history,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Lỗi khi gửi tin nhắn');
    }
  },

  /**
   * Search codebase
   */
  async search(query, limit = 10) {
    try {
      const response = await apiClientV1.post('/rag/search', {
        query,
        limit,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Lỗi khi tìm kiếm');
    }
  },

  /**
   * Check RAG system status
   */
  async getStatus() {
    try {
      const response = await apiClientV1.get('/rag/status');
      return response;
    } catch (error) {
      throw new Error(error.message || 'Lỗi khi kiểm tra status');
    }
  },

  /**
   * Debug: Check current user và token
   */
  async debugGetCurrentUser() {
    try {
      const response = await apiClientV1.get('/rag/me');
      return response;
    } catch (error) {
      throw new Error(error.message || 'Lỗi khi kiểm tra user');
    }
  },

  /**
   * Debug: Log token stored in localStorage
   */
  debugCheckLocalStorage() {
    const token = localStorage.getItem('tokenLogin');
    console.log('[RAG Debug] localStorage.tokenLogin:', token ? token.substring(0, 30) + '...' : 'NOT FOUND');
    console.log('[RAG Debug] All localStorage keys:', Object.keys(localStorage));
    return {
      tokenLogin: token,
      allKeys: Object.keys(localStorage),
    };
  },
};





