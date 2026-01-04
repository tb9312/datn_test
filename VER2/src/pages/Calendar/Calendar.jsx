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
  InfoCircleOutlined
} from '@ant-design/icons';
import CalendarView from '../../components/Calendar/CalendarView';
import EventForm from '../../components/Calendar/EventForm';
import PermissionWrapper from '../../components/Common/PermissionWrapper';
import { calendarService } from '../../services/calendarService';
import userService from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
const { Title } = Typography;

const CalendarPage = () => {
  const { modal } = App.useApp();
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
  }, [users.length]); // Chỉ phụ thuộc vào users.length

  // Load danh sách events - không phụ thuộc vào users
  const loadEvents = useCallback(async (date) => {
    try {
      setLoadingEvents(true);
      const params = {};
      
      if (date) {
        params.date = date.toISOString().split('T')[0];
      }
      
      const response = await calendarService.getEvents(params);
      
      console.log('📥 Events response:', response);
      
      if (response.code === 200 && response.data) {
        // Map dữ liệu từ backend sang định dạng frontend
        // KHÔNG map user info ở đây, sẽ map sau khi có users
        const formattedEvents = response.data.map((event) => ({
          id: event._id,
          title: event.title,
          description: event.description || '',
          type: event.type,
          color: getEventTypeColor(event.type),
          start: event.timeStart,
          end: event.timeFinish,
          // assigneeId: event.assignee,
          // FIX: Ensure participantIds is always an array, filter out null values
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
  }, []); // Không phụ thuộc vào users nữa

  // Hàm helper để map user info vào events
  const mapUserInfoToEvents = useCallback((eventsList, usersList) => {
    return eventsList.map(event => {
      // Tìm user info cho assignee
      // let assigneeUser = null;
      // if (event.assigneeId && usersList.length > 0) {
      //   assigneeUser = usersList.find(u => u.id === event.assigneeId) || {
      //     id: event.assigneeId,
      //     name: 'Chưa xác định'
      //   };
      // }
      
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
        // assignee: assigneeUser,
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
        // assignee: values.assigneeId || null
      };

      console.log('📤 Creating event:', eventData);
      
      const response = await calendarService.createEvent(eventData);
      
      console.log('📥 Create event response:', response);
      
      if (response.code === 201) {
        // Reload events
        await loadEvents();
        message.success('Tạo sự kiện thành công!');
        setModalVisible(false);
      } else {
        message.error(response.message || 'Tạo sự kiện thất bại');
      }
    } catch (error) {
      console.error('❌ Error creating event:', error);
      message.error(error.message || 'Tạo sự kiện thất bại');
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
        // assignee: values.assigneeId || null
      };

      console.log('📤 Updating event:', editingEvent.id, eventData);
      
      const response = await calendarService.updateEvent(editingEvent.id, eventData);
      
      console.log('📥 Update event response:', response);
      
      if (response.code === 200) {
        // Reload events
        await loadEvents();
        message.success('Cập nhật sự kiện thành công!');
        setModalVisible(false);
        setEditingEvent(null);
      } else {
        message.error(response.message || 'Cập nhật sự kiện thất bại');
      }
    } catch (error) {
      console.error('❌ Error updating event:', error);
      message.error(error.message || 'Cập nhật sự kiện thất bại');
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
      .slice(0, 5);
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
    <div>
      {/* Header */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <CalendarOutlined style={{ marginRight: 12, color: '#1890ff' }} />
              Lịch Làm Việc
            </Title>
            <p style={{ margin: 0, color: '#666' }}>
              Quản lý lịch trình và sự kiện của bạn
              <Button 
                type="link" 
                size="small" 
                onClick={handleRefreshEvents}
                loading={loadingEvents}
                style={{ marginLeft: 8 }}
              >
                🔄 Tải lại
              </Button>
            </p>
          </div>
          <PermissionWrapper permission="create_calendar">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingEvent(null);
                setModalVisible(true);
              }}
              loading={loadingUsers}
            >
              Tạo Sự Kiện
            </Button>
          </PermissionWrapper>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Calendar View */}
        <Col xs={24} lg={17}>
          <Card>
            <Tabs
              activeKey={activeView}
              onChange={setActiveView}
              items={[
                {
                  key: 'calendar',
                  label: (
                    <span>
                      <CalendarOutlined /> Lịch
                    </span>
                  ),
                  children: (
                    <CalendarView
                      events={events.filter(e => !e.deleted)}
                      onEventClick={handleViewEvent}
                      onDateSelect={handleDateSelect}
                      loading={loadingEvents}
                    />
                  )
                },
                {
                  key: 'list',
                  label: 'Danh sách sự kiện',
                  children: (
                    <div>
                      <div style={{ marginBottom: 16, textAlign: 'right' }}>
                        <span style={{ color: '#666' }}>
                          Hiển thị {events.filter(e => !e.deleted).length} sự kiện
                        </span>
                      </div>
                      <List
                        dataSource={events.filter(e => !e.deleted)}
                        loading={loadingEvents}
                        renderItem={(event) => {
                          // Kiểm tra xem user hiện tại có phải là người tạo không
                          const isCreator = user?._id === event.createdBy;
                          const canEdit = isCreator || isManager();
                          
                          return (
                            <List.Item
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
                                >
                                  {canEdit ? 'Chỉnh sửa' : 'Xem chi tiết'}
                                </Button>,
                                <Button 
                                  key="delete"
                                  type="link" 
                                  danger 
                                  onClick={() => handleDeleteEvent(event.id)}
                                  disabled={!canEdit}
                                >
                                  Xóa
                                </Button>
                              ]}
                            >
                              <List.Item.Meta
                                avatar={
                                  <Avatar 
                                    style={{ backgroundColor: event.color }} 
                                    icon={<CalendarOutlined />} 
                                  />
                                }
                                title={
                                  <Space>
                                    <span style={{ fontWeight: 500 }}>{event.title}</span>
                                    <Tag color={event.color}>
                                      {getEventTypeLabel(event.type)}
                                    </Tag>
                                    {/* {!isCreator && (
                                      <Tag color="green" icon={<UserOutlined />}>
                                        Người khác tạo
                                      </Tag>
                                    )} */}
                                  </Space>
                                }
                                description={
                                  <Space direction="vertical" size={0}>
                                    <div>
                                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                                      {new Date(event.start).toLocaleString('vi-VN')}
                                      {event.end && ` - ${new Date(event.end).toLocaleString('vi-VN')}`}
                                    </div>
                                    {event.location && (
                                      <div>
                                        <EnvironmentOutlined style={{ marginRight: 4 }} />
                                        {event.location}
                                      </div>
                                    )}
                                    {event.description && (
                                      <div style={{ color: '#666', fontSize: '13px', marginTop: 4 }}>
                                        {event.description}
                                      </div>
                                    )}
                                    {event.participants && event.participants.length > 0 && (
                                      <div style={{ marginTop: 4 }}>
                                        <TeamOutlined style={{ marginRight: 4 }} />
                                        <Avatar.Group size="small" maxCount={3}>
                                          {event.participants.map((participant, idx) => (
                                            <Avatar 
                                              key={idx} 
                                              src={participant.avatar} 
                                              icon={<UserOutlined />}
                                              style={{ backgroundColor: event.color }}
                                            />
                                          ))}
                                        </Avatar.Group>
                                        <span style={{ marginLeft: 8, fontSize: '12px' }}>
                                          {event.participants.length} thành viên
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
        <Col xs={24} lg={7}>
          <Card 
            title={
              <span>
                <CalendarOutlined /> Sự kiện sắp tới
              </span>
            } 
            style={{ marginBottom: 16 }}
            loading={loadingEvents}
          >
            {upcomingEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                <CalendarOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
                <div>Không có sự kiện sắp tới</div>
              </div>
            ) : (
              <List
                dataSource={upcomingEvents}
                renderItem={(event) => {
                  // Cũng cần kiểm tra quyền ở đây
                  const isCreator = user?._id === event.createdBy;
                  const canEdit = isCreator || isManager();
                  
                  return (
                    <List.Item
                      style={{ 
                        padding: '12px 0',
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
                          />
                        }
                        title={
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>
                            {event.title}
                          </div>
                        }
                        description={
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            <div>
                              📅 {new Date(event.start).toLocaleDateString('vi-VN', {
                                weekday: 'short',
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
                            {/* {!isCreator && (
                              <div style={{ marginTop: 4, fontSize: '11px', color: '#888' }}>
                                👤 Người khác tạo
                              </div>
                            )} */}
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
            title="Thống kê sự kiện"
            loading={loadingEvents}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {Object.entries({
                'meeting': { name: 'Cuộc họp', color: 'blue' },
                'task': { name: 'Công việc', color: 'green' },
                'event': { name: 'Sự kiện', color: 'purple' },
                'reminder': { name: 'Nhắc nhở', color: 'orange' }
              }).map(([type, config]) => (
                <div key={type} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 0'
                }}>
                  <span>{config.name}</span>
                  <Tag color={config.color}>
                    {events.filter(e => e.type === type && !e.deleted).length}
                  </Tag>
                </div>
              ))}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderTop: '1px solid #f0f0f0',
                marginTop: 4
              }}>
                <span style={{ fontWeight: 500 }}>Tổng số sự kiện</span>
                <Tag color="default">{events.filter(e => !e.deleted).length}</Tag>
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
        width={700}
        destroyOnClose
        confirmLoading={loading}
      >
        {/* Thêm thông tin người tạo sự kiện */}
        {editingEvent && (
          <div style={{ 
            marginBottom: 16, 
            padding: '8px 12px', 
            backgroundColor: '#f0f7ff', 
            borderRadius: 4,
            borderLeft: '3px solid #1890ff'
          }}>
            <p style={{ margin: 0, fontSize: '13px' }}>
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