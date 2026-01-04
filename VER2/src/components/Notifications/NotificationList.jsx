import React from 'react';
import {
  List,
  Button,
  Tag,
  Empty,
  Divider,
  Space,
  Typography,
  Spin,
  Alert,
  notification as antdNotification,
  Row,
  Col
} from 'antd';
import {
  CheckOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  MessageOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

const NotificationList = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  
  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    const icons = {
      task: <CheckCircleOutlined style={{ color: '#1890ff' }} />,
      system: <MessageOutlined style={{ color: '#722ed1' }} />,
      comment: <MessageOutlined style={{ color: '#52c41a' }} />,
      chat: <MessageOutlined style={{ color: '#eb2f96' }} />,
      project: <TeamOutlined style={{ color: '#52c41a' }} />,
      deadline: <ClockCircleOutlined style={{ color: '#faad14' }} />,
      urgent: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      meeting: <TeamOutlined style={{ color: '#eb2f96' }} />,
      create_project: <TeamOutlined style={{ color: '#52c41a' }} />,
      project_update: <TeamOutlined style={{ color: '#1890ff' }} />,
      project_delete: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
    };
    return icons[type?.toLowerCase()] || <MessageOutlined />;
  };

  const getNotificationColor = (type) => {
    const colors = {
      task: 'blue',
      system: 'purple',
      comment: 'green',
      chat: 'pink',
      project: 'green',
      deadline: 'orange',
      urgent: 'red',
      meeting: 'cyan',
      create_project: 'green',
      project_update: 'blue',
      project_delete: 'red'
    };
    return colors[type?.toLowerCase()] || 'default';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Vừa xong';
    
    try {
      const now = new Date();
      const time = new Date(timestamp);
      
      if (isNaN(time.getTime())) {
        return 'Vừa xong';
      }
      
      const diffInMinutes = Math.floor((now - time) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Vừa xong';
      if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
      return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    } catch (error) {
      return 'Vừa xong';
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Đánh dấu đã đọc
      if (!notification.isRead) {
        await markAsRead(notification._id);
      }
      
      // Đóng dropdown
      if (onClose) onClose();
      
      // Chuyển hướng nếu có URL
      if (notification.url && notification.url !== '#' && notification.url !== 'null') {
        navigate(notification.url);
      }
    } catch (error) {
      // Error đã được handle trong context
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      // Error đã được handle trong context
    }
  };

  const handleRetry = () => {
    fetchNotifications();
  };

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: 8, 
      width: 400,
      maxWidth: '90vw' // Responsive cho mobile
    }}>
      {/* Header */}
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Title level={5} style={{ margin: 0 }}>Thông báo</Title>
        <Space>
          {loading && <Spin size="small" />}
          {error && (
            <Button 
              type="link" 
              size="small" 
              icon={<ReloadOutlined />}
              onClick={handleRetry}
              title="Thử lại"
            />
          )}
          {!loading && !error && unreadCount > 0 && (
            <Button 
              type="link" 
              size="small" 
              onClick={handleMarkAllAsRead}
              style={{ padding: 0, fontSize: 12 }}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </Space>
      </div>

      {/* Notifications List */}
      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Đang tải thông báo...</Text>
            </div>
          </div>
        ) : error ? (
          <div style={{ padding: '20px' }}>
            <Alert
              message="Lỗi tải thông báo"
              description={error}
              type="error"
              showIcon
              action={
                <Button size="small" onClick={handleRetry}>
                  Thử lại
                </Button>
              }
            />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không có thông báo"
            style={{ padding: '40px 0' }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  background: item.isRead ? 'white' : '#f0f8ff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderLeft: item.isRead ? 'none' : '3px solid #1890ff'
                }}
                onClick={() => handleNotificationClick(item)}
                actions={[
                  !item.isRead && (
                    <Button
                      key="read"
                      type="text"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(item._id);
                      }}
                      title="Đánh dấu đã đọc"
                    />
                  ),
                  <Button
                    key="delete"
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(item._id);
                    }}
                    title="Xóa thông báo"
                  />
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(item.type)}
                  title={
                    <div style={{ marginBottom: 4 }}>
                      <Row align="middle" gutter={[8, 4]} wrap={false}>
                        <Col flex="auto">
                          <Text 
                            style={{ 
                              fontSize: 14, 
                              fontWeight: item.isRead ? 400 : 600,
                              color: item.isRead ? '#666' : '#000',
                              wordBreak: 'break-word'
                            }}
                          >
                            {item.title}
                          </Text>
                        </Col>
                        <Col>
                          <Tag 
                            color={getNotificationColor(item.type)} 
                            size="small"
                            style={{ fontSize: 10, margin: 0 }}
                          >
                            {item.type || 'system'}
                          </Tag>
                        </Col>
                      </Row>
                    </div>
                  }
                  description={
                    <div>
                      <Text 
                        style={{ 
                          fontSize: 13, 
                          display: 'block',
                          marginBottom: 4,
                          lineHeight: 1.4,
                          wordBreak: 'break-word'
                        }}
                      >
                        {item.message}
                      </Text>
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Text 
                            type="secondary" 
                            style={{ fontSize: 11 }}
                          >
                            {formatTime(item.createdAt)}
                          </Text>
                        </Col>
                        {item.priority && item.priority !== 'normal' && (
                          <Col>
                            <Tag 
                              color={item.priority === 'high' ? 'red' : 
                                     item.priority === 'medium' ? 'orange' : 'blue'} 
                              size="small"
                              style={{ fontSize: 9, margin: 0 }}
                            >
                              {item.priority}
                            </Tag>
                          </Col>
                        )}
                      </Row>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Footer */}
      {!loading && !error && (
        <>
          <Divider style={{ margin: 0 }} />
          <div style={{ 
            padding: 12, 
            textAlign: 'center',
            background: '#fafafa',
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8
          }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {notifications.length} thông báo • {unreadCount} chưa đọc
            </Text>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationList;