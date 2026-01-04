// Quản lý người dùng
import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Avatar, Modal, Form, Input, Select, message, Popconfirm, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, UserAddOutlined, SearchOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Search } = Input;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchText, setSearchText] = useState('');

  const roles = [
    { value: 'admin', label: 'Quản trị viên', color: 'red' },
    { value: 'manager', label: 'Quản lý', color: 'orange' },
    { value: 'user', label: 'Người dùng', color: 'blue' },
    { value: 'guest', label: 'Khách', color: 'default' }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setLoading(true);
    // Mock users data
    const mockUsers = [
      // {
      //   id: 1,
      //   name: 'Nguyễn Văn Admin',
      //   email: 'admin@company.com',
      //   role: 'admin',
      //   status: 'active',
      //   avatar: null,
      //   lastLogin: '2024-01-20 14:30:00',
      //   createdAt: '2024-01-01',
      //   projects: 12,
      //   tasks: 45
      // },
      {
        id: 1,
        name: 'Trần Thị Manager',
        email: 'manager@company.com',
        role: 'manager',
        status: 'active',
        avatar: null,
        lastLogin: '2024-01-20 09:15:00',
        createdAt: '2024-01-05',
        projects: 8,
        tasks: 32
      },
      {
        id: 2,
        name: 'Lê Văn User',
        email: 'user@company.com',
        role: 'user',
        status: 'active',
        avatar: null,
        lastLogin: '2024-01-19 16:45:00',
        createdAt: '2024-01-10',
        projects: 5,
        tasks: 18
      },
      {
        id: 3,
        name: 'Phạm Thị Guest',
        email: 'test@company.com',
        role: 'user',
        status: 'inactive',
        avatar: null,
        lastLogin: '2024-01-15 11:20:00',
        createdAt: '2024-01-08',
        projects: 2,
        tasks: 8
      },
      {
        id: 4,
        name: 'Hoàng Văn Developer',
        email: 'dev@company.com',
        role: 'user',
        status: 'active',
        avatar: null,
        lastLogin: '2024-01-20 13:10:00',
        createdAt: '2024-01-12',
        projects: 6,
        tasks: 24
      }
    ];
    setUsers(mockUsers);
    setLoading(false);
  };

  const getRoleColor = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj ? roleObj.color : 'default';
  };

  const getRoleLabel = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  const handleCreateUser = (values) => {
    const newUser = {
      id: Date.now(),
      ...values,
      avatar: null,
      lastLogin: null,
      createdAt: new Date().toISOString().split('T')[0],
      projects: 0,
      tasks: 0,
      status: 'active'
    };

    setUsers(prev => [newUser, ...prev]);
    message.success('Tạo người dùng thành công!');
    setModalVisible(false);
  };

  const handleUpdateUser = (values) => {
    setUsers(prev => prev.map(user =>
      user.id === editingUser.id
        ? { ...user, ...values }
        : user
    ));
    message.success('Cập nhật người dùng thành công!');
    setModalVisible(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
    message.success('Xóa người dùng thành công!');
  };

  const handleToggleStatus = (userId) => {
    setUsers(prev => prev.map(user =>
      user.id === userId
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
    message.success('Cập nhật trạng thái thành công!');
  };

  const columns = [
    {
      title: 'Người dùng',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserAddOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={getRoleColor(role)}>
          {getRoleLabel(role)}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Dự án',
      dataIndex: 'projects',
      key: 'projects',
      align: 'center',
    },
    {
      title: 'Công việc',
      dataIndex: 'tasks',
      key: 'tasks',
      align: 'center',
    },
    {
      title: 'Lần đăng nhập cuối',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (login) => login || 'Chưa đăng nhập',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={() => {
                setEditingUser(record);
                setModalVisible(true);
              }}
            />
          </Tooltip>
          
          <Tooltip title={record.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}>
            <Button 
              type="link" 
              icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => handleToggleStatus(record.id)}
            />
          </Tooltip>

          {/* <Popconfirm
            title="Xóa người dùng"
            description="Bạn có chắc chắn muốn xóa người dùng này?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
          >
            <Tooltip title="Xóa">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm> */}
        </Space>
      ),
    },
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Search
          placeholder="Tìm kiếm người dùng..."
          style={{ width: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          enterButton={<SearchOutlined />}
        />
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => {
            setEditingUser(null);
            setModalVisible(true);
          }}
        >
          Thêm Người Dùng
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} của ${total} người dùng`,
        }}
      />

      <Modal
        title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
        }}
        footer={null}
        width={500}
      >
        <UserForm
          user={editingUser}
          onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
          onCancel={() => {
            setModalVisible(false);
            setEditingUser(null);
          }}
        />
      </Modal>
    </div>
  );
};

const UserForm = ({ user, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue(user);
    } else {
      form.resetFields();
    }
  }, [user, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <Form.Item
        name="name"
        label="Họ và tên"
        rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
      >
        <Input placeholder="Nhập họ và tên" />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Vui lòng nhập email!' },
          { type: 'email', message: 'Email không hợp lệ!' }
        ]}
      >
        <Input placeholder="Nhập email" />
      </Form.Item>

      <Form.Item
        name="role"
        label="Vai trò"
        rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
      >
        <Select placeholder="Chọn vai trò">
          <Option value="admin">Quản trị viên</Option>
          <Option value="manager">Quản lý</Option>
          <Option value="user">Người dùng</Option>
          <Option value="guest">Khách</Option>
        </Select>
      </Form.Item>

      {!user && (
        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
        >
          <Input.Password placeholder="Nhập mật khẩu" />
        </Form.Item>
      )}

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {user ? 'Cập nhật' : 'Tạo'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default UserManagement;