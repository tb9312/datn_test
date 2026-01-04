import React from 'react';
import { Card, Select, Space } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const { Option } = Select;

const ChartCard = ({ title, data, type = 'bar', height = 300, onPeriodChange, showPeriodSelector = false }) => {
  const chartColors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#a0d911'];

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#1890ff" name="Giá trị" />
              {data[0]?.completed && (
                <Bar dataKey="completed" fill="#52c41a" name="Hoàn thành" />
              )}
              {data[0]?.pending && (
                <Bar dataKey="pending" fill="#faad14" name="Đang thực hiện" />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#1890ff" name="Giá trị" strokeWidth={2} />
              {data[0]?.target && (
                <Line type="monotone" dataKey="target" stroke="#f5222d" name="Mục tiêu" strokeWidth={2} strokeDasharray="5 5" />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#1890ff" 
                fill="#1890ff" 
                fillOpacity={0.3}
                name="Giá trị" 
                strokeWidth={2} 
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{title}</span>
          {showPeriodSelector && (
            <Select 
              defaultValue="month" 
              style={{ width: 120 }} 
              onChange={onPeriodChange}
            >
              <Option value="week">Tuần</Option>
              <Option value="month">Tháng</Option>
              <Option value="quarter">Quý</Option>
              <Option value="year">Năm</Option>
            </Select>
          )}
        </div>
      }
      style={{ height: '100%' }}
    >
      {renderChart()}
    </Card>
  );
};

export default ChartCard;