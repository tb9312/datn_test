//Phân tích hệ thống
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, List, Typography } from 'antd';
import { 
  UserOutlined, 
  ProjectOutlined, 
  TeamOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  DatabaseOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

const SystemAnalytics = () => {
  const [systemStats, setSystemStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = () => {
    // Mock system data
    const mockStats = {
      totalUsers: 156,
      activeUsers: 142,
      totalProjects: 42,
      activeProjects: 35,
      totalTasks: 523,
      completedTasks: 398,
      systemUptime: 99.8,
      storageUsage: 65,
      monthlyGrowth: 12.5
    };

    const mockActivities = [
      { id: 1, action: 'Đăng nhập', user: 'Nguyễn Văn A', time: '2 phút trước', type: 'info' },
      { id: 2, action: 'Tạo dự án mới', user: 'Trần Thị B', time: '15 phút trước', type: 'success' },
      { id: 3, action: 'Hoàn thành task', user: 'Lê Văn C', time: '1 giờ trước', type: 'success' },
      { id: 4, action: 'Cập nhật hệ thống', user: 'System', time: '2 giờ trước', type: 'warning' },
      { id: 5, action: 'Đăng ký người dùng mới', user: 'Phạm Thị D', time: '3 giờ trước', type: 'info' }
    ];

    const mockPerformance = [
      { metric: 'Thời gian phản hồi API', value: 120, target: 200, unit: 'ms' },
      { metric: 'Tải trang dashboard', value: 1.2, target: 2, unit: 's' },
      { metric: 'Sử dụng CPU', value: 45, target: 80, unit: '%' },
      { metric: 'Sử dụng RAM', value: 62, target: 85, unit: '%' },
      { metric: 'Dung lượng database', value: 2.4, target: 5, unit: 'GB' }
    ];

    setSystemStats(mockStats);
    setRecentActivities(mockActivities);
    setPerformanceMetrics(mockPerformance);
  };

  const getActivityColor = (type) => {
    const colors = {
      info: 'blue',
      success: 'green',
      warning: 'orange',
      error: 'red'
    };
    return colors[type] || 'default';
  };

  const performanceColumns = [
    {
      title: 'Chỉ số',
      dataIndex: 'metric',
      key: 'metric',
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      key: 'value',
      render: (value, record) => `${value} ${record.unit}`,
    },
    {
      title: 'Mục tiêu',
      dataIndex: 'target',
      key: 'target',
      render: (target, record) => `${target} ${record.unit}`,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => {
        const percentage = (record.value / record.target) * 100;
        let status, color;
        
        if (percentage <= 60) {
          status = 'Tốt';
          color = 'green';
        } else if (percentage <= 80) {
          status = 'Cảnh báo';
          color = 'orange';
        } else {
          status = 'Nguy hiểm';
          color = 'red';
        }
        
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Tiến độ',
      key: 'progress',
      render: (_, record) => {
        const percentage = (record.value / record.target) * 100;
        return (
          <Progress 
            percent={Math.min(percentage, 100)} 
            size="small" 
            strokeColor={
              percentage <= 60 ? '#52c41a' :
              percentage <= 80 ? '#faad14' : '#f5222d'
            }
          />
        );
      },
    },
  ];

  return (
    <div>
      <Title level={2}>Phân Tích Hệ Thống</Title>
      
      {/* System Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Người Dùng"
              value={systemStats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Dự Án Đang Chạy"
              value={systemStats.activeProjects}
              suffix={`/ ${systemStats.totalProjects}`}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Công Việc Hoàn Thành"
              value={systemStats.completedTasks}
              suffix={`/ ${systemStats.totalTasks}`}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tăng Trưởng Tháng"
              value={systemStats.monthlyGrowth}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* System Performance */}
        <Col xs={24} lg={12}>
          <Card title="Hiệu Suất Hệ Thống">
            <Table
              dataSource={performanceMetrics}
              columns={performanceColumns}
              pagination={false}
              size="small"
              rowKey="metric"
            />
          </Card>
        </Col>

        {/* System Health */}
        <Col xs={24} lg={12}>
          <Card title="Tình Trạng Hệ Thống">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Thời gian hoạt động"
                    value={systemStats.systemUptime}
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Sử dụng lưu trữ"
                    value={systemStats.storageUsage}
                    suffix="%"
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={24}>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <DatabaseOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 8 }} />
                  <div>
                    <Text strong>Hệ thống ổn định</Text>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      Tất cả dịch vụ đang hoạt động bình thường
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Hoạt Động Gần Đây">
            <List
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Tag color={getActivityColor(item.type)}>
                        {item.type.toUpperCase()}
                      </Tag>
                    }
                    title={item.action}
                    description={
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Bởi: {item.user}</span>
                        <span style={{ color: '#999' }}>{item.time}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SystemAnalytics;