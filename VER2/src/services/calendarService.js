// services/calendarService.js
import { apiClientV1 } from './api';

export const calendarService = {
  // Lấy danh sách sự kiện
  getEvents: async (params = {}) => {
    try {
      console.log('📤 Fetching events with params:', params);
      const response = await apiClientV1.get('/calendars', { params });
      console.log('📥 Events response:', response);
      // FIX: Filter null values from listUser
      if (response.code === 200 && response.data) {
        const cleanedData = response.data.map(event => ({
          ...event,
          listUser: Array.isArray(event.listUser) 
            ? event.listUser.filter(userId => userId !== null && userId !== undefined)
            : []
        }));
        
        return {
          ...response,
          data: cleanedData
        };
      }
      return response;
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      throw error;
    }
  },

  // Lấy chi tiết sự kiện
  getEventDetail: async (id) => {
    try {
      console.log('📤 Fetching event detail for ID:', id);
      const response = await apiClientV1.get(`/calendars/detail/${id}`);
      console.log('📥 Event detail response:', response);
      // FIX: Filter null values from listUser
      if (response.code === 200 && response.data) {
        const cleanedData = response.data.map(event => ({
          ...event,
          listUser: Array.isArray(event.listUser) 
            ? event.listUser.filter(userId => userId !== null && userId !== undefined)
            : []
        }));
        
        return {
          ...response,
          data: cleanedData
        };
      }
      return response;
    } catch (error) {
      console.error('❌ Error fetching event detail:', error);
      throw error;
    }
  },

  // Tạo sự kiện mới
  createEvent: async (eventData) => {
    try {
      console.log('📤 Creating event:', eventData);
      const response = await apiClientV1.post('/calendars/create', eventData);
      console.log('📥 Create event response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creating event:', error);
      throw error;
    }
  },

  // Cập nhật sự kiện
  updateEvent: async (id, eventData) => {
    try {
      console.log('📤 Updating event:', id, eventData);
      const response = await apiClientV1.patch(`/calendars/edit/${id}`, eventData);
      console.log('📥 Update event response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error updating event:', error);
      throw error;
    }
  },

  // Xóa sự kiện
  deleteEvent: async (id) => {
    try {
      console.log('📤 Deleting event:', id);
      const response = await apiClientV1.patch(`/calendars/delete/${id}`);
      console.log('📥 Delete event response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      throw error;
    }
  },

  // Lấy sự kiện theo ngày
  getEventsByDate: async (date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      console.log('📤 Fetching events for date:', formattedDate);
      const response = await apiClientV1.get('/calendars', {
        params: { date: formattedDate }
      });
      console.log('📥 Events by date response:', response);
      // FIX: Filter null values from listUser
      if (response.code === 200 && response.data) {
        const cleanedData = response.data.map(event => ({
          ...event,
          listUser: Array.isArray(event.listUser) 
            ? event.listUser.filter(userId => userId !== null && userId !== undefined)
            : []
        }));
        
        return {
          ...response,
          data: cleanedData
        };
      }
      return response;
    } catch (error) {
      console.error('❌ Error fetching events by date:', error);
      throw error;
    }
  }
};