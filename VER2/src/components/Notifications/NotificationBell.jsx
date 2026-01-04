import React, { useState } from 'react';
import { Badge, Dropdown, Button, Tooltip } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import NotificationList from './NotificationList';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationBell = () => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { unreadCount, fetchNotifications, loading } = useNotifications();

  const handleBellClick = () => {
    const newVisible = !dropdownVisible;
    setDropdownVisible(newVisible);
    
    // Luôn refresh khi mở dropdown
    if (newVisible && !loading) {
      fetchNotifications();
    }
  };

  console.log('🔔 NotificationBell: unreadCount =', unreadCount);

  const notificationDropdown = (
    <NotificationList 
      onClose={() => setDropdownVisible(false)}
    />
  );

  return (
    <Dropdown
      overlay={notificationDropdown}
      trigger={['click']}
      open={dropdownVisible}
      onOpenChange={setDropdownVisible}
      placement="bottomRight"
      overlayStyle={{ 
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        borderRadius: 8,
        maxWidth: '90vw' // Responsive
      }}
    >
      <Tooltip title="Thông báo">
        <Badge 
          count={unreadCount} 
          size="small" 
          overflowCount={99}
          offset={[-5, 5]}
          style={{ 
            cursor: 'pointer',
          }}
        >
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: 18, color: '#000' }} />}
            onClick={handleBellClick}
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
  );
};

export default NotificationBell;