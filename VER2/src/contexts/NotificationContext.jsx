import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notification as antdNotification } from 'antd';
import { notificationService } from '../services/notificationService';
import { io } from 'socket.io-client';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  // Fetch notifications từ API thực
  const fetchNotifications = useCallback(async (showNotification = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationService.getNotifications();
      
      console.log('📢 Notification API Response:', response);
      
      if (response.code === 200 && response.data) {
        // Format notifications theo cấu trúc backend
        const notificationsData = Array.isArray(response.data) ? response.data : [];
        
        const formattedNotifications = notificationsData.map(noti => ({
          _id: noti._id,
          title: noti.title,
          message: noti.message,
          type: noti.type,
          isRead: noti.isRead,
          read: noti.isRead,
          url: noti.url,
          createdAt: noti.createdAt,
          priority: noti.priority,
          sender: noti.sender
        }));
        
        console.log('📢 Formatted notifications:', formattedNotifications);
        
        // Kiểm tra xem có thông báo mới không
        const previousUnreadCount = unreadCount;
        const newUnreadCount = formattedNotifications.filter(n => !n.isRead).length;
        
        setNotifications(formattedNotifications);
        setUnreadCount(newUnreadCount);
        
        // Hiển thị notification nếu có thông báo mới
        if (showNotification && newUnreadCount > previousUnreadCount) {
          const newNotifications = formattedNotifications.filter(n => !n.isRead);
          const latestNotification = newNotifications[0];
          
          if (latestNotification) {
            antdNotification.info({
              message: latestNotification.title,
              description: latestNotification.message,
              duration: 4,
              onClick: () => {
                markAsRead(latestNotification._id);
                if (latestNotification.url) {
                  window.location.href = latestNotification.url;
                }
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
      setError(error.message);
      
      antdNotification.error({
        message: 'Lỗi tải thông báo',
        description: error.message,
        duration: 3
      });
    } finally {
      setLoading(false);
    }
  }, [unreadCount]);

  // Khởi tạo WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token && !socket) {
      const newSocket = io('http://localhost:3370', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });
      
      newSocket.on('connect', () => {
        console.log('🔌 WebSocket connected');
      });
      
      newSocket.on('new-notification', (notification) => {
        console.log('🔔 New notification via WebSocket:', notification);
        
        // Thêm thông báo mới vào đầu danh sách
        setNotifications(prev => [
          {
            _id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            isRead: false,
            read: false,
            url: notification.url,
            createdAt: notification.createdAt,
            priority: notification.priority,
            sender: notification.sender
          },
          ...prev
        ]);
        
        // Tăng unread count
        setUnreadCount(prev => prev + 1);
        
        // Hiển thị browser notification
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          });
        }
        
        // Hiển thị antd notification
        antdNotification.info({
          message: notification.title,
          description: notification.message,
          duration: 4,
          onClick: () => {
            markAsRead(notification._id);
            if (notification.url) {
              window.location.href = notification.url;
            }
          }
        });
      });
      
      newSocket.on('disconnect', () => {
        console.log('🔌 WebSocket disconnected');
      });
      
      setSocket(newSocket);
      
      return () => {
        newSocket.disconnect();
      };
    }
  }, []);

  // Load notifications on mount và polling
  // useEffect(() => {
  //   fetchNotifications();
    
  //   // Poll for new notifications every 10 seconds (nhanh hơn)
  //   const interval = setInterval(() => {
  //     fetchNotifications(true); // true = hiển thị notification khi có mới
  //   }, 10000);
    
  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, [fetchNotifications]);

  // Mark as read
  const markAsRead = async (notificationId) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      
      if (result.code === 200) {
        setNotifications(prev => 
          prev.map(noti => 
            noti._id === notificationId 
              ? { ...noti, isRead: true, read: true }
              : noti
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
      antdNotification.error({
        message: 'Lỗi đánh dấu đã đọc',
        description: error.message,
        duration: 3
      });
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      if (unreadNotifications.length === 0) {
        antdNotification.info({
          message: 'Không có thông báo chưa đọc',
          duration: 2
        });
        return;
      }
      
      // Gọi API markAsRead cho từng notification chưa đọc
      const promises = unreadNotifications.map(noti => 
        notificationService.markAsRead(noti._id)
      );
      
      await Promise.all(promises);
      
      setNotifications(prev => 
        prev.map(noti => ({ ...noti, isRead: true, read: true }))
      );
      setUnreadCount(0);
      
      antdNotification.success({
        message: `Đã đánh dấu ${unreadNotifications.length} thông báo là đã đọc`,
        duration: 2
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      antdNotification.error({
        message: 'Lỗi đánh dấu tất cả đã đọc',
        description: error.message,
        duration: 3
      });
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const result = await notificationService.deleteNotification(notificationId);
      
      if (result.code === 200) {
        const deletedNoti = notifications.find(n => n._id === notificationId);
        
        setNotifications(prev => 
          prev.filter(noti => noti._id !== notificationId)
        );
        
        // Update unread count if notification was unread
        if (deletedNoti && !deletedNoti.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        antdNotification.success({
          message: 'Đã xóa thông báo',
          duration: 2
        });
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      antdNotification.error({
        message: 'Lỗi xóa thông báo',
        description: error.message,
        duration: 3
      });
    }
  };

  // Request push permission
  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      antdNotification.warning({
        message: 'Trình duyệt không hỗ trợ Push Notifications'
      });
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      antdNotification.warning({
        message: 'Bạn đã từ chối quyền thông báo. Vui lòng cấp quyền trong cài đặt trình duyệt.'
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      antdNotification.success({
        message: 'Push Notifications đã được kích hoạt!'
      });
      return true;
    }
    
    return false;
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestPushPermission,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};