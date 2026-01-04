import React from 'react';
import { Card, Avatar, Progress, Tag, Space, Tooltip, Dropdown } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MessageOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TeamCard = ({ team, onView, onEdit, onDelete, onChat, user }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: team.id,
    data: { type: 'team', team }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const calculateTeamActivity = (team) => {
    if (!team.totalTasks || team.totalTasks === 0) return 0;
    return Math.round((team.completedTasks / team.totalTasks) * 100);
  };

  const activity = calculateTeamActivity(team);

  const handleCardClick = (e) => {
    if (e.target.closest('.ant-card-actions') || e.target.closest('.ant-dropdown-trigger') || e.target.closest('.ant-btn')) return;
    onView(team);
  };

  const canEditOrDelete = () => {
    if (!user) return false;
    if (user.role === 'manager') return true; // Admin/manager
    return team.members?.some(m => m.id === user.id && m.isLeader); // Trưởng nhóm
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
      case 'delete': onDelete && onDelete(team.id); break;
      default: break;
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        style={{
          marginBottom: 16,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          border: `1px solid ${team.isActive ? '#1890ff' : '#d9d9d9'}`,
          backgroundColor: team.isActive ? '#f6ffed' : 'white'
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
              }}>{team.description}</p>
            </div>

            <Space direction="vertical" align="end" size={4}>
              <Tag color={team.isActive ? 'success' : 'default'}>
                {team.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
              </Tag>
              {team.isPrivate && <Tag color="blue">Riêng tư</Tag>}
            </Space>
          </div>

          {/* Team Activity */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Hoạt động nhóm</span>
              <span style={{ fontSize: '12px', fontWeight: 500 }}>{activity}%</span>
            </div>
            <Progress
              percent={activity}
              size="small"
              strokeColor={
                activity >= 80 ? '#52c41a' :
                activity >= 50 ? '#1890ff' :
                activity >= 20 ? '#faad14' : '#ff4d4f'
              }
            />
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Space size="small">
              <UserOutlined style={{ color: '#666', fontSize: '12px' }} />
              <span style={{ fontSize: '12px', color: '#666' }}>{team.memberCount} thành viên</span>
            </Space>
            <Space size="small">
              <CalendarOutlined style={{ color: '#666', fontSize: '12px' }} />
              <span style={{ fontSize: '12px', color: '#666' }}>{team.projectCount} dự án</span>
            </Space>
          </div>

          {/* Members */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Avatar.Group size="small" maxCount={4} maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf', fontSize: '10px' }}>
              {team.members?.slice(0, 5).map((member) => (
                <Tooltip key={member.id} title={member.name} placement="top">
                  <Avatar src={member.avatar} icon={<UserOutlined />} style={{ border: `2px solid ${member.isOnline ? '#52c41a' : '#d9d9d9'}` }} />
                </Tooltip>
              ))}
            </Avatar.Group>
            <span style={{ fontSize: '11px', color: '#999' }}>{team.memberCount} thành viên</span>
          </div>

          {/* Recent Activity */}
          {team.recentActivity && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: '11px', color: '#999', marginBottom: 4 }}>Hoạt động gần đây:</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{team.recentActivity}</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TeamCard;
