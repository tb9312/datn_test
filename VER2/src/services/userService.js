import axios from 'axios';

const API_BASE_URL = 'http://localhost:3370/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {

    }
    throw error.response?.data || error;
  }
);

const userService = {
  // Lấy danh sách users (cho assignee)
  async getUsers(params = {}) {
    try {
      const response = await apiClient.get('/users/listuser', { 
        params: {
          page: params.page || 1,
          limit: params.limit || 100,
          search: params.search
        }
      });
      
      console.log('✅ User API Response Structure:', {
        keys: Object.keys(response),
        hasUsers: 'users' in response,
        usersLength: response.users?.length,
        fullResponse: response
      });
      
      // 🎯 QUAN TRỌNG: API của bạn trả về {code: 200, message: 'Thành công', users: [...]}
      return {
        success: response.code === 200,
        data: response.users || [],  // <-- DÙNG response.users
        message: response.message,
        code: response.code
      };
      
    } catch (error) {
      console.error('❌ Error in userService.getUsers:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Có lỗi xảy ra khi tải danh sách người dùng'
      };
    }
  },

  // Lấy user by id
  async getUserById(id) {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  handleError(error) {
    console.error('User API Error:', error);
    
    if (error.message) {
      return new Error(error.message);
    }
    
    return new Error('Có lỗi xảy ra khi tải danh sách người dùng');
  }
};

export default userService;