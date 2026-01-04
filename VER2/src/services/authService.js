// [file name]: services/authService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3370';

// Tạo các API client cho các version khác nhau
const createApiClient = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
  });

  // Request interceptor để thêm token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor xử lý lỗi
  instance.interceptors.response.use(
    (response) => {
      // Trả về data trực tiếp
      return response.data;
    },
    (error) => {
      // Xử lý lỗi 401 (unauthorized)
      if (error.response?.status === 401) {
        // localStorage.removeItem('token');
        // localStorage.removeItem('user');
        // Chỉ redirect nếu không phải trang auth
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && 
            !currentPath.includes('/register') &&
            !currentPath.includes('/forgot-password')) {

        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Tạo các client RIÊNG BIỆT với userService.js của bạn
export const profileApiV1 = createApiClient(`${API_BASE_URL}/api/v1`);
export const profileApiV3 = createApiClient(`${API_BASE_URL}/api/v3`);

// Service chuyên cho PROFILE (không ảnh hưởng đến userService.js cũ)
const authService = {
  // ========== PROFILE FUNCTIONS ==========
  async getProfile() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isManager = user.role === 'MANAGER' || user.role === 'manager';
      const apiClient = isManager ? profileApiV3 : profileApiV1;
      
      const response = await apiClient.get('/users/detail');
      
      if (response.code !== 200) {
        return {
          success: false,
          message: response.message || 'Không thể lấy thông tin'
        };
      }
      
      return {
        success: true,
        data: response.info,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi kết nối'
      };
    }
  },

  async updateProfile(updateData) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isManager = user.role === 'MANAGER' || user.role === 'manager';
      const apiClient = isManager ? profileApiV3 : profileApiV1;
      
      // Tạo FormData nếu có file
      let requestData = updateData;
      let headers = {};
      
      if (updateData.avatarFile) {
        const formData = new FormData();
        formData.append('avatar', updateData.avatarFile);
        
        // Thêm các field khác
        Object.keys(updateData).forEach(key => {
          if (key !== 'avatarFile' && updateData[key] !== undefined) {
            formData.append(key, updateData[key]);
          }
        });
        
        requestData = formData;
        headers = { 'Content-Type': 'multipart/form-data' };
      }
      
      const response = await apiClient.patch('/users/edit', requestData, { headers });
      
      if (response.code !== 200) {
        return {
          success: false,
          message: response.message || 'Cập nhật thất bại'
        };
      }
      
      return {
        success: true,
        data: response,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Cập nhật thất bại'
      };
    }
  },

  // ========== AUTH FUNCTIONS (chỉ cho profile, không trùng với userService) ==========
  async logout() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isManager = user.role === 'MANAGER' || user.role === 'manager';
      const apiClient = isManager ? profileApiV3 : profileApiV1;
      
      const response = await apiClient.get('/users/logout');
      return {
        success: response.code === 200,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Đăng xuất thất bại'
      };
    }
  },

  // ========== UTILITIES ==========
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export default authService;