// components/Projects/HotUserSelect.jsx
import React, { useState, useEffect } from "react";
import {
  Select,
  Spin,
  Avatar,
  Tag,
  Tooltip,
  Typography,
  Empty,
  Space,
} from "antd";
import {
  UserOutlined,
  TrophyOutlined,
  FireOutlined,
  TeamOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { apiClientV3 } from "../../services/api";

const { Option } = Select;
const { Text } = Typography;

const HotUserSelect = ({ value, onChange, placeholder, style, ...props }) => {
  const [hotUsers, setHotUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHotUsers();
  }, []);

  const loadHotUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClientV3.get("/users/listuser_hot");

      if (response?.success === true || response?.code === 200) {
        // Sắp xếp theo finalScore giảm dần
        const sortedUsers = [...(response?.data || [])].sort(
          (a, b) => b.finalScore - a.finalScore
        );
        setHotUsers(sortedUsers);
      } else {
        setError(response?.message || "Không thể tải danh sách thành viên");
      }
    } catch (err) {
      console.error("Error loading hot users:", err);
      setError(err.message || "Lỗi khi tải danh sách");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#52c41a";
    if (score >= 60) return "#1890ff";
    if (score >= 40) return "#faad14";
    return "#ff4d4f";
  };

  const getSkillText = (skill) => {
    const skillsMap = {
      expert: "Chuyên gia",
      intermediate: "Trung cấp",
      beginner: "Mới bắt đầu",
    };
    return skillsMap[skill] || skill;
  };

  const renderUserOption = (user, index) => {
    const rank = index + 1;

    return (
      <Option key={user._id} value={user._id}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
            {/* Rank badge */}
            <div
              style={{
                width: 30,
                textAlign: "center",
                marginRight: 8,
              }}
            >
              {rank <= 3 ? (
                <TrophyOutlined
                  style={{
                    fontSize: 16,
                    color:
                      rank === 1
                        ? "#fadb14"
                        : rank === 2
                        ? "#d9d9d9"
                        : "#fa8c16",
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    color: "#666",
                  }}
                >
                  #{rank}
                </span>
              )}
            </div>

            {/* Avatar */}
            <Avatar size="small" src={user.avatar} style={{ marginRight: 8 }}>
              {user.fullName?.charAt(0) || <UserOutlined />}
            </Avatar>

            {/* User info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                {user.fullName}
              </div>
              <div style={{ fontSize: "11px", color: "#666" }}>
                {getSkillText(user.skills)} • {user.email}
              </div>
            </div>
          </div>

          {/* Score badge */}
          <div style={{ textAlign: "right", marginLeft: 8 }}>
            <Tooltip title={`Điểm tổng: ${user.finalScore}`}>
              <Tag
                color={
                  user.finalScore >= 80
                    ? "success"
                    : user.finalScore >= 60
                    ? "processing"
                    : user.finalScore >= 40
                    ? "warning"
                    : "error"
                }
                style={{
                  margin: 0,
                  fontWeight: "bold",
                  minWidth: "45px",
                  textAlign: "center",
                }}
              >
                {user.finalScore}
              </Tag>
            </Tooltip>

            <Tooltip
              title={
                <div style={{ fontSize: "12px" }}>
                  <div>
                    <strong>Thống kê:</strong>
                  </div>
                  <div>• Điểm kỹ năng: {user.skillScore}</div>
                  <div>• Hoàn thành: {user.completionRate}%</div>
                  <div>• Công việc tồn: {user.backlogCount}</div>
                </div>
              }
            >
              <InfoCircleOutlined
                style={{
                  color: "#1890ff",
                  marginLeft: 4,
                  fontSize: "12px",
                  cursor: "help",
                }}
              />
            </Tooltip>
          </div>
        </div>
      </Option>
    );
  };

  const customDropdownRender = (menu) => (
    <div>
      {/* Header với thông tin */}
      <div
        style={{
          padding: "8px 12px",
          backgroundColor: "#f6ffed",
          borderBottom: "1px solid #d9d9d9",
          fontSize: "12px",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 2 }}>
          <FireOutlined style={{ color: "#ff4d4f", marginRight: 4 }} />
          Danh sách thành viên đã được xếp hạng
        </div>
        <Text type="secondary">
          Sắp xếp theo: Kỹ năng (60%) + Tỷ lệ hoàn thành (40%) - Công việc tồn
          đọng
        </Text>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Spin size="small" />
          <div style={{ marginTop: 8, fontSize: "12px", color: "#666" }}>
            Đang tải danh sách thành viên...
          </div>
        </div>
      ) : error ? (
        <div
          style={{ textAlign: "center", padding: "20px 0", color: "#ff4d4f" }}
        >
          {error}
        </div>
      ) : hotUsers.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Không có thành viên nào"
          style={{ padding: "20px 0" }}
        />
      ) : (
        menu
      )}
    </div>
  );

  return (
    <Select
      mode="multiple"
      value={value}
      onChange={onChange}
      placeholder={
        placeholder ||
        "Chọn thành viên - danh sách đã được xếp hạng theo hiệu suất"
      }
      optionFilterProp="children"
      showSearch
      allowClear
      size="large"
      maxTagCount={3}
      maxTagTextLength={15}
      suffixIcon={<TeamOutlined />}
      loading={loading}
      style={{ width: "100%", ...style }}
      filterOption={(input, option) => {
        const userId = option.value;
        const user = hotUsers.find((u) => u._id === userId);
        if (!user) return false;
        return (
          user.fullName?.toLowerCase().includes(input.toLowerCase()) ||
          user.email?.toLowerCase().includes(input.toLowerCase())
        );
      }}
      dropdownRender={customDropdownRender}
      {...props}
    >
      {hotUsers.map((user, index) => renderUserOption(user, index))}
    </Select>
  );
};

export default HotUserSelect;