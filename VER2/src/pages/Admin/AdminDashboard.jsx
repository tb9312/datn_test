import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Tabs, Typography, Table, Tag, Progress, App } from 'antd';
import { 
  UserOutlined, 
  ProjectOutlined, 
  TeamOutlined, 
  CheckCircleOutlined,
  WarningOutlined,
  RiseOutlined,
  BarChartOutlined 
} from '@ant-design/icons';
import UserManagement from '../../components/Admin/UserManagement';
import SystemAnalytics from '../../components/Admin/SystemAnalytics';
import SystemSettings from '../../components/Admin/SystemSettings';
const { Title } = Typography;
const { TabPane } = Tabs;

const AdminDashboardContent = () => {
  const [dashboardStats, setDashboardStats] = useState({});
  const [recentRegistrations, setRecentRegistrations] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Mock dashboard data
    const mockStats = {
      totalUsers: 156,
      newUsers: 12,
      totalProjects: 42,
      activeProjects: 35,
      totalTasks: 523,
      completedTasks: 398,
      systemHealth: 99.8,
      storageUsage: 2.4
    };

    const mockRegistrations = [
      { id: 1, name: 'Nguyễn Văn A', email: 'a@company.com', role: 'user', date: '2024-01-20' },
      { id: 2, name: 'Trần Thị B', email: 'b@company.com', role: 'manager', date: '2024-01-19' },
      { id: 3, name: 'Lê Văn C', email: 'c@company.com', role: 'user', date: '2024-01-18' },
      { id: 4, name: 'Phạm Thị D', email: 'd@company.com', role: 'user', date: '2024-01-17' },
      { id: 5, name: 'Hoàng Văn E', email: 'e@company.com', role: 'user', date: '2024-01-16' }
    ];

    setDashboardStats(mockStats);
    setRecentRegistrations(mockRegistrations);
  };

  const registrationColumns = [
    {
      title: 'Người dùng',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : role === 'manager' ? 'orange' : 'blue'}>
          {role === 'admin' ? 'Quản trị' : role === 'manager' ? 'Quản lý' : 'Người dùng'}
        </Tag>
      ),
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'date',
      key: 'date',
    },
  ];

  return (
    <div>
      {/* Dashboard Header */}
      {/* <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <BarChartOutlined style={{ marginRight: 12, color: '#1890ff' }} />
              Quản Trị Hệ Thống
            </Title>
            <p style={{ margin: 0, color: '#666' }}>
              Quản lý và giám sát toàn bộ hệ thống
            </p>
          </div>
        </div>
      </Card> */}

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Người Dùng"
              value={dashboardStats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#52c41a' }}>
              +{dashboardStats.newUsers} mới
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Dự Án Đang Chạy"
              value={dashboardStats.activeProjects}
              suffix={`/ ${dashboardStats.totalProjects}`}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              {Math.round((dashboardStats.activeProjects / dashboardStats.totalProjects) * 100)}% active
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Công Việc Hoàn Thành"
              value={dashboardStats.completedTasks}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={Math.round((dashboardStats.completedTasks / dashboardStats.totalTasks) * 100)} 
                size="small" 
              />
            </div>
          </Card>
        </Col>
        {/* <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Sức Khỏe Hệ Thống"
              value={dashboardStats.systemHealth}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#52c41a' }}>
              <CheckCircleOutlined /> Tất cả dịch vụ ổn định
            </div>
          </Card>
        </Col> */}
      </Row>

      <Tabs defaultActiveKey="overview">
        <TabPane tab="Tổng Quan" key="overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="Đăng Ký Gần Đây">
                <Table
                  columns={registrationColumns}
                  dataSource={recentRegistrations}
                  pagination={false}
                  rowKey="id"
                />
              </Card>
            </Col>
            {/* <Col xs={24} lg={8}>
              <Card title="Thống Kê Nhanh">
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Sử dụng lưu trữ</span>
                    <span>{dashboardStats.storageUsage} GB / 5 GB</span>
                  </div>
                  <Progress 
                    percent={(dashboardStats.storageUsage / 5) * 100} 
                    strokeColor={
                      (dashboardStats.storageUsage / 5) * 100 > 80 ? '#f5222d' : 
                      (dashboardStats.storageUsage / 5) * 100 > 60 ? '#faad14' : '#52c41a'
                    }
                  />
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Hiệu suất hệ thống</span>
                    <Tag color="green">Tốt</Tag>
                  </div>
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Bảo mật</span>
                    <Tag color="green">Đã bật</Tag>
                  </div>
                </div>
              </Card>
            </Col> */}
          </Row>
        </TabPane>

        <TabPane tab="Quản Lý Người Dùng" key="users">
          <UserManagement />
        </TabPane>

        {/* <TabPane tab="Phân Tích Hệ Thống" key="analytics">
          <SystemAnalytics />
        </TabPane> */}

        <TabPane tab="Cài Đặt" key="settings">
          <SystemSettings />
        </TabPane>
      </Tabs>
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <App>
      <AdminDashboardContent />
    </App>
  );
};

export default AdminDashboard;