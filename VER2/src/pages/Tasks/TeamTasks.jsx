// pages/Teams/TeamTasks.jsx
import React, { useState, useEffect } from 'react';
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
  Card,
  Tag,
  Avatar,
  Typography,
  Badge,
  Dropdown,
  Tooltip,
  Statistic,
  Spin,
  Empty,
  Divider
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
  ProjectOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  SyncOutlined,
  CalendarOutlined,
  FlagOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import TaskBoard from '../../components/Tasks/TaskBoard';
import ProjectCard from '../../components/Projects/ProjectCard';
import { useAuth } from '../../contexts/AuthContext';
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';
import userService from '../../services/userService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const TeamTasks = () => {
  const { user: currentUser, getUserId } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks', 'projects'
  const [sortBy, setSortBy] = useState('dueDate');
  const [viewMode, setViewMode] = useState('board'); // 'board', 'list'
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    backlogTasks: 0,
    totalProjects: 0
  });

  // Lấy danh sách dự án user đang tham gia
  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjects({
        limit: 100, // Lấy tất cả dự án
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      });
      
      if (response.success && Array.isArray(response.data)) {
        // Lọc các dự án user đang tham gia
        const currentUserId = getUserId();
        const userProjects = response.data.filter(project => {
          // Kiểm tra user là người tạo
          if (project.createdBy === currentUserId) return true;
          
          // Kiểm tra user là thành viên
          if (Array.isArray(project.listUser)) {
            return project.listUser.some(member => {
              const memberId = typeof member === 'object' ? member._id : member;
              return memberId === currentUserId;
            });
          }
          
          return false;
        });
        
        setProjects(userProjects);
        return userProjects;
      }
      return [];
    } catch (error) {
      console.error('Error loading projects:', error);
      message.error('Không thể tải danh sách dự án');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách task từ các dự án
  const loadTasksFromProjects = async (userProjects) => {
    try {
      setLoading(true);
      let allTasks = [];
      const currentUserId = getUserId();
      
      // Lấy task từ từng dự án
      for (const project of userProjects) {
        try {
          const response = await projectService.getTasksByParent(project._id, {
            limit: 100
          });
          
          if (response.success && Array.isArray(response.data)) {
            // Lọc task được assign cho user hiện tại
            const userTasks = response.data.filter(task => {
              // Kiểm tra user là người tạo task
              if (task.createdBy === currentUserId) return true;
              
              // Kiểm tra user được assign task
              if (task.assignee_id === currentUserId) return true;
              
              // Kiểm tra user là thành viên trong task
              if (Array.isArray(task.listUser)) {
                return task.listUser.some(member => {
                  const memberId = typeof member === 'object' ? member._id : member;
                  return memberId === currentUserId;
                });
              }
              
              return false;
            });
            
            // Thêm thông tin dự án cha vào mỗi task
            const tasksWithProject = userTasks.map(task => ({
              ...task,
              project: {
                id: project._id,
                title: project.title,
                status: project.status
              }
            }));
            
            allTasks = [...allTasks, ...tasksWithProject];
          }
        } catch (error) {
          console.error(`Error loading tasks from project ${project._id}:`, error);
        }
      }
      
      setTasks(allTasks);
      filterTasks(allTasks);
      updateStats(allTasks, userProjects.length);
      return allTasks;
    } catch (error) {
      console.error('Error loading tasks:', error);
      message.error('Không thể tải công việc');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Load tất cả dữ liệu
  const loadAllData = async () => {
    setLoading(true);
    try {
      const userProjects = await loadProjects();
      if (userProjects.length > 0) {
        await loadTasksFromProjects(userProjects);
      } else {
        setTasks([]);
        setFilteredTasks([]);
        updateStats([], 0);
      }
    } catch (error) {
      console.error('Error loading all data:', error);
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser]);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchText, selectedProject, filterStatus, filterPriority, sortBy]);

  const filterTasks = () => {
    let filtered = [...tasks];

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        task.content?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by project
    if (selectedProject !== 'all') {
      filtered = filtered.filter(task => task.project?.id === selectedProject);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      // Map status từ dự án sang board status
      const statusMap = {
        'not-started': 'todo',
        'in-progress': 'in-progress',
        'completed': 'done',
        'on-hold': 'backlog',
        'cancelled': 'backlog'
      };
      
      const boardStatus = statusMap[filterStatus] || filterStatus;
      filtered = filtered.filter(task => task.status === boardStatus);
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    // Sort tasks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.timeFinish || 0) - new Date(b.timeFinish || 0);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    setFilteredTasks(filtered);
  };

  const updateStats = (taskList, projectCount) => {
    const completed = taskList.filter(t => t.status === 'completed').length;
    const inProgress = taskList.filter(t => t.status === 'in-progress').length;
    const backlog = taskList.filter(t => t.status === 'not-started' || t.status === 'on-hold').length;
    
    setStats({
      totalTasks: taskList.length,
      completedTasks: completed,
      inProgressTasks: inProgress,
      backlogTasks: backlog,
      totalProjects: projectCount
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'not-started': 'default',
      'in-progress': 'processing',
      'on-hold': 'warning',
      'completed': 'success',
      'cancelled': 'error',
      'todo': 'default',
      'done': 'success',
      'backlog': 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'not-started': 'Chưa bắt đầu',
      'in-progress': 'Đang thực hiện',
      'on-hold': 'Tạm dừng',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'todo': 'Chưa bắt đầu',
      'done': 'Hoàn thành',
      'backlog': 'Tồn đọng'
    };
    return statusMap[status] || status;
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
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const handleTaskMove = async (taskId, newStatus) => {
    try {
      // Map board status to project status
      const statusMap = {
        'todo': 'not-started',
        'in-progress': 'in-progress',
        'done': 'completed',
        'backlog': 'on-hold'
      };
      
      const projectStatus = statusMap[newStatus] || newStatus;
      
      const response = await projectService.changeProjectStatus(taskId, projectStatus);
      
      if (response.success) {
        // Update local state
        setTasks(prev => prev.map(task =>
          task._id === taskId ? { ...task, status: newStatus } : task
        ));
        message.success('Cập nhật trạng thái thành công');
      } else {
        message.error(response.message || 'Cập nhật trạng thái thất bại');
      }
    } catch (error) {
      console.error('Error moving task:', error);
      message.error('Cập nhật trạng thái thất bại');
    }
  };

  const handleViewTaskDetail = (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    if (task && task.project) {
      window.open(`/projects/detail/${task.project.id}/subproject/${taskId}`, '_blank');
    }
  };

  const handleViewProjectDetail = (projectId) => {
    window.open(`/projects/detail/${projectId}`, '_blank');
  };

  const handleRefresh = () => {
    loadAllData();
    message.success('Đã làm mới dữ liệu');
  };

  // Task list view component
  const TaskListView = () => (
    <Card>
      {filteredTasks.length === 0 ? (
        <Empty
          description={searchText ? "Không tìm thấy công việc phù hợp" : "Chưa có công việc nào"}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #f0f0f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Công việc</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Dự án</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Trạng thái</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Độ ưu tiên</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Hạn hoàn thành</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => (
                <tr key={task._id} style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                  <td style={{ padding: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{task.title}</div>
                      {task.content && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {task.content.length > 100 ? task.content.substring(0, 100) + '...' : task.content}
                        </Text>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {task.project ? (
                      <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => handleViewProjectDetail(task.project.id)}>
                        {task.project.title}
                      </Tag>
                    ) : (
                      <Text type="secondary">Không có dự án</Text>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Tag color={getStatusColor(task.status)}>
                      {getStatusText(task.status)}
                    </Tag>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Tag color={getPriorityColor(task.priority)}>
                      {getPriorityText(task.priority)}
                    </Tag>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {task.timeFinish ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CalendarOutlined style={{ fontSize: '12px' }} />
                        <span>{formatDate(task.timeFinish)}</span>
                      </div>
                    ) : (
                      <Text type="secondary">Không có</Text>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Space>
                      <Tooltip title="Xem chi tiết">
                        <Button
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewTaskDetail(task._id);
                          }}
                        />
                      </Tooltip>
                    </Space>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  if (loading && tasks.length === 0 && projects.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div>
      {/* Custom Header */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <TeamOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <div>
              <Title level={2} style={{ margin: 0 }}>
                Công Việc Của Tôi
              </Title>
              <p style={{ margin: 0, color: '#666' }}>
                Quản lý công việc từ các dự án bạn tham gia
              </p>
            </div>
          </div>
          <Button
            icon={<SyncOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Làm mới
          </Button>
        </div>
      </Card>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Tổng công việc"
              value={stats.totalTasks}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Hoàn thành"
              value={stats.completedTasks}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Đang thực hiện"
              value={stats.inProgressTasks}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Dự án tham gia"
              value={stats.totalProjects}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter Section */}
      <Card style={{ marginBottom: 16 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={`Công việc (${stats.totalTasks})`} key="tasks" />
          <TabPane tab={`Dự án (${stats.totalProjects})`} key="projects" />
        </Tabs>

        {activeTab === 'tasks' && (
          <>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24} md={8}>
                <Search
                  placeholder="Tìm kiếm công việc..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={12} md={4}>
                <Select
                  value={selectedProject}
                  onChange={setSelectedProject}
                  style={{ width: '100%' }}
                  placeholder="Chọn dự án"
                  allowClear
                >
                  <Option value="all">Tất cả dự án</Option>
                  {projects.map(project => (
                    <Option key={project._id} value={project._id}>
                      {project.title}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} md={4}>
                <Select
                  value={filterStatus}
                  onChange={setFilterStatus}
                  style={{ width: '100%' }}
                  placeholder="Trạng thái"
                  allowClear
                >
                  <Option value="all">Tất cả trạng thái</Option>
                  <Option value="not-started">Chưa bắt đầu</Option>
                  <Option value="in-progress">Đang thực hiện</Option>
                  <Option value="on-hold">Tạm dừng</Option>
                  <Option value="completed">Hoàn thành</Option>
                </Select>
              </Col>
              <Col xs={12} md={4}>
                <Select
                  value={filterPriority}
                  onChange={setFilterPriority}
                  style={{ width: '100%' }}
                  placeholder="Độ ưu tiên"
                  allowClear
                >
                  <Option value="all">Tất cả ưu tiên</Option>
                  <Option value="high">Cao</Option>
                  <Option value="medium">Trung bình</Option>
                  <Option value="low">Thấp</Option>
                </Select>
              </Col>
              <Col xs={12} md={4}>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ width: '100%' }}
                  placeholder="Sắp xếp"
                >
                  <Option value="dueDate">Hạn hoàn thành</Option>
                  <Option value="priority">Độ ưu tiên</Option>
                  <Option value="createdAt">Mới nhất</Option>
                </Select>
              </Col>
            </Row>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                <Button
                  type={viewMode === 'board' ? 'primary' : 'default'}
                  onClick={() => setViewMode('board')}
                >
                  Board View
                </Button>
                <Button
                  type={viewMode === 'list' ? 'primary' : 'default'}
                  onClick={() => setViewMode('list')}
                >
                  List View
                </Button>
              </Space>
            </div>
          </>
        )}
      </Card>

      {/* Content Area */}
      {activeTab === 'tasks' ? (
        viewMode === 'board' ? (
          <TaskBoard
            tasks={filteredTasks.map(task => ({
              ...task,
              _id: task._id,
              status: task.status === 'not-started' ? 'todo' :
                      task.status === 'in-progress' ? 'in-progress' :
                      task.status === 'completed' ? 'done' :
                      task.status === 'on-hold' ? 'backlog' : 'backlog',
              title: task.title,
              content: task.content,
              timeStart: task.timeStart,
              timeFinish: task.timeFinish,
              priority: task.priority,
              assignee: { name: currentUser?.fullName || currentUser?.name }
            }))}
            onEditTask={(task) => handleViewTaskDetail(task._id)}
            onDeleteTask={() => {}}
            onTaskMove={handleTaskMove}
            onViewDetail={handleViewTaskDetail}
          />
        ) : (
          <TaskListView />
        )
      ) : (
        // Projects Tab
        <Row gutter={[16, 16]}>
          {projects.length === 0 ? (
            <Col span={24}>
              <Card>
                <Empty
                  description="Bạn chưa tham gia dự án nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </Card>
            </Col>
          ) : (
            projects.map(project => (
              <Col key={project._id} xs={24} sm={12} lg={8} xl={6}>
                <ProjectCard
                  project={{
                    _id: project._id,
                    id: project._id,
                    title: project.title,
                    content: project.content,
                    status: project.status,
                    priority: project.priority,
                    thumbnail: project.thumbnail,
                    timeStart: project.timeStart,
                    timeFinish: project.timeFinish,
                    createdBy: project.createdBy,
                    listUser: project.listUser || [],
                    createdAt: project.createdAt,
                  }}
                  currentUser={currentUser}
                  users={[]}
                  onView={() => handleViewProjectDetail(project._id)}
                />
              </Col>
            ))
          )}
        </Row>
      )}
    </div>
  );
};

export default TeamTasks;