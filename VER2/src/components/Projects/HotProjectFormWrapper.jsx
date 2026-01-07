// components/Projects/HotProjectFormWrapper.jsx
import React, { useState, useEffect } from "react";
import { Card, Alert, Space, Tag, Typography } from "antd";
import { FireOutlined, InfoCircleOutlined } from "@ant-design/icons";
import ProjectForm from "./ProjectForm"; // Import form cũ của bạn
import HotUserSelect from "./HotUserSelect";

const { Text } = Typography;

/**
 * Wrapper component để sử dụng ProjectForm cũ với tính năng hot users
 * Chỉ override phần select thành viên, giữ nguyên tất cả các phần khác
 */
const HotProjectFormWrapper = ({
  visible,
  onCancel,
  onFinish,
  initialValues,
  loading,
  users = [],
  currentUser,
  isParentProject = true,
  autoAssignToCreator = true,
  isCreatingTask = false,
  parentProjectId = null,
}) => {
  const [showHotUsers, setShowHotUsers] = useState(true);

  // Override hàm onFinish để thêm statusHot
  const handleFinish = (formData) => {
    // Thêm trường statusHot cho dự án khẩn cấp
    formData.append("statusHot", "true");
    // Đảm bảo priority là high
    formData.append("priority", "high");

    onFinish(formData);
  };

  // Tạo initialValues mặc định cho dự án khẩn cấp
  const hotProjectInitialValues = {
    ...initialValues,
    priority: "high", // Luôn set priority là high
  };

  return (
    <div>
      {/* Alert thông báo đây là dự án khẩn cấp */}
      <Alert
        message={
          <Space>
            <FireOutlined style={{ color: "#ff4d4f" }} />
            <span>TẠO DỰ ÁN KHẨN CẤP</span>
          </Space>
        }
        description="Dự án này sẽ được ưu tiên cao nhất. Hệ thống đã đề xuất các thành viên phù hợp nhất dựa trên kỹ năng và hiệu suất."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Card với toggle hiển thị hot users */}
      <Card
        size="small"
        style={{
          marginBottom: 16,
          backgroundColor: "#fff2e8",
          borderColor: "#ffbb96",
        }}
        title={
          <Space>
            <InfoCircleOutlined />
            <span>Thành viên đề xuất</span>
            <Tag color="red" icon={<FireOutlined />}>
              Xếp hạng theo hiệu suất
            </Tag>
          </Space>
        }
        extra={
          <Text
            type="secondary"
            style={{ fontSize: "12px", cursor: "pointer" }}
            onClick={() => setShowHotUsers(!showHotUsers)}
          >
            {showHotUsers ? "Ẩn xếp hạng" : "Hiện xếp hạng"}
          </Text>
        }
      >
        {showHotUsers && (
          <div style={{ marginBottom: 16 }}>
            <Text
              type="secondary"
              style={{ fontSize: "12px", display: "block", marginBottom: 8 }}
            >
              Danh sách thành viên đã được xếp hạng dựa trên:
            </Text>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: 12 }}>
              • Kỹ năng: 60%
              <br />
              • Tỷ lệ hoàn thành: 40%
              <br />• Trừ điểm cho công việc tồn đọng
            </div>
          </div>
        )}
      </Card>

      {/* Sử dụng ProjectForm cũ của bạn với custom select */}
      <ProjectForm
        visible={visible}
        onCancel={onCancel}
        onFinish={handleFinish}
        initialValues={hotProjectInitialValues}
        loading={loading}
        users={users}
        currentUser={currentUser}
        isParentProject={isParentProject}
        autoAssignToCreator={autoAssignToCreator}
        isCreatingTask={isCreatingTask}
        parentProjectId={parentProjectId}
        // Truyền prop custom để override phần select
        customUserSelect={
          <HotUserSelect
            value={[]}
            onChange={() => {}}
            style={{ width: "100%" }}
          />
        }
      />
    </div>
  );
};

export default HotProjectFormWrapper;