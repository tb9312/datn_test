import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  List,
  Avatar,
  Space,
  Tabs,
  Descriptions,
  Divider,
  Breadcrumb,
  Typography,
  Button,
  Table,
  Timeline,
  Badge,
  Spin,
  message,
  Modal,
  Dropdown,
  Menu
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  ProjectOutlined,
  MessageOutlined,
  PoweroffOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  LinkOutlined,
  MoreOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { teamService } from '../../services/teamService';
import projectService from '../../services/projectService';
import userService from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import TeamForm from '../../components/Teams/TeamForm';
import { useResponsive, getModalWidth } from '../../utils/responsiveUtils';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderInfo, setLeaderInfo] = useState(null);
  const [managerInfo, setManagerInfo] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [users, setUsers] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [projectInfo, setProjectInfo] = useState(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const { user } = useAuth();
  
  const modalWidth = getModalWidth(isMobile, isTablet, isDesktop);

  useEffect(() => {
    loadTeamDetail();
    loadUsers();
  }, [id]);

  const loadUsers = async () => {
    try {
      const response = await userService.getUsers({
        page: 1,
        limit: 100,
      });

      if (response.success) {
        setUsers(
          response.data.map((u) => ({
            id: u._id,
            name: u.fullName,
            email: u.email,
            avatar: u.avatar,
          }))
        );
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách user:', error);
    }
  };

  const loadProjectInfo = async (projectId) => {
    if (!projectId) return;
    
    setLoadingProject(true);
    try {
      const response = await projectService.getProjectDetail(projectId);
      
      if (response.success && response.data) {
        setProjectInfo({
          id: response.data._id,
          title: response.data.title,
          description: response.data.description || 'Không có mô tả',
          status: response.data.status
        });
      } else {
        setProjectInfo({
          id: projectId,
          title: `Dự án ID: ${projectId.substring(0, 8)}...`,
          description: 'Không có mô tả',
          status: 'unknown'
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin dự án:', error);
      setProjectInfo({
        id: projectId,
        title: `Dự án ID: ${projectId.substring(0, 8)}...`,
        description: 'Không tải được thông tin',
        status: 'error'
      });
    } finally {
      setLoadingProject(false);
    }
  };

  const loadTeamDetail = async () => {
    setLoading(true);
    try {
      const response = await teamService.getTeamDetail(id);
      
      if (response.success && response.data) {
        const teamData = response.data;
        setTeam(teamData);
        
        // Load leader và manager info
        if (teamData.leader) {
          loadUserInfo(teamData.leader, setLeaderInfo);
        }
        if (teamData.manager) {
          loadUserInfo(teamData.manager, setManagerInfo);
        }
        // Load project info nếu có project_id
        if (teamData.project_id) {
          loadProjectInfo(teamData.project_id);
        }
        
        // Load members info
        if (teamData.listUser && teamData.listUser.length > 0) {
          loadMembersInfo(teamData.listUser);
        }
      } else {
        message.error(response.message || 'Không tìm thấy team');
        navigate('/teams');
      }
    } catch (error) {
      message.error('Lỗi khi tải thông tin team: ' + error.message);
      navigate('/teams');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditingTeam(team);
    setModalVisible(true);
  };

  const handleUpdateTeam = async (values) => {
    try {
      setFormLoading(true);
      const response = await teamService.updateTeam(id, values);

      if (response.code === 200) {
        message.success('Cập nhật nhóm thành công!');
        setModalVisible(false);
        setEditingTeam(null);
        loadTeamDetail();
      } else {
        message.error(response.message || 'Lỗi khi cập nhật nhóm');
      }
    } catch (error) {
      message.error('Lỗi khi cập nhật nhóm: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingTeam(null);
  };

  const loadUserInfo = async (userId, setter) => {
    try {
      const response = await userService.getUserById(userId);
      if (response) {
        setter({
          id: userId,
          name: response.fullName,
          email: response.email,
          avatar: response.avatar
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin user:', error);
      setter({
        id: userId,
        name: 'User ID: ' + userId.substring(0, 8),
        email: 'N/A',
        avatar: null
      });
    }
  };

  const handleToggleActive = async (isActive) => {
    try {
      const response = await teamService.toggleActive(id, isActive);
      
      if (response.code === 200) {
        message.success(`Đã ${isActive ? "kích hoạt" : "tạm dừng"} nhóm thành công!`);
        loadTeamDetail();
      } else {
        message.error(response.message || "Lỗi khi cập nhật trạng thái");
      }
    } catch (error) {
      message.error("Lỗi khi cập nhật trạng thái: " + error.message);
    }
  };

  const loadMembersInfo = async (userIds) => {
    setLoadingUsers(true);
    try {
      const usersResponse = await userService.getUsers({ limit: 100 });
      
      if (usersResponse.success) {
        const usersMap = {};
        usersResponse.data.forEach(user => {
          usersMap[user._id] = {
            id: user._id,
            name: user.fullName,
            email: user.email,
            avatar: user.avatar
          };
        });
        
        const membersData = userIds.map(userId => {
          if (usersMap[userId]) {
            return usersMap[userId];
          }
          return {
            id: userId,
            name: 'User ID: ' + userId.substring(0, 8),
            email: 'N/A',
            avatar: null
          };
        });
        
        setMembers(membersData);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin thành viên:', error);
      const membersData = userIds.map(userId => ({
        id: userId,
        name: 'User ID: ' + userId.substring(0, 8),
        email: 'N/A',
        avatar: null
      }));
      setMembers(membersData);
    } finally {
      setLoadingUsers(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Check if user can edit team
  const canEditTeam = () => {
    if (!team || !user) return false;
    return team.leader === user?.id || 
           team.manager === user?.id || 
           user?.role?.toUpperCase() === 'MANAGER';
  };

  if (loading || !team) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const memberColumns = [
    {
      title: 'Thành viên',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar 
            size={isMobile ? 'small' : 'default'} 
            src={record.avatar} 
            icon={<UserOutlined />} 
          />
          <div>
            <div style={{ fontSize: isMobile ? 13 : 14 }}>{text}</div>
            {!isMobile && (
              <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
            )}
          </div>
        </Space>
      )
    },
    {
      title: 'Vai trò',
      key: 'role',
      render: (_, record) => {
        if (record.id === team.leader?.toString()) {
          return <Tag color="gold" size={isMobile ? "small" : "default"}>Leader</Tag>;
        }
        if (record.id === team.manager?.toString()) {
          return <Tag color="blue" size={isMobile ? "small" : "default"}>Manager</Tag>;
        }
        return <Tag size={isMobile ? "small" : "default"}>Member</Tag>;
      }
    },
  ];

  // Mobile actions menu
  const mobileActionsMenu = (
    <Menu>
      <Menu.Item key="toggle" onClick={() => handleToggleActive(!team.isActive)}>
        {team.isActive ? "Tạm dừng" : "Kích hoạt"}
      </Menu.Item>
      {canEditTeam() && (
        <Menu.Item key="edit" onClick={handleEditClick}>
          Chỉnh sửa
        </Menu.Item>
      )}
    </Menu>
  );

  return (
    <div className="team-detail-page">
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 16 }} className="team-breadcrumb">
        <Breadcrumb.Item>
          <a onClick={() => navigate('/teams')} className="breadcrumb-link">
            <TeamOutlined /> {isMobile ? "Nhóm" : "Nhóm"}
          </a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <span className="breadcrumb-current">
            {isMobile && team.name.length > 20 
              ? team.name.substring(0, 20) + "..." 
              : team.name}
          </span>
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Team Header */}
      <Card className="team-header-card">
        <div className="team-header-content">
          <div className="team-header-info">
            <div className="team-title-section">
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/teams')}
                style={{ marginRight: 12 }}
                size={isMobile ? "small" : "middle"}
              />
              <TeamOutlined style={{ 
                color: '#1890ff', 
                fontSize: isMobile ? '20px' : '24px', 
                marginRight: 12 
              }} />
              <Title level={isMobile ? 4 : 2} style={{ margin: 0, marginRight: 16 }} className="team-title">
                {isMobile && team.name.length > 25 
                  ? team.name.substring(0, 25) + "..." 
                  : team.name}
              </Title>
              <Tag 
                color={team.isActive ? 'success' : 'default'} 
                size={isMobile ? "small" : "default"}
                className="team-status-tag"
              >
                {team.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
              </Tag>
            </div>
            
            <Text className="team-description" style={{ 
              color: '#666', 
              fontSize: isMobile ? '14px' : '16px', 
              lineHeight: '1.6', 
              display: 'block', 
              marginBottom: 12 
            }}>
              {team.description || 'Không có mô tả'}
            </Text>
          </div>

          <div className="team-action-buttons">
            {isMobile ? (
              <Dropdown overlay={mobileActionsMenu} placement="bottomRight">
                <Button icon={<MoreOutlined />} size="middle" />
              </Dropdown>
            ) : (
              <Space>
                {/* Chỉ hiển thị nút toggle active khi có quyền */}
                {canEditTeam() && (
                  <Button 
                    icon={<PoweroffOutlined />}
                    onClick={() => handleToggleActive(!team.isActive)}
                    type={team.isActive ? "default" : "primary"}
                    danger={team.isActive}
                    size="middle"
                  >
                    {team.isActive ? "Tạm dừng" : "Kích hoạt"}
                  </Button>
                )}
                
                {/* Sửa nút Chỉnh sửa để mở modal */}
                {canEditTeam() && (
                  <Button 
                    icon={<EditOutlined />} 
                    type="primary" 
                    onClick={handleEditClick}
                    size="middle"
                  >
                    Chỉnh sửa
                  </Button>
                )}
              </Space>
            )}
          </div>
        </div>
      </Card>

      {/* Team Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }} className="team-stats-row">
        <Col xs={12} sm={6} md={6} lg={6}>
          <Card className="team-stat-card">
            <Statistic
              title={isMobile ? "TV" : "Thành viên"}
              value={team.listUser?.length || 0}
              prefix={<UserOutlined />}
              valueStyle={{ fontSize: isMobile ? 20 : 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6} lg={6}>
          <Card className="team-stat-card">
            <Statistic
              title={isMobile ? "TT" : "Trạng thái"}
              value={team.isActive ? 'Hoạt động' : 'Dừng'}
              valueStyle={{ color: team.isActive ? '#52c41a' : '#ff4d4f', fontSize: isMobile ? 16 : 20 }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6} lg={6}>
          <Card className="team-stat-card">
            <Statistic
              title={isMobile ? "Ngày tạo" : "Ngày tạo"}
              value={formatDate(team.createdAt).split(' ')[0]}
              prefix={<CalendarOutlined />}
              valueStyle={{ fontSize: isMobile ? 16 : 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6} lg={6}>
          <Card className="team-stat-card">
            <Statistic
              title={isMobile ? "Cập nhật" : "Cập nhật"}
              value={formatDate(team.updatedAt).split(' ')[0]}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ fontSize: isMobile ? 16 : 20 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="team-detail-row">
        {/* Team Details & Members */}
        <Col xs={24} md={8} lg={8} xl={7} className="team-sidebar-col">
          {/* Team Information */}
          <Card className="team-info-card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
                {isMobile ? "Thông tin" : "Thông tin nhóm"}
              </Title>
            </div>
            <Descriptions column={1} size="small" className="team-info-list">
              <Descriptions.Item label="Dự án">
                {team.project_id ? (
                  loadingProject ? (
                    <Spin size="small" />
                  ) : projectInfo ? (
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <div>
                        <ProjectOutlined style={{ color: '#1890ff', marginRight: 6 }} />
                        <Text strong style={{ fontSize: isMobile ? 13 : 14 }}>
                          {isMobile && projectInfo.title.length > 20 
                            ? projectInfo.title.substring(0, 20) + "..." 
                            : projectInfo.title}
                        </Text>
                      </div>
                      <div>
                        <Button 
                          type="link" 
                          size="small" 
                          icon={<LinkOutlined />}
                          onClick={() => navigate(`/projects/detail/${projectInfo.id}`)}
                          style={{ padding: 0, marginLeft: 8 }}
                        >
                          {isMobile ? "Xem" : "Xem dự án"}
                        </Button>
                      </div>
                    </Space>
                  ) : (
                    <Space>
                      <ProjectOutlined style={{ color: '#666', marginRight: 6 }} />
                      <Text copyable style={{ fontSize: isMobile ? 12 : 13 }}>
                        {team.project_id.substring(0, 8)}...
                      </Text>
                      <Button 
                        type="link" 
                        size="small" 
                        icon={<LinkOutlined />}
                        onClick={() => navigate(`/projects/${team.project_id}`)}
                        style={{ padding: 0 }}
                      >
                        {isMobile ? "Xem" : "Xem dự án"}
                      </Button>
                    </Space>
                  )
                ) : (
                  <Text type="secondary" style={{ fontSize: isMobile ? 12 : 13 }}>
                    Không có dự án
                  </Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Trưởng nhóm">
                {leaderInfo ? (
                  <Space>
                    <Avatar 
                      size={isMobile ? "small" : "default"} 
                      src={leaderInfo.avatar} 
                      icon={<CrownOutlined />}
                      style={{ backgroundColor: '#fadb14' }}
                    />
                    <div>
                      <div style={{ fontSize: isMobile ? 13 : 14 }}>{leaderInfo.name}</div>
                      {!isMobile && (
                        <Text type="secondary" style={{ fontSize: '11px' }}>{leaderInfo.email}</Text>
                      )}
                    </div>
                  </Space>
                ) : team.leader ? (
                  <Text copyable style={{ fontSize: isMobile ? 12 : 13 }}>
                    {team.leader.substring(0, 8)}...
                  </Text>
                ) : (
                  <Text type="secondary" style={{ fontSize: isMobile ? 12 : 13 }}>Không có</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Quản lý">
                {managerInfo ? (
                  <Space>
                    <Avatar 
                      size={isMobile ? "small" : "default"} 
                      src={managerInfo.avatar} 
                      icon={<UserOutlined />}
                    />
                    <div>
                      <div style={{ fontSize: isMobile ? 13 : 14 }}>{managerInfo.name}</div>
                      {!isMobile && (
                        <Text type="secondary" style={{ fontSize: '11px' }}>{managerInfo.email}</Text>
                      )}
                    </div>
                  </Space>
                ) : team.manager ? (
                  <Text copyable style={{ fontSize: isMobile ? 12 : 13 }}>
                    {team.manager.substring(0, 8)}...
                  </Text>
                ) : (
                  <Text type="secondary" style={{ fontSize: isMobile ? 12 : 13 }}>Không có</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo" style={{ fontSize: isMobile ? 12 : 13 }}>
                {formatDate(team.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật" style={{ fontSize: isMobile ? 12 : 13 }}>
                {formatDate(team.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Team Members */}
          <Card className="team-members-card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
                {isMobile ? `TV (${members.length})` : `Thành viên (${members.length})`}
              </Title>
            </div>
            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin />
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <Table
                    dataSource={members}
                    columns={memberColumns}
                    pagination={false}
                    rowKey="id"
                    size={isMobile ? "small" : "default"}
                    scroll={isMobile ? { x: 300 } : undefined}
                  />
                </div>
                {team.listUser && team.listUser.length > members.length && (
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }}>
                      Hiển thị {members.length}/{team.listUser.length} thành viên
                    </Text>
                  </div>
                )}
              </>
            )}
          </Card>
        </Col>

        {/* Main Content */}
        <Col xs={24} md={16} lg={16} xl={17} className="team-main-col">
          <Card className="team-content-card">
            <Tabs 
              defaultActiveKey="info" 
              size={isMobile ? "small" : "default"}
              className="team-tabs"
            >
              <TabPane 
                tab={
                  <span>
                    <TeamOutlined /> {isMobile ? "Chi tiết" : "Thông tin chi tiết"}
                  </span>
                } 
                key="info"
              >
                <div style={{ overflowX: 'auto' }}>
                  <Descriptions 
                    column={isMobile ? 1 : 2} 
                    bordered 
                    size={isMobile ? "small" : "default"}
                    className="team-detail-descriptions"
                  >
                    <Descriptions.Item label="Tên nhóm" span={isMobile ? 1 : 2}>
                      <Text style={{ fontSize: isMobile ? 13 : 14 }}>{team.name}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Mô tả" span={isMobile ? 1 : 2}>
                      <Text style={{ fontSize: isMobile ? 13 : 14 }}>
                        {team.description || 'Không có mô tả'}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      <Tag color={team.isActive ? 'success' : 'default'} size={isMobile ? "small" : "default"}>
                        {team.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Số thành viên">
                      <Text style={{ fontSize: isMobile ? 13 : 14 }}>{team.listUser?.length || 0}</Text>
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              </TabPane>

              <TabPane 
                tab={
                  <span>
                    <MessageOutlined /> {isMobile ? "HĐ" : "Hoạt động"}
                  </span>
                } 
                key="activities"
              >
                <Timeline className="team-timeline">
                  <Timeline.Item color="green" dot={<TeamOutlined />}>
                    <div style={{ fontSize: isMobile ? 13 : 14 }}>
                      <p style={{ margin: 0, fontWeight: 500 }}>Nhóm được tạo</p>
                      <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }}>
                        {formatDate(team.createdAt)}
                      </Text>
                    </div>
                  </Timeline.Item>
                  <Timeline.Item color="blue">
                    <div style={{ fontSize: isMobile ? 13 : 14 }}>
                      <p style={{ margin: 0, fontWeight: 500 }}>Cập nhật lần cuối</p>
                      <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }}>
                        {formatDate(team.updatedAt)}
                      </Text>
                    </div>
                  </Timeline.Item>
                  {team.deleted && (
                    <Timeline.Item color="red">
                      <div style={{ fontSize: isMobile ? 13 : 14 }}>
                        <p style={{ margin: 0, fontWeight: 500 }}>Nhóm bị xóa</p>
                        <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }}>
                          {formatDate(team.deletedAt)} bởi {team.deletedBy}
                        </Text>
                      </div>
                    </Timeline.Item>
                  )}
                </Timeline>

                {!team.deleted && (
                  <>
                    <Divider style={{ margin: '16px 0' }} />
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <Text type="secondary" style={{ fontSize: isMobile ? 12 : 13 }}>
                        Các hoạt động khác sẽ được hiển thị khi có dữ liệu
                      </Text>
                    </div>
                  </>
                )}
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* Modal Form Chỉnh sửa */}
      <Modal
        title="Chỉnh sửa nhóm"
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={modalWidth}
        destroyOnClose
        centered
      >
        <TeamForm
          visible={modalVisible}
          onCancel={handleModalCancel}
          onFinish={handleUpdateTeam}
          initialValues={editingTeam}
          loading={formLoading}
          users={users}
          editingTeam={editingTeam}
          isMobile={isMobile}
        />
      </Modal>
    </div>
  );
};

export default TeamDetail;