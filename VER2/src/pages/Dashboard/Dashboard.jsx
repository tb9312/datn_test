// pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Progress, List, Tag, Spin, Alert, Button } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  RiseOutlined,
  ProjectOutlined,
  UserOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import StatCard from '../../components/Common/StatCard';
import ChartCard from '../../components/Common/ChartCard';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/dashboardService';

const Dashboard = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'guest';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [statCards, setStatCards] = useState([]);
  const [taskChartData, setTaskChartData] = useState(null);
  const [projectChartData, setProjectChartData] = useState(null);
  const [projectProgress, setProjectProgress] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [userRole]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching dashboard data...');
      
      const data = await dashboardService.getDashboardData();
      console.log('✅ Dashboard data received:', data);
      
      setDashboardData(data);
      
      // 1. Cập nhật stat cards
      const stats = dashboardService.getStatCardsData(data, userRole);
      console.log('📊 Stat cards data:', stats);
      updateStatCards(stats, userRole);
        
      // 2. Cập nhật chart data
      if (userRole === 'user' || userRole === 'USER') {
        const taskChart = dashboardService.getTaskDistributionData(data);
        setTaskChartData(taskChart);
      }
      
      // FIX: Sử dụng dữ liệu thực từ API
      const projectChart = dashboardService.getProjectDistributionData(data);
      console.log('📈 Project chart from service:', projectChart);
      setProjectChartData(projectChart);
      
      // 3. Cập nhật project progress (cho manager)
      if (userRole === 'manager' || userRole === 'MANAGER') {
        const progressData = dashboardService.getProjectProgressData(data);
        setProjectProgress(progressData);
      }
      
      // 4. Lấy dữ liệu mẫu
      setRecentActivities(dashboardService.getRecentActivities());
      setUpcomingDeadlines(dashboardService.getUpcomingDeadlines());
      
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updateStatCards = (stats, role) => {
    let cards = [];
    
    if (role === 'user' || role === 'USER') {
      cards = [
        {
          title: "Total Tasks",
          value: stats.totalTasks || 0,
          icon: <CheckCircleOutlined />,
          color: "#1890ff"
        },
        {
          title: "Pending",
          value: stats.pendingTasks || 0,
          icon: <ClockCircleOutlined />,
          color: "#faad14"
        },
        {
          title: "Team Tasks",
          value: stats.teamTasks || 0,
          icon: <TeamOutlined />,
          color: "#52c41a"
        },
      ];
    } else if (role === 'manager' || role === 'MANAGER') {
      cards = [
        {
          title: "Total Projects",
          value: stats.totalProjects || 0,
          icon: <ProjectOutlined />,
          color: "#1890ff"
        },
        {
          title: "My Projects",
          value: stats.totalPM || 0,
          icon: <UserOutlined />,
          color: "#13c2c2"
        },
        {
          title: "Pending Projects",
          value: stats.pendingProjects || 0,
          icon: <ClockCircleOutlined />,
          color: "#faad14"
        },
        {
          title: "Team Projects",
          value: stats.teamProjects || 0,
          icon: <TeamOutlined />,
          color: "#52c41a"
        }
      ];
    }
    
    console.log('🎯 Stat cards to display:', cards);
    setStatCards(cards);
  };

  const getActivityTag = (type) => {
    const colors = {
      success: 'green',
      info: 'blue',
      warning: 'orange',
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Đang tải dữ liệu dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Lỗi"
        description={error}
        type="error"
        showIcon
        action={
          <Button 
            type="link" 
            onClick={fetchDashboardData}
            icon={<ReloadOutlined />}
            style={{ marginLeft: '10px' }}
          >
            Thử lại
          </Button>
        }
      />
    );
  }

  return (
    <div>
      {/* Statistics Cards */}
      <Row gutter={[24, 24]}>
        {statCards.map((card, index) => (
          <Col key={index} xs={24} sm={12} lg={statCards.length > 4 ? 4 : 6}>
            <StatCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
            />
          </Col>
        ))}
      </Row>

      {/* Charts and Progress */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* Manager chỉ xem project chart */}
        {(userRole === 'manager' || userRole === 'MANAGER') ? (
          <>
            <Col xs={24} lg={16}>
              <ChartCard
                title="Project Distribution"
                labels={projectChartData?.labels || []}
                data={projectChartData?.data || []}
                colors={projectChartData?.colors || []}
                type="doughnut"
              />
            </Col>
            
            {/* <Col xs={24} lg={8}>
              <Card title="Project Progress" bordered={false}>
                {projectProgress.map((project, index) => (
                  <div key={index} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>{project.name}</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress 
                      percent={project.progress} 
                      strokeColor={index === 0 ? "#1890ff" : index === 1 ? "#52c41a" : "#722ed1"} 
                    />
                  </div>
                ))}
              </Card>
            </Col> */}
          </>
        ) : (
          // User xem task chart
          <Col xs={24} lg={12}>
            <ChartCard
              title="Task Distribution"
              labels={taskChartData?.labels || []}
              data={taskChartData?.data || []}
              colors={taskChartData?.colors || []}
              type="doughnut"
            />
          </Col>
        )}
      </Row>

      {/* Recent Activities và Upcoming Deadlines */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {(userRole === 'manager' || userRole === 'MANAGER') && (
          <Col xs={24} lg={12}>
            <Card title="Recent Activities" bordered={false}>
              <List
                dataSource={recentActivities}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <div>
                          <span style={{ fontWeight: 500 }}>{item.user}</span>
                          <span> {item.action} </span>
                          <span style={{ fontWeight: 500 }}>{item.task}</span>
                        </div>
                      }
                      description={
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          marginTop: 4 
                        }}>
                          <Tag color={getActivityTag(item.type)}>
                            {item.type.toUpperCase()}
                          </Tag>
                          <span style={{ color: '#999', fontSize: 12 }}>
                            {item.time}
                          </span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        )}
        
        <Col xs={24} lg={(userRole === 'manager' || userRole === 'MANAGER') ? 12 : 24}>
          <Card title="Upcoming Deadlines" bordered={false}>
            <List
              dataSource={upcomingDeadlines}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.task}
                    description={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{item.date}</span>
                        <Tag color={item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'orange' : 'blue'}>
                          {item.priority}
                        </Tag>
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

export default Dashboard;