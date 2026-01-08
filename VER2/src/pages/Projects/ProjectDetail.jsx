// pages/Projects/ProjectDetail.jsx - ĐÃ FIX RESPONSIVE
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  List,
  Avatar,
  Alert,
  Space,
  Tabs,
  Descriptions,
  Breadcrumb,
  Typography,
  Modal,
  message,
  Input,
  Form,
  Tooltip,
  Select,
  DatePicker,
  App,
  Popconfirm,
  Divider,
  Badge
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  CalendarOutlined,
  UserOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  FireOutlined,
  CommentOutlined,
  PlusOutlined,
  EyeOutlined,
  LockOutlined,
  SendOutlined,
  MoreOutlined,
  ProjectOutlined,
  TagOutlined
} from "@ant-design/icons";
import moment from "moment";
import { useAuth } from "../../contexts/AuthContext";
import projectService from "../../services/projectService";
import ProjectForm from "../../components/Projects/ProjectForm";
import userService from "../../services/userService";
import HotUserSelect from "../../components/Projects/HotUserSelect";
import hotProjectService from "../../services/hotProjectService";
import { useResponsive, getModalWidth } from "../../utils/responsiveUtils";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const ProjectDetailContent = () => {
  const { id } = useParams();
  const { modal } = App.useApp();
  const navigate = useNavigate();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subProjects, setSubProjects] = useState([]);
  const [subProjectModalVisible, setSubProjectModalVisible] = useState(false);
  const [editingSubProject, setEditingSubProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user, isManager } = useAuth();
  const [users, setUsers] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);
  const [hotTaskModalVisible, setHotTaskModalVisible] = useState(false);
  
  console.log("=== DEBUG PROJECT DETAIL ===");
  console.log("Project ID from URL:", id);
  console.log("Is Mobile:", isMobile, "Is Tablet:", isTablet);

  useEffect(() => {
    console.log("useEffect triggered, loading project:", id);
    if (id) {
      loadProjectDetail();
    }
  }, [id]);

  useEffect(() => {
    if (project) {
      loadProjectUsers();
      loadComments();
    }
  }, [project]);

  // Load danh sách user từ project
  const loadProjectUsers = async () => {
    try {
      console.log("=== Loading Project Users ===");

      const allUsersResponse = await userService.getUsers();

      console.log("All users API response:", allUsersResponse);

      if (!allUsersResponse.success || !Array.isArray(allUsersResponse.data)) {
        console.error("❌ Cannot get users from API or data is not array");
        setProjectUsers([]);
        setUsers([]);
        return;
      }

      const allUsers = allUsersResponse.data;
      console.log("✅ All users from API:", allUsers.length);

      // Lọc chỉ lấy users có trong dự án
      const projectMemberIds = [];

      // Thêm người tạo
      if (project.createdBy) {
        projectMemberIds.push(project.createdBy);
      }

      // Thêm thành viên từ listUser
      if (project.listUser && Array.isArray(project.listUser)) {
        project.listUser.forEach((member) => {
          const memberId = typeof member === "object" ? member._id : member;
          if (memberId && !projectMemberIds.includes(memberId)) {
            projectMemberIds.push(memberId);
          }
        });
      }

      // Lọc users thực tế
      const filteredUsers = allUsers.filter((userItem) =>
        projectMemberIds.includes(userItem._id)
      );

      // Đảm bảo người tạo luôn có trong danh sách
      if (project.createdBy) {
        const creator = allUsers.find((u) => u._id === project.createdBy);
        if (creator && !filteredUsers.some((u) => u._id === creator._id)) {
          filteredUsers.push(creator);
        }
      }

      console.log("✅ Filtered project users:", filteredUsers.length, "users");

      setProjectUsers(filteredUsers);
      setUsers(allUsers);
    } catch (error) {
      console.error("❌ Error loading project users:", error);
      setProjectUsers([]);
      setUsers([]);
    }
  };

  // Load comments riêng
  const loadComments = async () => {
    try {
      console.log("=== Loading Comments for Project ===", id);

      // Load project detail để lấy comments
      const response = await projectService.getProjectDetail(id);
      console.log("Project detail for comments response:", response);
      if (response.success) {
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

  // Load chi tiết dự án
  const loadProjectDetail = async () => {
    console.log("Loading project detail for ID:", id);
    setLoading(true);
    try {
      // 1. Load project detail
      const response = await projectService.getProjectDetail(id);

      console.log("Project detail API response:", response);

      if (!response.success) {
        console.error("API returned error:", response);
        message.error("Không thể tải chi tiết dự án");
        navigate("/projects");
        return;
      }

      const projectData = response.data;
      console.log("Project data:", projectData);

      if (!projectData) {
        console.error("No project data found");
        message.error("Dự án không tồn tại");
        navigate("/projects");
        return;
      }

      setProject(projectData);

      // 2. Load sub-projects (công việc) bằng API mới
      console.log("📋 Fetching sub-projects for project:", id);
      const subProjectsResponse = await projectService.getTasksByParent(id);
      console.log("Sub-projects response:", subProjectsResponse);

      if (subProjectsResponse.success) {
        console.log(
          `✅ Found ${subProjectsResponse.data?.length || 0} sub-projects`
        );
        setSubProjects(subProjectsResponse.data || []);
      } else {
        console.log(
          "❌ Failed to load sub-projects:",
          subProjectsResponse.message
        );
        setSubProjects([]);
      }
    } catch (error) {
      console.error("Error loading project detail:", error);
      message.error("Không thể tải chi tiết dự án");
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra user có thể tạo công việc không
  const canCreateSubProject = () => {
    if (!project || !user) return false;

    // 1. Người tạo dự án cha có quyền
    if (project.createdBy === user.id) return true;

    // 2. Thành viên trong dự án có quyền
    const isMember = project.listUser?.some((member) => {
      const memberId = typeof member === "object" ? member._id : member;
      return memberId === user.id;
    });

    return isMember || false;
  };

  // Kiểm tra user có thể sửa/xóa công việc không
  const canEditSubProject = (subProject) => {
    if (!user || !subProject) return false;

    // 1. Người tạo công việc có quyền
    if (subProject.createdBy === user.id) return true;

    // 2. Người tạo dự án cha có quyền
    if (project.createdBy === user.id) return true;

    // 3. Manager có quyền sửa tất cả
    if (user.role === "MANAGER") return true;

    return false;
  };

  // Tạo công việc
  const handleCreateSubProject = async (formData) => {
    try {
      setLoading(true);

      console.log("🎯 === USER TẠO TASK ===");
      console.log("User Role:", user?.role);
      console.log("Parent ID:", id);

      const finalFormData = new FormData();

      // Copy tất cả data
      for (let [key, value] of formData.entries()) {
        finalFormData.append(key, value);
      }

      // Đảm bảo có projectParentId
      finalFormData.set("projectParentId", id);

      // Đảm bảo có createdBy và assignee_id
      finalFormData.set("createdBy", user.id);
      finalFormData.set("assignee_id", user.id);

      // Gọi API - LUÔN là task nên isSubProject = true
      const response = await projectService.createProject(finalFormData, true);

      console.log("📥 Response:", response);

      if (response.success) {
        message.success("🎉 Tạo công việc thành công!");
        setSubProjectModalVisible(false);
        loadProjectDetail(); // Load lại để cập nhật danh sách
      } else {
        if (response.code === 403) {
          message.error("🚫 " + response.message);
        } else if (response.code === 404) {
          message.error("🔍 " + response.message);
        } else {
          message.error("❌ " + (response.message || "Tạo công việc thất bại"));
        }
      }
    } catch (error) {
      console.error("💥 Error:", error);
      message.error(error.message || "Tạo công việc thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHotTask = async (formData) => {
    try {
      // Chỉ Manager mới được tạo
      if (!isManager) {
        message.error("Chỉ Manager mới được tạo công việc đột xuất!");
        return;
      }

      setLoading(true);

      console.log("🔥 === MANAGER TẠO CÔNG VIỆC ĐỘT XUẤT ===");
      console.log("User Role:", user?.role);
      console.log("Parent Project ID:", id);

      const finalFormData = new FormData();

      // Thêm tất cả field từ form
      for (let [key, value] of formData.entries()) {
        if (value instanceof File || typeof value === "string") {
          finalFormData.append(key, value);
        } else if (value !== null && value !== undefined) {
          finalFormData.append(key, String(value));
        }
      }

      // Đảm bảo các trường bắt buộc
      finalFormData.set("projectParentId", id);
      finalFormData.set("createdBy", user.id);
      finalFormData.set("assignee_id", user.id);
      finalFormData.set("statusHot", "true");
      finalFormData.set("priority", "high");

      // Debug FormData
      console.log("🔥 Final FormData:");
      for (let [key, value] of finalFormData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await hotProjectService.createHotProject(finalFormData);

      console.log("🔥 Hot Task Response:", response);

      if (response.success) {
        message.success("🎉 Tạo công việc đột xuất thành công!");
        setHotTaskModalVisible(false);
        loadProjectDetail();
      } else {
        message.error(
          "❌ " + (response.message || "Tạo công việc đột xuất thất bại")
        );
      }
    } catch (error) {
      console.error("💥 Error creating hot task:", error);
      message.error(error.message || "Tạo công việc đột xuất thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubProject = async (subProjectId) => {
    modal.confirm({
      title: "Xóa công việc",
      content: "Bạn có chắc chắn muốn xóa công việc này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      async onOk() {
        try {
          const response = await projectService.deleteProject(subProjectId);

          if (response.success) {
            message.success("Xóa công việc thành công!");
            loadProjectDetail();
          } else {
            message.error(response.message || "Xóa công việc thất bại!");
          }
        } catch (error) {
          console.error("Error deleting sub-project:", error);
          message.error(error.message || "Xóa công việc thất bại!");
        }
      },
    });
  };

  const handleEditSubProject = (subProject) => {
    setEditingSubProject(subProject);
    setSubProjectModalVisible(true);
  };

  const handleUpdateSubProject = async (formData) => {
    try {
      setLoading(true);

      const response = await projectService.updateProject(
        editingSubProject._id,
        formData
      );

      if (response.success) {
        message.success("Cập nhật công việc thành công!");
        setSubProjectModalVisible(false);
        setEditingSubProject(null);
        loadProjectDetail();
      } else {
        message.error(response.message || "Cập nhật công việc thất bại!");
      }
    } catch (error) {
      console.error("Error updating sub-project:", error);
      message.error(error.message || "Cập nhật công việc thất bại!");
    } finally {
      setLoading(false);
    }
  };

  // Xác định xem user có thể comment không
  const canComment = () => {
    if (!project || !user) return false;

    // 1. Người tạo dự án cha có thể comment
    if (project.createdBy === user.id) return true;

    // 2. Thành viên trong dự án có thể comment
    const isMember = project.listUser?.some((member) => {
      const memberId = typeof member === "object" ? member._id : member;
      return memberId === user.id;
    });

    return isMember || false;
  };

  const isCommentOwner = (comment) => {
    if (!comment || !comment.user || !user) return false;

    // Backend đã populate user thành object
    const commentUserId = comment.user._id || comment.user.id;
    const currentUserId = user.id || user._id;

    return commentUserId === currentUserId;
  };

  // Thêm comment
  const handleAddComment = async () => {
    if (!commentText.trim()) {
      message.warning("Vui lòng nhập nội dung comment");
      return;
    }

    if (!canComment()) {
      message.warning("Bạn không có quyền comment trong dự án này");
      return;
    }

    setSubmitting(true);
    try {
      const response = await projectService.addComment(id, commentText);

      if (response.success) {
        setCommentText("");
        await loadComments();
        message.success("Thêm comment thành công!");
      } else {
        if (response.code === 403) {
          message.error("Bạn không có quyền comment trong dự án này");
        } else if (response.code === 404) {
          message.error("Dự án không tồn tại hoặc đã bị xóa");
        } else {
          message.error(
            response.message || `Lỗi ${response.code}: Thêm comment thất bại!`
          );
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      message.error(error.message || "Thêm comment thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

  // Mở modal chỉnh sửa comment
  const handleEditComment = (comment) => {
    if (!isCommentOwner(comment)) {
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
      const response = await projectService.editComment(
        editingComment._id,
        editCommentText
      );

      if (response.success) {
        message.success(response.message || "Đã chỉnh sửa comment!");
        setCommentModalVisible(false);
        setEditingComment(null);
        setEditCommentText("");
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
      console.error("Error editing comment:", error);
      message.error(error.message || "Chỉnh sửa comment thất bại!");
    }
  };

  // Xóa comment
  const handleDeleteComment = async (comment) => {
    if (!isCommentOwner(comment)) {
      message.warning("Bạn không được xóa comment của người khác");
      return;
    }

    try {
      const response = await projectService.deleteComment(comment._id);

      if (response.success) {
        message.success(response.message || "Đã xóa comment!");
        await loadComments();
      } else {
        message.error(response.message || "Xóa comment thất bại!");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      message.error(error.message || "Xóa comment thất bại!");
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

  const getPriorityColor = (priority) => {
    const colors = {
      low: "blue",
      medium: "orange",
      high: "red",
    };
    return colors[priority] || "default";
  };

  // Lấy thông tin user từ ID
  const getUserInfo = (userId) => {
    return (
      projectUsers.find((u) => u._id === userId) ||
      users.find((u) => u._id === userId)
    );
  };

  if (loading && !project) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Title level={3}>Đang tải dự án...</Title>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <Title level={3}>Dự án không tồn tại</Title>
        <Button onClick={() => navigate("/projects")}>
          Quay lại danh sách dự án
        </Button>
      </div>
    );
  }

  const subProjectStats = {
    total: subProjects.length,
    completed: subProjects.filter((p) => p.status === "completed").length,
    inProgress: subProjects.filter((p) => p.status === "in-progress").length,
    notStarted: subProjects.filter((p) => p.status === "not-started").length,
  };

  // Tỷ lệ hoàn thành
  const completionRate =
    subProjectStats.total > 0
      ? Math.round((subProjectStats.completed / subProjectStats.total) * 100)
      : 0;

  // Người tạo dự án = Người phụ trách
  const projectCreator = getUserInfo(project.createdBy);
  const isCreator = project.createdBy === user?.id;

  // Responsive settings
  const modalWidth = getModalWidth(isMobile, isTablet, isDesktop);
  const avatarSize = isMobile ? 'small' : isTablet ? 'default' : 'large';

  return (
    <div className="project-detail-page">
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <a
            onClick={() => navigate("/projects")}
            style={{ cursor: "pointer" }}
            className="breadcrumb-link"
          >
            <ProjectOutlined /> {isMobile ? "Dự án" : "Dự án"}
          </a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <span className="breadcrumb-current">
            {isMobile && project.title.length > 20 
              ? project.title.substring(0, 20) + "..." 
              : project.title}
          </span>
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Project Header */}
      <Card className="project-header-card">
        <div className="project-header-content">
          <div className="project-header-info">
            <div className="project-title-section">
              <Title level={isMobile ? 3 : 2} style={{ margin: 0, marginRight: 16 }} className="project-title">
                {isMobile && project.title.length > 30 
                  ? project.title.substring(0, 30) + "..." 
                  : project.title}
              </Title>
              <div className="project-tags">
                <Space wrap size={isMobile ? 4 : 8}>
                  <Tag color={getStatusColor(project.status)} size={isMobile ? "small" : "default"}>
                    {getStatusText(project.status)}
                  </Tag>
                  <Tag color={getPriorityColor(project.priority)} size={isMobile ? "small" : "default"}>
                    {project.priority === "high"
                      ? "Ưu tiên cao"
                      : project.priority === "medium"
                      ? "Ưu tiên trung bình"
                      : "Ưu tiên thấp"}
                  </Tag>
                  {isCreator && (
                    <Tag color="gold" icon={<CrownOutlined />} size={isMobile ? "small" : "default"}>
                      {isMobile ? "Bạn" : "Bạn phụ trách"}
                    </Tag>
                  )}
                </Space>
              </div>
            </div>

            <Paragraph
              className="project-description"
              style={{ 
                color: "#666", 
                fontSize: isMobile ? "14px" : "16px", 
                lineHeight: "1.6",
                marginBottom: isMobile ? 8 : 12
              }}
              ellipsis={isMobile ? { rows: 2 } : { rows: 3 }}
            >
              {project.content}
            </Paragraph>

            {/* Project Thumbnail */}
            {project.thumbnail && (
              <div className="project-thumbnail">
                <img
                  src={project.thumbnail}
                  alt="Thumbnail"
                  style={{
                    maxWidth: "100%",
                    maxHeight: isMobile ? 150 : 200,
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              </div>
            )}
          </div>

          <div className="project-action-buttons">
            <Space direction={isMobile ? "vertical" : "horizontal"} style={{ width: isMobile ? "100%" : "auto" }}>
              {/* Chỉ hiển thị nút Thêm công việc nếu user có quyền */}
              {canCreateSubProject() ? (
                <>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setSubProjectModalVisible(true)}
                    size={isMobile ? "middle" : "large"}
                    block={isMobile}
                  >
                    {isMobile ? "Thêm CV" : "Thêm công việc"}
                  </Button>
                  {/* CHỈ MANAGER mới thấy nút này */}
                  {(user?.role === "manager" || user?.role === "MANAGER") && (
                    <Button
                      type="primary"
                      danger
                      icon={<FireOutlined />}
                      onClick={() => setHotTaskModalVisible(true)}
                      size={isMobile ? "middle" : "large"}
                      block={isMobile}
                    >
                      {isMobile ? "CV đột xuất" : "Công việc đột xuất"}
                    </Button>
                  )}
                </>
              ) : (
                <Tooltip title="Bạn không có quyền tạo công việc trong dự án này">
                  <Button type="primary" icon={<LockOutlined />} disabled block={isMobile}>
                    {isMobile ? "Thêm CV" : "Thêm công việc"}
                  </Button>
                </Tooltip>
              )}
            </Space>
          </div>
        </div>
      </Card>

      {/* Project Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6} md={6} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={isMobile ? "Tổng CV" : "Tổng công việc"}
              value={subProjectStats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ fontSize: isMobile ? 20 : 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={isMobile ? "Hoàn thành" : "Đã hoàn thành"}
              value={subProjectStats.completed}
              valueStyle={{ color: "#52c41a", fontSize: isMobile ? 20 : 24 }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={isMobile ? "Đang làm" : "Đang thực hiện"}
              value={subProjectStats.inProgress}
              valueStyle={{ color: "#1890ff", fontSize: isMobile ? 20 : 24 }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={isMobile ? "Hoàn thành" : "Công việc hoàn thành"}
              value={completionRate}
              suffix="%"
              valueStyle={{
                color: completionRate === 100 ? "#52c41a" : "#faad14",
                fontSize: isMobile ? 20 : 24
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="project-detail-row">
        {/* Project Details */}
        <Col xs={24} md={8} lg={8} xl={7} className="project-sidebar-col">
          <Card className="project-info-card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
                {isMobile ? "Thông tin" : "Thông tin dự án"}
              </Title>
            </div>
            <Descriptions column={1} size="small" className="project-info-list">
              <Descriptions.Item label="Người tạo & phụ trách">
                <Space>
                  <Avatar
                    size={isMobile ? "small" : "default"}
                    src={projectCreator?.avatar}
                    icon={<CrownOutlined />}
                    style={{
                      backgroundColor: isCreator ? "#fadb14" : "#1890ff",
                      color: "#fff",
                    }}
                  />
                  <div className="user-info">
                    <span className="user-name">
                      {projectCreator?.fullName || project.createdBy}
                    </span>
                    {isCreator && (
                      <Tag color="gold" size="small" style={{ marginLeft: 8 }}>
                        Bạn
                      </Tag>
                    )}
                  </div>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Ngày bắt đầu">
                <Space>
                  <CalendarOutlined />
                  <span>
                    {project.timeStart
                      ? moment(project.timeStart).format(isMobile ? "DD/MM" : "DD/MM/YYYY")
                      : "Chưa có"}
                  </span>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Hạn hoàn thành">
                <Space>
                  <CalendarOutlined />
                  <span>
                    {project.timeFinish
                      ? moment(project.timeFinish).format(isMobile ? "DD/MM" : "DD/MM/YYYY")
                      : "Chưa có"}
                  </span>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Ngày tạo">
                {moment(project.createdAt).format(isMobile ? "DD/MM HH:mm" : "DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Team Members */}
          {projectUsers.length > 0 && (
            <Card className="team-members-card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
                  {isMobile ? "Thành viên" : "Thành viên nhóm"}
                </Title>
              </div>
              <List
                className="team-members-list"
                dataSource={projectUsers}
                size={isMobile ? "small" : "default"}
                renderItem={(userItem) => (
                  <List.Item className="team-member-item">
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={isMobile ? "small" : "default"}
                          src={userItem.avatar}
                          icon={
                            userItem._id === project.createdBy ? (
                              <CrownOutlined />
                            ) : (
                              <UserOutlined />
                            )
                          }
                          style={{
                            backgroundColor:
                              userItem._id === project.createdBy
                                ? "#fadb14"
                                : "#d9d9d9",
                          }}
                        >
                          {userItem.fullName?.charAt(0)}
                        </Avatar>
                      }
                      title={
                        <div className="member-title">
                          <span className="member-name">{userItem.fullName}</span>
                          <div className="member-tags">
                            {userItem._id === project.createdBy && (
                              <Tag color="gold" size="small">
                                {isMobile ? "PT" : "Phụ trách"}
                              </Tag>
                            )}
                            {userItem._id === user?.id && (
                              <Tag color="green" size="small">
                                Bạn
                              </Tag>
                            )}
                          </div>
                        </div>
                      }
                      description={
                        <div className="member-email">
                          {!isMobile && userItem.email}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Col>

        {/* Main Content - Sub Projects */}
        <Col xs={24} md={16} lg={16} xl={17} className="project-main-col">
          <Card className="project-content-card">
            <Tabs 
              defaultActiveKey="subProjects" 
              size={isMobile ? "small" : "default"}
              className="project-tabs"
            >
              <TabPane
                tab={
                  <span>
                    <FileTextOutlined /> {isMobile ? `CV (${subProjects.length})` : `Công việc (${subProjects.length})`}
                  </span>
                }
                key="subProjects"
              >
                {subProjects.length === 0 ? (
                  <div className="empty-state">
                    <FileTextOutlined
                      style={{
                        fontSize: isMobile ? 36 : 48,
                        color: "#d9d9d9",
                        marginBottom: 16,
                      }}
                    />
                    <div style={{ fontSize: isMobile ? 14 : 16 }}>Chưa có công việc nào</div>
                    {canCreateSubProject() && (
                      <Button
                        type="primary"
                        style={{ marginTop: 16 }}
                        onClick={() => setSubProjectModalVisible(true)}
                        size={isMobile ? "middle" : "large"}
                      >
                        Thêm công việc đầu tiên
                      </Button>
                    )}
                  </div>
                ) : (
                  <List
                    className="subprojects-list"
                    dataSource={subProjects}
                    size={isMobile ? "small" : "default"}
                    renderItem={(subProject) => {
                      const subProjectCreator = getUserInfo(
                        subProject.createdBy
                      );
                      const isSubProjectCreator =
                        subProject.createdBy === user?.id;

                      return (
                        <List.Item
                          className="subproject-item"
                          actions={
                            isMobile
                              ? [
                                  <Button
                                    key="view"
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() =>
                                      navigate(
                                        `/projects/detail/${id}/subproject/${subProject._id}`,
                                        {
                                          state: { parentProjectId: id },
                                        }
                                      )
                                    }
                                  />,
                                  canEditSubProject(subProject) && (
                                    <Button
                                      key="more"
                                      size="small"
                                      icon={<MoreOutlined />}
                                      onClick={() => {
                                        // Show dropdown menu on mobile
                                        modal.confirm({
                                          title: 'Tùy chọn công việc',
                                          content: (
                                            <div>
                                              <Button 
                                                type="text" 
                                                block 
                                                icon={<EditOutlined />}
                                                onClick={() => {
                                                  modal.destroy();
                                                  handleEditSubProject(subProject);
                                                }}
                                              >
                                                Chỉnh sửa
                                              </Button>
                                              <Divider style={{ margin: '8px 0' }} />
                                              <Button 
                                                type="text" 
                                                danger 
                                                block 
                                                icon={<DeleteOutlined />}
                                                onClick={() => {
                                                  modal.destroy();
                                                  handleDeleteSubProject(subProject._id);
                                                }}
                                              >
                                                Xóa
                                              </Button>
                                            </div>
                                          ),
                                          footer: null,
                                          width: 250
                                        });
                                      }}
                                    />
                                  )
                                ].filter(Boolean)
                              : [
                                  <Button
                                    key="view"
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() =>
                                      navigate(
                                        `/projects/detail/${id}/subproject/${subProject._id}`,
                                        {
                                          state: { parentProjectId: id },
                                        }
                                      )
                                    }
                                  >
                                    Xem chi tiết
                                  </Button>,
                                  canEditSubProject(subProject) && (
                                    <>
                                      <Button
                                        key="edit"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() =>
                                          handleEditSubProject(subProject)
                                        }
                                      >
                                        Sửa
                                      </Button>
                                      <Button
                                        key="delete"
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        danger
                                        onClick={() =>
                                          handleDeleteSubProject(subProject._id)
                                        }
                                      >
                                        Xóa
                                      </Button>
                                    </>
                                  ),
                                ].filter(Boolean)
                          }
                        >
                          <List.Item.Meta
                            avatar={
                              <Tooltip
                                title={
                                  subProjectCreator
                                    ? `Người tạo: ${subProjectCreator.fullName}`
                                    : "Người tạo"
                                }
                              >
                                <Badge
                                  dot
                                  color={getStatusColor(subProject.status)}
                                  offset={[-5, 5]}
                                >
                                  <Avatar
                                    size={isMobile ? "small" : "default"}
                                    style={{
                                      backgroundColor: isSubProjectCreator
                                        ? "#52c41a"
                                        : getStatusColor(subProject.status),
                                      color: "#fff",
                                    }}
                                    src={subProjectCreator?.avatar}
                                  >
                                    {subProjectCreator?.fullName?.charAt(0) ||
                                      subProject.title?.charAt(0) ||
                                      "T"}
                                  </Avatar>
                                </Badge>
                              </Tooltip>
                            }
                            title={
                              <div className="subproject-title-section">
                                <div className="subproject-title-row">
                                  <span className="subproject-name">
                                    {isMobile && subProject.title.length > 25
                                      ? subProject.title.substring(0, 25) + "..."
                                      : subProject.title}
                                  </span>
                                  <div className="subproject-tags">
                                    {subProject.statusHot && (
                                  <Tag 
                                    color="red" 
                                    size="small"
                                    icon={<FireOutlined />}
                                    style={{ 
                                      fontWeight: 500,
                                      borderColor: '#ff4d4f'
                                    }}
                                  >
                                    {isMobile ? "Đột xuất" : "Công việc đột xuất"}
                                  </Tag>
                                )}
                                    {subProjectCreator && (
                                      <Tag
                                        color={
                                          isSubProjectCreator ? "green" : "blue"
                                        }
                                        size="small"
                                      >
                                        <Space size={2}>
                                          <UserOutlined />
                                          {isMobile ? (
                                            <span>{subProjectCreator.fullName.substring(0, 5)}...</span>
                                          ) : (
                                            <span>{subProjectCreator.fullName}</span>
                                          )}
                                          {isSubProjectCreator && (
                                            <span className="you-tag">(Bạn)</span>
                                          )}
                                        </Space>
                                      </Tag>
                                    )}
                                  </div>
                                </div>
                                <div className="subproject-status-row">
                                  <Tag
                                    color={getStatusColor(subProject.status)}
                                    size="small"
                                  >
                                    {getStatusText(subProject.status)}
                                  </Tag>
                                  <Tag
                                    color={getPriorityColor(subProject.priority)}
                                    size="small"
                                  >
                                    {subProject.priority === "high"
                                      ? "Cao"
                                      : subProject.priority === "medium"
                                      ? "TB"
                                      : "Thấp"}
                                  </Tag>
                                </div>
                              </div>
                            }
                            description={
                              <div className="subproject-description">
                                <div className="subproject-content">
                                  {isMobile && subProject.content && subProject.content.length > 40
                                    ? subProject.content.substring(0, 40) + "..."
                                    : subProject.content}
                                </div>
                                <div className="subproject-meta">
                                  {subProject.timeStart && (
                                    <span className="meta-item">
                                      📅 Bắt đầu: {moment(
                                        subProject.timeStart
                                      ).format("DD/MM")}
                                    </span>
                                  )}
                                  {subProject.timeFinish && (
                                    <span className="meta-item">
                                      • Hạn: {moment(
                                        subProject.timeFinish
                                      ).format("DD/MM")}
                                    </span>
                                  )}
                                  {subProject.listUser?.length > 0 && (
                                    <span className="meta-item">
                                      • 👥 {subProject.listUser.length}
                                    </span>
                                  )}
                                </div>
                              </div>
                            }
                          />
                        </List.Item>
                      );
                    }}
                  />
                )}
              </TabPane>

              <TabPane 
                tab={
                  <span>
                    <CommentOutlined /> {isMobile ? `TL (${comments.length})` : `Thảo luận (${comments.length})`}
                  </span>
                } 
                key="discussions"
              >
                {/* Kiểm tra quyền comment trước khi hiển thị input */}
                {canComment() ? (
                  <Card className="comment-input-card" style={{ marginBottom: 16 }}>
                    <div className="comment-input-wrapper">
                      <Avatar
                        size={isMobile ? "default" : "large"}
                        src={user?.avatar}
                        icon={<UserOutlined />}
                        style={{ backgroundColor: "#1890ff" }}
                        className="comment-avatar"
                      />
                      <div className="comment-input-content">
                        <TextArea
                          rows={isMobile ? 2 : 3}
                          placeholder="Thêm bình luận..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          maxLength={500}
                          showCount
                          className="comment-textarea"
                        />
                        <div className="comment-actions">
                          <Button
                            type="primary"
                            icon={<SendOutlined />}
                            onClick={handleAddComment}
                            loading={submitting}
                            disabled={!commentText.trim()}
                            size={isMobile ? "small" : "middle"}
                          >
                            Gửi
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card
                    className="comment-permission-card"
                    style={{ marginBottom: 16, backgroundColor: "#fff2e8" }}
                  >
                    <div className="permission-message">
                      <LockOutlined
                        style={{
                          fontSize: 24,
                          color: "#fa8c16",
                          marginBottom: 8,
                        }}
                      />
                      <div>Bạn không có quyền comment trong dự án này</div>
                      <Text type="secondary" style={{ fontSize: isMobile ? "11px" : "12px" }}>
                        Chỉ người tạo và thành viên của dự án mới được comment
                      </Text>
                    </div>
                  </Card>
                )}

                {/* Comments List */}
                {comments.length === 0 ? (
                  <div className="empty-comments">
                    <CommentOutlined
                      style={{
                        fontSize: isMobile ? 36 : 48,
                        color: "#d9d9d9",
                        marginBottom: 16,
                      }}
                    />
                    <div style={{ fontSize: isMobile ? 14 : 16 }}>Chưa có bình luận nào</div>
                    {!canComment() && (
                      <Text
                        type="secondary"
                        style={{ fontSize: isMobile ? "11px" : "12px", marginTop: 8 }}
                      >
                        Tham gia dự án để bình luận
                      </Text>
                    )}
                  </div>
                ) : (
                  <List
                    className="comments-list"
                    dataSource={comments.sort(
                      (a, b) => (b.position || 0) - (a.position || 0)
                    )}
                    size={isMobile ? "small" : "default"}
                    renderItem={(comment) => {
                      const commentUser = comment.user;
                      const isCommentOwner =
                        commentUser &&
                        (commentUser._id === user?.id ||
                          commentUser.id === user?.id);

                      const commentContent =
                        comment.content || comment.comment || "";

                      return (
                        <List.Item
                          key={comment._id}
                          className="comment-item"
                          actions={[
                            isCommentOwner && (
                              <Button
                                size="small"
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => handleEditComment(comment)}
                              >
                                {isMobile ? "Sửa" : "Sửa"}
                              </Button>
                            ),

                            isCommentOwner && (
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
                                  {isMobile ? "Xóa" : "Xóa"}
                                </Button>
                              </Popconfirm>
                            ),
                          ].filter(Boolean)}
                        >
                          <List.Item.Meta
                            avatar={
                              <Avatar
                                size={isMobile ? "default" : "large"}
                                src={commentUser?.avatar}
                                style={{
                                  backgroundColor: isCommentOwner
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
                              <div className="comment-header">
                                <Space wrap size={4}>
                                  <strong className="comment-author">
                                    {commentUser?.fullName || comment.userName}
                                  </strong>
                                  {isCommentOwner && (
                                    <Tag color="blue" size="small">
                                      Bạn
                                    </Tag>
                                  )}
                                  {commentUser &&
                                    commentUser._id === project.createdBy && (
                                      <Tag
                                        color="gold"
                                        size="small"
                                        icon={<CrownOutlined />}
                                      >
                                        {isMobile ? "PT" : "Phụ trách"}
                                      </Tag>
                                    )}
                                  <Tooltip
                                    title={moment(
                                      comment.createdAt || comment.created_at
                                    ).format("YYYY-MM-DD HH:mm:ss")}
                                  >
                                    <span className="comment-time">
                                      {moment(
                                        comment.createdAt || comment.created_at
                                      ).fromNow()}
                                    </span>
                                  </Tooltip>
                                </Space>
                              </div>
                            }
                            description={
                              <div className="comment-body">
                                <p
                                  style={{ margin: 0, whiteSpace: "pre-wrap" }}
                                  className="comment-content"
                                >
                                  {commentContent}
                                </p>
                                {comment.updatedAt &&
                                  comment.updatedAt !== comment.createdAt && (
                                    <Text
                                      type="secondary"
                                      className="comment-edited"
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
        width={isMobile ? '95%' : 500}
        centered
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

      {/* Sub Project Form Modal */}
      <Modal
        title={editingSubProject ? "Chỉnh sửa công việc" : "Thêm công việc mới"}
        open={subProjectModalVisible}
        onCancel={() => {
          setSubProjectModalVisible(false);
          setEditingSubProject(null);
        }}
        footer={null}
        width={modalWidth}
        destroyOnClose
        centered
      >
        <ProjectForm
          visible={subProjectModalVisible}
          onCancel={() => {
            setSubProjectModalVisible(false);
            setEditingSubProject(null);
          }}
          onFinish={
            editingSubProject ? handleUpdateSubProject : handleCreateSubProject
          }
          initialValues={editingSubProject}
          loading={loading}
          users={projectUsers}
          currentUser={user}
          isParentProject={false}
          autoAssignToCreator={true}
          isCreatingTask={true}
          parentProjectId={id}
          isMobile={isMobile}
        />
      </Modal>

      {isManager && (
        <Modal
          title={
            <Space>
              <FireOutlined style={{ color: "#ff4d4f" }} />
              <span>Tạo Công Việc Đột Xuất (Manager Only)</span>
            </Space>
          }
          open={hotTaskModalVisible}
          onCancel={() => setHotTaskModalVisible(false)}
          footer={null}
          width={modalWidth}
          destroyOnClose
          centered
        >
          <div className="hot-task-modal">
            <Alert
              message="CÔNG VIỆC ĐỘT XUẤT - DÀNH CHO MANAGER"
              description="Công việc này sẽ được ưu tiên cao nhất. Hệ thống đã đề xuất các thành viên phù hợp nhất dựa trên kỹ năng và hiệu suất."
              type="warning"
              showIcon
              icon={<FireOutlined />}
              style={{ marginBottom: 16 }}
            />

            <ProjectForm
              visible={hotTaskModalVisible}
              onCancel={() => setHotTaskModalVisible(false)}
              onFinish={handleCreateHotTask}
              initialValues={{
                priority: "high",
                timeStart: moment(),
                timeFinish: moment().add(3, "day"),
              }}
              loading={loading}
              users={projectUsers}
              currentUser={user}
              isParentProject={false}
              autoAssignToCreator={true}
              isCreatingTask={true}
              parentProjectId={id}
              isMobile={isMobile}
              customUserSelect={
                <HotUserSelect
                  placeholder="Chọn thành viên - danh sách đã được xếp hạng theo hiệu suất"
                  style={{ width: "100%" }}
                  size={isMobile ? "middle" : "large"}
                />
              }
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

const ProjectDetail = () => {
  return (
    <App>
      <ProjectDetailContent />
    </App>
  );
};

export default ProjectDetail;