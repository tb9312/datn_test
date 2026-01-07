import { apiClientV1 } from "./api";

const settingService = {
  async getGeneralSetting() {
    try {
      // apiClientV1 đã có baseURL: http://localhost:3370/api/v1
      const response = await apiClientV1.get("/settingGeneral");

      // response đã là response.data (do interceptor)
      return {
        success: response.success,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ getGeneralSetting error:", error);
      return {
        success: false,
        data: null,
        message: error.message || "Không lấy được cấu hình hệ thống",
      };
    }
  },
};

export default settingService;