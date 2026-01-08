// pages/Dashboard.jsx - ĐÃ FIX RESPONSIVE HOÀN CHỈNH
import React, { useState, useEffect } from "react";
import { Row, Col, Card, List, Tag, Spin, Alert, Button, Typography, Space } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ProjectOutlined,
  UserOutlined,
  ReloadOutlined,
  BellOutlined,
} from "@ant-design/icons";
import StatCard from "../../components/Common/StatCard";
import ChartCard from "../../components/Common/ChartCard";
import { useAuth } from "../../contexts/AuthContext";
import { dashboardService } from "../../services/dashboardService";
import PosterBell from "../../components/Article/SystemArticleMini";
import { useResponsive, getDisplayCount } from "../../utils/responsiveUtils";

const { Text } = Typography;

const Dashboard = () => {
  const { user } = useAuth();
  const userRole = user?.role || "guest";
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const [loading, setLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [statCards, setStatCards] = useState([]);
  const [taskChartData, setTaskChartData] = useState(null);
  const [projectChartData, setProjectChartData] = useState(null);
  const [simpleNotifications, setSimpleNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchSimpleNotifications();
  }, [userRole]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Fetching dashboard data...");

      const data = await dashboardService.getDashboardData();
      console.log("✅ Dashboard data received:", data);

      setDashboardData(data);

      // 1. Cập nhật stat cards
      const stats = dashboardService.getStatCardsData(data, userRole);
      console.log("📊 Stat cards data:", stats);
      updateStatCards(stats, userRole);

      // 2. Cập nhật chart data
      if (userRole === "user" || userRole === "USER") {
        const taskChart = dashboardService.getTaskDistributionData(data);
        setTaskChartData(taskChart);
      }

      // FIX: Sử dụng dữ liệu thực từ API
      const projectChart = dashboardService.getProjectDistributionData(data);
      console.log("📈 Project chart from service:", projectChart);
      setProjectChartData(projectChart);

    } catch (err) {
      console.error("Error fetching dashboard:", err);
      setError(err.message || "Có lỗi xảy ra khi tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Lấy notifications với số lượng responsive
  const fetchSimpleNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const count = getDisplayCount(isMobile, isTablet, 5);
      const notifications = await dashboardService.getSimpleNotifications(count);
      setSimpleNotifications(notifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setSimpleNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const updateStatCards = (stats, role) => {
    let cards = [];

    if (role === "user" || role === "USER") {
      cards = [
        {
          title: isMobile ? "Tasks" : "Total Tasks",
          value: stats.totalTasks || 0,
          icon: <CheckCircleOutlined />,
          color: "#1890ff",
        },
        {
          title: isMobile ? "Pending" : "Pending Tasks",
          value: stats.pendingTasks || 0,
          icon: <ClockCircleOutlined />,
          color: "#faad14",
        },
        {
          title: isMobile ? "Team" : "Team Tasks",
          value: stats.teamTasks || 0,
          icon: <TeamOutlined />,
          color: "#52c41a",
        },
      ];
    } else if (role === "manager" || role === "MANAGER") {
      cards = [
        {
          title: isMobile ? "Projects" : "Total Projects",
          value: stats.totalProjects || 0,
          icon: <ProjectOutlined />,
          color: "#1890ff",
        },
        {
          title: isMobile ? "My" : "My Projects",
          value: stats.totalPM || 0,
          icon: <UserOutlined />,
          color: "#13c2c2",
        },
        {
          title: isMobile ? "Pending" : "Pending Projects",
          value: stats.pendingProjects || 0,
          icon: <ClockCircleOutlined />,
          color: "#faad14",
        },
        {
          title: isMobile ? "Team" : "Team Projects",
          value: stats.teamProjects || 0,
          icon: <TeamOutlined />,
          color: "#52c41a",
        },
      ];
    }

    console.log("🎯 Stat cards to display:", cards);
    setStatCards(cards);
  };
  

  // Render notification item đơn giản
  const renderNotificationItem = (notification) => (
    <List.Item 
      className="notification-item"
      style={{ 
        padding: isMobile ? "8px 0" : "12px 0", 
        borderBottom: "1px solid #f0f0f0",
        background: notification.isRead ? "transparent" : "#f6ffed",
        borderRadius: 6,
        marginBottom: 4,
      }}
    >
      <div style={{ width: "100%" }}>
        {/* Message */}
        <Text
          style={{
            fontSize: isMobile ? 12 : 14,
            display: "block",
            marginBottom: 6,
            lineHeight: 1.4,
            color: notification.isRead ? "#666" : "#000",
            fontWeight: notification.isRead ? "normal" : "500",
          }}
        >
          {notification.message}
        </Text>
        
        {/* Time và Tags */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          flexWrap: "wrap",
        }}>
          {/* Time */}
          <Text type="secondary" style={{ fontSize: isMobile ? 10 : 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4, fontSize: isMobile ? 10 : 11 }} />
            {dashboardService.formatTimeShort(notification.createdAt)}
          </Text>
          
          {/* Tags */}
          <Space size={4} style={{ marginTop: isMobile ? 4 : 0 }}>
            <Tag 
              color={dashboardService.getTypeColor(notification.type)} 
              size="small"
              style={{ fontSize: isMobile ? 9 : 10 }}
            >
              {notification.type}
            </Tag>
            
            {notification.priority && notification.priority !== "normal" && (
              <Tag
                color={dashboardService.getPriorityColor(notification.priority)}
                size="small"
                style={{ fontSize: isMobile ? 9 : 10 }}
              >
                {notification.priority === "high" ? "Cao" : 
                 notification.priority === "medium" ? "Trung" : "Thấp"}
              </Tag>
            )}
          </Space>
        </div>
      </div>
    </List.Item>
  );

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
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
            style={{ marginLeft: "10px" }}
          >
            Thử lại
          </Button>
        }
      />
    );
  }

  return (
    <div className="dashboard-container">
      <PosterBell />
      
      {/* Statistics Cards - ĐÃ FIX RESPONSIVE */}
      <Row gutter={[16, 16]} className="statistics-row">
        {statCards.map((card, index) => (
          <Col 
            key={index} 
            xs={24} 
            sm={12} 
            md={statCards.length > 3 ? 12 : 24} 
            lg={statCards.length > 3 ? 6 : 12}
            xl={statCards.length > 3 ? 6 : 8}
          >
            <Card className="dashboard-stat-card">
              <StatCard
                title={card.title}
                value={card.value}
                icon={card.icon}
                color={card.color}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts and Notifications - ĐÃ FIX RESPONSIVE */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }} className="charts-row">
        {/* Manager: Project Chart + Notifications */}
        {userRole === "manager" || userRole === "MANAGER" ? (
          <>
            {/* Chart cho Manager - ĐÃ FIX */}
            <Col xs={24} sm={24} md={16} lg={16} xl={17} className="chart-column">
              <Card className="chart-container">
                <ChartCard
                  title="Project Distribution"
                  labels={projectChartData?.labels || []}
                  data={projectChartData?.data || []}
                  colors={projectChartData?.colors || []}
                  type="doughnut"
                />
              </Card>
            </Col>

            {/* Notifications cho Manager - ĐÃ FIX */}
            <Col xs={24} sm={24} md={8} lg={8} xl={7} className="notifications-column">
              <Card 
                className="notifications-card"
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BellOutlined style={{ color: '#1890ff' }} />
                    <span>{isMobile ? "Activities" : "Recent Activities"}</span>
                  </div>
                }
                bordered={false}
              >
                {notificationsLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin size="small" />
                    <p style={{ marginTop: 8, fontSize: 12 }}>Đang tải thông báo...</p>
                  </div>
                ) : simpleNotifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <BellOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                    <p style={{ fontSize: 13 }}>Chưa có thông báo nào</p>
                  </div>
                ) : (
                  <List
                    dataSource={simpleNotifications}
                    renderItem={renderNotificationItem}
                    size="small"
                    locale={{ emptyText: 'Không có thông báo' }}
                  />
                )}
              </Card>
            </Col>
          </>
        ) : (
          // User: Task Chart + Notifications
          <>
            {/* Chart cho User - ĐÃ FIX */}
            <Col xs={24} sm={24} md={12} lg={12} xl={14} className="chart-column">
              <Card className="chart-container">
                <ChartCard
                  title="Task Distribution"
                  labels={taskChartData?.labels || []}
                  data={taskChartData?.data || []}
                  colors={taskChartData?.colors || []}
                  type="doughnut"
                />
              </Card>
            </Col>

            {/* Notifications cho User - ĐÃ FIX */}
            <Col xs={24} sm={24} md={12} lg={12} xl={10} className="notifications-column">
              <Card 
                className="notifications-card"
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BellOutlined style={{ color: '#1890ff' }} />
                    <span>{isMobile ? "Activities" : "Recent Activities"}</span>
                  </div>
                }
                bordered={false}
              >
                {notificationsLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin size="small" />
                    <p style={{ marginTop: 8, fontSize: 12 }}>Đang tải thông báo...</p>
                  </div>
                ) : simpleNotifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <BellOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                    <p style={{ fontSize: 13 }}>Chưa có thông báo nào</p>
                  </div>
                ) : (
                  <List
                    dataSource={simpleNotifications}
                    renderItem={renderNotificationItem}
                    size="small"
                    locale={{ emptyText: 'Không có thông báo' }}
                  />
                )}
              </Card>
            </Col>
          </>
        )}
      </Row>
    </div>
  );
};

export default Dashboard;