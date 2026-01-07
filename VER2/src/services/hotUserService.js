// services/hotUserService.js
import { apiClientV3 } from "./api";

/**
 * Service riêng cho việc lấy danh sách user xếp hạng (chỉ dành cho Manager)
 */
export const getHotUsers = async () => {
  try {
    // Chỉ dùng apiClientV3 (Manager API) vì endpoint này chỉ có ở /api/v3
    const response = await apiClientV3.get("/users/listuser_hot");

    console.log("🔥 Hot Users API Response:", response);

    return {
      success: response?.success === true || response?.code === 200,
      data: response?.data || [],
      total: response?.total || 0,
      message: response?.message || "Thành công",
    };
  } catch (error) {
    console.error("❌ Error fetching hot users:", error);
    return {
      success: false,
      data: [],
      total: 0,
      message: error.message || "Lỗi khi tải danh sách thành viên xếp hạng",
    };
  }
};

export default {
  getHotUsers,
};