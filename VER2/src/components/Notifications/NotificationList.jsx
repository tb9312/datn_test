import React from "react";
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
  Row,
  Col,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  MessageOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useNotifications } from "../../contexts/NotificationContext";
import { useNavigate } from "react-router-dom";

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
    deleteNotification,
  } = useNotifications();

  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    const icons = {
      TASK: <CheckCircleOutlined style={{ color: "#1890ff" }} />,
      PROJECT: <TeamOutlined style={{ color: "#52c41a" }} />,
      CREATE_PROJECT: <TeamOutlined style={{ color: "#52c41a" }} />,
      SYSTEM: <MessageOutlined style={{ color: "#722ed1" }} />,
      COMMENT: <MessageOutlined style={{ color: "#52c41a" }} />,
      CHAT: <MessageOutlined style={{ color: "#eb2f96" }} />,
      DEADLINE: <ClockCircleOutlined style={{ color: "#faad14" }} />,
      URGENT: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      MEETING: <TeamOutlined style={{ color: "#eb2f96" }} />,
      PROJECT_UPDATE: <TeamOutlined style={{ color: "#1890ff" }} />,
      PROJECT_DELETE: (
        <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
      ),
    };
    return icons[type] || <MessageOutlined />;
  };

  const getNotificationColor = (type) => {
    const colors = {
      TASK: "blue",
      PROJECT: "green",
      CREATE_PROJECT: "green",
      SYSTEM: "purple",
      COMMENT: "green",
      CHAT: "pink",
      DEADLINE: "orange",
      URGENT: "red",
      MEETING: "cyan",
      PROJECT_UPDATE: "blue",
      PROJECT_DELETE: "red",
    };
    return colors[type] || "default";
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Vừa xong";

    try {
      const now = new Date();
      const time = new Date(timestamp);

      if (isNaN(time.getTime())) {
        return "Vừa xong";
      }

      const diffInMinutes = Math.floor((now - time) / (1000 * 60));

      if (diffInMinutes < 1) return "Vừa xong";
      if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
      if (diffInMinutes < 1440)
        return `${Math.floor(diffInMinutes / 60)} giờ trước`;
      return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    } catch (error) {
      return "Vừa xong";
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
      if (
        notification.url &&
        notification.url !== "#" &&
        notification.url !== "null"
      ) {
        navigate(notification.url);
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleRetry = () => {
    fetchNotifications();
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: 8,
        width: 400,
        maxWidth: "90vw",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          Thông báo
        </Title>
        <Space>
          {loading && <Spin size="small" />}
          {!loading && unreadCount > 0 && (
            <Button
              type="link"
              size="small"
              onClick={handleMarkAllAsRead}
              style={{ padding: 0, fontSize: 12 }}
              loading={loading}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<ReloadOutlined />}
            onClick={handleRetry}
            title="Tải lại"
            loading={loading}
          />
        </Space>
      </div>

      {/* Notifications List */}
      <div style={{ maxHeight: 400, overflow: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Đang tải thông báo...</Text>
            </div>
          </div>
        ) : error ? (
          <div style={{ padding: "20px" }}>
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
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <Text type="secondary">
                Đang hiển thị {notifications.length} thông báo đã tải trước đó
              </Text>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không có thông báo"
            style={{ padding: "40px 0" }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #f0f0f0",
                  background: item.isRead ? "white" : "#f0f8ff",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  borderLeft: item.isRead ? "none" : "3px solid #1890ff",
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
                  />,
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
                              color: item.isRead ? "#666" : "#000",
                              wordBreak: "break-word",
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
                            {item.type}
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
                          display: "block",
                          marginBottom: 4,
                          lineHeight: 1.4,
                          wordBreak: "break-word",
                        }}
                      >
                        {item.message}
                      </Text>
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {formatTime(item.createdAt)}
                          </Text>
                        </Col>
                        {item.priority && item.priority !== "normal" && (
                          <Col>
                            <Tag
                              color={
                                item.priority === "high"
                                  ? "red"
                                  : item.priority === "medium"
                                  ? "orange"
                                  : "blue"
                              }
                              size="small"
                              style={{ fontSize: 9, margin: 0 }}
                            >
                              {item.priority === "high"
                                ? "Cao"
                                : item.priority === "medium"
                                ? "Trung bình"
                                : "Thấp"}
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
      {!loading && !error && notifications.length > 0 && (
        <>
          <Divider style={{ margin: 0 }} />
          <div
            style={{
              padding: 12,
              textAlign: "center",
              background: "#fafafa",
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Hiển thị {notifications.length} thông báo • {unreadCount} chưa đọc
            </Text>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationList;