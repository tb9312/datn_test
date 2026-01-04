import React from 'react';
import { Card, Tag, Button, Space, Dropdown, Typography, Avatar } from 'antd';
import { 
  MoreOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CalendarOutlined,
  FlagOutlined,
  UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

const TaskCard = ({ 
  task, 
  onEdit, 
  onDelete, 
  onViewDetail, 
  showStatusTag = true,
  compact = false 
}) => {
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
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const menuItems = [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'Xem chi tiết',
      onClick: () => onViewDetail && onViewDetail(task._id)
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Chỉnh sửa',
      onClick: () => onEdit && onEdit(task)
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Xóa',
      danger: true,
      onClick: () => onDelete && onDelete(task._id)
    }
  ];

  return (
    <Card
      size="small"
      style={{
        marginBottom: compact ? 0 : '12px',
        cursor: 'pointer',
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        transition: 'all 0.3s',
        height: compact ? 'auto' : '100%'
      }}
      bodyStyle={{
        padding: compact ? '12px' : '16px'
      }}
      hoverable
      onClick={() => onViewDetail && onViewDetail(task._id)}
    >
      {/* Header với tiêu đề và menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <Text strong style={{ 
          fontSize: compact ? '14px' : '15px',
          lineHeight: '1.4',
          flex: 1,
          marginRight: '8px'
        }}>
          {task.title}
        </Text>
        
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement="bottomRight"
          onClick={(e) => e.stopPropagation()}
        >
          <Button 
            type="text" 
            size="small" 
            icon={<MoreOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>

      {/* Nội dung */}
      {task.content && (
        <Paragraph 
          ellipsis={{ 
            rows: compact ? 2 : 3, 
            tooltip: task.content 
          }}
          style={{ 
            marginBottom: '12px',
            fontSize: compact ? '13px' : '14px',
            color: '#666',
            lineHeight: '1.5'
          }}
        >
          {task.content}
        </Paragraph>
      )}

      {/* Tags và metadata */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Status và Priority */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {showStatusTag && (
            <Tag 
              color={getStatusColor(task.status)}
              style={{ 
                margin: 0,
                fontSize: compact ? '11px' : '12px',
                padding: compact ? '2px 6px' : '2px 8px'
              }}
            >
              {getStatusText(task.status)}
            </Tag>
          )}
          
          {task.priority && task.priority !== 'medium' && (
            <Tag 
              color={getPriorityColor(task.priority)}
              icon={<FlagOutlined />}
              style={{ 
                margin: 0,
                fontSize: compact ? '11px' : '12px',
                padding: compact ? '2px 6px' : '2px 8px'
              }}
            >
              {getPriorityText(task.priority)}
            </Tag>
          )}
        </div>

        {/* Dates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {task.timeStart && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CalendarOutlined style={{ fontSize: '12px', color: '#999' }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Bắt đầu: {formatDate(task.timeStart)}
              </Text>
            </div>
          )}
          
          {task.timeFinish && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CalendarOutlined style={{ fontSize: '12px', color: '#999' }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Kết thúc: {formatDate(task.timeFinish)}
              </Text>
            </div>
          )}
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {task.tags.slice(0, 3).map((tag, index) => (
              <Tag 
                key={index}
                style={{ 
                  margin: 0,
                  fontSize: '11px',
                  padding: '1px 6px',
                  background: '#f0f0f0',
                  border: '1px solid #d9d9d9',
                  color: '#666'
                }}
              >
                {tag}
              </Tag>
            ))}
            {task.tags.length > 3 && (
              <Tag style={{ fontSize: '11px', padding: '1px 6px' }}>
                +{task.tags.length - 3}
              </Tag>
            )}
          </div>
        )}
      </div>
      {/* Assignee */}
      {task.assignee && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
        <Avatar 
          size="small" 
          src={task.assignee.avatar} 
          icon={!task.assignee.avatar && <UserOutlined />}
        />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {task.assignee.name}
        </Text>
      </div>
      )}
        
      {/* Action buttons for non-compact view */}
      {!compact && (
        <div style={{ 
          marginTop: '12px', 
          paddingTop: '12px', 
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail && onViewDetail(task._id);
            }}
          >
            Chi tiết
          </Button>
          
          <Space>
            <Button 
              size="small" 
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit(task);
              }}
            >
              Sửa
            </Button>
            <Button 
              size="small" 
              icon={<DeleteOutlined />}
              danger
              onClick={(e) => {
                console.log("DELETE BUTTON CLICKED!");
                console.log("task._id:", task._id);
                console.log("onDelete function exists:", !!onDelete);
                e.stopPropagation();
                if (onDelete) {
                  console.log("Calling onDelete with:", task._id);
                  onDelete(task._id);
                }
              }}
            >
              Xóa
            </Button>
          </Space>
        </div>
      )}
    </Card>
  );
};

// export default TaskCard;
export default React.memo(TaskCard);