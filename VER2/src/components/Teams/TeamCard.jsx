import React from 'react';
import { Card, Avatar, Progress, Tag, Space, Tooltip, Dropdown, Badge } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MessageOutlined,
  CalendarOutlined,
  CrownOutlined,
  DashboardOutlined
} from '@ant-design/icons';

const TeamCard = ({ team, onView, onEdit, onDelete, onChat, user }) => {
  const handleCardClick = (e) => {
    if (e.target.closest('.ant-card-actions') || e.target.closest('.ant-dropdown-trigger') || e.target.closest('.ant-btn')) return;
    onView(team);
  };

  const canEditOrDelete = () => {
    if (!user) return false;
    if (user.role === 'manager') return true;
    return team.leader === user.id || team.manager === user.id;
  };

  const menuItems = [
    { key: 'view', icon: <EyeOutlined />, label: 'Xem chi tiết' },
    ...(canEditOrDelete() ? [{ key: 'edit', icon: <EditOutlined />, label: 'Chỉnh sửa' }] : []),
    { key: 'chat', icon: <MessageOutlined />, label: 'Nhắn tin nhóm' },
    ...(canEditOrDelete() ? [{ type: 'divider' }] : []),
    ...(canEditOrDelete() ? [{ key: 'delete', icon: <DeleteOutlined />, label: 'Xóa nhóm', danger: true }] : [])
  ];

  const handleMenuClick = ({ key, domEvent }) => {
    if (domEvent) domEvent.stopPropagation();
    switch (key) {
      case 'view': onView && onView(team); break;
      case 'edit': onEdit && onEdit(team); break;
      case 'chat': onChat && onChat(team); break;
      case 'delete': onDelete && onDelete(team._id); break;
      default: break;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <Card
      style={{
        marginBottom: 16,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: `1px solid ${team.isActive ? '#1890ff' : '#d9d9d9'}`,
        backgroundColor: team.isActive ? '#f6ffed' : '#fafafa'
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
        <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={["click"]}>
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
        {team.listUser && team.listUser.length > 0 && (
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
              {team.listUser.slice(0, 5).map((userId, index) => (
                <Tooltip key={index} title={`User ID: ${userId}`} placement="top">
                  <Avatar 
                    icon={<UserOutlined />} 
                    style={{ 
                      border: '2px solid #fff',
                      background: `#${((userId || '').toString().substring(0, 6) + '999999').substring(0, 6)}`
                    }}
                  />
                </Tooltip>
              ))}
            </Avatar.Group>
            {team.listUser.length > 5 && (
              <span style={{ fontSize: '11px', color: '#999', marginLeft: 8 }}>
                +{team.listUser.length - 5} người khác
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TeamCard;