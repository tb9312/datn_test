import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  List,
  Avatar,
  Space,
  Tabs,
  Descriptions,
  Divider,
  Breadcrumb,
  Typography,
  Button,
  Table,
  Timeline,
  Badge
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  ProjectOutlined,
  MessageOutlined,
  EditOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data
  const users = [
    { id: 1, name: 'Nguyễn Văn A', email: 'a@example.com', avatar: null, role: 'Team Lead', isOnline: true, joinDate: '2024-01-01' },
    { id: 2, name: 'Trần Thị B', email: 'b@example.com', avatar: null, role: 'Frontend Developer', isOnline: true, joinDate: '2024-01-05' },
    { id: 3, name: 'Lê Văn C', email: 'c@example.com', avatar: null, role: 'Backend Developer', isOnline: false, joinDate: '2024-01-10' },
    { id: 4, name: 'Phạm Thị D', email: 'd@example.com', avatar: null, role: 'UI/UX Designer', isOnline: true, joinDate: '2024-01-08' }
  ];

  useEffect(() => {
    loadTeamData();
    loadTeamProjects();
    loadTeamTasks();
  }, [id]);

  const loadTeamData = () => {
    // Mock team data
    const mockTeam = {
      id: 1,
      name: 'Frontend Development Team',
      description: 'Nhóm chuyên phát triển giao diện người dùng với các công nghệ hiện đại như React, Vue, Angular. Chúng tôi tập trung vào việc tạo ra trải nghiệm người dùng tốt nhất.',
      isPrivate: false,
      isActive: true,
      members: users,
      memberCount: 4,
      projectCount: 5,
      totalTasks: 45,
      completedTasks: 32,
      tags: ['frontend', 'react', 'vue', 'javascript', 'typescript'],
      recentActivity: 'Hoàn thành component library mới',
      createdAt: '2024-01-01',
      teamLead: users[0],
      performance: 85
    };
    setTeam(mockTeam);
  };

  const loadTeamProjects = () => {
    // Mock projects for this team
    const mockProjects = [
      {
        id: 1,
        name: 'Website Redesign',
        status: 'in-progress',
        progress: 75,
        dueDate: '2024-03-31',
        taskCount: 24,
        completedTasks: 18
      },
      {
        id: 2,
        name: 'Mobile App',
        status: 'in-progress',
        progress: 45,
        dueDate: '2024-06-30',
        taskCount: 35,
        completedTasks: 16
      },
      {
        id: 3,
        name: 'Admin Dashboard',
        status: 'completed',
        progress: 100,
        dueDate: '2024-01-20',
        taskCount: 18,
        completedTasks: 18
      }
    ];
    setProjects(mockProjects);
  };

  const loadTeamTasks = () => {
    // Mock tasks for this team
    const mockTasks = [
      {
        id: 1,
        title: 'Thiết kế component library',
        assignee: users[1],
        status: 'done',
        priority: 'high',
        dueDate: '2024-01-25',
        project: 'Website Redesign'
      },
      {
        id: 2,
        title: 'API integration cho user module',
        assignee: users[2],
        status: 'in-progress',
        priority: 'high',
        dueDate: '2024-02-15',
        project: 'Mobile App'
      },
      {
        id: 3,
        title: 'Optimize performance',
        assignee: users[0],
        status: 'todo',
        priority: 'medium',
        dueDate: '2024-02-28',
        project: 'Website Redesign'
      },
      {
        id: 4,
        title: 'Write unit tests',
        assignee: users[3],
        status: 'in-progress',
        priority: 'medium',
        dueDate: '2024-02-10',
        project: 'Mobile App'
      }
    ];
    setTasks(mockTasks);
    setLoading(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'todo': 'default',
      'in-progress': 'processing',
      'done': 'success'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'todo': 'Chưa bắt đầu',
      'in-progress': 'Đang thực hiện',
      'done': 'Hoàn thành'
    };
    return statusMap[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'blue',
      'medium': 'orange',
      'high': 'red'
    };
    return colors[priority] || 'default';
  };

  if (loading || !team) {
    return <div>Loading...</div>;
  }

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    todo: tasks.filter(t => t.status === 'todo').length
  };

  const projectColumns = [
    {
      title: 'Tên dự án',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'success' : status === 'in-progress' ? 'processing' : 'default'}>
          {status === 'completed' ? 'Hoàn thành' : status === 'in-progress' ? 'Đang thực hiện' : 'Chưa bắt đầu'}
        </Tag>
      )
    },
    {
      title: 'Tiến độ',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress) => (
        <Progress percent={progress} size="small" />
      )
    },
    {
      title: 'Công việc',
      dataIndex: 'taskCount',
      key: 'taskCount',
      render: (taskCount, record) => (
        <Text>{record.completedTasks}/{taskCount}</Text>
      )
    },
    {
      title: 'Hạn hoàn thành',
      dataIndex: 'dueDate',
      key: 'dueDate'
    }
  ];

  const taskColumns = [
    {
      title: 'Công việc',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Dự án',
      dataIndex: 'project',
      key: 'project'
    },
    {
      title: 'Người phụ trách',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (assignee) => (
        <Space>
          <Avatar size="small" src={assignee?.avatar} icon={<UserOutlined />} />
          <span>{assignee?.name}</span>
        </Space>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Độ ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority === 'high' ? 'Cao' : priority === 'medium' ? 'Trung bình' : 'Thấp'}
        </Tag>
      )
    },
    {
      title: 'Hạn hoàn thành',
      dataIndex: 'dueDate',
      key: 'dueDate'
    }
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <a onClick={() => navigate('/teams')}>Nhóm</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{team.name}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Team Header */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <TeamOutlined style={{ color: '#1890ff', fontSize: '24px', marginRight: 12 }} />
              <Title level={2} style={{ margin: 0, marginRight: 16 }}>
                {team.name}
              </Title>
              <Space>
                <Tag color={team.isActive ? 'success' : 'default'}>
                  {team.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                </Tag>
                {team.isPrivate && (
                  <Tag color="blue">Riêng tư</Tag>
                )}
              </Space>
            </div>
            
            <Text style={{ color: '#666', fontSize: '16px', lineHeight: '1.6', display: 'block', marginBottom: 12 }}>
              {team.description}
            </Text>

            {/* Team Tags */}
            {team.tags && team.tags.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Space wrap>
                  {team.tags.map(tag => (
                    <Tag key={tag} color="blue">
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </div>

          <Space>
            <Button icon={<MessageOutlined />}>
              Nhắn tin nhóm
            </Button>
            <Button icon={<EditOutlined />}>
              Chỉnh sửa
            </Button>
          </Space>
        </div>
      </Card>

      {/* Team Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Thành viên"
              value={team.memberCount}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Dự án"
              value={team.projectCount}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Công việc hoàn thành"
              value={team.completedTasks}
              suffix={`/${team.totalTasks}`}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Hiệu suất"
              value={team.performance}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Team Details & Members */}
        <Col xs={24} lg={8}>
          {/* Team Information */}
          <Card title="Thông tin nhóm" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Trưởng nhóm">
                <Space>
                  <Avatar size="small" src={team.teamLead?.avatar} icon={<UserOutlined />} />
                  <span>{team.teamLead?.name}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                <Space>
                  <CalendarOutlined />
                  <span>{team.createdAt}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={team.isActive ? 'success' : 'default'}>
                  {team.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Quyền riêng tư">
                <Tag color={team.isPrivate ? 'blue' : 'default'}>
                  {team.isPrivate ? 'Riêng tư' : 'Công khai'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Team Members */}
          <Card title="Thành viên nhóm" style={{ marginBottom: 16 }}>
            <List
              dataSource={team.members}
              renderItem={member => (
                <List.Item
                  actions={[
                    <Button type="text" icon={<MessageOutlined />} size="small" />
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge dot={member.isOnline} color="green" offset={[-2, 2]}>
                        <Avatar src={member.avatar} icon={<UserOutlined />} />
                      </Badge>
                    }
                    title={
                      <Space>
                        <span>{member.name}</span>
                        {member.id === team.teamLead?.id && (
                          <Tag color="gold" style={{ fontSize: '10px' }}>Trưởng nhóm</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <div>{member.role}</div>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          Tham gia: {member.joinDate}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Team Performance */}
          <Card title="Hiệu suất nhóm">
            <div style={{ textAlign: 'center' }}>
              <Progress 
                type="circle" 
                percent={team.performance} 
                width={120}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <div style={{ marginTop: 16 }}>
                <Text strong>Hiệu suất làm việc</Text>
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  Dựa trên tiến độ và chất lượng công việc
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Main Content */}
        <Col xs={24} lg={16}>
          <Card>
            <Tabs defaultActiveKey="projects">
              <TabPane tab={`Dự án (${projects.length})`} key="projects">
                <Table 
                  dataSource={projects} 
                  columns={projectColumns}
                  pagination={false}
                  rowKey="id"
                />
              </TabPane>

              <TabPane tab={`Công việc (${tasks.length})`} key="tasks">
                <Table 
                  dataSource={tasks} 
                  columns={taskColumns}
                  pagination={false}
                  rowKey="id"
                />
              </TabPane>

              <TabPane tab="Thống kê" key="stats">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card title="Phân bổ công việc" size="small">
                      <div style={{ textAlign: 'center' }}>
                        <Progress 
                          type="circle" 
                          percent={Math.round((taskStats.completed / taskStats.total) * 100)} 
                          width={120}
                        />
                        <div style={{ marginTop: 16 }}>
                          <Text strong>{taskStats.completed}/{taskStats.total} công việc đã hoàn thành</Text>
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="Trạng thái công việc" size="small">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Hoàn thành</span>
                          <Tag color="green">{taskStats.completed}</Tag>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Đang thực hiện</span>
                          <Tag color="blue">{taskStats.inProgress}</Tag>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Chưa bắt đầu</span>
                          <Tag color="default">{taskStats.todo}</Tag>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </TabPane>

              <TabPane tab="Hoạt động" key="activities">
                <Timeline>
                  <Timeline.Item color="green" dot={<TeamOutlined />}>
                    <p>Nhóm được tạo</p>
                    <Text type="secondary">{team.createdAt} bởi {team.teamLead?.name}</Text>
                  </Timeline.Item>
                  <Timeline.Item color="blue">
                    <p>Thành viên mới tham gia: Trần Thị B</p>
                    <Text type="secondary">2024-01-05</Text>
                  </Timeline.Item>
                  <Timeline.Item color="blue">
                    <p>Bắt đầu dự án Website Redesign</p>
                    <Text type="secondary">2024-01-10</Text>
                  </Timeline.Item>
                  <Timeline.Item color="blue">
                    <p>Hoàn thành component library</p>
                    <Text type="secondary">2024-01-25</Text>
                  </Timeline.Item>
                  <Timeline.Item>
                    <p>Dự kiến hoàn thành Mobile App</p>
                    <Text type="secondary">2024-06-30</Text>
                  </Timeline.Item>
                </Timeline>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeamDetail;