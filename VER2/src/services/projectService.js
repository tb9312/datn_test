// services/projectService.js
import { apiClientV1, apiClientV3, API_CONFIG } from './api';

// Projects API endpoints
const PROJECT_ENDPOINTS = {
  LIST: '/projects',
  DETAIL: '/projects/detail',
  CREATE: '/projects/create',
  EDIT: '/projects/edit',
  CHANGE_STATUS: '/projects/change-status',
  CHANGE_PRIORITY: '/projects/priority',
  CHANGE_MULTI: '/projects/change-multi',
  DELETE: '/projects/delete',
  COMMENT: {
    ADD: '/projects/comment',
    EDIT: '/projects/comment/edit',
    DELETE: '/projects/comment/delete'
  },
  UPLOAD: '/upload'
};

// Helper để xác định API client dựa trên role của user
const getApiClientByRole = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return apiClientV1;
  
  try {
    const user = JSON.parse(userStr);
    const userRole = user.role?.toUpperCase();
    return userRole === 'MANAGER' ? apiClientV3 : apiClientV1;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return apiClientV1;
  }
};

// ========== XỬ LÝ COMMENT ==========

// Thêm comment
export const addComment = async (projectId, comment) => {
  try {
    const response = await apiClientV1.post(`${PROJECT_ENDPOINTS.COMMENT.ADD}/${projectId}`, { 
      comment 
    });
    
    return {
      success: response?.code === 200,
      message: response?.message || 'Thêm comment thành công',
      data: response?.data || response
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    
    let errorMessage = 'Thêm comment thất bại!';
    if (error.message.includes('401')) {
      errorMessage = 'Bạn cần đăng nhập để thêm comment!';
    }
    
    throw new Error(errorMessage);
  }
};

// Sửa comment
export const editComment = async (commentId, comment) => {
  try {
    const response = await apiClientV1.patch(
      `${PROJECT_ENDPOINTS.COMMENT.EDIT}/${commentId}`, 
      { comment }
    );
    
    return {
      success: response?.code === 200,
      message: response?.message || 'Sửa comment thành công',
      data: response?.data || response
    };
  } catch (error) {
    console.error('Error editing comment:', error);
    
    let errorMessage = 'Sửa comment thất bại!';
    if (error.message.includes('400') && error.message.includes('khong duoc sua')) {
      errorMessage = 'Bạn không được sửa comment của người khác!';
    }
    
    throw new Error(errorMessage);
  }
};

// Xóa comment
export const deleteComment = async (commentId) => {
  try {
    const response = await apiClientV1.patch(
      `${PROJECT_ENDPOINTS.COMMENT.DELETE}/${commentId}`
    );
    
    return {
      success: response?.code === 200,
      message: response?.message || 'Xóa comment thành công',
      data: response?.data || response
    };
  } catch (error) {
    console.error('Error deleting comment:', error);
    
    let errorMessage = 'Xóa comment thất bại!';
    if (error.message.includes('400') && error.message.includes('khong duoc xoa')) {
      errorMessage = 'Bạn không được xóa comment của người khác!';
    }
    
    throw new Error(errorMessage);
  }
};

// Helper để xác định API client cho project detail
const getDetailApiClient = () => {
  return apiClientV1;
};

// Thêm hàm upload file riêng
export const uploadFile = async (file) => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1${PROJECT_ENDPOINTS.UPLOAD}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Lấy danh sách dự án
export const getProjects = async (params = {}) => {
  try {
    const apiClient = getApiClientByRole();
    const response = await apiClient.get(PROJECT_ENDPOINTS.LIST, { params });
    
    if (!response) {
      console.error('❌ ERROR: Empty response from getProjects');
      return {
        success: false,
        data: [],
        pagination: {
          page: params.page || 1,
          pageSize: params.limit || 10,
          total: 0
        }
      };
    }
    
    const data = response.data || response;
    const paginationData = response.pagination || {
      page: params.page || 1,
      pageSize: params.limit || 10,
      total: Array.isArray(data) ? data.length : 0
    };
    
    return {
      success: true,
      data: Array.isArray(data) ? data : [],
      pagination: paginationData
    };
  } catch (error) {
    console.error('Error fetching projects:', error);
    
    return {
      success: false,
      data: [],
      pagination: {
        page: params.page || 1,
        pageSize: params.limit || 10,
        total: 0
      }
    };
  }
};

// Lấy chi tiết dự án
export const getProjectDetail = async (id) => {
  try {
    console.log('=== DEBUG GET PROJECT DETAIL ===');
    console.log('Project ID:', id);
    const apiClient = getDetailApiClient();
    
    console.log('API Endpoint:', `${PROJECT_ENDPOINTS.DETAIL}/${id}`);
    const response = await apiClient.get(`${PROJECT_ENDPOINTS.DETAIL}/${id}`);
    
    return {
      success: response?.code === 200 || response?.success === true,
      data: response?.data || response,
      comments: response?.comment || []
    };
  } catch (error) {
    console.error('=== ERROR GETTING PROJECT DETAIL ===');
    console.error('Error fetching project detail:', error);
    throw error;
  }
};

// ========== THÊM: Lấy tasks của một parent project ==========
export const getTasksByParent = async (parentId, params = {}) => {
  try {
    console.log('📋 SERVICE: Get tasks for parent:', parentId);
    console.log('Params:', params);
    
    // Xác định API URL dựa trên user role
    const userStr = localStorage.getItem('user');
    let apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v1`;
    
    if (userStr) {
      const user = JSON.parse(userStr);
      const userRole = user.role?.toUpperCase();
      if (userRole === 'MANAGER') {
        apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v3`;
      }
    }
    
    const url = `${apiBaseUrl}/projects/${parentId}/tasks`;
    console.log('API URL:', url);
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const queryParams = new URLSearchParams(params).toString();
    const fullUrl = queryParams ? `${url}?${queryParams}` : url;
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    const responseData = await response.json();
    console.log('Response data:', responseData);
    
    return {
      success: responseData.code === 200,
      code: responseData.code || response.status,
      message: responseData.message || 'Thành công',
      data: responseData.data || [],
      total: responseData.total || 0
    };
    
  } catch (error) {
    console.error('🔥 ERROR in getTasksByParent:', error);
    return {
      success: false,
      code: 500,
      message: error.message || 'Lỗi khi tải danh sách công việc',
      data: [],
      total: 0
    };
  }
};

// Tạo dự án mới
export const createProject = async (formData, isSubProject = false) => {
  try {
    console.log('🚀 === SERVICE: CREATE PROJECT ===');
    console.log('Is SubProject/Task?', isSubProject);
    
    // Xác định API dựa trên user role VÀ loại project
    const userStr = localStorage.getItem('user');
    let apiBaseUrl;
    
    if (userStr) {
      const user = JSON.parse(userStr);
      const userRole = user.role?.toUpperCase();
      
      console.log('User Role:', userRole);
      console.log('Is SubProject:', isSubProject);
      
      if (isSubProject) {
        // TASK: LUÔN dùng API v1 (cho cả Manager và User)
        apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v1`;
        console.log('✅ TASK -> Using API v1');
      } else {
        // PARENT PROJECT: Chỉ Manager dùng v3
        if (userRole === 'MANAGER') {
          apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v3`;
          console.log('✅ PARENT PROJECT -> Using API v3 (Manager only)');
        } else {
          // User cố gắng tạo parent project -> gửi về v1 nhưng sẽ bị server reject
          apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v1`;
          console.log('⚠ User trying to create parent project -> will be rejected by server');
        }
      }
    } else {
      apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v1`;
    }
    
    const endpoint = PROJECT_ENDPOINTS.CREATE;
    console.log('API URL:', `${apiBaseUrl}${endpoint}`);
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });
    
    console.log('Response Status:', response.status);
    
    const responseText = await response.text();
    console.log('Raw Response:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Parse JSON error:', e);
      return {
        success: false,
        code: 500,
        message: 'Response không phải JSON hợp lệ'
      };
    }
    
    return {
      success: responseData.code === 200,
      code: responseData.code || response.status,
      message: responseData.message || (responseData.success ? 'Thành công' : 'Thất bại'),
      data: responseData.data
    };
    
  } catch (error) {
    console.error('🔥 SERVICE ERROR:', error);
    return {
      success: false,
      code: 500,
      message: 'Lỗi kết nối: ' + error.message
    };
  }
};

// Cập nhật dự án
export const updateProject = async (id, formData) => {
  try {
    console.log('=== UPDATE PROJECT SERVICE ===');
    console.log('Project ID:', id);
    
    const isFormData = formData instanceof FormData;
    console.log('Is FormData:', isFormData);
    
    // Xác định API URL dựa trên user role
    const userStr = localStorage.getItem('user');
    let apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v1`;
    
    if (userStr) {
      const user = JSON.parse(userStr);
      const userRole = user.role?.toUpperCase();
      if (userRole === 'MANAGER') {
        apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v3`;
        console.log('✓ Using API v3 for Manager');
      } else {
        console.log('✓ Using API v1 for User');
      }
    }
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const url = `${apiBaseUrl}${PROJECT_ENDPOINTS.EDIT}/${id}`;
    
    console.log('PATCH URL:', url);
    
    // Gửi request
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });
    
    console.log('Response status:', response.status);
    
    // Đọc response text
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Parsed response:', responseData);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return {
        success: false,
        code: 500,
        message: 'Invalid JSON response from server',
        data: null
      };
    }
    
    // Kiểm tra code trong response body
    const success = responseData.code === 200;
    
    return {
      success: success,
      code: responseData.code || response.status,
      message: responseData.message || (success ? 'Thành công' : 'Thất bại'),
      data: responseData.data || responseData
    };
    
  } catch (error) {
    console.error('=== UPDATE PROJECT ERROR ===');
    console.error('Error:', error);
    
    return {
      success: false,
      code: 500,
      message: error.message || 'Lỗi kết nối đến server',
      data: null
    };
  }
};

// Xóa dự án
export const deleteProject = async (id) => {
  try {
    console.log('=== DEBUG DELETE PROJECT SERVICE ===');
    console.log('Project ID:', id);
    
    // Lấy token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
    }
    
    // Xác định API URL dựa trên user role
    const userStr = localStorage.getItem('user');
    let apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v1`;
    
    if (userStr) {
      const user = JSON.parse(userStr);
      const userRole = user.role?.toUpperCase();
      if (userRole === 'MANAGER') {
        apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v3`;
        console.log('✓ Using API v3 for Manager delete');
      } else {
        console.log('✓ Using API v1 for User delete');
      }
    }
    
    const url = `${apiBaseUrl}${PROJECT_ENDPOINTS.DELETE}/${id}`;
    console.log('Delete URL:', url);
    
    // Gửi request PATCH
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Delete response status:', response.status);
    
    const responseText = await response.text();
    console.log('Raw delete response:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return {
        success: false,
        message: 'Invalid JSON response from server'
      };
    }
    
    // Kiểm tra response
    const success = responseData.code === 200;
    
    return {
      success: success,
      code: responseData.code || response.status,
      message: responseData.message || (success ? 'Xóa thành công' : 'Xóa thất bại'),
      data: responseData.data
    };
    
  } catch (error) {
    console.error('=== ERROR IN DELETE PROJECT ===');
    console.error('Error:', error);
    
    return {
      success: false,
      code: 500,
      message: error.message || 'Lỗi kết nối đến server'
    };
  }
};

// Thay đổi trạng thái dự án
export const changeProjectStatus = async (id, status) => {
  try {
    const apiClient = getApiClientByRole();
    const response = await apiClient.patch(`${PROJECT_ENDPOINTS.CHANGE_STATUS}/${id}`, { status });
    
    return {
      success: response?.code === 200 || response?.success === true,
      message: response?.message || 'Cập nhật trạng thái thành công'
    };
  } catch (error) {
    console.error('Error changing project status:', error);
    throw error;
  }
};

// Thay đổi độ ưu tiên dự án
export const changeProjectPriority = async (id, priority) => {
  try {
    const apiClient = getApiClientByRole();
    const response = await apiClient.patch(`${PROJECT_ENDPOINTS.CHANGE_PRIORITY}/${id}`, { priority });
    
    return {
      success: response?.code === 200 || response?.success === true,
      message: response?.message || 'Cập nhật độ ưu tiên thành công'
    };
  } catch (error) {
    console.error('Error changing project priority:', error);
    throw error;
  }
};

// Thay đổi nhiều dự án cùng lúc
export const changeMultipleProjects = async (ids, key, value) => {
  try {
    const apiClient = getApiClientByRole();
    const response = await apiClient.patch(PROJECT_ENDPOINTS.CHANGE_MULTI, {
      ids,
      key,
      value
    });
    
    return {
      success: response?.code === 200 || response?.success === true,
      message: response?.message || 'Cập nhật hàng loạt thành công'
    };
  } catch (error) {
    console.error('Error changing multiple projects:', error);
    throw error;
  }
};

// Lấy sub-projects (dự án con) - DÙNG API CŨ (có thể xóa sau khi chuyển sang getTasksByParent)
export const getSubProjects = async (parentId, params = {}) => {
  try {
    const response = await apiClientV1.get(PROJECT_ENDPOINTS.LIST, {
      params: {
        ...params,
        parentId
      }
    });
    
    return {
      success: true,
      data: response || []
    };
  } catch (error) {
    console.error('Error fetching sub-projects:', error);
    throw error;
  }
};

// Export tất cả functions - THÊM getTasksByParent
export default {
  getProjects,
  getProjectDetail,
  getTasksByParent, // THÊM DÒNG NÀY
  getSubProjects,
  createProject,
  updateProject,
  deleteProject,
  changeProjectStatus,
  changeProjectPriority,
  changeMultipleProjects,
  addComment,
  editComment,
  deleteComment,
  uploadFile
};