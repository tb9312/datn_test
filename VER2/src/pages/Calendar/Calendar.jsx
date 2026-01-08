import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button,
  Space,
  Modal,
  App,
  message,
  Card,
  Typography,
  Row,
  Col,
  Tabs,
  List,
  Tag,
  Avatar,
  Badge,
  Spin
} from 'antd';
import {
  PlusOutlined,
  CalendarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  WarningFilled
} from '@ant-design/icons';
import CalendarView from '../../components/Calendar/CalendarView';
import EventForm from '../../components/Calendar/EventForm';
// ĐÃ LOẠI BỎ PermissionWrapper import
import { calendarService } from '../../services/calendarService';
import userService from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive } from '../../utils/responsiveUtils';

import dayjs from 'dayjs';
const { Title } = Typography;

const CalendarPage = () => {
  const { modal } = App.useApp();
  const { isMobile, isTablet } = useResponsive();
  const [events, setEvents] = useState([]);
  const [isViewMode, setIsViewMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeView, setActiveView] = useState('calendar');
  const [users, setUsers] = useState([]);
  const { user, isManager } = useAuth();
  
  // Sử dụng useRef để theo dõi đã load dữ liệu chưa
  const hasLoaded = useRef(false);

  // Load danh sách users - chỉ chạy 1 lần
  const loadUsers = useCallback(async () => {
    if (users.length > 0) return; // Đã có users rồi thì không load lại
    
    try {
      setLoadingUsers(true);
      const response = await userService.getUsers();
      
      console.log('📥 Users response:', response);
      
      if (response.success && response.data) {
        const formattedUsers = response.data.map(user => ({
          id: user._id || user.id,
          _id: user._id || user.id,
          name: user.fullName || user.name || user.email,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        }));
        setUsers(formattedUsers);
        console.log('✅ Formatted users:', formattedUsers.length);
      } else {
        console.warn('Không thể tải danh sách người dùng');
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, [users.length]);

  // Load danh sách events - không phụ thuộc vào users
  const loadEvents = useCallback(async (date) => {
    try {
      setLoadingEvents(true);
      const params = {};
      
      if (date) {
        params.date = date.toISOString().split('T')[0];
      } else {
      // Khi không có date, lấy tất cả events
      params.limit = 100;  // 👈 Thêm limit lớn
      params.page = 1;
    }
      
      const response = await calendarService.getEvents(params);
      
      console.log('📥 Events response:', response);
      
      if (response.code === 200 && response.data) {
        // Map dữ liệu từ backend sang định dạng frontend
        const formattedEvents = response.data.map((event) => ({
          id: event._id,
          title: event.title,
          description: event.description || '',
          type: event.type,
          color: getEventTypeColor(event.type),
          start: event.timeStart,
          end: event.timeFinish,
          participantIds: Array.isArray(event.listUser) 
            ? event.listUser.filter(id => id !== null && id !== undefined)
            : [],
          location: event.location || '',
          isAllDay: event.isAllDay || false,
          createdBy: event.createdBy,
          createdAt: event.createdAt,
          deleted: event.deleted || false
        }));
        
        console.log('✅ Formatted events:', formattedEvents.length);
        setEvents(formattedEvents);
      } else {
        console.warn(response.message || 'Không thể tải danh sách sự kiện');
      }
    } catch (error) {
      console.error('❌ Error loading events:', error);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Hàm helper để map user info vào events
  const mapUserInfoToEvents = useCallback((eventsList, usersList) => {
    return eventsList.map(event => {
      // Tìm user info cho participants
      const participantUsers = event.participantIds && usersList.length > 0 
        ? event.participantIds.map(userId => 
            usersList.find(u => u.id === userId) || {
              id: userId,
              name: 'Người dùng'
            }
          )
        : [];

      return {
        ...event,
        participants: participantUsers
      };
    });
  }, []);

  // Load data khi component mount - CHỈ CHẠY 1 LẦN
  useEffect(() => {
    const initializeData = async () => {
      if (hasLoaded.current) return;
      hasLoaded.current = true;
      
      console.log('🚀 Initializing calendar data...');
      
      try {
        // Load users trước
        await loadUsers();
        
        // Load events sau
        await loadEvents();
        
        console.log('✅ Calendar data initialized');
      } catch (error) {
        console.error('❌ Error initializing data:', error);
      }
    };

    initializeData();
    
    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up calendar...');
    };
  }, [loadUsers, loadEvents]);

  // Effect để map user info vào events khi có đủ dữ liệu
  useEffect(() => {
    if (events.length > 0 && users.length > 0) {
      console.log('🔄 Mapping user info to events...');
      const eventsWithUsers = mapUserInfoToEvents(events, users);
      
      // So sánh để tránh re-render không cần thiết
      const hasChanges = JSON.stringify(events) !== JSON.stringify(eventsWithUsers);
      if (hasChanges) {
        console.log('✅ Updated events with user info');
        setEvents(eventsWithUsers);
      }
    }
  }, [users, events, mapUserInfoToEvents]);
  
  // Hàm helper kiểm tra quyền chỉnh sửa
  const checkEditPermission = (event) => {
    if (!event) return false;
    
    // Nếu là quản lý, được phép chỉnh sửa tất cả
    if (isManager && isManager()) return true;
    
    // Kiểm tra user hiện tại có phải là người tạo sự kiện không
    const isCreator = user?._id === event.createdBy;
    
    return isCreator;
  };

  // Hàm helper kiểm tra quyền xóa
  const checkDeletePermission = (event) => {
    if (!event) return false;
    
    // Nếu là quản lý, được phép xóa tất cả
    if (isManager && isManager()) return true;
    
    // Kiểm tra user hiện tại có phải là người tạo sự kiện không
    const isCreator = user?._id === event.createdBy;
    
    return isCreator;
  };

  // Hiển thị thông tin sự kiện trùng lịch
  const showConflictModal = (response) => {
    const { message: conflictMessage, data } = response;
    
    // Tách message thành các dòng
    const messageLines = conflictMessage.split('\n');
    
    Modal.error({
      title: '⛔ Xung đột lịch',
      content: (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <div style={{ 
            background: '#fff2f0', 
            border: '1px solid #ffccc7',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <WarningFilled style={{ color: '#ff4d4f', fontSize: '18px', marginTop: '2px' }} />
              <div>
                {messageLines.map((line, index) => (
                  <p key={index} style={{ 
                    margin: index === 0 ? '0 0 4px 0' : '4px 0', 
                    color: '#333',
                    fontWeight: index === 0 ? 500 : 400
                  }}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
          
          {data && data.conflictTime && (
            <div style={{ 
              background: '#f6ffed', 
              border: '1px solid #b7eb8f',
              padding: '12px',
              borderRadius: '6px',
              marginTop: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <CalendarOutlined style={{ color: '#52c41a', fontSize: '16px', marginTop: '2px' }} />
                <div>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 500, color: '#333' }}>
                    Chi tiết sự kiện trùng:
                  </p>
                  <div style={{ 
                    background: 'white', 
                    padding: '10px', 
                    borderRadius: '4px',
                    border: '1px dashed #d9d9d9'
                  }}>
                    <p style={{ margin: '0 0 6px 0', fontSize: '15px' }}>
                      <strong>📌 {data.conflictTitle}</strong>
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <ClockCircleOutlined style={{ color: '#1890ff' }} />
                      <span style={{ fontSize: '14px' }}>
                        {new Date(data.conflictTime.start).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })} - {new Date(data.conflictTime.end).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {data.conflictWithUsers && data.conflictWithUsers.length > 0 && (
                      <div style={{ 
                        background: '#fff7e6', 
                        padding: '6px 8px', 
                        borderRadius: '4px',
                        marginTop: '8px',
                        fontSize: '13px'
                      }}>
                        <TeamOutlined style={{ marginRight: '4px', color: '#fa8c16' }} />
                        Có {data.conflictWithUsers.length} thành viên khác cũng bị trùng lịch
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div style={{ 
            marginTop: '16px', 
            padding: '10px',
            background: '#f0f7ff',
            borderRadius: '4px',
            borderLeft: '3px solid #1890ff'
          }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}>
              <InfoCircleOutlined style={{ marginRight: '6px' }} />
              <strong>Gợi ý:</strong> Hãy chọn thời gian khác hoặc thay đổi thành viên tham gia
            </p>
          </div>
        </div>
      ),
      okText: 'Đã hiểu',
      okType: 'primary',
      width: isMobile ? '95%' : 500,
      centered: true,
      onOk: () => {
        // Có thể thêm logic redirect đến sự kiện conflict
        if (data && data.conflictId) {
          console.log('Redirect to conflict event:', data.conflictId);
        }
      }
    });
  };

  // Tạo sự kiện mới
  const handleCreateEvent = async (values) => {
    try {
      setLoading(true);
      
      const eventData = {
        title: values.title,
        description: values.description || '',
        type: values.type,
        listUser: values.participants || [],
        timeStart: values.start,
        timeFinish: values.end,
        location: values.location || '',
        isAllDay: values.isAllDay || false,
      };

      console.log('📤 Creating event:', eventData);
      
      const response = await calendarService.createEvent(eventData);
      
      console.log('📥 Create event response:', response);
      
      if (response.code === 201) {
      // Reload events
      await loadEvents();
      message.success({
        content: '✅ Tạo sự kiện thành công!',
        duration: 3,
        style: {
          marginTop: '50px',
        },
      });
      setModalVisible(false);
    } else if (response.code === 400) {
      // Hiển thị conflict modal chi tiết
      showConflictModal(response);
    } else {
      message.error({
        content: `❌ ${response.message || 'Tạo sự kiện thất bại'}`,
        duration: 5,
      });
    }
  } catch (error) {
    console.error('❌ Error creating event:', error);
    message.error({
      content: `❌ ${error.message || 'Tạo sự kiện thất bại'}`,
      duration: 5,
    });
  } finally {
    setLoading(false);
  }
};

  // Cập nhật sự kiện
  const handleUpdateEvent = async (values) => {
    if (!editingEvent) return;
    
    try {
      setLoading(true);
      
      const eventData = {
        title: values.title,
        description: values.description || '',
        type: values.type,
        listUser: values.participants || [],
        timeStart: values.start,
        timeFinish: values.end,
        location: values.location || '',
        isAllDay: values.isAllDay || false,
      };

      console.log('📤 Updating event:', editingEvent.id, eventData);
      
      const response = await calendarService.updateEvent(editingEvent.id, eventData);
      
      console.log('📥 Update event response:', response);
      
      if (response.code === 200) {
      // Reload events
      await loadEvents();
      message.success({
        content: '✅ Cập nhật sự kiện thành công!',
        duration: 3,
        style: {
          marginTop: '50px',
        },
      });
      setModalVisible(false);
      setEditingEvent(null);
    } else if (response.code === 400) {
      // Hiển thị conflict modal cho update
      showConflictModal(response);
    } else {
      message.error({
        content: `❌ ${response.message || 'Cập nhật sự kiện thất bại'}`,
        duration: 5,
      });
    }
  } catch (error) {
    console.error('❌ Error updating event:', error);
    message.error({
      content: `❌ ${error.message || 'Cập nhật sự kiện thất bại'}`,
      duration: 5,
    });
  } finally {
    setLoading(false);
  }
};

  // Xóa sự kiện
  const handleDeleteEvent = async (eventId) => {
    modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa sự kiện này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      async onOk() {
        try {
          const response = await calendarService.deleteEvent(eventId);
          
          if (response.code === 200) {
            // Cập nhật state ngay lập tức
            setEvents(prev => prev.filter(event => event.id !== eventId));
            message.success('Xóa sự kiện thành công!');
          } else {
            message.error(response.message || 'Không thể xóa sự kiện');
          }
        } catch (error) {
          message.error(error.message || 'Xóa sự kiện thất bại');
        }
      }
    });
  };

  // Chỉnh sửa sự kiện
  const handleEditEvent = async (event) => {
    try {
      setLoading(true);
      setIsViewMode(false);
      
      console.log('📤 Fetching event detail for:', event.id);
      
      // Load chi tiết từ API để có dữ liệu mới nhất
      const response = await calendarService.getEventDetail(event.id);
      
      if (response.code === 200 && response.data) {
        const eventDetail = response.data;
        
        console.log('📅 Event detail from API:', eventDetail);
        
        // FIX: Sử dụng dayjs để parse datetime
        let startDate = eventDetail.timeStart;
        let endDate = eventDetail.timeFinish;
        
        // Đảm bảo datetime hợp lệ
        try {
          if (!startDate || typeof startDate !== 'string') {
            console.warn('⚠️ Invalid start date, using current date');
            startDate = new Date().toISOString();
          }
          
          if (!endDate || typeof endDate !== 'string') {
            console.warn('⚠️ Invalid end date, using +1 hour');
            const now = new Date();
            now.setHours(now.getHours() + 1);
            endDate = now.toISOString();
          }
        } catch (error) {
          console.error('❌ Error processing dates:', error);
          startDate = new Date().toISOString();
          endDate = new Date(Date.now() + 3600000).toISOString();
        }
        
        const formattedEvent = {
          id: eventDetail._id,
          title: eventDetail.title,
          description: eventDetail.description || '',
          type: eventDetail.type,
          start: startDate, // Sử dụng datetime đã được xử lý
          end: endDate,     // Sử dụng datetime đã được xử lý
          location: eventDetail.location || '',
          isAllDay: eventDetail.isAllDay || false,
          participants: eventDetail.listUser || [],
          isRecurring: eventDetail.isRecurring || false,
          createdBy: eventDetail.createdBy // Thêm createdBy để kiểm tra quyền
        };
        
        console.log('✅ Formatted event for edit:', formattedEvent);
        setEditingEvent(formattedEvent);
        setModalVisible(true);
      } else {
        message.error('Không thể tải chi tiết sự kiện');
      }
    } catch (error) {
      console.error('❌ Error loading event detail:', error);
      // Fallback: dùng event hiện tại nhưng đảm bảo datetime hợp lệ
      const fallbackEvent = {
        ...event,
        start: event.start ? event.start : new Date().toISOString(),
        end: event.end ? event.end : new Date(Date.now() + 3600000).toISOString()
      };
      setEditingEvent(fallbackEvent);
      setModalVisible(true);
      message.warning('Đang dùng dữ liệu cục bộ');
    } finally {
      setLoading(false);
    }
  };

  // Thêm hàm mới để xem chi tiết (chỉ xem)
  const handleViewEvent = async (event) => {
    try {
      setLoading(true);
      setIsViewMode(true); // Đặt thành true khi chỉ xem
      
      console.log('📤 Fetching event detail for view:', event.id);
      
      // Load chi tiết từ API để có dữ liệu mới nhất
      const response = await calendarService.getEventDetail(event.id);
      
      if (response.code === 200 && response.data) {
        const eventDetail = response.data;
        
        console.log('📅 Event detail from API for view:', eventDetail);
        
        // Xử lý datetime tương tự handleEditEvent
        let startDate = eventDetail.timeStart;
        let endDate = eventDetail.timeFinish;
        
        try {
          if (!startDate || typeof startDate !== 'string') {
            console.warn('⚠️ Invalid start date, using current date');
            startDate = new Date().toISOString();
          }
          
          if (!endDate || typeof endDate !== 'string') {
            console.warn('⚠️ Invalid end date, using +1 hour');
            const now = new Date();
            now.setHours(now.getHours() + 1);
            endDate = now.toISOString();
          }
        } catch (error) {
          console.error('❌ Error processing dates:', error);
          startDate = new Date().toISOString();
          endDate = new Date(Date.now() + 3600000).toISOString();
        }
        
        const formattedEvent = {
          id: eventDetail._id,
          title: eventDetail.title,
          description: eventDetail.description || '',
          type: eventDetail.type,
          start: startDate,
          end: endDate,
          location: eventDetail.location || '',
          isAllDay: eventDetail.isAllDay || false,
          participants: eventDetail.listUser || [],
          isRecurring: eventDetail.isRecurring || false,
          createdBy: eventDetail.createdBy
        };
        
        console.log('✅ Formatted event for view:', formattedEvent);
        setEditingEvent(formattedEvent);
        setModalVisible(true);
      } else {
        message.error('Không thể tải chi tiết sự kiện');
      }
    } catch (error) {
      console.error('❌ Error loading event detail for view:', error);
      // Fallback
      const fallbackEvent = {
        ...event,
        start: event.start ? event.start : new Date().toISOString(),
        end: event.end ? event.end : new Date(Date.now() + 3600000).toISOString(),
        createdBy: event.createdBy
      };
      setEditingEvent(fallbackEvent);
      setModalVisible(true);
      message.warning('Đang dùng dữ liệu cục bộ');
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý khi đóng modal
  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingEvent(null);
    setIsViewMode(false); // Reset về false
  };

  const handleFormFinish = (values) => {
    if (editingEvent) {
      handleUpdateEvent(values);
    } else {
      handleCreateEvent(values);
    }
  };

  const getEventTypeColor = (type) => {
    const typeColors = {
      'meeting': '#1890ff',
      'deadline': '#ff4d4f',
      'task': '#52c41a',
      'event': '#722ed1',
      'reminder': '#faad14'
    };
    return typeColors[type] || '#1890ff';
  };

  const getEventTypeLabel = (type) => {
    const typeLabels = {
      'meeting': 'Cuộc họp',
      'deadline': 'Hạn chót',
      'task': 'Công việc',
      'event': 'Sự kiện',
      'reminder': 'Nhắc nhở'
    };
    return typeLabels[type] || type;
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(event => new Date(event.start) >= now && !event.deleted)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, isMobile ? 3 : 5);
  };

  const upcomingEvents = getUpcomingEvents();

  // Hàm xử lý khi chọn ngày từ calendar
  const handleDateSelect = (date) => {
    console.log('📅 Date selected:', date);
    setEditingEvent(null);
    setModalVisible(true);
  };

  // Hàm reload events (dùng khi cần refresh data)
  const handleRefreshEvents = async () => {
    await loadEvents();
  };

  if (loadingEvents && !hasLoaded.current) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh' 
      }}>
        <Spin size="large" tip="Đang tải lịch làm việc..." />
      </div>
    );
  }

  return (
    <div className="calendar-page">
      {/* Header */}
      <Card className="calendar-header-card">
        <div className="calendar-header">
          <div className="calendar-header-left">
            <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
              <CalendarOutlined style={{ marginRight: 12, color: '#1890ff' }} />
              {isMobile ? 'Lịch' : 'Lịch Làm Việc'}
            </Title>
            <p style={{ margin: 0, color: '#666' }}>
              {isMobile ? 'Quản lý lịch trình' : 'Quản lý lịch trình và sự kiện của bạn'}
              <Button 
                type="link" 
                size="small" 
                onClick={handleRefreshEvents}
                loading={loadingEvents}
                style={{ marginLeft: 8 }}
              >
                🔄 {isMobile ? 'Tải lại' : 'Tải lại'}
              </Button>
            </p>
          </div>
          {/* ĐÃ LOẠI BỎ PermissionWrapper - Mọi người dùng đều có thể tạo sự kiện */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingEvent(null);
              setModalVisible(true);
            }}
            loading={loadingUsers}
            size={isMobile ? 'middle' : 'large'}
          >
            {isMobile ? 'Tạo' : 'Tạo Sự Kiện'}
          </Button>
        </div>
      </Card>

      <Row gutter={[16, 16]} className="calendar-main-row">
        {/* Calendar View */}
        <Col xs={24} lg={17} xl={18} className="calendar-main-col">
          <Card className="calendar-view-card">
            <Tabs
              activeKey={activeView}
              onChange={setActiveView}
              items={[
                {
                  key: 'calendar',
                  label: (
                    <span>
                      <CalendarOutlined /> {isMobile ? 'Lịch' : 'Lịch'}
                    </span>
                  ),
                  children: (
                    <div className="calendar-view-container">
                      <CalendarView
                        events={events.filter(e => !e.deleted)}
                        onEventClick={handleViewEvent}
                        onDateSelect={handleDateSelect}
                        loading={loadingEvents}
                        isMobile={isMobile}
                      />
                    </div>
                  )
                },
                {
                  key: 'list',
                  label: isMobile ? 'Danh sách' : 'Danh sách sự kiện',
                  children: (
                    <div className="events-list-container">
                      <div className="events-list-header">
                        <span style={{ color: '#666' }}>
                          Hiển thị {events.filter(e => !e.deleted).length} sự kiện
                        </span>
                      </div>
                      <List
                        dataSource={events.filter(e => !e.deleted)}
                        loading={loadingEvents}
                        renderItem={(event) => {
                          const canEdit = checkEditPermission(event);
                          const canDelete = checkDeletePermission(event);
                          
                          return (
                            <List.Item
                              className="event-list-item"
                              style={{ 
                                borderLeft: `4px solid ${event.color}`,
                                marginBottom: 8,
                                borderRadius: 4
                              }}
                              actions={[
                                <Button 
                                  key="detail"
                                  type="link" 
                                  onClick={() => canEdit ? handleEditEvent(event) : handleViewEvent(event)}
                                  icon={<InfoCircleOutlined />}
                                  size={isMobile ? 'small' : 'middle'}
                                >
                                  {canEdit ? (isMobile ? 'Sửa' : 'Chỉnh sửa') : (isMobile ? 'Xem' : 'Xem chi tiết')}
                                </Button>,
                                canDelete && (
                                  <Button 
                                    key="delete"
                                    type="link" 
                                    danger 
                                    onClick={() => handleDeleteEvent(event.id)}
                                    size={isMobile ? 'small' : 'middle'}
                                  >
                                    {isMobile ? 'Xóa' : 'Xóa'}
                                  </Button>
                                )
                              ].filter(Boolean)}
                            >
                              <List.Item.Meta
                                avatar={
                                  <Avatar 
                                    size={isMobile ? 'small' : 'default'}
                                    style={{ backgroundColor: event.color }} 
                                    icon={<CalendarOutlined />} 
                                  />
                                }
                                title={
                                  <Space className="event-title-space">
                                    <span className="event-title-text" style={{ fontWeight: 500 }}>
                                      {isMobile ? event.title.substring(0, 20) + (event.title.length > 20 ? '...' : '') : event.title}
                                    </span>
                                    <Tag color={event.color} size={isMobile ? 'small' : 'default'}>
                                      {isMobile ? getEventTypeLabel(event.type).substring(0, 8) : getEventTypeLabel(event.type)}
                                    </Tag>
                                  </Space>
                                }
                                description={
                                  <Space direction="vertical" size={2} className="event-description">
                                    <div className="event-time">
                                      <ClockCircleOutlined style={{ marginRight: 4, fontSize: isMobile ? 11 : 12 }} />
                                      <span style={{ fontSize: isMobile ? 11 : 12 }}>
                                        {new Date(event.start).toLocaleString('vi-VN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: isMobile ? undefined : 'numeric'
                                        })}
                                        {event.end && ` - ${new Date(event.end).toLocaleString('vi-VN', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}`}
                                      </span>
                                    </div>
                                    {event.location && (
                                      <div className="event-location">
                                        <EnvironmentOutlined style={{ marginRight: 4, fontSize: isMobile ? 11 : 12 }} />
                                        <span style={{ fontSize: isMobile ? 11 : 12 }}>
                                          {isMobile ? event.location.substring(0, 20) + (event.location.length > 20 ? '...' : '') : event.location}
                                        </span>
                                      </div>
                                    )}
                                    {event.description && (
                                      <div className="event-description-text" style={{ 
                                        color: '#666', 
                                        fontSize: isMobile ? 10 : 13, 
                                        marginTop: 2 
                                      }}>
                                        {isMobile ? event.description.substring(0, 40) + (event.description.length > 40 ? '...' : '') : event.description}
                                      </div>
                                    )}
                                    {event.participants && event.participants.length > 0 && (
                                      <div className="event-participants" style={{ marginTop: 4 }}>
                                        <TeamOutlined style={{ marginRight: 4, fontSize: isMobile ? 11 : 12 }} />
                                        <Avatar.Group 
                                          size={isMobile ? 'small' : 'default'} 
                                          maxCount={isMobile ? 2 : 3}
                                        >
                                          {event.participants.map((participant, idx) => (
                                            <Avatar 
                                              key={idx} 
                                              src={participant.avatar} 
                                              icon={<UserOutlined />}
                                              style={{ backgroundColor: event.color }}
                                              size={isMobile ? 'small' : 'default'}
                                            />
                                          ))}
                                        </Avatar.Group>
                                        <span style={{ 
                                          marginLeft: 8, 
                                          fontSize: isMobile ? 10 : 12 
                                        }}>
                                          {event.participants.length} {isMobile ? '' : 'thành viên'}
                                        </span>
                                      </div>
                                    )}
                                  </Space>
                                }
                              />
                            </List.Item>
                          );
                        }}
                      />
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </Col>

        {/* Sidebar - Upcoming Events */}
        <Col xs={24} lg={7} xl={6} className="calendar-sidebar-col">
          <Card 
            className="upcoming-events-card"
            title={
              <span>
                <CalendarOutlined /> {isMobile ? 'Sắp tới' : 'Sự kiện sắp tới'}
              </span>
            } 
            style={{ marginBottom: 16 }}
            loading={loadingEvents}
          >
            {upcomingEvents.length === 0 ? (
              <div className="no-events-message">
                <CalendarOutlined style={{ fontSize: '32px', marginBottom: '8px', color: '#999' }} />
                <div style={{ color: '#999' }}>Không có sự kiện sắp tới</div>
              </div>
            ) : (
              <List
                className="upcoming-events-list"
                dataSource={upcomingEvents}
                renderItem={(event) => {
                  const canEdit = checkEditPermission(event);
                  
                  return (
                    <List.Item
                      className="upcoming-event-item"
                      style={{ 
                        padding: isMobile ? '8px 0' : '12px 0',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer'
                      }}
                      onClick={() => canEdit ? handleEditEvent(event) : handleViewEvent(event)}
                    >
                      <List.Item.Meta
                        avatar={
                          <Badge 
                            color={event.color} 
                            status="processing" 
                            size={isMobile ? 'small' : 'default'}
                          />
                        }
                        title={
                          <div className="upcoming-event-title" style={{ 
                            fontSize: isMobile ? 13 : 14, 
                            fontWeight: '500' 
                          }}>
                            {isMobile ? 
                              event.title.substring(0, 20) + (event.title.length > 20 ? '...' : '') : 
                              event.title
                            }
                          </div>
                        }
                        description={
                          <div className="upcoming-event-details" style={{ 
                            fontSize: isMobile ? 10 : 12, 
                            color: '#666' 
                          }}>
                            <div>
                              📅 {new Date(event.start).toLocaleDateString('vi-VN', {
                                weekday: isMobile ? undefined : 'short',
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </div>
                            <div>
                              🕐 {new Date(event.start).toLocaleTimeString('vi-VN', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>

          {/* Event Statistics */}
          <Card 
            className="event-stats-card"
            title={isMobile ? "Thống kê" : "Thống kê sự kiện"}
            loading={loadingEvents}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {Object.entries({
                'meeting': { name: isMobile ? 'Họp' : 'Cuộc họp', color: 'blue' },
                'task': { name: isMobile ? 'C.việc' : 'Công việc', color: 'green' },
                'event': { name: isMobile ? 'S.kiện' : 'Sự kiện', color: 'purple' },
                'reminder': { name: isMobile ? 'Nhắc' : 'Nhắc nhở', color: 'orange' }
              }).map(([type, config]) => (
                <div key={type} className="event-stat-item" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 0'
                }}>
                  <span style={{ fontSize: isMobile ? 12 : 14 }}>{config.name}</span>
                  <Tag color={config.color} size={isMobile ? 'small' : 'default'}>
                    {events.filter(e => e.type === type && !e.deleted).length}
                  </Tag>
                </div>
              ))}
              <div className="total-events-stat" style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderTop: '1px solid #f0f0f0',
                marginTop: 4
              }}>
                <span style={{ fontWeight: 500, fontSize: isMobile ? 13 : 14 }}>
                  {isMobile ? 'Tổng' : 'Tổng số sự kiện'}
                </span>
                <Tag color="default" size={isMobile ? 'small' : 'default'}>
                  {events.filter(e => !e.deleted).length}
                </Tag>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Event Form Modal */}
      <Modal
        title={isViewMode ? 'Chi tiết sự kiện' : (editingEvent ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới')}
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={isMobile ? '95%' : isTablet ? '90%' : 700}
        destroyOnClose
        confirmLoading={loading}
        centered
      >
        {/* Thêm thông tin người tạo sự kiện */}
        {editingEvent && (
          <div className="event-creator-info" style={{ 
            marginBottom: 16, 
            padding: '8px 12px', 
            backgroundColor: '#f0f7ff', 
            borderRadius: 4,
            borderLeft: '3px solid #1890ff'
          }}>
            <p style={{ margin: 0, fontSize: isMobile ? 12 : 13 }}>
              {isViewMode ? (
                <span><strong>👤 Người phụ trách:</strong> {users.find(u => u.id === editingEvent.createdBy)?.name || 'Người tạo sự kiện'}</span>
              ) : (
                <span><strong>👤 Người phụ trách:</strong> {user?.name || 'Bạn'} (người tạo sự kiện)</span>
              )}
            </p>
          </div>
        )}
        
        <EventForm
          visible={modalVisible}
          onCancel={handleModalCancel}
          onFinish={handleFormFinish}
          initialValues={editingEvent}
          loading={loading}
          users={users}
          loadingUsers={loadingUsers}
          isViewMode={isViewMode}
          isMobile={isMobile}
        />
      </Modal>
    </div>
  );
};

const Calendar = () => {
  return (
    <App>
      <CalendarPage />
    </App>
  );
};

export default Calendar;