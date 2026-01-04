// src/components/Notifications/NotificationTester.jsx
import React from 'react';
import { Card, Button, Space, Typography, Divider, Alert } from 'antd';
import { 
  NotificationOutlined, 
  MailOutlined, 
  BellOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons';
import { useNotifications } from '../../contexts/NotificationContext';

const { Title, Text } = Typography;

const NotificationTester = () => {
  const { testNotification, sendEmailReminder, requestPushPermission } = useNotifications();

  const handleTestNotification = (type) => {
    testNotification(type);
  };

  const handleTestEmailReminder = () => {
    sendEmailReminder({
      title: 'Task Demo',
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 giờ sau
    });
  };

  const handleTestDeadlineAlert = () => {
    // Tạo một deadline alert giả
    const alert = {
      taskTitle: 'Demo Task - Thiết kế hệ thống',
      timeRemaining: '1 giờ 30 phút'
    };
    
    // Hiển thị alert
    notification.warning({
      message: '⏰ Cảnh báo Deadline',
      description: `Task "${alert.taskTitle}" hết hạn trong ${alert.timeRemaining}`,
      duration: 6,
      placement: 'topRight'
    });
  };

  return (
    <Card>
      <Title level={4}>🎯 Trình kiểm tra Thông báo</Title>
      <Text type="secondary">Test tất cả các loại thông báo với dữ liệu giả lập</Text>
      
      <Divider />
      
      <Alert
        message="Đang sử dụng Mock Data"
        description="Tất cả thông báo đang được giả lập. Dữ liệu sẽ reset khi reload trang."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong>Real-time Notifications:</Text>
          <Space style={{ marginTop: 8 }} wrap>
            <Button 
              icon={<NotificationOutlined />}
              onClick={() => handleTestNotification('task')}
            >
              Task Notification
            </Button>
            <Button 
              icon={<ClockCircleOutlined />}
              onClick={() => handleTestNotification('deadline')}
            >
              Deadline Alert
            </Button>
            <Button 
              icon={<BellOutlined />}
              onClick={() => handleTestNotification('project')}
            >
              Project Update
            </Button>
            <Button 
              onClick={() => handleTestNotification('system')}
            >
              System Message
            </Button>
          </Space>
        </div>

        <div>
          <Text strong>Email & Reminders:</Text>
          <Space style={{ marginTop: 8 }} wrap>
            <Button 
              icon={<MailOutlined />}
              type="primary"
              onClick={handleTestEmailReminder}
            >
              Gửi Email Reminder
            </Button>
            <Button 
              icon={<ClockCircleOutlined />}
              onClick={handleTestDeadlineAlert}
            >
              Test Deadline Alert
            </Button>
          </Space>
        </div>

        <div>
          <Text strong>Push Notifications:</Text>
          <Space style={{ marginTop: 8 }} wrap>
            <Button 
              icon={<BellOutlined />}
              onClick={requestPushPermission}
            >
              Yêu cầu Quyền Push
            </Button>
          </Space>
        </div>
      </Space>

      <Divider />
      
      <Text type="secondary" style={{ fontSize: 12 }}>
        💡 Mẹo: Thông báo mới sẽ tự động được thêm ngẫu nhiên mỗi 30 giây
      </Text>
    </Card>
  );
};

export default NotificationTester;