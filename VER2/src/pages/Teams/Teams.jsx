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
  Card,
  Empty,
  Typography,
  Statistic,
  Drawer,
  Tag,
  Spin
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import TeamCard from '../../components/Teams/TeamCard';
import TeamForm from '../../components/Teams/TeamForm';
import TeamChat from '../../components/Chat/TeamChat';
import { useAuth } from '../../contexts/AuthContext';
import PermissionWrapper from '../../components/Common/PermissionWrapper';
import { teamService } from '../../services/teamService';
import userService from '../../services/userService';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [chatDrawerVisible, setChatDrawerVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadTeams();
    loadUsers();
    loadProjects();
  }, [pagination.page, filterStatus]);

  useEffect(() => {
    filterTeams();
  }, [teams, searchText]);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filterStatus !== 'all' && { isActive: filterStatus === 'active' })
      };

      const response = await teamService.getTeams(params);
      
      if (response.code === 200) {
        setTeams(response.data);
        setPagination(response.pagination || {
          total: response.data.length,
          page: 1,
          limit: 10,
          totalPages: 1
        });
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách nhóm: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.getUsers({
        page: 1,
        limit: 100
      });
      
      if (response.success) {
        setUsers(response.data.map(u => ({
          id: u._id,
          name: u.fullName,
          email: u.email,
          avatar: u.avatar
        })));
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách user:', error);
    }
  };

  const loadProjects = async () => {
    try {
      // Load projects mà user có quyền tạo team
      const response = await teamService.getProjectsForTeam();
      if (response.code === 200) {
        setProjects(response.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách dự án:', error);
    }
  };

  const filterTeams = () => {
    let filtered = [...teams];

    if (searchText) {
      filtered = filtered.filter(team =>
        team.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (team.description && team.description.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    setFilteredTeams(filtered);
  };

  const handleCreateTeam = async (values) => {
    try {
      const response = await teamService.createTeam(values);
      
      if (response.code === 200) {
        message.success('Tạo nhóm thành công!');
        setModalVisible(false);
        loadTeams(); // Reload danh sách
      } else {
        message.error(response.message || 'Lỗi khi tạo nhóm');
      }
    } catch (error) {
      message.error('Lỗi khi tạo nhóm: ' + error.message);
    }
  };

  const handleUpdateTeam = async (values) => {
    try {
      if (!editingTeam) return;
      
      const response = await teamService.updateTeam(editingTeam._id, values);
      
      if (response.code === 200) {
        message.success('Cập nhật nhóm thành công!');
        setModalVisible(false);
        setEditingTeam(null);
        loadTeams(); // Reload danh sách
      } else {
        message.error(response.message || 'Lỗi khi cập nhật nhóm');
      }
    } catch (error) {
      message.error('Lỗi khi cập nhật nhóm: ' + error.message);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa nhóm này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await teamService.deleteTeam(teamId);
          
          if (response.code === 200) {
            message.success('Xóa nhóm thành công!');
            loadTeams(); // Reload danh sách
          } else {
            message.error(response.message || 'Lỗi khi xóa nhóm');
          }
        } catch (error) {
          message.error('Lỗi khi xóa nhóm: ' + error.message);
        }
      }
    });
  };

  const handleToggleActive = async (teamId, isActive) => {
    try {
      const response = await teamService.toggleActive(teamId, isActive);
      
      if (response.code === 200) {
        message.success(`Đã ${isActive ? 'kích hoạt' : 'tạm dừng'} nhóm thành công!`);
        loadTeams(); // Reload danh sách
      } else {
        message.error(response.message || 'Lỗi khi cập nhật trạng thái');
      }
    } catch (error) {
      message.error('Lỗi khi cập nhật trạng thái: ' + error.message);
    }
  };

  const handleViewTeam = (team) => {
    navigate(`/teams/${team._id}`);
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setModalVisible(true);
  };

  const handleChatTeam = (team) => {
    setSelectedTeam(team);
    setChatDrawerVisible(true);
  };

  const handleFormFinish = (values) => {
    if (editingTeam) {
      handleUpdateTeam(values);
    } else {
      handleCreateTeam(values);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingTeam(null);
  };

  const stats = {
    total: pagination.total,
    active: teams.filter(t => t.isActive).length,
    inactive: teams.filter(t => !t.isActive).length
  };
  
  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <TeamOutlined style={{ marginRight: 12, color: '#1890ff' }} />
              Quản Lý Nhóm
            </Title>
            <p style={{ margin: 0, color: '#666' }}>Danh sách nhóm của bạn</p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadTeams}>
              Tải lại
            </Button>
            <PermissionWrapper permission="create_team">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                Tạo Nhóm
              </Button>
            </PermissionWrapper>
          </Space>
        </div>
      </Card>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Tổng số nhóm" value={stats.total} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Đang hoạt động" 
              value={stats.active} 
              valueStyle={{ color: '#52c41a' }} 
              prefix={<TeamOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Không hoạt động" 
              value={stats.inactive} 
              valueStyle={{ color: '#ff4d4f' }} 
              prefix={<TeamOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Tổng thành viên" 
              value={teams.reduce((sum, t) => sum + (t.listUser?.length || 0), 0)} 
              prefix={<UserOutlined />} 
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Search 
              placeholder="Tìm kiếm nhóm theo tên hoặc mô tả..." 
              prefix={<SearchOutlined />} 
              value={searchText} 
              onChange={(e) => setSearchText(e.target.value)}
              allowClear 
              onSearch={filterTeams}
            />
          </Col>
          <Col xs={12} md={6}>
            <Select 
              value={filterStatus} 
              onChange={setFilterStatus} 
              style={{ width: '100%' }} 
              placeholder="Trạng thái"
            >
              <Option value="all">Tất cả</Option>
              <Option value="active">Đang hoạt động</Option>
              <Option value="inactive">Không hoạt động</Option>
            </Select>
          </Col>
          <Col xs={12} md={6} style={{ textAlign: 'right' }}>
            <Tag color="blue">Trang {pagination.page}/{pagination.totalPages}</Tag>
          </Col>
        </Row>
      </Card>

      {/* Teams Display */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : filteredTeams.length === 0 ? (
        <Card>
          <Empty description="Không tìm thấy nhóm nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {filteredTeams.map(team => (
              <Col key={team._id} xs={24} sm={12} lg={8} xl={6}>
                <TeamCard 
                  team={team} 
                  user={user} 
                  onView={handleViewTeam} 
                  onEdit={handleEditTeam} 
                  onDelete={handleDeleteTeam}
                  onChat={handleChatTeam}
                />
              </Col>
            ))}
          </Row>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Space>
                <Button 
                  disabled={pagination.page === 1} 
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Trang trước
                </Button>
                <span>Trang {pagination.page} / {pagination.totalPages}</span>
                <Button 
                  disabled={pagination.page === pagination.totalPages} 
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Trang sau
                </Button>
              </Space>
            </div>
          )}
        </>
      )}

      {/* Team Form Modal */}
      <Modal 
        title={editingTeam ? 'Chỉnh sửa nhóm' : 'Tạo nhóm mới'} 
        open={modalVisible} 
        onCancel={handleModalCancel} 
        footer={null} 
        width={600}
        destroyOnClose
      >
        <TeamForm 
          visible={modalVisible}
          onCancel={handleModalCancel}
          onFinish={handleFormFinish}
          initialValues={editingTeam}
          loading={loading}
          users={users}
          projects={projects}
          editingTeam={editingTeam}
        />
      </Modal>

      {/* Team Chat Drawer */}
      <Drawer title={`Team Chat - ${selectedTeam?.name}`} placement="right" onClose={() => setChatDrawerVisible(false)} open={chatDrawerVisible} width={500}>
        {selectedTeam && <TeamChat team={selectedTeam} currentUser={{...user, id: user._id || user.id}} onClose={() => setChatDrawerVisible(false)} />}
      </Drawer>
    </div>
  );
};

export default Teams;