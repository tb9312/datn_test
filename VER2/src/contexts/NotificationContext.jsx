import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { notification as antdNotification } from "antd";
import { notificationService } from "../services/notificationService";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pollingIntervalRef = useRef(null);
  const isMountedRef = useRef(true); // Để kiểm tra component còn mount không

  // Kiểm tra authentication state - DÙNG ĐÚNG KEY "tokenLogin"
  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('tokenLogin') || sessionStorage.getItem('tokenLogin');
    const user = localStorage.getItem('user');
    
    const isAuth = !!token && !!user;
    
    console.log("🔐 Auth check:", { 
      hasToken: !!token, 
      hasUser: !!user, 
      isAuthenticated: isAuth 
    });
    
    return isAuth;
  }, []);

  // Fetch notifications từ API - CHỈ KHI ĐÃ LOGIN
  const fetchNotifications = useCallback(async (showNotification = false) => {
    // Kiểm tra authentication trước
    const auth = checkAuth();
    if (!auth) {
      console.log("⚠️ User not authenticated, skipping notification fetch");
      if (isMountedRef.current) {
        setNotifications([]);
        setUnreadCount(0);
        setError("Vui lòng đăng nhập để xem thông báo");
        setIsAuthenticated(false);
      }
      return;
    }

    if (!isMountedRef.current) return;

    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
        setIsAuthenticated(true);
      }
      
      // Gọi API với pagination params
      const params = {
        page: 1,
        limit: 50
      };
      
      const response = await notificationService.getNotifications(params);

      console.log("📢 Notification API Response:", response);

      if (!isMountedRef.current) return;

      // Kiểm tra response structure
      if (response && (response.success || response.code === 200)) {
        const notificationsData = response.data || [];
        
        const formattedNotifications = notificationsData.map((noti) => ({
          _id: noti._id,
          title: noti.title,
          message: noti.message,
          type: noti.type,
          isRead: noti.isRead,
          url: noti.url,
          createdAt: noti.createdAt,
          priority: noti.priority,
          sender: noti.sender,
        }));

        // Tính số notification chưa đọc
        const newUnreadCount = formattedNotifications.filter(
          (n) => !n.isRead
        ).length;

        console.log("📊 Notifications loaded:", {
          total: formattedNotifications.length,
          unread: newUnreadCount
        });

        if (isMountedRef.current) {
          setNotifications(formattedNotifications);
          setUnreadCount(newUnreadCount);
          setIsAuthenticated(true);
        }

        // Hiển thị thông báo nếu có notification mới
        if (showNotification && newUnreadCount > 0 && isMountedRef.current) {
          const unreadNotifications = formattedNotifications.filter(n => !n.isRead);
          const latestUnread = unreadNotifications[0];
          
          if (latestUnread) {
            antdNotification.info({
              message: latestUnread.title,
              description: latestUnread.message,
              duration: 4,
              onClick: () => {
                if (latestUnread.url) {
                  window.location.href = latestUnread.url;
                }
              },
            });
          }
        }
      } else {
        throw new Error(response?.message || 'Lỗi tải thông báo');
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      
      console.error("❌ Failed to fetch notifications:", error);
      
      // Kiểm tra nếu là lỗi authentication
      if (error.message.includes('Authentication') || error.message.includes('401')) {
        console.log("🔒 Authentication error, clearing auth state");
        if (isMountedRef.current) {
          setIsAuthenticated(false);
          setNotifications([]);
          setUnreadCount(0);
          setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }
        
        // Không hiển thị thông báo lỗi authentication
        return;
      }
      
      if (isMountedRef.current) {
        setError(error.message || 'Lỗi tải thông báo');
      }
      
      antdNotification.error({
        message: "Lỗi tải thông báo",
        description: error.message || 'Không thể kết nối đến server',
        duration: 3,
      });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [checkAuth]);

  // Setup polling - CHỈ KHI ĐÃ LOGIN
  const setupPolling = useCallback(() => {
    // Clear interval cũ nếu có
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Kiểm tra authentication
    const auth = checkAuth();
    if (!auth) {
      console.log("⚠️ Not authenticated, skipping polling setup");
      if (isMountedRef.current) {
        setIsAuthenticated(false);
      }
      return;
    }

    console.log("🔄 Setting up notification polling for authenticated user...");
    
    if (isMountedRef.current) {
      setIsAuthenticated(true);
    }

    // Polling: kiểm tra thông báo mới mỗi 60 giây
    pollingIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        console.log("⏰ Polling check...");
        fetchNotifications(true); // true = hiển thị notification khi có mới
      }
    }, 60000); // 60 giây

    // Fetch ngay lần đầu
    fetchNotifications();
  }, [checkAuth, fetchNotifications]);

  // Lắng nghe sự kiện login/logout từ AuthContext - FIX INFINITE LOOP
  useEffect(() => {
    isMountedRef.current = true;

    const handleAuthChange = () => {
      if (!isMountedRef.current) return;
      
      const isNowAuthenticated = checkAuth();
      console.log("🔄 Auth state changed:", isNowAuthenticated);
      
      if (isNowAuthenticated) {
        // User vừa login - setup polling
        setupPolling();
      } else {
        // User vừa logout - clear data và polling
        setNotifications([]);
        setUnreadCount(0);
        setError("Vui lòng đăng nhập để xem thông báo");
        setIsAuthenticated(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    };

    // Kiểm tra auth ngay khi mount
    handleAuthChange();

    // Lắng nghe storage events (login/logout từ tab khác)
    const handleStorageChange = (e) => {
      if (e.key === 'tokenLogin' || e.key === 'user') {
        handleAuthChange();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup khi unmount
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('storage', handleStorageChange);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [checkAuth, setupPolling]); // ĐỪNG THÊM fetchNotifications vào dependencies

  // Mark as read - CHỈ KHI ĐÃ LOGIN
  const markAsRead = async (notificationId) => {
    if (!checkAuth()) {
      antdNotification.warning({
        message: "Vui lòng đăng nhập",
        duration: 2,
      });
      return;
    }

    try {
      const result = await notificationService.markAsRead(notificationId);

      if (result?.code === 200 || result?.success) {
        if (isMountedRef.current) {
          setNotifications((prev) =>
            prev.map((noti) =>
              noti._id === notificationId
                ? { ...noti, isRead: true }
                : noti
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        
        antdNotification.success({
          message: "Đã đánh dấu đã đọc",
          duration: 2,
        });
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
      antdNotification.error({
        message: "Lỗi đánh dấu đã đọc",
        description: error.message,
        duration: 3,
      });
    }
  };

  // Mark all as read - CHỈ KHI ĐÃ LOGIN
  const markAllAsRead = async () => {
    if (!checkAuth()) {
      antdNotification.warning({
        message: "Vui lòng đăng nhập",
        duration: 2,
      });
      return;
    }

    try {
      const result = await notificationService.markAllAsRead();
      
      if (result?.success) {
        if (isMountedRef.current) {
          setNotifications((prev) =>
            prev.map((noti) => ({ ...noti, isRead: true }))
          );
          setUnreadCount(0);
        }

        antdNotification.success({
          message: result.message || 'Đã đánh dấu tất cả thông báo là đã đọc',
          duration: 2,
        });
        
        // Refresh lại danh sách
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      antdNotification.error({
        message: "Lỗi đánh dấu tất cả đã đọc",
        description: error.message,
        duration: 3,
      });
    }
  };

  // Delete notification - CHỈ KHI ĐÃ LOGIN
  const deleteNotification = async (notificationId) => {
    if (!checkAuth()) {
      antdNotification.warning({
        message: "Vui lòng đăng nhập",
        duration: 2,
      });
      return;
    }

    try {
      const result = await notificationService.deleteNotification(notificationId);

      if (result?.code === 200 || result?.success) {
        const deletedNoti = notifications.find((n) => n._id === notificationId);

        if (isMountedRef.current) {
          setNotifications((prev) =>
            prev.filter((noti) => noti._id !== notificationId)
          );

          // Update unread count if notification was unread
          if (deletedNoti && !deletedNoti.isRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }

        antdNotification.success({
          message: "Đã xóa thông báo",
          duration: 2,
        });
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      antdNotification.error({
        message: "Lỗi xóa thông báo",
        description: error.message,
        duration: 3,
      });
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    isAuthenticated,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};