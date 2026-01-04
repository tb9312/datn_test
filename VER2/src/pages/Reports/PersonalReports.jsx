import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  List,
  Typography,
  Timeline,
  Tag
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FileTextOutlined,
  UserOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const PersonalReports = () => {
  const [personalStats, setPersonalStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    loadPersonalData();
  }, []);

  const loadPersonalData = () => {
    // Mock personal data for regular user
    const mockStats = {
      totalTasks: 24,
      completedTasks: 18,
      inProgressTasks: 4,
      pendingTasks: 2,
      completionRate: 75,
      productivity: 4.2,
      overdueTasks: 1
    };

    const mockActivities = [
      { action: 'Hoàn thành task "Design Homepage"', time: '2 giờ trước', type: 'success' },
      { action: 'Bắt đầu task "API Integration"', time: '4 giờ trước', type: 'info' },
      { action: 'Được assign task mới', time: '1 ngày trước', type: 'info' },
      { action: 'Hoàn thành task "Code Review"', time: '2 ngày trước', type: 'success' },
      { action: 'Task "Testing" bị trễ hạn', time: '3 ngày trước', type: 'warning' }
    ];

    setPersonalStats(mockStats);
    setRecentActivities(mockActivities);
  };

  const getActivityColor = (type) => {
    const colors = {
      info: 'blue',
      success: 'green',
      warning: 'orange'
    };
    return colors[type] || 'default';
  };

  return (
    <div>
      <Title level={2}>Báo Cáo Cá Nhân</Title>
      
      {/* Personal Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng công việc"
              value={personalStats.totalTasks}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đã hoàn thành"
              value={personalStats.completedTasks}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        {/* <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tỷ lệ hoàn thành"
              value={personalStats.completionRate}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col> */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Công việc trễ"
              value={personalStats.overdueTasks}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Progress Overview */}
        <Col xs={24} lg={12}>
          <Card title="Tiến Độ Công Việc">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Hoàn thành</span>
                <span>{personalStats.completedTasks}/{personalStats.totalTasks}</span>
              </div>
              {/* <Progress 
                // percent={personalStats.completionRate} 
                strokeColor="#52c41a"
              /> */}
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Đang thực hiện</span>
                <Tag color="blue">{personalStats.inProgressTasks}</Tag>
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Chưa bắt đầu</span>
                <Tag color="default">{personalStats.pendingTasks}</Tag>
              </div>
            </div>
          </Card>
        </Col>

        {/* Recent Activities */}
        <Col xs={24} lg={12}>
          <Card title="Hoạt Động Gần Đây">
            <Timeline>
              {recentActivities.map((activity, index) => (
                <Timeline.Item 
                  key={index}
                  color={getActivityColor(activity.type)}
                >
                  <div>
                    <div>{activity.action}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {activity.time}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* Performance Summary
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Tóm Tắt Hiệu Suất">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <UserOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
                  <div>
                    <Text strong>Năng Suất</Text>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                      {personalStats.productivity}/5
                    </div>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
                  <div>
                    <Text strong>Độ Tin Cậy</Text>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                      {personalStats.completionRate}%
                    </div>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <ClockCircleOutlined style={{ fontSize: 32, color: '#faad14', marginBottom: 8 }} />
                  <div>
                    <Text strong>Tuân Thủ Deadline</Text>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14' }}>
                      {Math.round(((personalStats.totalTasks - personalStats.overdueTasks) / personalStats.totalTasks) * 100)}%
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row> */}
    </div>
  );
};

export default PersonalReports;