// components/Projects/ProjectCard.jsx
import React from 'react';
import { 
  Card, 
  Tag, 
  Avatar, 
  Space, 
  Tooltip 
} from 'antd';
import {
  TeamOutlined,
  CalendarOutlined,
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const ProjectCard = ({ 
  project, 
  onView, 
  onEdit, 
  onDelete,
  currentUser,
  users = []
}) => {
  // Kiểm tra vai trò của user trong dự án này
  const getUserRole = () => {
    if (!currentUser || !project) return '';
    
    if (project.createdBy === currentUser.id) {
      return 'creator'; // Người tạo = người phụ trách
    } else if (project.listUser?.includes(currentUser.id)) {
      return 'member';
    }
    return '';
  };

  const userRole = getUserRole();
  
  // Xác định badge cho vai trò
  const getRoleBadge = () => {
    switch(userRole) {
      case 'creator':
        return (
          <Tag 
            color="gold" 
            size="small" 
            icon={<CrownOutlined />}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4,
              fontWeight: 600,
              fontSize: '11px',
              padding: '0 8px',
              height: '22px'
            }}
          >
            <UserOutlined /> Phụ trách
          </Tag>
        );
      case 'member':
        return (
          <Tag 
            color="green" 
            size="small" 
            icon={<TeamOutlined />}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4,
              fontSize: '11px',
              padding: '0 8px',
              height: '22px'
            }}
          >
            Thành viên
          </Tag>
        );
      default:
        return null;
    }
  };

  // Kiểm tra quyền chỉnh sửa
  const canEditProject = () => {
    if (!currentUser || !project) return false;
    
    // 1. Người tạo dự án có quyền (và cũng là người phụ trách)
    if (project.createdBy === currentUser.id) return true;
    
    // 2. Manager có quyền sửa tất cả
    if (currentUser.role === 'MANAGER') return true;
    
    return false;
  };

  // Kiểm tra quyền xóa
  const canDeleteProject = () => {
    if (!currentUser || !project) return false;
    
    // Chỉ người tạo dự án (cũng là phụ trách) hoặc Manager mới được xóa
    return project.createdBy === currentUser.id || currentUser.role === 'MANAGER';
  };

  const getStatusColor = (status) => {
    const colors = {
      'not-started': 'default',
      'in-progress': 'processing',
      'on-hold': 'warning',
      'completed': 'success',
      'cancelled': 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'not-started': 'Chưa bắt đầu',
      'in-progress': 'Đang thực hiện',
      'on-hold': 'Tạm dừng',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getStatusIcon = (status) => {
    const icons = {
      'not-started': <ClockCircleOutlined />,
      'in-progress': <ClockCircleOutlined />,
      'on-hold': <PauseCircleOutlined />,
      'completed': <CheckCircleOutlined />,
      'cancelled': <CloseCircleOutlined />
    };
    return icons[status] || <ClockCircleOutlined />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'blue',
      'medium': 'orange',
      'high': 'red'
    };
    return colors[priority] || 'default';
  };

  const getPriorityText = (priority) => {
    const priorityMap = {
      'low': 'Thấp',
      'medium': 'Trung bình',
      'high': 'Cao'
    };
    return priorityMap[priority] || priority;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    return moment(dateString).format('DD/MM/YYYY');
  };

  // Xác định actions dựa trên quyền
  const getCardActions = () => {
    const actions = [
      <Tooltip title="Xem chi tiết">
        <EyeOutlined 
          key="view" 
          onClick={(e) => {
            e.stopPropagation();
            if (onView) onView(project);
          }} 
        />
      </Tooltip>,
    ];

    // Thêm edit action nếu có quyền
    if (onEdit && canEditProject()) {
      actions.push(
        <Tooltip title="Chỉnh sửa">
          <EditOutlined 
            key="edit" 
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit(project);
            }} 
          />
        </Tooltip>
      );
    }

    // Thêm delete action nếu có quyền
    if (onDelete && canDeleteProject()) {
      actions.push(
        <Tooltip title="Xóa dự án">
          <DeleteOutlined 
            key="delete" 
            style={{ color: '#ff4d4f' }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log('Delete clicked for project:', project.id);
              if (onDelete) onDelete(project.id);
            }} 
          />
        </Tooltip>
      );
    }

    return actions;
  };
  // Lấy thông tin user từ ID
  const getUserInfo = (userId) => {
    if (!userId || !Array.isArray(users)) return null;
    return users.find(user => user._id === userId || user.id === userId);
  };

  // Lấy danh sách team members để hiển thị - VERSION MỚI
  const getTeamMembers = () => {
    if (!project.listUser || !Array.isArray(project.listUser)) return [];
    
    return project.listUser
      .filter(memberId => memberId !== project.createdBy) // Loại bỏ người tạo
      .map(member => {
        // Trường hợp 1: member là object (có thông tin đầy đủ)
        if (typeof member === 'object' && member !== null) {
          return {
            id: member._id || member.id,
            name: member.fullName || member.name,
            avatar: member.avatar
          };
        }
        
        // Trường hợp 2: member là ID string - tìm trong users prop
        if (typeof member === 'string') {
          const userInfo = getUserInfo(member);
          if (userInfo) {
            return {
              id: member,
              name: userInfo.fullName || userInfo.name || `User ${member.substring(0, 6)}...`,
              avatar: userInfo.avatar
            };
          }
          
          // Không tìm thấy user trong danh sách
          return {
            id: member,
            name: `User ${member.substring(0, 6)}...`,
            avatar: null
          };
        }
        
        return {
          id: member,
          name: `User ${member}`,
          avatar: null
        };
      });
  };

  // Lấy thông tin người tạo (phụ trách)
  const getCreatorInfo = () => {
    if (!project.createdBy) return null;
    
    const creator = getUserInfo(project.createdBy);
    if (creator) {
      return {
        id: creator._id || creator.id,
        name: creator.fullName || creator.name,
        avatar: creator.avatar
      };
    }
    
    // Không tìm thấy
    return {
      id: project.createdBy,
      name: `User ${project.createdBy.substring(0, 6)}...`,
      avatar: null
    };
  };

  const teamMembers = getTeamMembers();
  const creatorInfo = getCreatorInfo();
  const cardActions = getCardActions();

  return (
    <Card
      style={{
        marginBottom: 16,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: `1px solid ${
          project.status === 'completed' ? '#52c41a' : 
          project.status === 'in-progress' ? '#1890ff' : 
          project.status === 'on-hold' ? '#faad14' : '#d9d9d9'
        }`,
        position: 'relative',
        overflow: 'hidden',
        height: '100%'
      }}
      hoverable
      onClick={() => {
        if (onView) onView(project);
      }}
      actions={cardActions}
    >
      {/* Badge thumbnail
      {project.thumbnail && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 60,
            height: 60,
            backgroundImage: `url(${project.thumbnail})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderBottomLeftRadius: 8,
            opacity: 0.9,
            zIndex: 1
          }}
        />
      )} */}

      {/* Vai trò badge */}
      {getRoleBadge() && (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
          {getRoleBadge()}
        </div>
      )}

      <div style={{ 
        marginTop: userRole ? 32 : 0, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: 12 
      }}>
        <div style={{ flex: 1, marginRight: project.thumbnail ? 60 : 0 }}>
          <h3 style={{ 
            margin: 0, 
            marginBottom: 8,
            fontSize: '16px',
            fontWeight: 600,
            color: '#1890ff',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            {project.name || project.title}
            {project.createdBy === currentUser?.id && (
              <Tag 
                color="gold" 
                size="small" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 4,
                  padding: '0 6px',
                  height: '20px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                <UserOutlined style={{ fontSize: '10px' }} /> BẠN
              </Tag>
            )}
          </h3>
          <p style={{ 
            color: '#666', 
            fontSize: '13px',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.5',
            minHeight: '2.5em'
          }}>
            {project.description || project.content || 'Không có mô tả'}
          </p>
        </div>
      </div>

      {/* Status và Priority */}
      <Space size={8} style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Tag 
          icon={getStatusIcon(project.status)} 
          color={getStatusColor(project.status)}
          style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {getStatusText(project.status)}
        </Tag>
        <Tag 
          color={getPriorityColor(project.priority)}
          style={{ margin: 0 }}
        >
          {getPriorityText(project.priority)}
        </Tag>
      </Space>

      {/* Thông tin ngày tháng */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 12,
        backgroundColor: '#fafafa',
        padding: '8px 12px',
        borderRadius: '6px'
      }}>
        <Space size="small">
          <CalendarOutlined style={{ color: '#666', fontSize: '12px' }} />
          <Tooltip title="Ngày bắt đầu">
            <span style={{ fontSize: '12px', color: '#666' }}>
              {formatDate(project.startDate || project.timeStart)}
            </span>
          </Tooltip>
        </Space>
        
        <span style={{ color: '#bfbfbf', fontSize: '12px' }}>→</span>
        
        <Space size="small">
          <CalendarOutlined style={{ color: '#666', fontSize: '12px' }} />
          <Tooltip title="Hạn hoàn thành">
            <span style={{ fontSize: '12px', color: '#666' }}>
              {formatDate(project.dueDate || project.timeFinish)}
            </span>
          </Tooltip>
        </Space>
      </div>

      {/* Team Members - Không bao gồm người phụ trách (người tạo) */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 12
      }}>
        {teamMembers.length > 0 ? (
          <>
            <Avatar.Group 
  size="small" 
  maxCount={3} 
  maxStyle={{ 
    color: '#f56a00', 
    backgroundColor: '#fde3cf',
    fontSize: '10px'
  }}
>
  {/* Hiển thị người phụ trách đầu tiên */}
  {project.createdBy && creatorInfo && (
    <Tooltip 
      key="assignee" 
      title={`Phụ trách: ${creatorInfo.name}`}
      placement="top"
    >
      <Avatar 
        size="small"
        icon={creatorInfo.avatar ? null : <CrownOutlined />}
        src={creatorInfo.avatar}
        style={{ 
          backgroundColor: creatorInfo.avatar ? 'transparent' : '#fadb14',
          border: '2px solid #fadb14',
          cursor: 'pointer'
        }}
      >
        {!creatorInfo.avatar && creatorInfo.name?.charAt(0).toUpperCase()}
      </Avatar>
    </Tooltip>
  )}
  
  {/* Hiển thị các thành viên khác */}
  {teamMembers.slice(0, 3).map((member) => (
    <Tooltip 
      key={member.id} 
      title={member.name} 
      placement="top"
    >
      <Avatar 
        src={member.avatar} 
        icon={member.avatar ? null : <UserOutlined />}
        size="small"
        style={{ 
          backgroundColor: member.avatar ? 'transparent' : '#d9d9d9',
          cursor: 'pointer'
        }}
      >
        {!member.avatar && member.name?.charAt(0).toUpperCase()}
      </Avatar>
    </Tooltip>
  ))}
</Avatar.Group>
            
            <span style={{ fontSize: '11px', color: '#999' }}>
              {teamMembers.length + 1} thành viên {/* +1 cho người phụ trách */}
            </span>
          </>
        ) : (
          <Space size="small">
            <TeamOutlined style={{ color: '#999', fontSize: '12px' }} />
            <span style={{ fontSize: '11px', color: '#999' }}>
              Chỉ có người phụ trách
            </span>
          </Space>
        )}
      </div>

      {/* Footer với thông tin người tạo/phụ trách - SỬA */}
      <div style={{ 
        marginTop: 12, 
        paddingTop: 12, 
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Space size="small">
          <CrownOutlined style={{ color: '#fadb14', fontSize: '11px' }} />
          <span style={{ fontSize: '11px', color: '#666' }}>
            Phụ trách: {creatorInfo?.name || 'Bạn'}
          </span>
        </Space>
        
        {project.createdAt && (
          <Tooltip title={`Tạo ngày: ${moment(project.createdAt).format('DD/MM/YYYY HH:mm')}`}>
            <span style={{ fontSize: '10px', color: '#ccc' }}>
              {moment(project.createdAt).fromNow()}
            </span>
          </Tooltip>
        )}
      </div>
    </Card>
  );
};

export default ProjectCard;