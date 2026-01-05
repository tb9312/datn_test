// services/projectService.js
import { apiClientV1, apiClientV3, API_CONFIG, getAuthToken } from './api';

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
    DELETE: '/projects/comment/delete',
  },
  UPLOAD: '/upload',
};

const getApiClientByRole = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return apiClientV1;

  try {
    const user = JSON.parse(userStr);
    const role = user.role?.toUpperCase();
    return role === 'MANAGER' ? apiClientV3 : apiClientV1;
  } catch {
    return apiClientV1;
  }
};

// ========== COMMENT ==========
export const addComment = async (projectId, comment) => {
  const response = await apiClientV1.post(`${PROJECT_ENDPOINTS.COMMENT.ADD}/${projectId}`, {
    comment,
  });

  return {
    success: response?.code === 200 || response?.success === true,
    message: response?.message || 'Thêm comment thành công',
    data: response?.data || response,
  };
};

export const editComment = async (commentId, comment) => {
  const response = await apiClientV1.patch(`${PROJECT_ENDPOINTS.COMMENT.EDIT}/${commentId}`, {
    comment,
  });

  return {
    success: response?.code === 200 || response?.success === true,
    message: response?.message || 'Sửa comment thành công',
    data: response?.data || response,
  };
};

export const deleteComment = async (commentId) => {
  const response = await apiClientV1.patch(`${PROJECT_ENDPOINTS.COMMENT.DELETE}/${commentId}`);

  return {
    success: response?.code === 200 || response?.success === true,
    message: response?.message || 'Xóa comment thành công',
    data: response?.data || response,
  };
};

// Upload file
export const uploadFile = async (file) => {
  const token = getAuthToken(); // ✅ tokenLogin
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1${PROJECT_ENDPOINTS.UPLOAD}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
  return await response.json();
};

// Lấy danh sách dự án
export const getProjects = async (params = {}) => {
  try {
    const apiClient = getApiClientByRole();
    const response = await apiClient.get(PROJECT_ENDPOINTS.LIST, { params });

    const data = response?.data || response || [];
    const pagination = response?.pagination || {
      page: params.page || 1,
      pageSize: params.limit || 10,
      total: Array.isArray(data) ? data.length : 0,
    };

    return { success: true, data: Array.isArray(data) ? data : [], pagination };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return {
      success: false,
      data: [],
      pagination: { page: params.page || 1, pageSize: params.limit || 10, total: 0 },
    };
  }
};

// Lấy chi tiết dự án
export const getProjectDetail = async (id) => {
  const response = await apiClientV1.get(`${PROJECT_ENDPOINTS.DETAIL}/${id}`);

  return {
    success: response?.code === 200 || response?.success === true,
    data: response?.data || response,
    comments: response?.comments || [],
  };
};

// Lấy tasks của parent project
export const getTasksByParent = async (parentId, params = {}) => {
  try {
    const userStr = localStorage.getItem('user');
    let apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v1`;

    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role?.toUpperCase() === 'MANAGER') {
        apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v3`;
      }
    }

    const token = getAuthToken(); // ✅ tokenLogin
    const queryParams = new URLSearchParams(params).toString();
    const url = `${apiBaseUrl}/projects/${parentId}/tasks${queryParams ? `?${queryParams}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();

    return {
      success: responseData.code === 200 || responseData.success === true,
      code: responseData.code || response.status,
      message: responseData.message || 'Thành công',
      data: responseData.data || [],
      total: responseData.total || 0,
    };
  } catch (error) {
    console.error('🔥 ERROR in getTasksByParent:', error);
    return {
      success: false,
      code: 500,
      message: error.message || 'Lỗi khi tải danh sách công việc',
      data: [],
      total: 0,
    };
  }
};

// Tạo dự án mới
export const createProject = async (formData, isSubProject = false) => {
  try {
    const userStr = localStorage.getItem('user');
    let apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v1`;

    if (userStr) {
      const user = JSON.parse(userStr);
      const role = user.role?.toUpperCase();

      if (!isSubProject && role === 'MANAGER') {
        apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v3`;
      }
    }

    const token = getAuthToken(); // ✅ tokenLogin
    const response = await fetch(`${apiBaseUrl}${PROJECT_ENDPOINTS.CREATE}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const responseData = await response.json();

    return {
      success: responseData.code === 200 || responseData.success === true,
      code: responseData.code || response.status,
      message: responseData.message || (responseData.success ? 'Thành công' : 'Thất bại'),
      data: responseData.data,
    };
  } catch (error) {
    return { success: false, code: 500, message: 'Lỗi kết nối: ' + error.message };
  }
};

// Cập nhật dự án
export const updateProject = async (id, formData) => {
  try {
    const userStr = localStorage.getItem('user');
    let apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v1`;

    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role?.toUpperCase() === 'MANAGER') apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v3`;
    }

    const token = getAuthToken(); // ✅ tokenLogin
    const url = `${apiBaseUrl}${PROJECT_ENDPOINTS.EDIT}/${id}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const responseData = await response.json();

    return {
      success: responseData.code === 200 || responseData.success === true,
      code: responseData.code || response.status,
      message: responseData.message || 'Thất bại',
      data: responseData.data || responseData,
    };
  } catch (error) {
    return { success: false, code: 500, message: error.message || 'Lỗi kết nối', data: null };
  }
};

// Xóa dự án
export const deleteProject = async (id) => {
  try {
    const userStr = localStorage.getItem('user');
    let apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v1`;

    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role?.toUpperCase() === 'MANAGER') apiBaseUrl = `${API_CONFIG.BASE_URL}/api/v3`;
    }

    const token = getAuthToken(); // ✅ tokenLogin
    const url = `${apiBaseUrl}${PROJECT_ENDPOINTS.DELETE}/${id}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    const responseData = await response.json();

    return {
      success: responseData.code === 200 || responseData.success === true,
      code: responseData.code || response.status,
      message: responseData.message || 'Thất bại',
      data: responseData.data,
    };
  } catch (error) {
    return { success: false, code: 500, message: error.message || 'Lỗi kết nối' };
  }
};

// Change status/priority/multi (axios instance tự gắn tokenLogin)
export const changeProjectStatus = async (id, status) => {
  const apiClient = getApiClientByRole();
  const response = await apiClient.patch(`${PROJECT_ENDPOINTS.CHANGE_STATUS}/${id}`, { status });

  return {
    success: response?.code === 200 || response?.success === true,
    message: response?.message || 'Cập nhật trạng thái thành công',
  };
};

export const changeProjectPriority = async (id, priority) => {
  const apiClient = getApiClientByRole();
  const response = await apiClient.patch(`${PROJECT_ENDPOINTS.CHANGE_PRIORITY}/${id}`, {
    priority,
  });

  return {
    success: response?.code === 200 || response?.success === true,
    message: response?.message || 'Cập nhật độ ưu tiên thành công',
  };
};

export const changeMultipleProjects = async (ids, key, value) => {
  const apiClient = getApiClientByRole();
  const response = await apiClient.patch(PROJECT_ENDPOINTS.CHANGE_MULTI, { ids, key, value });

  return {
    success: response?.code === 200 || response?.success === true,
    message: response?.message || 'Cập nhật hàng loạt thành công',
  };
};

export const getSubProjects = async (parentId, params = {}) => {
  const response = await apiClientV1.get(PROJECT_ENDPOINTS.LIST, {
    params: { ...params, parentId },
  });

  return { success: true, data: response || [] };
};

export default {
  getProjects,
  getProjectDetail,
  getTasksByParent,
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
  uploadFile,
};