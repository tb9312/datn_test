import React from 'react';
import { Card, Avatar, Progress, Tag, Space, Tooltip, Dropdown, Badge, message, Switch } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PoweroffOutlined,
  MessageOutlined,
  CalendarOutlined,
  CrownOutlined,
  DashboardOutlined
} from '@ant-design/icons';

const TeamCard = ({ 
  team, 
  onView, 
  onEdit, 
  onDelete, 
  onChat, 
  user, 
  onToggleActive,
  members = [] 
}) => {
  const handleCardClick = (e) => {
    if (e.target.closest('.ant-card-actions') || e.target.closest('.ant-dropdown-trigger') || e.target.closest('.ant-btn') || e.target.closest('.ant-switch')) return;
    onView(team);
  };

  const canEditOrDelete = () => {
    if (!user) return false;
    if (user.role.toUpperCase() === 'MANAGER') {
      return true;
    }
    // Lấy ID của user
  const userId = user._id || user.id;
  if (!userId) return false;
  
  // Kiểm tra user có phải là leader không
  // Xử lý cả trường hợp leader là object hoặc string
  if (team.leader) {
    const leaderId = team.leader._id || team.leader.id || team.leader;
    if (leaderId === userId) return true;
  }
  
  // Kiểm tra user có phải là manager không
  if (team.manager) {
    const managerId = team.manager._id || team.manager.id || team.manager;
    if (managerId === userId) return true;
  }
  
  // Kiểm tra user có phải là người tạo team (createdBy)
  if (team.createdBy) {
    const createdById = team.createdBy._id || team.createdBy.id || team.createdBy;
    if (createdById === userId) return true;
  }
  
  return false;
};


  // Kiểm tra quyền toggle active
  const canToggleActive = () => {
    if (!user) return false;
    // Manager và Admin có toàn quyền
    if (user.role.toUpperCase() === 'MANAGER') {
      return true;
    }
    // Lấy ID của user
  const userId = user._id || user.id;
  if (!userId) return false;
  
  // Leader, Manager, hoặc người tạo team
  if (team.leader) {
    const leaderId = team.leader._id || team.leader.id || team.leader;
    if (leaderId === userId) return true;
  }
  
  if (team.manager) {
    const managerId = team.manager._id || team.manager.id || team.manager;
    if (managerId === userId) return true;
  }
  
  if (team.createdBy) {
    const createdById = team.createdBy._id || team.createdBy.id || team.createdBy;
    if (createdById === userId) return true;
  }
  
  return false;
};

  

  const getMenuItems = () => {
    const items = [
      { key: 'view', icon: <EyeOutlined />, label: 'Xem chi tiết' },
    ];

    // Thêm Chỉnh sửa nếu có quyền
    if (canEditOrDelete()) {
      items.push({ key: 'edit', icon: <EditOutlined />, label: 'Chỉnh sửa' });
    }

    // Thêm Nhắn tin nhóm
    // items.push({ key: 'chat', icon: <MessageOutlined />, label: 'Nhắn tin nhóm' });

    // Thêm Tạm dừng/Kích hoạt nếu có quyền
    if (canEditOrDelete()) {
      items.push({ 
        key: 'toggleActive', 
        icon: <PoweroffOutlined />, 
        label: team.isActive ? 'Tạm dừng hoạt động' : 'Kích hoạt',
        danger: team.isActive // Hiển thị màu đỏ khi đang hoạt động (tức là sắp tạm dừng)
      });
    }

    // Thêm phân cách nếu có các option trên
    if (canEditOrDelete()) {
      items.push({ type: 'divider' });
    }

    // // Thêm Xóa nhóm nếu có quyền
    // if (canEditOrDelete()) {
    //   items.push({ 
    //     key: 'delete', 
    //     icon: <DeleteOutlined />, 
    //     label: 'Xóa nhóm', 
    //     danger: true 
    //   });
    // }

    return items;
  };

  const handleMenuClick = ({ key, domEvent }) => {
    if (domEvent) domEvent.stopPropagation();
    switch (key) {
      case 'view': 
        onView && onView(team); 
        break;
      case 'edit': 
        onEdit && onEdit(team); 
        break;
      case 'chat': 
        onChat && onChat(team); 
        break;
      case 'toggleActive': 
        if (onToggleActive && canEditOrDelete()) {
          onToggleActive(team._id, !team.isActive);
        } else {
          message.warning('Bạn không có quyền thay đổi trạng thái nhóm này');
        }
        break;
      case 'delete': 
        onDelete && onDelete(team._id); 
        break;
      default: 
        break;
    }
  };

  const handleToggleActive = (e) => {
    e.stopPropagation();
    if (onToggleActive && canToggleActive()) {
      onToggleActive(team._id, !team.isActive);
    } else {
      message.warning('Bạn không có quyền thay đổi trạng thái nhóm này');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Lọc và ánh xạ thông tin thành viên từ mảng members dựa trên team.listUser (ID)
  const getTeamMembers = () => {
    if (!team.listUser || !Array.isArray(team.listUser) || team.listUser.length === 0) {
      return [];
    }
    
    if (!members || !Array.isArray(members)) {
      return [];
    }
    
    return members.filter(member => 
      team.listUser.includes(member._id || member.id)
    );
  };

  const teamMembers = getTeamMembers();

  return (
    <Card
      style={{
        marginBottom: 16,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: `1px solid ${team.isActive ? '#1890ff' : '#d9d9d9'}`,
        backgroundColor: team.isActive ? '#f6ffed' : '#fafafa',
      }}
      hoverable
      onClick={handleCardClick}
      actions={[
        <Tooltip title="Xem chi tiết">
          <EyeOutlined onClick={(e) => { e.stopPropagation(); onView(team); }} />
        </Tooltip>,
        <Tooltip title="Nhắn tin nhóm">
          <MessageOutlined onClick={(e) => { e.stopPropagation(); onChat(team); }} />
        </Tooltip>,
        <Dropdown menu={{ items: getMenuItems(), onClick: handleMenuClick }} trigger={["click"]}>
          <SettingOutlined onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ]}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <TeamOutlined style={{ color: '#1890ff', fontSize: '16px', marginRight: 8 }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{team.name}</h3>
            </div>
            <p style={{
              color: '#666',
              fontSize: '13px',
              margin: 0,
              marginBottom: 8,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>{team.description || 'Không có mô tả'}</p>
          </div>

          <Space direction="vertical" align="end" size={4}>
            <Tag color={team.isActive ? 'success' : 'default'}>
              {team.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
            </Tag>
            {team.project_id && (
              <Tag color="blue" style={{ fontSize: '11px' }}>
                <DashboardOutlined /> Dự án
              </Tag>
            )}
          </Space>
        </div>

        {/* Team Info */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Space size="small">
              <UserOutlined style={{ color: '#666', fontSize: '12px' }} />
              <span style={{ fontSize: '12px', color: '#666' }}>
                {team.listUser?.length || 0} thành viên
              </span>
            </Space>
            <Space size="small">
              <CalendarOutlined style={{ color: '#666', fontSize: '12px' }} />
              <span style={{ fontSize: '12px', color: '#666' }}>
                {formatDate(team.createdAt)}
              </span>
            </Space>
          </div>

          {/* Role Indicators */}
          {(team.leader || team.manager) && (
            <div style={{ 
              marginTop: 8, 
              padding: '6px 8px', 
              background: '#f0f5ff', 
              borderRadius: 4,
              fontSize: '11px'
            }}>
              <Space size={12}>
                {team.leader && (
                  <span>
                    <CrownOutlined style={{ color: '#faad14', marginRight: 4 }} />
                    Leader
                  </span>
                )}
                {team.manager && (
                  <span>
                    <UserOutlined style={{ color: '#1890ff', marginRight: 4 }} />
                    Manager
                  </span>
                )}
              </Space>
            </div>
          )}
        </div>

        {/* Members Preview */}
        {teamMembers.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: '11px', color: '#999', marginBottom: 6 }}>
              Thành viên:
            </div>
            <Avatar.Group 
              size="small" 
              maxCount={4} 
              maxStyle={{ 
                color: '#f56a00', 
                backgroundColor: '#fde3cf', 
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              {teamMembers.slice(0, 5).map((member, index) => (
                <Tooltip 
                  key={member._id || member.id || index} 
                  title={`${member.fullName || member.name || 'Chưa có tên'}`} 
                  placement="top"
                >
                  <Avatar 
                    src={member.avatar}  // Hiển thị avatar nếu có
                    icon={!member.avatar && <UserOutlined />} 
                    style={{ 
                      border: '2px solid #fff',
                      background: member.avatar ? 'transparent' : `#${((member._id || '').toString().substring(0, 6) + '999999').substring(0, 6)}`
                    }}
                  >
                    {/* Hiển thị chữ cái đầu nếu không có avatar */}
                    {!member.avatar && (member.fullName || member.name || 'U').charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
            {teamMembers.length > 5 && (
              <span style={{ fontSize: '11px', color: '#999', marginLeft: 8 }}>
                +{teamMembers.length - 5} người khác
              </span>
            )}
          </div>
        )}
        
      </div>
    </Card>
  );
};

export default TeamCard;