// import { apiClientV1 } from './api';

// export const notificationService = {
//   getNotifications: async (params = {}) => {
//     const response = await apiClientV1.get('/notifications', { params });
//     return response; // Trả về toàn bộ response
//   },

//   markAsRead: async (notificationId) => {
//     const response = await apiClientV1.patch(`/notifications/isReaded/${notificationId}`);
//     return response;
//   },

//   markAllAsRead: async () => {
//     const response = await notificationService.getNotifications();
//     const unreadNotifications = response.data.filter(n => !n.isRead);
    
//     const promises = unreadNotifications.map(noti => 
//       notificationService.markAsRead(noti._id)
//     );
    
//     await Promise.all(promises);
    
//     return { success: true };
//   },

//   deleteNotification: async (notificationId) => {
//     const response = await apiClientV1.patch(`/notifications/delete/${notificationId}`);
//     return response;
//   }
// };
import { apiClientV1 } from './api';

export const notificationService = {
  getNotifications: async (params = {}) => {
    const response = await apiClientV1.get('/notifications', { params });
    return response;
  },

  markAsRead: async (notificationId) => {
    const response = await apiClientV1.patch(`/notifications/isReaded/${notificationId}`);
    return response;
  },

  deleteNotification: async (notificationId) => {
    const response = await apiClientV1.patch(`/notifications/delete/${notificationId}`);
    return response;
  }
};