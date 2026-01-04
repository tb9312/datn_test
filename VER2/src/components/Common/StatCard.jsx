import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Text } = Typography;

const StatCard = ({ title, value, icon, color, change }) => {
  return (
    <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            backgroundColor: `${color}20`,
            color: color,
            width: 48,
            height: 48,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            marginRight: 16,
          }}
        >
          {icon}
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {title}
          </Text>
          <Title level={3} style={{ margin: '4px 0' }}>
            {value}
          </Title>
          {change && (
            <Text style={{ color: change.startsWith('+') ? '#52c41a' : '#f5222d' }}>
              {change}
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;