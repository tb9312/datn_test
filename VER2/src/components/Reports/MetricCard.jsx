import React from 'react';
import { Card, Statistic, Tag, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';

const MetricCard = ({ title, value, previousValue, suffix, prefix, color, trend, description }) => {
  const getTrendIcon = () => {
    if (trend > 0) return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
    if (trend < 0) return <ArrowDownOutlined style={{ color: '#f5222d' }} />;
    return <MinusOutlined style={{ color: '#faad14' }} />;
  };

  const getTrendColor = () => {
    if (trend > 0) return 'success';
    if (trend < 0) return 'error';
    return 'warning';
  };

  const getTrendText = () => {
    if (trend > 0) return `+${Math.abs(trend)}%`;
    if (trend < 0) return `-${Math.abs(trend)}%`;
    return '0%';
  };

  return (
    <Card>
      <Statistic
        title={
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <div>{title}</div>
            {description && (
              <div style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                {description}
              </div>
            )}
          </Space>
        }
        value={value}
        valueStyle={{ color }}
        prefix={prefix}
        suffix={
          <Space>
            {suffix}
            {trend !== undefined && (
              <Tag color={getTrendColor()} icon={getTrendIcon()}>
                {getTrendText()}
              </Tag>
            )}
          </Space>
        }
      />
      {previousValue !== undefined && (
        <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
          So với trước: {previousValue}
        </div>
      )}
    </Card>
  );
};

export default MetricCard;