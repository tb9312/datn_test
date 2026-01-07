import React, { useState, useEffect } from "react";
import {
  Button,
  Space,
  Modal,
  message,
  Input,
  Select,
  Row,
  Col,
  Tabs,
  Tooltip,
  Table,
  Badge,
  Tag,
  Card,
  Empty,
  Typography,
  Divider,
  Spin,
  Pagination,
  App,
  Alert,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  StarOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  FlagOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import TaskForm from "../../components/Tasks/TaskForm";
import TaskCard from "../../components/Tasks/TaskCard";
import TaskBoard from "../../components/Tasks/TaskBoard";
import taskService from "../../services/taskService";
import userService from "../../services/userService";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const PersonalTasks = () => {
  const { modal } = App.useApp();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [viewMode, setViewMode] = useState("board");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [smartSortTasks, setSmartSortTasks] = useState([]);
const [smartSortLoading, setSmartSortLoading] = useState(false);
  
  // State cho phân trang (chỉ dùng cho list view)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // State riêng cho board view (load tất cả tasks)
  const [boardTasks, setBoardTasks] = useState([]);
  const [boardLoading, setBoardLoading] = useState(false);

  // Load tasks cho list view (có phân trang)
  const loadTasks = async (page = 1, search = "") => {
    if (viewMode === "board") return; // Không load cho board
    
    setLoading(true);
    try {
      const keywordToSend = (search || searchText || "").trim();
      const params = {
        page,
        limit: pagination.pageSize,
        keyword: keywordToSend,
        status: filterStatus !== "all" ? filterStatus : undefined,
        forBoard: 'false' // Explicitly not for board
      };

      const response = await taskService.getTasks(params);
      
      console.log("🚀 API RESPONSE PAGINATION:", {
      total: response.pagination?.total,
      totalPage: response.pagination?.totalPage,
      limitItem: response.pagination?.limitItem,
      calculated: response.pagination?.totalPage * response.pagination?.limitItem,
      fullResponse: response  // Xem toàn bộ response
    });
      if (response.code === 200) {
        setTasks(response.data || []);
        setFilteredTasks(response.data || []);
        
        if (response.pagination) {
          setPagination({
            current: response.pagination.currentPage || page,
            pageSize: response.pagination.limitItem || pagination.pageSize,
            total: response.pagination.total || 0,
          });
        }
      } else {
        setTasks([]);
        setFilteredTasks([]);
      
      }
      
    } catch (error) {
      console.error("Error loading tasks:", error);
      message.error(error.message || "Không thể tải danh sách công việc");
      setTasks([]);
      setFilteredTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Load tasks cho board view (tất cả tasks)
  const loadBoardTasks = async () => {
    setBoardLoading(true);
    try {
      const params = {
        forBoard: 'true', // Flag để backend trả về tất cả tasks
        status: filterStatus !== "all" ? filterStatus : undefined,
        keyword: searchText || undefined,
      };

      const response = await taskService.getTasks(params);
      
      if (response.code === 200) {
        setBoardTasks(response.data || []);
      } else {
        setBoardTasks([]);
      }
    } catch (error) {
      console.error("Error loading board tasks:", error);
      setBoardTasks([]);
    } finally {
      setBoardLoading(false);
    }
  };

  // Load smart sort tasks
const loadSmartSortTasks = async () => {
  if (viewMode !== "smart-sort") return;
  setSmartSortLoading(true);
  try {
    const params = {
      keyword: searchText || undefined,
      status: filterStatus !== "all" ? filterStatus : undefined,
    };

    const response = await taskService.getSuggestedTasks(params);
    console.log("Smart Sort Response:", response);
    
    // SỬA: Đơn giản chỉ cần lấy response.data
    setSmartSortTasks(response?.data || []);
    
  } catch (error) {
    console.error("Error loading smart sort tasks:", error);
    message.error(error.message || "Không thể tải danh sách công việc thông minh");
    setSmartSortTasks([]);
  } finally {
    setSmartSortLoading(false);
  }
};

  // Load users
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await userService.getUsers();
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (Array.isArray(response)) {
        setUsers(response);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      message.error("Không thể tải danh sách người dùng");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadUsers();
    if (viewMode === "board") {
      loadBoardTasks();
    }
    else if (viewMode === "smart-sort") {
    loadSmartSortTasks();
    } 
    else {
      loadTasks(1);
    }
  }, []);

  // Khi viewMode thay đổi
  useEffect(() => {
    if (viewMode === "board") {
      loadBoardTasks();
    } else if (viewMode === "smart-sort") {
    loadSmartSortTasks();
    } else {
    loadTasks(1);
    }
  }, [viewMode]);

  // Khi filter thay đổi
  useEffect(() => {
    if (viewMode === "board") {
      loadBoardTasks();
    } else if (viewMode === "smart-sort") {
    loadSmartSortTasks();
    } else {
      loadTasks(1);
    }
  }, [filterStatus, searchText]);

  // Search với debounce
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (viewMode === "board") {
        loadBoardTasks();
      }else if (viewMode === "smart-sort") {
        loadSmartSortTasks();
      } else {
        loadTasks(1, searchText);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchText]);

  // Tạo task mới
  const handleCreateTask = async (values) => {
    setFormLoading(true);
    try {
      const taskData = {
        title: values.title,
        content: values.content,
        status: values.status,
        timeStart: values.timeStart,
        timeFinish: values.timeFinish,
        priority: values.priority,
      };

      if (values.assigneeId) {
        taskData.assigneeId = values.assigneeId;
      }

      await taskService.createTask(taskData);
      message.success("Tạo công việc thành công!");
      setModalVisible(false);
      
      // Reload dữ liệu
      if (viewMode === "board") {
        loadBoardTasks();
      } else if (viewMode === "smart-sort") {
        loadSmartSortTasks();
      } else {
        loadTasks(1); // Task mới sẽ ở đầu trang 1
      }
    } catch (error) {
      console.error("Create task error:", error);
      message.error(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Update task
  const handleUpdateTask = async (values) => {
    setFormLoading(true);
    try {
      const taskData = {
        title: values.title,
        content: values.content,
        status: values.status,
        timeStart: values.timeStart,
        timeFinish: values.timeFinish,
        priority: values.priority,
        tags: values.tags,
      };

      if (values.assigneeId) {
        taskData.assigneeId = values.assigneeId;
      }

      const taskId = editingTask?._id;
      if (!taskId) {
        message.error("Task ID không hợp lệ!");
        return;
      }

      await taskService.updateTask(taskId, taskData);
      message.success("Cập nhật công việc thành công!");
      setModalVisible(false);
      setEditingTask(null);
      
      // Reload dữ liệu
      if (viewMode === "board") {
        loadBoardTasks();
      } else if (viewMode === "smart-sort") {
        loadSmartSortTasks();
      } else {
        loadTasks(pagination.current);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete task
  const handleDeleteTask = (taskId) => {
    modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa công việc này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          await taskService.deleteTask(taskId);
          message.success("Xóa công việc thành công!");
          
          // Reload dữ liệu
          if (viewMode === "board") {
            loadBoardTasks();
          } else if (viewMode === "smart-sort") {
            loadSmartSortTasks();
          } else {
            loadTasks(pagination.current);
          }
        } catch (error) {
          message.error(error.message || "Lỗi xóa công việc");
        }
      },
    });
  };

  // Change task status (for drag & drop)
  const handleTaskMove = async (taskId, newStatus) => {
    try {
      await taskService.changeTaskStatus(taskId, newStatus);
      message.success("Cập nhật trạng thái công việc thành công!");
      
      // Reload dữ liệu
      if (viewMode === "board") {
        loadBoardTasks();
      } else if (viewMode === "smart-sort") {
        loadSmartSortTasks();
      } else {
        loadTasks(pagination.current);
      }
    } catch (error) {
      console.error("handleTaskMove error:", error);
      message.error(error.message || "Lỗi cập nhật trạng thái");
    }
  };

  // View task detail
  const handleViewTaskDetail = async (taskId) => {
    try {
      const taskDetail = await taskService.getTaskDetail(taskId);
      setEditingTask(taskDetail.data || taskDetail);
      setModalVisible(true);
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  const handleFormFinish = (values) => {
    if (editingTask) {
      handleUpdateTask(values);
    } else {
      handleCreateTask(values);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingTask(null);
    setFormLoading(false);
  };

  // Handle pagination change (only for list view)
  const handlePageChange = (page, pageSize) => {
    setPagination((prev) => ({ ...prev, current: page, pageSize }));
    loadTasks(page);
  };

  // Refresh data
  const handleRefresh = () => {
    loadUsers();
    if (viewMode === "board") {
      loadBoardTasks();
    } else if (viewMode === "smart-sort") {
      loadSmartSortTasks();
    } else {
      loadTasks(pagination.current);
    }
  };

  // Map task từ backend sang frontend format
  const mapTaskFromBackend = (task) => {
    return {
      ...task,
      id: task.id || task._id,
      description: task.content,
      dueDate: task.timeFinish,
      title: task.title || "Không có tiêu đề",
      status: task.status || "todo",
      content: task.content || "",
      timeStart: task.timeStart || null,
      timeFinish: task.timeFinish || null,
      assignee: task.assignee || null,
      smartScore: task.smartScore || 0,
    };
  };

  // Các hàm helper
  const getStatusColor = (status) => {
    const colors = {
      'todo': 'default',
      'in-progress': 'blue',
      'done': 'green',
      'backlog': 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      'todo': 'Chưa bắt đầu',
      'in-progress': 'Đang thực hiện',
      'done': 'Hoàn thành',
      'backlog': 'Tồn đọng'
    };
    return texts[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'green',
      'medium': 'orange',
      'high': 'red'
    };
    return colors[priority] || 'default';
  };

  const getPriorityText = (priority) => {
    const texts = {
      'low': 'Thấp',
      'medium': 'Trung bình',
      'high': 'Cao'
    };
    return texts[priority] || priority;
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('vi-VN');
  };
  // Columns cho Smart Sort Table
  const smartSortColumns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_, __, index) => (
        <Badge 
          count={index + 1}
          style={{ 
            backgroundColor: 
              index < 3 ? '#ff4d4f' : 
              index < 6 ? '#faad14' : 
              '#52c41a'
          }}
        />
      ),
    },
    {
      title: 'Công việc',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4, fontSize: '14px' }}>
            {text}
          </div>
          {record.content && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.content.length > 80 ? record.content.substring(0, 80) + '...' : record.content}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Độ ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)} icon={<FlagOutlined />}>
          {getPriorityText(priority)}
        </Tag>
      ),
    },
    {
      title: 'Hạn hoàn thành',
      dataIndex: 'timeFinish',
      key: 'timeFinish',
      width: 120,
      render: (date) => (
        date ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CalendarOutlined style={{ fontSize: '12px' }} />
            <span>{formatDate(date)}</span>
          </div>
        ) : (
          <Text type="secondary">Không có</Text>
        )
      ),
    },
    {
      title: 'Điểm ưu tiên',
      dataIndex: 'smartScore',
      key: 'smartScore',
      width: 100,
      sorter: (a, b) => (b.smartScore || 0) - (a.smartScore || 0),
      defaultSortOrder: 'descend',
      render: (score) => (
        <Tag color="blue" style={{ fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>
          {score || 0}
        </Tag>
      ),
    },
    // {
    //   title: 'Thao tác',
    //   key: 'actions',
    //   width: 150,
    //   render: (_, record) => (
    //     <Space>
    //       <Tooltip title="Xem chi tiết">
    //         <Button
    //           size="small"
    //           icon={<EyeOutlined />}
    //           onClick={(e) => {
    //             e.stopPropagation();
    //             handleViewTaskDetail(record._id);
    //           }}
    //         />
    //       </Tooltip>
    //       <Tooltip title="Chỉnh sửa">
    //         <Button
    //           size="small"
    //           icon={<EditOutlined />}
    //           onClick={(e) => {
    //             e.stopPropagation();
    //             handleEditTask(record);
    //           }}
    //         />
    //       </Tooltip>
    //       <Tooltip title="Xóa">
    //         <Button
    //           size="small"
    //           icon={<DeleteOutlined />}
    //           danger
    //           onClick={(e) => {
    //             e.stopPropagation();
    //             handleDeleteTask(record._id);
    //           }}
    //         />
    //       </Tooltip>
    //     </Space>
    //   ),
    // },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Công Việc Cá Nhân
            </Title>
            <p style={{ margin: 0, color: "#666" }}>
              {viewMode === "board" 
                ? `Tổng số: ${boardTasks.length} công việc` 
                : viewMode === "smart-sort"
                ? `Đề xuất: ${smartSortTasks.length} công việc ưu tiên`
                : `Trang ${pagination.current} • Tổng số: ${pagination.total} công việc`}
            </p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={
                viewMode === "board" ? boardLoading : 
                viewMode === "smart-sort" ? smartSortLoading : 
                loading}
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingTask(null);
                setModalVisible(true);
              }}
            >
              Tạo Công Việc
            </Button>
          </Space>
        </div>
      </Card>

      {/* Filters and Search */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Search
              placeholder="Tìm kiếm theo tên công việc..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              onSearch={(value) => setSearchText(value)}
            />
          </Col>
          <Col xs={12} md={6}>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: "100%" }}
              placeholder="Lọc theo trạng thái"
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="todo">Chưa bắt đầu</Option>
              <Option value="in-progress">Đang thực hiện</Option>
              <Option value="done">Hoàn thành</Option>
              <Option value="backlog">Tồn đọng</Option>
            </Select>
          </Col>
          <Col xs={12} md={6} style={{ textAlign: "right" }}>
            <Space>
              <Button
                icon={<AppstoreOutlined />}
                type={viewMode === "board" ? "primary" : "default"}
                onClick={() => setViewMode("board")}
              >
                Board
              </Button>
              <Button
                icon={<UnorderedListOutlined />}
                type={viewMode === "list" ? "primary" : "default"}
                onClick={() => setViewMode("list")}
              >
                List
              </Button>
              <Button
                icon={<StarOutlined />} 
                type={viewMode === "smart-sort" ? "primary" : "default"}
                onClick={() => setViewMode("smart-sort")}
              >
                Smart Sort
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Info Alert for Board View */}
      {viewMode === "board" && boardTasks.length > 50 && (
        <Alert
          message="Thông tin"
          description={`Đang hiển thị ${boardTasks.length} công việc. Sử dụng bộ lọc để tìm kiếm nhanh hơn.`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Tasks Display */}
      <Spin spinning={
        viewMode === "board" ? boardLoading : 
        viewMode === "smart-sort" ? smartSortLoading :
        loading
        }>
        {viewMode === "board" ? (
          <TaskBoard
            tasks={boardTasks.map(mapTaskFromBackend)}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onTaskMove={handleTaskMove}
            onViewDetail={handleViewTaskDetail}
          />
        ) : viewMode === "smart-sort" ? (
          <div>
            {/* Info về smart sort */}
            {/* <Alert
              message="Smart Sort - Gợi ý công việc ưu tiên"
              description="Các công việc được sắp xếp theo độ ưu tiên dựa trên deadline, độ quan trọng và trạng thái. Điểm cao = Ưu tiên cao."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            /> */}
            
            {/* Smart Sort Table */}
            <Card>
              {smartSortLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin tip="Đang tải danh sách công việc..." />
                </div>
              ) : smartSortTasks.length === 0 ? (
                <Empty
                  description="Không tìm thấy công việc nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Table
                  columns={smartSortColumns}
                  dataSource={smartSortTasks.map((task, index) => ({
                    ...mapTaskFromBackend(task),
                    key: task._id,
                    index,
                  }))}
                  pagination={false}
                  size="middle"
                  onRow={(record) => ({
                    onClick: () => handleViewTaskDetail(record._id),
                    style: { cursor: 'pointer' }
                  })}
                  scroll={{ x: 'max-content' }}
                />
              )}
            </Card>
            
            {/* Ghi chú về màu sắc xếp hạng */}
            {/* <Alert
              message="Ghi chú:"
              description={
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Badge color="#ff4d4f" />
                    <span>Top 3: Ưu tiên cao nhất</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Badge color="#faad14" />
                    <span>Top 4-6: Ưu tiên trung bình</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Badge color="#52c41a" />
                    <span>Các công việc còn lại</span>
                  </div>
                </div>
              }
              type="info"
              style={{ marginTop: 16 }}
            /> */}
          </div>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {filteredTasks.length === 0 ? (
                <Col span={24}>
                  <Empty
                    description="Không tìm thấy công việc nào"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </Col>
              ) : (
                filteredTasks.map((task) => (
                  <Col key={task._id} xs={24} lg={12} xl={8}>
                    <TaskCard
                      task={mapTaskFromBackend(task)}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                      onViewDetail={handleViewTaskDetail}
                      showStatusTag={true}
                    />
                  </Col>
                ))
              )}
            </Row>

            {/* Pagination chỉ cho list view */}
            {viewMode === "list" && pagination.total > pagination.pageSize && (
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} của ${total} công việc`
                  }
                />
              </div>
            )}

          </>
        )}
      </Spin>

      {/* Task Form Modal */}
      <Modal
        title={editingTask ? "Chỉnh sửa công việc" : "Tạo công việc mới"}
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={600}
        destroyOnClose
      >
        <TaskForm
          visible={modalVisible}
          onCancel={handleModalCancel}
          onFinish={handleFormFinish}
          initialValues={editingTask}
          loading={formLoading}
          users={users}
          showAssignee={false}
        />
      </Modal>
    </div>
  );
};

const PersonalTasksWithApp = () => {
  return (
    <App>
      <PersonalTasks />
    </App>
  );
};

export default PersonalTasksWithApp;