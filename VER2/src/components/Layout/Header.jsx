import React, { useState } from 'react';
import { 
  Layout, 
  Dropdown, 
  Avatar, 
  Space, 
  Badge, 
  theme, 
  Button, 
  Tooltip 
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationList from '../Notifications/NotificationList';

const { Header: AntHeader } = Layout;

const Header = ({ collapsed, onToggle }) => {
  const { user, logout, isManager } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [notificationDropdownVisible, setNotificationDropdownVisible] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // THÊM DEBUG
  console.log('🏢 HEADER DEBUG:');
  console.log('User role:', user?.role);
  console.log('isManager():', isManager());
  console.log('User fullName:', user?.fullName);

  const getUserMenuItems = () => {
    const items = [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Hồ sơ',
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Cài đặt',
      },
    ];

    // CHỈ admin mới có menu Admin
    if (user?.role === 'admin') {
      items.unshift({
        key: 'admin',
        icon: <CrownOutlined />,
        label: 'Quản trị',
        style: { 
          color: '#ff4d4f',
          fontWeight: 'bold'
        }
      });
    }

    items.push(
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
      }
    );

    return items;
  };

  const getRoleText = () => {
    if (user?.role === 'admin') {
      return 'Quản trị viên';
    } else if (isManager()) {
      return 'Quản lý';
    } else {
      return 'Người dùng';
    }
  };

  const getRoleColor = () => {
    if (user?.role === 'admin') {
      return '#ff4d4f'; // Màu đỏ cho admin
    } else if (isManager()) {
      return '#1890ff'; // Màu xanh cho manager
    } else {
      return '#666'; // Màu xám cho user
    }
  };

  const getRoleIcon = () => {
    if (user?.role === 'admin') {
      return '👑';
    } else if (isManager()) {
      return '👔';
    } else {
      return '👤';
    }
  };

  const notificationDropdown = (
    <div style={{ width: 400 }}>
      <NotificationList 
        onClose={() => setNotificationDropdownVisible(false)}
      />
    </div>
  );

  return (
    <AntHeader
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000, 
        padding: '0 24px',
        background: colorBgContainer,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
          className: 'trigger',
          onClick: onToggle,
          style: { fontSize: 18, cursor: 'pointer' },
        })}
        
        {/* Thêm thông tin role vào header
        <div style={{ 
          marginLeft: 20, 
          padding: '4px 12px', 
          background: isManager() ? '#f0f5ff' : '#f6ffed',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          color: getRoleColor(),
          border: `1px solid ${getRoleColor()}20`,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>{getRoleIcon()}</span>
          <span>{getRoleText()}</span>
          {/* Debug info chỉ hiển thị trong dev */}
          {/* {process.env.NODE_ENV === 'development' && (
            <span style={{ 
              fontSize: '10px', 
              color: '#999',
              marginLeft: '4px'
            }}>
              ({user?.role})
            </span>
          )}
        </div> */} 
      </div>

      <Space size="large">
        {/* Notification Bell */}
        <Dropdown
          overlay={notificationDropdown}
          trigger={['click']}
          open={notificationDropdownVisible}
          onOpenChange={setNotificationDropdownVisible}
          placement="bottomRight"
          overlayStyle={{ 
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            borderRadius: 8
          }}
        >
          <Tooltip title="Thông báo">
            <Badge 
              count={unreadCount} 
              size="small" 
              offset={[-5, 5]}
              style={{ 
                cursor: 'pointer',
              }}
            >
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 18, color: '#000' }} />}
                onClick={() => setNotificationDropdownVisible(!notificationDropdownVisible)}
                style={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </Badge>
          </Tooltip>
        </Dropdown>
        
        {/* User Profile Dropdown */}
        <Dropdown
          menu={{
            items: getUserMenuItems(),
            onClick: ({ key }) => {
              if (key === 'profile') navigate('/profile');
              else if (key === 'settings') navigate('/profile');
              else if (key === 'admin') navigate('/admin');
              else if (key === 'logout') logout();
            }
          }}
          placement="bottomRight"
        >
          <div style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            padding: '8px',
            borderRadius: '8px',
            transition: 'background 0.3s',
            ':hover': {
              background: '#f5f5f5'
            }
          }}>
            <Avatar 
              size="default" 
              icon={<UserOutlined />} 
              src={user?.avatar}
              style={{
                border: user?.role === 'admin' ? '2px solid #ff4d4f' : 
                        isManager() ? '2px solid #1890ff' : 'none',
                background: user?.role === 'admin' ? '#fff2f0' : 
                           isManager() ? '#f0f5ff' : '#f5f5f5'
              }}
            />
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-start',
              lineHeight: 1.2,
              gap: 2
            }}>
              <div style={{ 
                fontSize: 14, 
                fontWeight: 600,
                color: '#000'
              }}>
                {user?.fullName || user?.name || user?.email || 'Người dùng'}
              </div>
              <div style={{ 
                fontSize: 12, 
                color: getRoleColor(),
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <span>{getRoleIcon()}</span>
                <span>{getRoleText()}</span>
              </div>
            </div>
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;