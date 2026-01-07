// services/hotProjectService.js
import { apiClientV1, API_CONFIG, getAuthToken } from "./api";

/**
 * Service riêng cho các chức năng liên quan đến dự án khẩn cấp
 */

// Lấy danh sách dự án khẩn cấp
export const getHotProjects = async (params = {}) => {
  try {
    // Dùng apiClientV1 vì endpoint này ở /api/v1
    const response = await apiClientV1.get("/projects/hotproject", { params });

    console.log("🔥 Hot Projects API Response:", response);

    return {
      success: true,
      data: Array.isArray(response) ? response : response?.data || [],
      total: response?.total || 0,
    };
  } catch (error) {
    console.error("❌ Error fetching hot projects:", error);
    return {
      success: false,
      data: [],
      total: 0,
      message: error.message || "Lỗi khi tải dự án khẩn cấp",
    };
  }
};

// Tạo dự án khẩn cấp
export const createHotProject = async (formData) => {
  try {
    const token = getAuthToken();
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/v1/projects/create_hot`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // KHÔNG set Content-Type để browser tự set multipart/form-data
        },
        body: formData,
      }
    );

    const responseData = await response.json();

    console.log("🔥 Create Hot Project Response:", responseData);

    return {
      success: responseData.code === 200 || responseData.success === true,
      code: responseData.code || response.status,
      message:
        responseData.message ||
        (responseData.success ? "Thành công" : "Thất bại"),
      data: responseData.data,
    };
  } catch (error) {
    console.error("❌ Error creating hot project:", error);
    return {
      success: false,
      code: 500,
      message: "Lỗi kết nối: " + error.message,
      data: null,
    };
  }
};

// Từ chối tham gia dự án khẩn cấp
export const refuseProject = async (projectId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/v1/projects/refuse/${projectId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const responseData = await response.json();

    console.log("🔥 Refuse Project Response:", responseData);

    return {
      success: responseData.code === 200 || responseData.success === true,
      code: responseData.code || response.status,
      message: responseData.message || "Thành công",
    };
  } catch (error) {
    console.error("❌ Error refusing project:", error);
    return {
      success: false,
      code: 500,
      message: error.message || "Lỗi kết nối",
    };
  }
};

export default {
  getHotProjects,
  createHotProject,
  refuseProject,
};
//check