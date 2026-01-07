// services/api.js
import axios from "axios";

export const API_CONFIG = {
  BASE_URL: "http://localhost:3370",
  TIMEOUT: 10000,
  ENDPOINTS: {
    AUTH: {
      USER_REGISTER: "/api/v1/users/register",
      USER_LOGIN: "/api/v1/users/login",
      USER_LOGOUT: "/api/v1/users/logout",
      USER_FORGOT_PASSWORD: "/api/v1/users/password/forgot",
      USER_VERIFY_OTP: "/api/v1/users/password/otp",
      USER_RESET_PASSWORD: "/api/v1/users/password/reset",

      MANAGER_LOGIN: "/api/v3/users/login",
      MANAGER_LOGOUT: "/api/v3/users/get",
      MANAGER_LOGOUT: "/api/v3/users/get",

      ADMIN_LOGIN: "/api/v2/users/login",
    },
    // Task endpoints (không cần /api/v1 prefix vì apiClientV1 đã có baseURL)
    TASKS: {
      LIST: "/tasks",
      DETAIL: "/tasks/detail",
      CREATE: "/tasks/create",
      EDIT: "/tasks/edit",
      CHANGE_STATUS: "/tasks/change-status",
      DELETE: "/tasks/delete",
      SUGGEST: "/tasks/suggest-task",
    },

    // Project endpoints (không cần /api/v1 prefix vì apiClientV1 đã có baseURL)
    PROJECTS: {
      LIST: "/projects",
      HOT_LIST: "/projects/hotproject",
      DETAIL: "/projects/detail",
      CREATE: "/projects/create",
      CREATE_HOT: "/projects/create_hot",
      EDIT: "/projects/edit",
      CHANGE_STATUS: "/projects/change-status",
      DELETE: "/projects/delete",
      REFUSE: "/projects/refuse/:id",
    },
    CALENDAR: {
      LIST: "/calendars",
      DETAIL: "/calendars/detail/:id",
      CREATE: "/calendars/create",
      EDIT: "/calendars/edit/:id",
      DELETE: "/calendars/delete/:id",
    },
  },
};

// ✅ DÙNG 1 KEY DUY NHẤT
export const STORAGE_KEYS = {
  TOKEN: "tokenLogin",
  USER: "user",
  API_VERSION: "apiVersion",
};

export const getAuthToken = () => {
  return (
    localStorage.getItem(STORAGE_KEYS.TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.TOKEN)
  );
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const createApiClient = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: API_CONFIG.TIMEOUT,
    headers: { "Content-Type": "application/json" },
  });

  // ✅ Request interceptor: add Bearer token
  instance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();

      // Debug (bạn có thể bỏ)
      // console.log("➡️", (config.baseURL || "") + config.url, "token?", !!token);

      if (token) config.headers.Authorization = `Bearer ${token}`;
      else delete config.headers.Authorization;

      return config;
    },
    (error) => Promise.reject(error)
  );

  // ✅ Response interceptor: trả về data trực tiếp
  instance.interceptors.response.use(
    (response) => response.data,
    (error) => {
      const status = error.response?.status;
      const msg = error.response?.data?.message || error.message || "Error";
      const url = (error.config?.baseURL || "") + (error.config?.url || "");

      // ✅ KHÔNG tự xoá token ở đây (tránh bị văng)
      if (status === 401) {
        console.warn("🔒 401 from:", url, "message:", msg);
        throw new Error(msg);
      }

      if (error.code === "NETWORK_ERROR" || error.code === "ECONNREFUSED") {
        throw new Error("Không thể kết nối đến server. Vui lòng thử lại sau.");
      }

      throw new Error(msg);
    }
  );

  return instance;
};

export const apiClientV1 = createApiClient(`${API_CONFIG.BASE_URL}/api/v1`);
export const apiClientV2 = createApiClient(`${API_CONFIG.BASE_URL}/api/v2`);
export const apiClientV3 = createApiClient(`${API_CONFIG.BASE_URL}/api/v3`);

export const getApiClient = (version = "v1") => {
  switch (version) {
    case "v2":
      return apiClientV2;
    case "v3":
      return apiClientV3;
    default:
      return apiClientV1;
  }
};