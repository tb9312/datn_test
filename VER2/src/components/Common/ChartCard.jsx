import React from 'react';
import { Card, Empty } from 'antd';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Đăng ký các thành phần ChartJS
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const ChartCard = ({ title, labels = [], data = [], colors = [], type = 'doughnut' }) => {
  if (!data || data.length === 0 || data.every(item => item === 0)) {
    return (
      <Card title={title} bordered={false}>
        <Empty description="No data available" />
      </Card>
    );
  }

  const chartData = {
    labels: labels,
    datasets: [
      {
        data: data,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            label += context.raw;
            return label;
          }
        }
      }
    },
  };

  return (
    <Card title={title} bordered={false}>
      <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </Card>
  );
};

export default ChartCard;