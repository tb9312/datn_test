// pages/Projects/SubProjectDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Card,
  Row,
  Col,
  Tag,
  Avatar,
  Space,
  Descriptions,
  Breadcrumb,
  Typography,
  message,
  Input,
  List,
  App,
  Popconfirm,
  Tabs,
  Tooltip,
  Statistic,
  Divider,
  Timeline,
  Modal,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  UserOutlined,
  CommentOutlined,
  SendOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  FireOutlined,
  LockOutlined,
  FlagOutlined,
  TagOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ProjectOutlined,
  FileTextOutlined,
  HistoryOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { useAuth } from "../../contexts/AuthContext";
import projectService from "../../services/projectService";
import userService from "../../services/userService";
import ProjectForm from "../../components/Projects/ProjectForm";
import hotProjectService from "../../services/hotProjectService";
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const SubProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [task, setTask] = useState(null);
  const [parentProject, setParentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [refusing, setRefusing] = useState(false);
  const { user } = useAuth();
  const [users, setUsers] = useState([]);

  // Lấy parentProjectId từ state hoặc từ task data
  const parentProjectId = location.state?.parentProjectId;

  console.log("=== DEBUG SUBPROJECT DETAIL ===");
  console.log("Task ID:", id);
  console.log("Parent Project ID from state:", parentProjectId);

  useEffect(() => {
    if (id) {
      loadTaskDetail();
    }
  }, [id]);

  // Load comments riêng
  const loadComments = async () => {
    try {
      console.log("📥 Loading comments for task:", id);

      // Load task detail để lấy comments
      const response = await projectService.getProjectDetail(id);

      if (response.success) {
        console.log("✅ Comments loaded:", response.comments?.length || 0);
        setComments(response.comments || []);
      } else {
        console.error("❌ Failed to load comments:", response.message);
        setComments([]);
      }
    } catch (error) {
      console.error("❌ Error loading comments:", error);
      setComments([]);
    }
  };

  const loadTaskDetail = async () => {
    setLoading(true);
    try {
      // 1. Load task detail
      const taskResponse = await projectService.getProjectDetail(id);

      console.log("Task detail API response:", taskResponse);

      if (!taskResponse.success || !taskResponse.data) {
        message.error("Không thể tải chi tiết công việc");
        navigate("/projects");
        return;
      }

      const taskData = taskResponse.data;
      setTask(taskData);

      // 2. Load parent project info (ưu tiên từ state, nếu không thì từ task data)
      const pid = parentProjectId || taskData.projectParentId;
      console.log("Loading parent project with ID:", pid);

      if (pid) {
        const parentResponse = await projectService.getProjectDetail(pid);
        if (parentResponse.success) {
          setParentProject(parentResponse.data);
        } else {
          console.log("⚠️ Could not load parent project");
        }
      }

      // 3. Load comments
      await loadComments();

      // 4. Load users
      const usersResponse = await userService.getUsers();
      if (usersResponse.success) {
        setUsers(usersResponse.data || []);
      }
    } catch (error) {
      console.error("Error loading task detail:", error);
      message.error("Không thể tải chi tiết công việc");
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  };

  // Lấy thông tin user từ comment
  const getUserFromComment = (comment) => {
    // Xử lý cả 2 trường hợp: user (object) hoặc user_id (string)
    if (comment.user && typeof comment.user === "object") {
      return comment.user;
    }

    // Nếu là user_id, tìm trong danh sách users
    const userId = comment.user_id || comment.user;
    if (userId) {
      return getUserInfo(userId);
    }

    return null;
  };

  // Hàm kiểm tra quyền sở hữu comment (đổi tên để tránh trùng)
  const checkCommentOwnership = (comment) => {
    const commentUser = getUserFromComment(comment);
    if (commentUser) {
      return commentUser._id === user?.id || commentUser.id === user?.id;
    }
    return comment.user_id === user?.id;
  };

  const handleEditTask = (task) => {
    console.log("Edit task:", task);
    setEditingTask(task);
    setEditModalVisible(true);
  };

  const handleUpdateTask = async (formData) => {
    try {
      setFormLoading(true);
      const response = await projectService.updateProject(
        editingTask._id,
        formData
      );

      if (response.success) {
        message.success("Cập nhật công việc thành công!");
        setEditModalVisible(false);
        setEditingTask(null);
        loadTaskDetail(); // Load lại chi tiết
      } else {
        message.error(response.message || "Cập nhật công việc thất bại!");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      message.error(error.message || "Cập nhật công việc thất bại!");
    } finally {
      setFormLoading(false);
    }
  };

  // Kiểm tra user có thể comment không
  const canComment = () => {
    if (!task || !user) return false;

    // 1. Người tạo task có thể comment
    if (task.createdBy === user.id) return true;

    // 2. Thành viên trong task có thể comment
    const isMember = task.listUser?.some((member) => {
      const memberId = typeof member === "object" ? member._id : member;
      return memberId === user.id;
    });

    // 3. Người tạo parent project có thể comment
    if (parentProject && parentProject.createdBy === user.id) return true;

    return isMember || false;
  };

  // Thêm comment
  const handleAddComment = async () => {
    if (!commentText.trim()) {
      message.warning("Vui lòng nhập nội dung comment");
      return;
    }

    if (!canComment()) {
      message.warning("Bạn không có quyền comment trong công việc này");
      return;
    }

    console.log("🔄 Adding comment to task:", commentText);

    setSubmitting(true);
    try {
      const response = await projectService.addComment(id, commentText);

      console.log("📤 Comment API response:", response);

      if (response.success) {
        message.success(response.message || "Thêm comment thành công!");
        setCommentText("");

        // Load lại comments sau khi thêm
        await loadComments();
      } else {
        console.error("❌ Comment failed:", response);

        // Hiển thị thông báo lỗi chi tiết
        if (response.code === 403) {
          message.error("Bạn không có quyền comment trong công việc này");
        } else if (response.code === 404) {
          message.error("Công việc không tồn tại hoặc đã bị xóa");
        } else {
          message.error(
            response.message || `Lỗi ${response.code}: Thêm comment thất bại!`
          );
        }
      }
    } catch (error) {
      console.error("💥 Error adding comment:", error);
      message.error(error.message || "Thêm comment thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

  // Mở modal chỉnh sửa comment
  const handleEditComment = (comment) => {
    if (!checkCommentOwnership(comment)) {
      message.warning("Bạn không được chỉnh sửa comment của người khác");
      return;
    }

    setEditingComment(comment);
    setEditCommentText(comment.content || comment.comment || "");
    setCommentModalVisible(true);
  };

  // Lưu comment sau khi chỉnh sửa
  const handleSaveCommentEdit = async () => {
    if (!editCommentText.trim()) {
      message.warning("Vui lòng nhập nội dung comment");
      return;
    }

    try {
      console.log("✏️ Editing comment:", editingComment._id);

      const response = await projectService.editComment(
        editingComment._id,
        editCommentText
      );

      console.log("Edit comment response:", response);

      if (response.success) {
        message.success(response.message || "Đã chỉnh sửa comment!");
        setCommentModalVisible(false);
        setEditingComment(null);
        setEditCommentText("");

        // Load lại comments
        await loadComments();
      } else {
        console.error("❌ Edit comment failed:", response);

        if (response.code === 403) {
          message.error("Bạn không được chỉnh sửa comment của người khác");
        } else {
          message.error(response.message || "Chỉnh sửa comment thất bại!");
        }
      }
    } catch (error) {
      console.error("💥 Error editing comment:", error);
      message.error(error.message || "Chỉnh sửa comment thất bại!");
    }
  };

  // Xóa comment
  const handleDeleteComment = async (comment) => {
    if (!checkCommentOwnership(comment)) {
      message.warning("Bạn không được xóa comment của người khác");
      return;
    }

    try {
      console.log("🗑️ Deleting comment:", comment._id);

      const response = await projectService.deleteComment(comment._id);

      console.log("Delete comment response:", response);

      if (response.success) {
        message.success(response.message || "Đã xóa comment!");

        // Load lại comments
        await loadComments();
      } else {
        console.error("❌ Delete comment failed:", response);

        if (response.code === 403) {
          message.error("Bạn không được xóa comment của người khác");
        } else {
          message.error(response.message || "Xóa comment thất bại!");
        }
      }
    } catch (error) {
      console.error("💥 Error deleting comment:", error);
      message.error(error.message || "Xóa comment thất bại!");
    }
  };

  // THÊM hàm từ chối công việc đột xuất
  const handleRefuseTask = async () => {
    try {
      setRefusing(true);

      console.log("🗑️ Refusing hot task:", id);

      const response = await hotProjectService.refuseProject(id);

      console.log("Refuse response:", response);

      if (response.success) {
        message.success("✅ Đã từ chối tham gia công việc đột xuất!");

        // Delay một chút rồi quay về
        setTimeout(() => {
          if (parentProject) {
            navigate(`/projects/detail/${parentProject._id}`);
          } else {
            navigate("/projects");
          }
        }, 1500);
      } else {
        message.error(response.message || "Từ chối thất bại!");
      }
    } catch (error) {
      console.error("💥 Error refusing task:", error);
      message.error(error.message || "Từ chối thất bại!");
    } finally {
      setRefusing(false);
    }
  };

  const handleDeleteTask = async () => {
    try {
      const response = await projectService.deleteProject(id);

      if (response.success) {
        message.success("Xóa công việc thành công!");
        // Quay về parent project
        if (parentProject) {
          navigate(`/projects/detail/${parentProject._id}`);
        } else {
          navigate("/projects");
        }
      } else {
        message.error(response.message || "Xóa công việc thất bại!");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      message.error(error.message || "Xóa công việc thất bại!");
    }
  };

  const handleChangeStatus = async (newStatus) => {
    try {
      const response = await projectService.changeProjectStatus(id, newStatus);

      if (response.success) {
        message.success("Cập nhật trạng thái thành công!");
        loadTaskDetail();
      } else {
        message.error(response.message || "Cập nhật trạng thái thất bại!");
      }
    } catch (error) {
      console.error("Error changing status:", error);
      message.error(error.message || "Cập nhật trạng thái thất bại!");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      "not-started": "default",
      "in-progress": "processing",
      "on-hold": "warning",
      completed: "success",
      cancelled: "error",
    };
    return colors[status] || "default";
  };

  const getStatusText = (status) => {
    const statusMap = {
      "not-started": "Chưa bắt đầu",
      "in-progress": "Đang thực hiện",
      "on-hold": "Tạm dừng",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  const getStatusIcon = (status) => {
    const icons = {
      "not-started": <FlagOutlined />,
      "in-progress": <PlayCircleOutlined />,
      "on-hold": <PauseCircleOutlined />,
      completed: <CheckCircleOutlined />,
      cancelled: <CloseCircleOutlined />,
    };
    return icons[status] || <FlagOutlined />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "blue",
      medium: "orange",
      high: "red",
    };
    return colors[priority] || "default";
  };

  const getUserInfo = (userId) => {
    return users.find((u) => u._id === userId);
  };

  const canEditTask = () => {
    if (!task || !user) return false;

    if (task.createdBy === user.id) return true;
    if (user.role === "MANAGER") return true;
    if (parentProject && parentProject.createdBy === user.id) return true;

    return false;
  };

  // THÊM hàm kiểm tra người được từ chối
  const canRefuseTask = () => {
    if (!task || !user || !task.statusHot) return false;

    // 1. User phải nằm trong listUser của task
    const isInListUser = task.listUser?.some((memberId) => {
      const id = typeof memberId === "object" ? memberId._id : memberId;
      return id === user?.id;
    });

    if (!isInListUser) return false;

    // 2. User không phải là người tạo task
    if (task.createdBy === user?.id) return false;

    // 3. User không phải là người được assign (nếu có)
    if (task.assignee_id && task.assignee_id === user?.id) return false;

    return true;
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Title level={3}>Đang tải công việc...</Title>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <Title level={3}>Công việc không tồn tại</Title>
        <Button onClick={() => navigate("/projects")}>
          Quay lại danh sách dự án
        </Button>
      </div>
    );
  }

  const taskCreator = getUserInfo(task.createdBy);
  const assignee = getUserInfo(task.assignee_id);
  const isTaskCreator = task.createdBy === user?.id;

  return (
    <App>
      <div>
        {/* Breadcrumb với hierarchical navigation */}
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>
            <a
              onClick={() => navigate("/projects")}
              style={{ cursor: "pointer" }}
            >
              <ProjectOutlined /> Dự án
            </a>
          </Breadcrumb.Item>

          {parentProject && (
            <Breadcrumb.Item>
              <a
                onClick={() =>
                  navigate(`/projects/detail/${parentProject._id}`)
                }
                style={{ cursor: "pointer" }}
              >
                <FileTextOutlined /> {parentProject.title}
              </a>
            </Breadcrumb.Item>
          )}

          <Breadcrumb.Item>
            <strong style={{ color: "#1890ff" }}>
              <TagOutlined /> {task.title}
            </strong>
          </Breadcrumb.Item>
        </Breadcrumb>

        {/* Header Card */}
        <Card style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Title level={2} style={{ margin: 0, marginRight: 16 }}>
                  {task.title}
                </Title>
                <Space>
                  <Tag
                    color={getStatusColor(task.status)}
                    icon={getStatusIcon(task.status)}
                  >
                    {getStatusText(task.status)}
                  </Tag>
                  {/* THÊM badge công việc đột xuất */}
                  {task.statusHot && (
                    <Tag color="red" icon={<FireOutlined />}>
                      Công việc đột xuất
                    </Tag>
                  )}
                  <Tag color={getPriorityColor(task.priority)}>
                    {task.priority === "high"
                      ? "Ưu tiên cao"
                      : task.priority === "medium"
                      ? "Ưu tiên trung bình"
                      : "Ưu tiên thấp"}
                  </Tag>
                  {task.tag && (
                    <Tag color="purple" icon={<TagOutlined />}>
                      {task.tag === "bug"
                        ? "🐛 Bug fix"
                        : task.tag === "feature"
                        ? "✨ Tính năng mới"
                        : task.tag === "improvement"
                        ? "🚀 Cải tiến"
                        : task.tag === "documentation"
                        ? "📚 Tài liệu"
                        : task.tag === "design"
                        ? "🎨 Thiết kế"
                        : task.tag === "test"
                        ? "🧪 Kiểm thử"
                        : task.tag}
                    </Tag>
                  )}
                </Space>
              </div>

              <Text
                style={{ color: "#666", fontSize: "16px", lineHeight: "1.6" }}
              >
                {task.content}
              </Text>
            </div>

            <Space>
              {/* Nút quay về parent project */}
              {parentProject && (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() =>
                    navigate(`/projects/detail/${parentProject._id}`)
                  }
                >
                  Về dự án
                </Button>
              )}

              {/* Nút thay đổi trạng thái */}
              {canEditTask() &&
                task.status !== "completed" &&
                task.status !== "cancelled" && (
                  <Button
                    type="primary"
                    onClick={() => {
                      if (task.status === "not-started") {
                        handleChangeStatus("in-progress");
                      } else if (task.status === "in-progress") {
                        handleChangeStatus("completed");
                      } else if (task.status === "on-hold") {
                        handleChangeStatus("in-progress");
                      }
                    }}
                  >
                    {task.status === "not-started"
                      ? "Bắt đầu"
                      : task.status === "in-progress"
                      ? "Hoàn thành"
                      : task.status === "on-hold"
                      ? "Tiếp tục"
                      : "Cập nhật"}
                  </Button>
                )}

              {/* Nút sửa */}
              {canEditTask() && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleEditTask(task)}
                >
                  Sửa
                </Button>
              )}

              {/* Nút xóa */}
              {canEditTask() && (
                <Popconfirm
                  title="Xóa công việc"
                  description="Bạn có chắc chắn muốn xóa công việc này?"
                  onConfirm={handleDeleteTask}
                  okText="Xóa"
                  cancelText="Hủy"
                  okType="danger"
                >
                  <Button icon={<DeleteOutlined />} danger>
                    Xóa
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </div>
        </Card>

        {/* Parent Project Info (nếu có) */}
        {parentProject && (
          <Card
            style={{
              marginBottom: 16,
              backgroundColor: "#f6ffed",
              borderColor: "#b7eb8f",
            }}
            size="small"
          >
            <Space>
              <Avatar
                icon={<ProjectOutlined />}
                style={{ backgroundColor: "#52c41a" }}
              />
              <div style={{ flex: 1 }}>
                <Text strong>Thuộc dự án: </Text>
                <LinkOutlined style={{ margin: "0 8px", color: "#1890ff" }} />
                <a
                  onClick={() =>
                    navigate(`/projects/detail/${parentProject._id}`)
                  }
                  style={{ cursor: "pointer", color: "#1890ff" }}
                >
                  {parentProject.title}
                </a>
                <Text type="secondary" style={{ marginLeft: 16 }}>
                  Quản lý:{" "}
                  {getUserInfo(parentProject.createdBy)?.fullName ||
                    parentProject.createdBy}
                </Text>
              </div>
              <Button
                size="small"
                onClick={() =>
                  navigate(`/projects/detail/${parentProject._id}`)
                }
              >
                Xem dự án
              </Button>
            </Space>
          </Card>
        )}

        <Row gutter={[16, 16]}>
          {/* Left Column - Task Info */}
          <Col xs={24} lg={8}>
            <Card title="Thông tin công việc" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                {taskCreator && (
                  <Descriptions.Item label="Người tạo">
                    <Space>
                      <Avatar
                        size="small"
                        src={taskCreator?.avatar}
                        icon={<UserOutlined />}
                      />
                      <span>
                        {taskCreator?.fullName || task.createdBy}
                        {isTaskCreator && (
                          <Tag
                            color="green"
                            size="small"
                            style={{ marginLeft: 8 }}
                          >
                            Bạn
                          </Tag>
                        )}
                      </span>
                    </Space>
                  </Descriptions.Item>
                )}

                {assignee && (
                  <Descriptions.Item label="Người thực hiện">
                    <Space>
                      <Avatar
                        size="small"
                        src={assignee?.avatar}
                        icon={<UserOutlined />}
                      />
                      <span>
                        {assignee?.fullName || task.assignee_id}
                        {assignee?._id === user?.id && (
                          <Tag
                            color="blue"
                            size="small"
                            style={{ marginLeft: 8 }}
                          >
                            Bạn
                          </Tag>
                        )}
                      </span>
                    </Space>
                  </Descriptions.Item>
                )}

                <Descriptions.Item label="Ngày bắt đầu">
                  <Space>
                    <CalendarOutlined />
                    <span>
                      {task.timeStart
                        ? moment(task.timeStart).format("DD/MM/YYYY")
                        : "Chưa có"}
                    </span>
                  </Space>
                </Descriptions.Item>

                <Descriptions.Item label="Hạn hoàn thành">
                  <Space>
                    <CalendarOutlined />
                    <span>
                      {task.timeFinish
                        ? moment(task.timeFinish).format("DD/MM/YYYY")
                        : "Chưa có"}
                    </span>
                  </Space>
                </Descriptions.Item>

                {task.estimatedHours > 0 && (
                  <Descriptions.Item label="Ước tính thời gian">
                    <Space>
                      <ClockCircleOutlined />
                      <span>{task.estimatedHours} giờ</span>
                    </Space>
                  </Descriptions.Item>
                )}

                <Descriptions.Item label="Ngày tạo">
                  {moment(task.createdAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
              </Descriptions>
            </Card>
            {/* Thêm phần này sau Card "Thông tin công việc" và trước "Team Members" */}

            {/* Thông tin công việc đột xuất */}
            {task.statusHot && (
              <Card
                title={
                  <Space>
                    <FireOutlined style={{ color: "#ff4d4f" }} />
                    <span>Thông tin công việc đột xuất</span>
                  </Space>
                }
                style={{
                  marginBottom: 16,
                  borderColor: "#ffccc7",
                  backgroundColor: "#fff2e8",
                }}
                size="small"
              >
                <div style={{ marginBottom: 12 }}>
                  <Text strong>Trạng thái: </Text>
                  {task.assignee_id ? (
                    <Space>
                      <Tag color="green">
                        <CheckCircleOutlined /> Đã có người phụ trách
                      </Tag>
                      <Avatar
                        size="small"
                        src={getUserInfo(task.assignee_id)?.avatar}
                        style={{ marginLeft: 8 }}
                      />
                      <Text>
                        {getUserInfo(task.assignee_id)?.fullName ||
                          task.assignee_id}
                      </Text>
                    </Space>
                  ) : (
                    <Tag color="orange">
                      <ClockCircleOutlined /> Đang chờ xác nhận
                    </Tag>
                  )}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <Text strong>Thành viên được mời: </Text>
                  <div style={{ marginTop: 8 }}>
                    {task.listUser && task.listUser.length > 0 ? (
                      <Space wrap>
                        {task.listUser.map((userId) => {
                          const userInfo = getUserInfo(userId);
                          if (!userInfo) return null;

                          const isAssigned = task.assignee_id === userId;
                          const isCurrentUser = userId === user?.id;

                          return (
                            <Tag
                              key={userId}
                              color={
                                isAssigned
                                  ? "green"
                                  : isCurrentUser
                                  ? "blue"
                                  : "default"
                              }
                              icon={
                                isAssigned ? (
                                  <CheckCircleOutlined />
                                ) : (
                                  <UserOutlined />
                                )
                              }
                            >
                              <Avatar
                                size="small"
                                src={userInfo.avatar}
                                style={{ marginRight: 4 }}
                              />
                              {userInfo.fullName}
                              {isAssigned && " (Phụ trách)"}
                              {isCurrentUser && !isAssigned && " (Bạn)"}
                            </Tag>
                          );
                        })}
                      </Space>
                    ) : (
                      <Text type="secondary">Chưa có thành viên nào</Text>
                    )}
                  </div>
                </div>

                {/* Button từ chối chỉ hiển thị nếu user có quyền */}
                {canRefuseTask() && (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 12,
                      borderTop: "1px solid #ffccc7",
                      textAlign: "center",
                    }}
                  >
                    <Text
                      type="secondary"
                      style={{ display: "block", marginBottom: 8 }}
                    >
                      Bạn được mời tham gia công việc đột xuất này
                    </Text>

                    <Popconfirm
                      title="Từ chối tham gia"
                      description={
                        <div>
                          <p>
                            Bạn có chắc chắn muốn từ chối tham gia công việc
                            này?
                          </p>
                          <p style={{ fontSize: "12px", color: "#666" }}>
                            Manager sẽ nhận được thông báo và có thể chọn người
                            khác.
                          </p>
                        </div>
                      }
                      onConfirm={handleRefuseTask}
                      okText="Từ chối"
                      cancelText="Hủy"
                      okType="danger"
                      disabled={refusing}
                    >
                      <Button
                        icon={<CloseCircleOutlined />}
                        danger
                        loading={refusing}
                        size="middle"
                      >
                        Từ chối tham gia
                      </Button>
                    </Popconfirm>
                  </div>
                )}
              </Card>
            )}
            {/* Team Members */}
            {task.listUser && task.listUser.length > 0 && (
              <Card title="Thành viên tham gia" style={{ marginBottom: 16 }}>
                <List
                  dataSource={task.listUser}
                  renderItem={(userId) => {
                    const userItem = getUserInfo(userId);
                    if (!userItem) return null;

                    return (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              src={userItem.avatar}
                              icon={<UserOutlined />}
                            />
                          }
                          title={
                            <Space>
                              <span>{userItem.fullName}</span>
                              {userItem._id === task.createdBy && (
                                <Tag color="gold" size="small">
                                  Tạo
                                </Tag>
                              )}
                              {userItem._id === task.assignee_id && (
                                <Tag color="blue" size="small">
                                  Thực hiện
                                </Tag>
                              )}
                              {userItem._id === user?.id && (
                                <Tag color="green" size="small">
                                  Bạn
                                </Tag>
                              )}
                            </Space>
                          }
                          description={userItem.email}
                        />
                      </List.Item>
                    );
                  }}
                />
              </Card>
            )}

            {/* Quick Stats */}
            <Card title="Thống kê">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Bình luận"
                    value={comments.length}
                    prefix={<CommentOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Thành viên"
                    value={task.listUser?.length || 0}
                    prefix={<TeamOutlined />}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Right Column - Tabs */}
          <Col xs={24} lg={16}>
            <Card>
              <Tabs defaultActiveKey="comments">
                <TabPane tab={`Thảo luận (${comments.length})`} key="comments">
                  {/* Kiểm tra quyền comment trước khi hiển thị input */}
                  {canComment() ? (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Avatar
                          size="large"
                          src={user?.avatar}
                          icon={<UserOutlined />}
                          style={{ backgroundColor: "#1890ff" }}
                        />
                        <div style={{ flex: 1 }}>
                          <TextArea
                            rows={3}
                            placeholder="Thêm bình luận về công việc này..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            maxLength={500}
                            showCount
                          />
                          <div style={{ marginTop: 8, textAlign: "right" }}>
                            <Button
                              type="primary"
                              icon={<SendOutlined />}
                              onClick={handleAddComment}
                              loading={submitting}
                              disabled={!commentText.trim()}
                            >
                              Gửi
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Card
                      style={{ marginBottom: 16, backgroundColor: "#fff2e8" }}
                    >
                      <div style={{ textAlign: "center", padding: "16px" }}>
                        <LockOutlined
                          style={{
                            fontSize: 24,
                            color: "#fa8c16",
                            marginBottom: 8,
                          }}
                        />
                        <div>
                          Bạn không có quyền comment trong công việc này
                        </div>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Chỉ người tạo, người thực hiện và thành viên của công
                          việc mới được comment
                        </Text>
                      </div>
                    </Card>
                  )}

                  {/* Comments list */}
                  {comments.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                      <CommentOutlined
                        style={{
                          fontSize: 48,
                          color: "#d9d9d9",
                          marginBottom: 16,
                        }}
                      />
                      <div>Chưa có bình luận nào</div>
                      {!canComment() && (
                        <Text
                          type="secondary"
                          style={{ fontSize: "12px", marginTop: 8 }}
                        >
                          Tham gia công việc để bình luận
                        </Text>
                      )}
                    </div>
                  ) : (
                    <List
                      dataSource={comments.sort(
                        (a, b) => (b.position || 0) - (a.position || 0)
                      )}
                      renderItem={(comment) => {
                        const commentUser = getUserFromComment(comment);
                        const isOwner = checkCommentOwnership(comment); // Sửa ở đây

                        return (
                          <List.Item
                            actions={[
                              isOwner && (
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<EditOutlined />}
                                  onClick={() => handleEditComment(comment)}
                                >
                                  Sửa
                                </Button>
                              ),

                              isOwner && (
                                <Popconfirm
                                  title="Xóa comment"
                                  description="Bạn có chắc chắn muốn xóa comment này?"
                                  onConfirm={() => handleDeleteComment(comment)}
                                  okText="Xóa"
                                  cancelText="Hủy"
                                  okType="danger"
                                >
                                  <Button
                                    size="small"
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                  >
                                    Xóa
                                  </Button>
                                </Popconfirm>
                              ),
                            ].filter(Boolean)}
                          >
                            <List.Item.Meta
                              avatar={
                                <Avatar
                                  size="large"
                                  src={commentUser?.avatar}
                                  style={{
                                    backgroundColor: isOwner
                                      ? "#1890ff"
                                      : "#d9d9d9",
                                  }}
                                >
                                  {commentUser?.fullName?.charAt(0) ||
                                    comment.userName?.charAt(0) || (
                                      <UserOutlined />
                                    )}
                                </Avatar>
                              }
                              title={
                                <Space>
                                  <strong>
                                    {commentUser?.fullName || comment.userName}
                                  </strong>
                                  {isOwner && (
                                    <Tag color="blue" size="small">
                                      Bạn
                                    </Tag>
                                  )}
                                  {commentUser &&
                                    commentUser._id === task.createdBy && (
                                      <Tag
                                        color="gold"
                                        size="small"
                                        icon={<CrownOutlined />}
                                      >
                                        Người tạo
                                      </Tag>
                                    )}
                                  <span style={{ color: "#999", fontSize: 12 }}>
                                    {moment(
                                      comment.createdAt || comment.created_at
                                    ).fromNow()}
                                  </span>
                                </Space>
                              }
                              description={
                                <div>
                                  <p
                                    style={{
                                      margin: 0,
                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
                                    {comment.content || comment.comment}
                                  </p>
                                  {comment.updatedAt &&
                                    comment.updatedAt !== comment.createdAt && (
                                      <Text
                                        type="secondary"
                                        style={{
                                          fontSize: "11px",
                                          marginTop: 4,
                                          display: "block",
                                        }}
                                      >
                                        <EditOutlined /> Đã chỉnh sửa{" "}
                                        {moment(comment.updatedAt).fromNow()}
                                      </Text>
                                    )}
                                </div>
                              }
                            />
                          </List.Item>
                        );
                      }}
                    />
                  )}
                </TabPane>

                <TabPane tab="Lịch sử" key="history" icon={<HistoryOutlined />}>
                  <Timeline>
                    <Timeline.Item color="green">
                      <p>
                        <strong>Công việc được tạo</strong>
                      </p>
                      <p>Bởi: {taskCreator?.fullName || "Người dùng"}</p>
                      <small>
                        {moment(task.createdAt).format("DD/MM/YYYY HH:mm")}
                      </small>
                    </Timeline.Item>

                    {task.timeStart && (
                      <Timeline.Item color="blue">
                        <p>
                          <strong>
                            Ngày bắt đầu:{" "}
                            {moment(task.timeStart).format("DD/MM/YYYY")}
                          </strong>
                        </p>
                      </Timeline.Item>
                    )}

                    {task.timeFinish && (
                      <Timeline.Item color="orange">
                        <p>
                          <strong>
                            Hạn hoàn thành:{" "}
                            {moment(task.timeFinish).format("DD/MM/YYYY")}
                          </strong>
                        </p>
                      </Timeline.Item>
                    )}

                    {/* Có thể thêm các sự kiện thay đổi status ở đây */}
                  </Timeline>

                  <Divider />

                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <Text type="secondary">
                      Lịch sử thay đổi chi tiết sẽ được cập nhật khi có hoạt
                      động
                    </Text>
                  </div>
                </TabPane>

                <TabPane tab="Tệp đính kèm" key="attachments">
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <FileTextOutlined
                      style={{
                        fontSize: 48,
                        color: "#d9d9d9",
                        marginBottom: 16,
                      }}
                    />
                    <div>Chưa có tệp đính kèm</div>
                    <Text
                      type="secondary"
                      style={{ fontSize: "12px", marginTop: 8 }}
                    >
                      Tính năng upload file đang phát triển
                    </Text>
                  </div>
                </TabPane>
              </Tabs>
            </Card>
          </Col>
        </Row>

        {/* Modal chỉnh sửa comment */}
        <Modal
          title="Chỉnh sửa comment"
          open={commentModalVisible}
          onCancel={() => {
            setCommentModalVisible(false);
            setEditingComment(null);
            setEditCommentText("");
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setCommentModalVisible(false);
                setEditingComment(null);
                setEditCommentText("");
              }}
            >
              Hủy
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={handleSaveCommentEdit}
              loading={submitting}
              disabled={!editCommentText.trim()}
            >
              Lưu thay đổi
            </Button>,
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Nhập nội dung comment..."
            value={editCommentText}
            onChange={(e) => setEditCommentText(e.target.value)}
            maxLength={500}
            showCount
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Modal>

        {/* Modal chỉnh sửa công việc */}
        {editModalVisible && (
          <Modal
            title="Chỉnh sửa công việc"
            open={editModalVisible}
            onCancel={() => {
              setEditModalVisible(false);
              setEditingTask(null);
            }}
            footer={null}
            width={700}
            destroyOnClose
          >
            <ProjectForm
              visible={editModalVisible}
              onCancel={() => {
                setEditModalVisible(false);
                setEditingTask(null);
              }}
              onFinish={handleUpdateTask}
              initialValues={editingTask}
              loading={formLoading}
              users={users}
              currentUser={user}
              isParentProject={false}
              autoAssignToCreator={false}
              isCreatingTask={true}
              parentProjectId={
                parentProject?._id || editingTask?.projectParentId
              }
            />
          </Modal>
        )}
      </div>
    </App>
  );
};

export default SubProjectDetail;