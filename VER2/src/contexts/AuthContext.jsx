import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const STORAGE_KEYS = {
  TOKEN: "tokenLogin",
  USER: "user",
  API_VERSION: "apiVersion",
};

const BASE_URL = "http://localhost:3370";

const endpoints = {
  v1: {
    login: `${BASE_URL}/api/v1/users/login`,
    detail: `${BASE_URL}/api/v1/users/detail`,
    register: `${BASE_URL}/api/v1/users/register`,
    forgot: `${BASE_URL}/api/v1/users/password/forgot`,
    otp: `${BASE_URL}/api/v1/users/password/otp`,
    reset: `${BASE_URL}/api/v1/users/password/reset`,
  },
  v3: {
    login: `${BASE_URL}/api/v3/users/login`,
    detail: `${BASE_URL}/api/v3/users/detail`,
  },
  v2: {
    login: `${BASE_URL}/api/v2/users/login`,
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    try {
      const token =
        localStorage.getItem(STORAGE_KEYS.TOKEN) ||
        sessionStorage.getItem(STORAGE_KEYS.TOKEN);

      const userData = localStorage.getItem(STORAGE_KEYS.USER);

      if (token && userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
      }
    } catch (e) {
      console.error("Failed to load auth:", e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAuth = ({ token, userData, apiVersion = "v1", persist = "local" }) => {
    if (persist === "session") {
      sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    localStorage.setItem(STORAGE_KEYS.API_VERSION, apiVersion);
    setUser(userData);
  };

  const clearAuth = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.API_VERSION);
    setUser(null);
  };

  const login = async (email, password, isManager = false) => {
    const apiVersion = isManager ? "v3" : "v1";
    const ep = isManager ? endpoints.v3 : endpoints.v1;
    try {
      const res = await axios.post(ep.login, { email, password });
      const data = res.data;
      const token = data.user.token;
      let userData = null;
      if (data.user) {
        console.log("hello")
        userData = {
          ...data.user,
          _id: data.user._id,
          id: data.user._id,
          role: data.user.role || (isManager ? "manager" : "user"),
          token,
        };
      }
  
      try {
        console.log("ℹ️ Fetching user detail...");
        const detailRes = await axios.get(ep.detail, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const detailData = detailRes.data;
        if (detailData?.code === 200 && detailData?.info) {
          userData = {
            ...(userData || {}),
            ...detailData.info,
            _id: detailData.info._id,
            id: detailData.info._id,
            role: detailData.info.role || (isManager ? "manager" : "user"),
            avatar: detailData.info.avatar || userData?.avatar || "",
            token,
          };
        }
      } catch (e) {
        console.warn("⚠️ Detail API failed, using login user as fallback.");
      }
      if (!userData) {
        userData = {
          _id: email,
          id: email,
          fullName: email.split("@")[0],
          email,
          role: isManager ? "manager" : "user",
          avatar: "",
          token,
        };
      }
      saveAuth({ token, userData, apiVersion, persist: "local" });
      return {
        success: true,
        message: data.message || "Đăng nhập thành công!",
        token,
        user: userData,
      };
    } catch (error) {
      console.error("Login error details:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể kết nối đến server";
      return { success: false, message: errorMsg };
    }
  };
  const logout = () => {
    clearAuth();
  };
  const register = async (fullName, email, password) => {
    try {
      const res = await axios.post(endpoints.v1.register, { fullName, email, password });
      const data = res.data;

      if (!data?.success && data?.code !== 200) {
        return { success: false, message: data?.message || "Đăng ký thất bại!" };
      }
      return await login(email, password, false);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Lỗi đăng ký";
      return { success: false, message: errorMsg };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await axios.post(endpoints.v1.forgot, { email });
      const data = res.data;

      if (data?.code && data.code !== 200) {
        return { success: false, message: data?.message || "Email không tồn tại!" };
      }
      if (data?.success === false) {
        return { success: false, message: data?.message || "Email không tồn tại!" };
      }

      return { success: true, message: data?.message || "Đã gửi mã OTP qua email!" };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Lỗi gửi OTP";
      return { success: false, message: errorMsg };
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      const res = await axios.post(endpoints.v1.otp, { email, otp });
      const data = res.data;

      if (data?.code && data.code !== 200) {
        return { success: false, message: data?.message || "OTP không hợp lệ" };
      }
      if (data?.success === false) {
        return { success: false, message: data?.message || "OTP không hợp lệ" };
      }

      return { success: true, message: data?.message || "Xác thực thành công!" };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "OTP không hợp lệ";
      return { success: false, message: errorMsg };
    }
  };

  const resetPassword = async (email, password, confirmPassword) => {
    try {
      const res = await axios.post(endpoints.v1.reset, { email, password, confirmPassword });
      const data = res.data;

      if (data?.code && data.code !== 200) {
        return { success: false, message: data?.message || "Thay đổi mật khẩu thất bại!" };
      }
      if (data?.success === false) {
        return { success: false, message: data?.message || "Thay đổi mật khẩu thất bại!" };
      }

      return { success: true, message: data?.message || "Thành công! Vui lòng đăng nhập lại." };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || "Lỗi thay đổi mật khẩu";
      return { success: false, message: errorMsg };
    }
  };

  const checkIsManager = (role) => {
    if (!role) return false;
    return role.toUpperCase() === "MANAGER" || role.toLowerCase() === "manager";
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (checkIsManager(user.role)) return true;
    if (user.role === "admin") return true;
    return user.permissions?.includes(permission) || false;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    forgotPassword,
    verifyOTP,
    resetPassword,
    hasPermission,
    isManager: () => checkIsManager(user?.role),
    getUserId: () => user?._id || user?.id,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};