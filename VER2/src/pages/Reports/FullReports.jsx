import React, { useState, useEffect } from 'react';
import {
  Button,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Tabs,
  DatePicker,
  Select,
  Statistic,
  List,
  Tag
} from 'antd';
import {
  DownloadOutlined,
  BarChartOutlined,
  TeamOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  RiseOutlined
} from '@ant-design/icons';
import ChartCard from '../../components/Reports/ChartCard';
import MetricCard from '../../components/Reports/MetricCard';
import ReportGenerator from '../../components/Reports/ReportGenerator';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for charts
  const taskCompletionData = [
    { name: 'Th1', value: 45, completed: 35, pending: 10 },
    { name: 'Th2', value: 52, completed: 42, pending: 10 },
    { name: 'Th3', value: 48, completed: 38, pending: 10 },
    { name: 'Th4', value: 60, completed: 50, pending: 10 },
    { name: 'Th5', value: 55, completed: 45, pending: 10 },
    { name: 'Th6', value: 70, completed: 60, pending: 10 },
  ];

  const projectProgressData = [
    { name: 'Website', progress: 85, tasks: 24, completed: 20 },
    { name: 'Mobile App', progress: 45, tasks: 35, completed: 16 },
    { name: 'API', progress: 90, tasks: 18, completed: 16 },
    { name: 'Design', progress: 75, tasks: 15, completed: 11 },
    { name: 'Testing', progress: 30, tasks: 20, completed: 6 },
  ];

  const teamPerformanceData = [
    { name: 'Frontend', value: 85, target: 80 },
    { name: 'Backend', value: 78, target: 85 },
    { name: 'Design', value: 92, target: 75 },
    { name: 'QA', value: 65, target: 70 },
    { name: 'Marketing', value: 88, target: 85 },
  ];

  const taskDistributionData = [
    { name: 'Hoàn thành', value: 156 },
    { name: 'Đang thực hiện', value: 45 },
    { name: 'Chưa bắt đầu', value: 23 },
    { name: 'Tồn đọng', value: 12 },
  ];

  const userActivityData = [
    { name: 'Nguyễn Văn A', tasks: 45, completed: 38 },
    { name: 'Trần Thị B', tasks: 38, completed: 32 },
    { name: 'Lê Văn C', tasks: 52, completed: 45 },
    { name: 'Phạm Thị D', tasks: 28, completed: 22 },
    { name: 'Hoàng Văn E', tasks: 35, completed: 28 },
  ];

  const timelineData = [
    { time: '08:00', activity: 'Bắt đầu ngày làm việc', user: 'System' },
    { time: '09:30', activity: 'Họp nhóm hàng tuần', user: 'Nguyễn Văn A' },
    { time: '11:00', activity: 'Hoàn thành task #245', user: 'Trần Thị B' },
    { time: '14:00', activity: 'Review code PR #156', user: 'Lê Văn C' },
    { time: '16:30', activity: 'Deploy phiên bản mới', user: 'Phạm Thị D' },
  ];

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleGenerateReport = (values) => {
    console.log('Generated report:', values);
    // Handle report generation
  };

  const metrics = [
    {
      title: 'Tổng công việc',
      value: 236,
      previousValue: 198,
      suffix: 'công việc',
      color: '#1890ff',
      trend: 19.2,
      description: 'Tổng số công việc trong kỳ'
    },
    {
      title: 'Tỷ lệ hoàn thành',
      value: 76.3,
      previousValue: 68.5,
      suffix: '%',
      color: '#52c41a',
      trend: 11.4,
      description: 'Tỷ lệ công việc hoàn thành'
    },
    {
      title: 'Năng suất',
      value: 4.2,
      previousValue: 3.8,
      suffix: 'task/ngày',
      color: '#faad14',
      trend: 10.5,
      description: 'Năng suất trung bình'
    },
    {
      title: 'Độ trễ',
      value: 12,
      previousValue: 18,
      suffix: 'giờ',
      color: '#f5222d',
      trend: -33.3,
      description: 'Độ trễ trung bình'
    }
  ];

  return (
    <div>
      {/* Header */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <BarChartOutlined style={{ marginRight: 12, color: '#1890ff' }} />
              Báo Cáo & Thống Kê
            </Title>
            <p style={{ margin: 0, color: '#666' }}>
              Phân tích hiệu suất và tạo báo cáo chi tiết
            </p>
          </div>
          <Space>
            <RangePicker
              onChange={(dates) => setDateRange(dates)}
              style={{ width: 250 }}
            />
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => setReportModalVisible(true)}
            >
              Tạo Báo Cáo
            </Button>
          </Space>
        </div>
      </Card>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {metrics.map((metric, index) => (
          <Col key={index} xs={24} sm={12} lg={6}>
            <MetricCard {...metric} />
          </Col>
        ))}
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Tổng Quan" key="overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <ChartCard
                title="Tiến Độ Công Việc Theo Tháng"
                data={taskCompletionData}
                type="bar"
                height={300}
                showPeriodSelector
              />
            </Col>
            <Col xs={24} lg={12}>
              <ChartCard
                title="Phân Bổ Công Việc"
                data={taskDistributionData}
                type="pie"
                height={300}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <ChartCard
                title="Hiệu Suất Nhóm"
                data={teamPerformanceData}
                type="line"
                height={300}
              />
            </Col>
            <Col xs={24} lg={12}>
              <ChartCard
                title="Tiến Độ Dự Án"
                data={projectProgressData}
                type="bar"
                height={300}
              />
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Hiệu Suất" key="performance">
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card title="Hoạt Động Theo Thời Gian Thực">
                <List
                  dataSource={timelineData}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Tag color="blue">{item.time}</Tag>}
                        title={item.activity}
                        description={`Bởi: ${item.user}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Phân Tích Người Dùng" key="users">
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <ChartCard
                title="Hiệu Suất Cá Nhân"
                data={userActivityData}
                type="bar"
                height={400}
              />
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="So Sánh" key="comparison">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card title="So Sánh Nhóm">
                <Statistic
                  title="Nhóm hiệu quả nhất"
                  value="Design Team"
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Statistic
                  title="Hiệu suất"
                  value={92}
                  suffix="%"
                  style={{ marginTop: 16 }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="So Sánh Dự Án">
                <Statistic
                  title="Dự án tiến độ tốt nhất"
                  value="API Development"
                  prefix={<ProjectOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
                <Statistic
                  title="Tiến độ"
                  value={90}
                  suffix="%"
                  style={{ marginTop: 16 }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Xu Hướng">
                <Statistic
                  title="Tăng trưởng năng suất"
                  value={15.2}
                  suffix="%"
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
                <Statistic
                  title="So với kỳ trước"
                  value={12.8}
                  suffix="%"
                  style={{ marginTop: 16 }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Report Generator Modal */}
      <ReportGenerator
        visible={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        onGenerate={handleGenerateReport}
      />
    </div>
  );
};

export default Reports;