import React, { useState, useEffect, useCallback } from 'react';
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
  Empty,
  Typography,
  Statistic,
  Table,
  Tag,
  App,
  Dropdown,
  Menu,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ProjectOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  MoreOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../../components/Projects/ProjectCard';
import ProjectForm from '../../components/Projects/ProjectForm';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/userService';
import projectService from '../../services/projectService';
import debounce from 'lodash/debounce';
import { useResponsive, getModalWidth, getDisplayCount } from '../../utils/responsiveUtils';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const ProjectsContent = () => {
  const { modal } = App.useApp();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  const { user: currentUser, isManager, getUserId } = useAuth();
  
  const [users, setUsers] = useState([]);
  
  const modalWidth = getModalWidth(isMobile, isTablet, isDesktop);
  const displayCount = getDisplayCount(isMobile, isTablet, 10);

  useEffect(() => {
    if (currentUser) {
      console.log('🔍 Current User in Projects:', {
        id: getUserId(),
        _id: currentUser._id,
        idField: currentUser.id,
        role: currentUser.role,
        isManager: isManager(),
        fullName: currentUser.fullName
      });
      
      loadUsers();
      loadProjects();
    }
  }, [currentUser, pagination.current, pagination.pageSize, sortField, sortOrder]);

  useEffect(() => {
    if (!modalVisible && editingProject) {
      console.log('Modal closed after editing, reloading projects...');
      loadProjects();
      setEditingProject(null);
    }
  }, [modalVisible, editingProject]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchText, filterStatus, filterPriority, activeTab]);

  // Projects.jsx - sửa hàm loadUsers
  const loadUsers = async () => {
    try {
      console.log('=== DEBUG Projects.jsx loadUsers ===');
      
      const response = await userService.getUsers();
      
      console.log('User service response:', response);
      console.log('Response success:', response.success);
      console.log('Response data (users array):', response.data);
      console.log('Response data length:', response.data?.length);
      
      if (response.success && Array.isArray(response.data)) {
        setUsers(response.data);
        console.log('✅ Users set to state:', response.data.length, 'users');
        
        if (response.data.length > 0) {
          console.log('First user structure:', response.data[0]);
          console.log('Keys of first user:', Object.keys(response.data[0]));
        }
      } else {
        console.error('❌ Invalid users response:', response);
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setUsers([]);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      console.log('=== LOADING PROJECTS ===');
      const currentUserId = getUserId();
      console.log('Current User ID:', currentUserId);
      
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        sortBy: sortField,
        sortOrder: sortOrder,
        search: searchText,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        priority: filterPriority !== 'all' ? filterPriority : undefined,
      };

      console.log('API Params:', params);

      const response = await projectService.getProjects(params);
      
      console.log('=== PROJECTS API RESPONSE ===');
      console.log('Data length:', response.data?.length);
      
      if (response.data && Array.isArray(response.data)) {
        setProjects(response.data || []);
        setFilteredProjects(response.data || []);
        setPagination({
          ...pagination,
          total: response.pagination?.total || response.data?.length || 0,
        });
      } else {
        console.error('Invalid response data:', response);
        setProjects([]);
        setFilteredProjects([]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      message.error('Không thể tải danh sách dự án');
      setProjects([]);
      setFilteredProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchText(value);
      setPagination({ ...pagination, current: 1 });
    }, 500),
    [pagination]
  );

  const filterProjects = () => {
    let filtered = projects;

    if (searchText) {
      filtered = filtered.filter(project =>
        project.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        project.content?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(project => project.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(project => project.priority === filterPriority);
    }

    if (activeTab !== 'all') {
      filtered = filtered.filter(project => project.status === activeTab);
    }

    setFilteredProjects(filtered);
  };

  // 🎯 QUAN TRỌNG: Sửa hàm handleFormFinish
  const handleFormFinish = async (formData) => {
    try {
      setLoading(true);
      
      let response;
      const currentUserId = getUserId();
      
      if (editingProject) {
        console.log('=== DEBUG UPDATE PROJECT ===');
        console.log('Project ID to update:', editingProject._id);
        console.log('Current User ID:', currentUserId);
        
        // Log form data
        console.log('FormData to update:');
        const formDataObj = {};
        for (let [key, value] of formData.entries()) {
          formDataObj[key] = value;
          console.log(`  ${key}:`, value);
        }
        
        // Gọi service update
        response = await projectService.updateProject(editingProject._id, formData);
        
        console.log('Update API response:', response);
        console.log('Response success?', response.success);
        console.log('Response code?', response.code);
        console.log('Response message?', response.message);
        
        // 🎯 QUAN TRỌNG: Kiểm tra CẢ success VÀ code
        if (response.success && response.code === 200) {
          console.log('✅ Update successful!');
          message.success(response.message || 'Cập nhật thành công!');
          setModalVisible(false);
          setEditingProject(null);
          
          // Reload projects sau 300ms
          setTimeout(() => {
            loadProjects();
          }, 300);
          
        } else {
          // Xử lý lỗi dựa trên code
          console.error('❌ Update failed:', response);
          
          if (response.code === 404) {
            message.error('Không tìm thấy dự án. Có thể đã bị xóa hoặc không tồn tại.');
          } else if (response.code === 403) {
            message.error('Bạn không có quyền chỉnh sửa dự án này.');
          } else if (response.code === 400) {
            message.error('Dữ liệu không hợp lệ: ' + (response.message || ''));
          } else {
            message.error(response.message || `Cập nhật thất bại (code: ${response.code})`);
          }
        }
      } else {
        // Khi tạo mới
        formData.append('createdBy', currentUserId);
        response = await projectService.createProject(formData, false);
        
        if (response.success) {
          message.success(response.message || 'Tạo dự án thành công!');
          setModalVisible(false);
          loadProjects();
        } else {
          message.error(response.message || 'Tạo dự án thất bại!');
        }
      }
      
    } catch (error) {
      console.error('❌ Error in handleFormFinish:', error);
      message.error(error.message || 'Thao tác thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    console.log('=== HANDLE DELETE PROJECT CALLED ===');
    
    // Sử dụng modal từ useApp hook
    modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa dự án này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      async onOk() {
        try {
          console.log('Modal onOk called');
          const response = await projectService.deleteProject(projectId);
          
          console.log('Delete response:', response);
          
          if (response.success) {
            message.success(response.message || 'Xóa dự án thành công!');
            loadProjects();
          } else {
            message.error(response.message || 'Xóa dự án thất bại!');
          }
        } catch (error) {
          console.error('Error deleting project:', error);
          message.error(error.message || 'Xóa dự án thất bại!');
        }
      },
      onCancel() {
        console.log('Delete cancelled by user');
      }
    });
  };

  const handleChangeMultiple = async (key, value) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một dự án');
      return;
    }

    try {
      const response = await projectService.changeMultipleProjects(selectedRowKeys, key, value);
      
      if (response.success) {
        message.success('Cập nhật hàng loạt thành công!');
        setSelectedRowKeys([]);
        loadProjects();
      } else {
        message.error(response.message || 'Cập nhật hàng loạt thất bại!');
      }
    } catch (error) {
      console.error('Error changing multiple:', error);
      message.error(error.message || 'Cập nhật hàng loạt thất bại!');
    }
  };

  const navigate = useNavigate();

  const handleViewProject = (project) => {
    const projectId = project._id || project.id;
    navigate(`/projects/detail/${projectId}`);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingProject(null);
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
    
    if (sorter.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const canEditProject = (project) => {
    if (!currentUser || !project) return false;
    
    const currentUserId = getUserId();
    
    if (project.createdBy === currentUserId) return true;
    if (isManager()) return true;
    
    return false;
  };

  const canDeleteProject = (project) => {
    if (!currentUser || !project) return false;
    
    const currentUserId = getUserId();
    return project.createdBy === currentUserId || isManager();
  };

  const columns = [
    {
      title: 'Tên dự án',
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      render: (text) => (
        <span style={{ fontSize: isMobile ? 13 : 14 }}>
          {isMobile && text.length > 25 ? text.substring(0, 25) + '...' : text}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          'not-started': { text: 'Chưa bắt đầu', color: 'default' },
          'in-progress': { text: 'Đang thực hiện', color: 'processing' },
          'on-hold': { text: 'Tạm dừng', color: 'warning' },
          'completed': { text: 'Hoàn thành', color: 'success' },
          'cancelled': { text: 'Đã hủy', color: 'error' },
        };
        const statusInfo = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={statusInfo.color} size={isMobile ? "small" : "default"}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: 'Độ ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const priorityMap = {
          'low': { text: 'Thấp', color: 'blue' },
          'medium': { text: 'Trung bình', color: 'orange' },
          'high': { text: 'Cao', color: 'red' },
        };
        const priorityInfo = priorityMap[priority] || { text: priority, color: 'default' };
        return <Tag color={priorityInfo.color} size={isMobile ? "small" : "default"}>{priorityInfo.text}</Tag>;
      },
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'timeStart',
      key: 'timeStart',
      render: (date) => (
        <span style={{ fontSize: isMobile ? 12 : 13 }}>
          {date ? new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: isMobile ? '2-digit' : 'numeric'
          }) : '-'}
        </span>
      ),
    },
    {
      title: 'Hạn hoàn thành',
      dataIndex: 'timeFinish',
      key: 'timeFinish',
      render: (date) => (
        <span style={{ fontSize: isMobile ? 12 : 13 }}>
          {date ? new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: isMobile ? '2-digit' : 'numeric'
          }) : '-'}
        </span>
      ),
    },
    {
      title: 'Vai trò',
      key: 'role',
      render: (_, record) => {
        const currentUserId = getUserId();
        let roleText = '';
        let roleColor = 'default';
        
        if (record.createdBy === currentUserId) {
          roleText = 'Phụ trách';
          roleColor = 'gold';
        } else if (record.listUser?.includes(currentUserId)) {
          roleText = 'Thành viên';
          roleColor = 'green';
        }
        
        return roleText ? (
          <Tag color={roleColor} size={isMobile ? "small" : "default"}>
            {isMobile ? roleText.substring(0, 3) : roleText}
          </Tag>
        ) : '-';
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        const actions = [
          {
            key: 'view',
            label: 'Xem chi tiết',
            icon: <EyeOutlined />,
            onClick: () => handleViewProject(record)
          }
        ];
        
        if (canEditProject(record)) {
          actions.push({
            key: 'edit',
            label: 'Chỉnh sửa',
            icon: <EditOutlined />,
            onClick: () => handleEditProject(record)
          });
        }
        
        if (canDeleteProject(record)) {
          actions.push({
            key: 'delete',
            label: 'Xóa',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDeleteProject(record._id)
          });
        }
        
        if (isMobile) {
          return (
            <Dropdown
              menu={{
                items: actions.map(action => ({
                  key: action.key,
                  label: action.label,
                  icon: action.icon,
                  danger: action.danger,
                  onClick: action.onClick
                }))
              }}
              placement="bottomRight"
            >
              <Button size="small" icon={<MoreOutlined />} />
            </Dropdown>
          );
        }
        
        return (
          <Space size={isMobile ? 2 : 4}>
            {actions.map(action => (
              <Button
                key={action.key}
                size="small"
                icon={action.icon}
                onClick={action.onClick}
                danger={action.danger}
              >
                {!isMobile && action.label}
              </Button>
            ))}
          </Space>
        );
      },
    },
  ];

  const currentUserId = getUserId();
  const stats = {
    total: pagination.total,
    completed: projects.filter(p => p.status === 'completed').length,
    inProgress: projects.filter(p => p.status === 'in-progress').length,
    notStarted: projects.filter(p => p.status === 'not-started').length,
    assignedToMe: projects.filter(p => p.createdBy === currentUserId).length,
  };

  // Mobile filter menu
  const filterMenu = (
    <Menu>
      <Menu.ItemGroup title="Trạng thái">
        <Menu.Item key="all-status" onClick={() => setFilterStatus('all')}>
          Tất cả trạng thái
        </Menu.Item>
        <Menu.Item key="not-started" onClick={() => setFilterStatus('not-started')}>
          Chưa bắt đầu
        </Menu.Item>
        <Menu.Item key="in-progress" onClick={() => setFilterStatus('in-progress')}>
          Đang thực hiện
        </Menu.Item>
        <Menu.Item key="completed" onClick={() => setFilterStatus('completed')}>
          Hoàn thành
        </Menu.Item>
      </Menu.ItemGroup>
      <Menu.Divider />
      <Menu.ItemGroup title="Độ ưu tiên">
        <Menu.Item key="all-priority" onClick={() => setFilterPriority('all')}>
          Tất cả ưu tiên
        </Menu.Item>
        <Menu.Item key="high" onClick={() => setFilterPriority('high')}>
          Cao
        </Menu.Item>
        <Menu.Item key="medium" onClick={() => setFilterPriority('medium')}>
          Trung bình
        </Menu.Item>
        <Menu.Item key="low" onClick={() => setFilterPriority('low')}>
          Thấp
        </Menu.Item>
      </Menu.ItemGroup>
    </Menu>
  );

  return (
    <div className="projects-page">
      {/* Header */}
      <Card className="projects-header-card">
        <div className="projects-header-content">
          <div className="projects-header-info">
            <Title level={isMobile ? 3 : 2} style={{ margin: 0 }} className="projects-title">
              <ProjectOutlined style={{ marginRight: 12, color: '#1890ff' }} />
              {isManager() ? (isMobile ? 'QL Dự Án' : 'Quản Lý Dự Án') : (isMobile ? 'Dự Án Của Tôi' : 'Dự Án Của Tôi')}
            </Title>
            <p style={{ margin: 0, color: '#666', fontSize: isMobile ? 13 : 14 }} className="projects-subtitle">
              {isManager() 
                ? (isMobile ? 'Quản lý dự án' : 'Quản lý và theo dõi tiến độ tất cả dự án') 
                : (isMobile ? 'Dự án bạn tham gia' : 'Các dự án bạn đang tham gia và phụ trách')}
            </p>
          </div>

          {isManager() && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
              size={isMobile ? "middle" : "large"}
              className="create-project-btn"
            >
              {isMobile ? 'Tạo' : 'Tạo Dự Án'}
            </Button>
          )}
        </div>
      </Card>

      {/* Statistics Cards - ĐÃ FIX RESPONSIVE */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }} className="stats-row">
        <Col xs={12} sm={6} md={6} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={isMobile ? "Tổng" : "Tổng số dự án"}
              value={stats.total}
              prefix={<ProjectOutlined />}
              valueStyle={{ fontSize: isMobile ? 20 : 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={isMobile ? "Đang làm" : "Đang thực hiện"}
              value={stats.inProgress}
              valueStyle={{ color: '#1890ff', fontSize: isMobile ? 20 : 24 }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={isMobile ? "Hoàn thành" : "Hoàn thành"}
              value={stats.completed}
              valueStyle={{ color: '#52c41a', fontSize: isMobile ? 20 : 24 }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={isMobile ? "Bạn PT" : "Bạn phụ trách"}
              value={stats.assignedToMe}
              valueStyle={{ color: '#722ed1', fontSize: isMobile ? 20 : 24 }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card className="projects-content-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size={isMobile ? "small" : "default"}
          className="projects-tabs"
        >
          <TabPane
            key="all"
            tab={isMobile ? `Tất cả (${stats.total})` : `Tất cả (${stats.total})`}
          />
          <TabPane
            key="in-progress"
            tab={isMobile ? `Đang làm (${stats.inProgress})` : `Đang thực hiện (${stats.inProgress})`}
          />
          <TabPane
            key="not-started"
            tab={isMobile ? `Chưa bắt đầu (${stats.notStarted})` : `Chưa bắt đầu (${stats.notStarted})`}
          />
          <TabPane
            key="completed"
            tab={isMobile ? `Hoàn thành (${stats.completed})` : `Hoàn thành (${stats.completed})`}
          />
          <TabPane
            key="on-hold"
            tab={isMobile ? `Tạm dừng (${projects.filter(p => p.status === 'on-hold').length})` : `Tạm dừng (${projects.filter(p => p.status === 'on-hold').length})`}
          />
        </Tabs>

        {/* Filter Controls - ĐÃ FIX RESPONSIVE */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }} align="middle" className="filter-row">
          <Col xs={24} sm={isMobile ? 24 : 8} md={8} lg={8}>
            <Input
              placeholder="Tìm kiếm dự án..."
              prefix={<SearchOutlined />}
              onChange={(e) => debouncedSearch(e.target.value)}
              allowClear
              size={isMobile ? "middle" : "large"}
              className="search-input"
            />
          </Col>
          
          {isMobile ? (
            <Col xs={24}>
              <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                <Dropdown overlay={filterMenu} trigger={['click']}>
                  <Button icon={<FilterOutlined />} size="middle">
                    Lọc
                  </Button>
                </Dropdown>
                
                <Space>
                  <Button
                    icon={<AppstoreOutlined />}
                    type={viewMode === 'grid' ? 'primary' : 'default'}
                    onClick={() => setViewMode('grid')}
                    size="middle"
                  />
                  <Button
                    icon={<UnorderedListOutlined />}
                    type={viewMode === 'list' ? 'primary' : 'default'}
                    onClick={() => setViewMode('list')}
                    size="middle"
                  />
                </Space>
              </Space>
              
              {/* Show active filters on mobile */}
              {(filterStatus !== 'all' || filterPriority !== 'all') && (
                <div style={{ marginTop: 8 }}>
                  <Space wrap size={4}>
                    {filterStatus !== 'all' && (
                      <Tag closable onClose={() => setFilterStatus('all')} size="small">
                        Trạng thái: {filterStatus === 'in-progress' ? 'Đang làm' : 
                                   filterStatus === 'not-started' ? 'Chưa bắt đầu' :
                                   filterStatus === 'completed' ? 'Hoàn thành' :
                                   filterStatus === 'on-hold' ? 'Tạm dừng' : filterStatus}
                      </Tag>
                    )}
                    {filterPriority !== 'all' && (
                      <Tag closable onClose={() => setFilterPriority('all')} size="small">
                        Ưu tiên: {filterPriority === 'high' ? 'Cao' : 
                                filterPriority === 'medium' ? 'TB' : 'Thấp'}
                      </Tag>
                    )}
                  </Space>
                </div>
              )}
            </Col>
          ) : (
            <>
              <Col xs={12} sm={12} md={4} lg={4}>
                <Select
                  value={filterStatus}
                  onChange={setFilterStatus}
                  style={{ width: '100%' }}
                  placeholder="Trạng thái"
                  allowClear
                  size="middle"
                >
                  <Option value="all">Tất cả trạng thái</Option>
                  <Option value="not-started">Chưa bắt đầu</Option>
                  <Option value="in-progress">Đang thực hiện</Option>
                  <Option value="on-hold">Tạm dừng</Option>
                  <Option value="completed">Hoàn thành</Option>
                  <Option value="cancelled">Đã hủy</Option>
                </Select>
              </Col>
              <Col xs={12} sm={12} md={4} lg={4}>
                <Select
                  value={filterPriority}
                  onChange={setFilterPriority}
                  style={{ width: '100%' }}
                  placeholder="Độ ưu tiên"
                  allowClear
                  size="middle"
                >
                  <Option value="all">Tất cả ưu tiên</Option>
                  <Option value="high">Cao</Option>
                  <Option value="medium">Trung bình</Option>
                  <Option value="low">Thấp</Option>
                </Select>
              </Col>
              <Col xs={24} sm={24} md={8} lg={8} style={{ textAlign: 'right' }}>
                <Space wrap>
                  <Button
                    icon={<AppstoreOutlined />}
                    type={viewMode === 'grid' ? 'primary' : 'default'}
                    onClick={() => setViewMode('grid')}
                    size="middle"
                  >
                    Grid
                  </Button>
                  <Button
                    icon={<UnorderedListOutlined />}
                    type={viewMode === 'list' ? 'primary' : 'default'}
                    onClick={() => setViewMode('list')}
                    size="middle"
                  >
                    List
                  </Button>
                </Space>
              </Col>
            </>
          )}
        </Row>

        {isManager() && selectedRowKeys.length > 0 && (
          <Row style={{ marginTop: 16 }} className="bulk-actions-row">
            <Col span={24}>
              <Space wrap>
                <span>Đã chọn {selectedRowKeys.length} dự án:</span>
                <Select
                  placeholder="Cập nhật trạng thái"
                  style={{ width: isMobile ? 120 : 150 }}
                  onChange={(value) => handleChangeMultiple('status', value)}
                  size="middle"
                >
                  <Option value="not-started">Chưa bắt đầu</Option>
                  <Option value="in-progress">Đang thực hiện</Option>
                  <Option value="on-hold">Tạm dừng</Option>
                  <Option value="completed">Hoàn thành</Option>
                  <Option value="cancelled">Đã hủy</Option>
                </Select>
                <Select
                  placeholder="Cập nhật độ ưu tiên"
                  style={{ width: isMobile ? 120 : 150 }}
                  onChange={(value) => handleChangeMultiple('priority', value)}
                  size="middle"
                >
                  <Option value="low">Thấp</Option>
                  <Option value="medium">Trung bình</Option>
                  <Option value="high">Cao</Option>
                </Select>
                <Button
                  danger
                  onClick={() => handleChangeMultiple('delete', true)}
                  size="middle"
                >
                  {isMobile ? 'Xóa đã chọn' : 'Xóa đã chọn'}
                </Button>
              </Space>
            </Col>
          </Row>
        )}
      </Card>

      {/* Projects List/Grid */}
      {viewMode === 'grid' ? (
        filteredProjects.length === 0 ? (
          <Card className="empty-projects-card">
            <Empty
              description={
                <div>
                  <div style={{ fontSize: isMobile ? 14 : 16, marginBottom: 8 }}>
                    Không tìm thấy dự án nào
                  </div>
                  {searchText && (
                    <Text type="secondary" style={{ fontSize: isMobile ? 12 : 13 }}>
                      Thử tìm kiếm với từ khóa khác
                    </Text>
                  )}
                </div>
              }
              image={isMobile ? Empty.PRESENTED_IMAGE_SIMPLE : Empty.PRESENTED_IMAGE_DEFAULT}
              imageStyle={{
                height: isMobile ? 80 : 120,
              }}
            />
          </Card>
        ) : (
          <Row gutter={[16, 16]} className="projects-grid">
            {filteredProjects.map(project => (
              <Col 
                key={project._id} 
                xs={24} 
                sm={12} 
                md={8} 
                lg={6}
                xl={6}
                className="project-col"
              >
                <div className="project-card-wrapper">
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
                    currentUserId={currentUserId}
                    users={users}
                    onView={handleViewProject}
                    onEdit={canEditProject(project) ? handleEditProject : undefined}
                    onDelete={canDeleteProject(project) ? handleDeleteProject : undefined}
                    isMobile={isMobile}
                  />
                </div>
              </Col>
            ))}
          </Row>
        )
      ) : (
        <Card className="projects-table-card">
          <div style={{ overflowX: 'auto' }}>
            <Table
              rowSelection={isManager() ? rowSelection : undefined}
              columns={columns}
              dataSource={filteredProjects}
              rowKey="_id"
              pagination={{
                ...pagination,
                showSizeChanger: !isMobile,
                showQuickJumper: !isMobile,
                showTotal: (total, range) => 
                  isMobile ? `${range[0]}-${range[1]} / ${total}` : 
                  `Hiển thị ${range[0]}-${range[1]} trong tổng ${total} dự án`,
                size: isMobile ? "small" : "default"
              }}
              loading={loading}
              onChange={handleTableChange}
              scroll={isMobile ? { x: 800 } : undefined}
              size={isMobile ? "small" : "default"}
            />
          </div>
        </Card>
      )}

      {isManager() && (
        <Modal
          title={editingProject ? 'Chỉnh sửa dự án' : 'Tạo dự án mới'}
          open={modalVisible}
          onCancel={handleModalCancel}
          footer={null}
          width={modalWidth}
          destroyOnClose
          centered
        >
          <ProjectForm
            visible={modalVisible}
            onCancel={handleModalCancel}
            onFinish={handleFormFinish}
            initialValues={editingProject}
            loading={loading}
            users={users}
            currentUser={currentUser}
            currentUserId={currentUserId}
            isParentProject={true}
            autoAssignToCreator={!editingProject}
            isCreatingTask={false}
            isMobile={isMobile}
          />
        </Modal>
      )}
    </div>
  );
};

const Projects = () => {
  return (
    <App>
      <ProjectsContent />
    </App>
  );
};

export default Projects;