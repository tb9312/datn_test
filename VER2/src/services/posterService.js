import { apiClientV1 } from "./api";

const posterService = {
  async getPoster() {
    try {
      // response đã là response.data
      const response = await apiClientV1.get("/poster");

      console.log("📢 POSTER RESPONSE:", response);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ getPoster error:", error);
      return {
        success: false,
        data: null,
        message: error.message || "Không lấy được thông báo hệ thống",
      };
    }
  },
};
export default posterService;