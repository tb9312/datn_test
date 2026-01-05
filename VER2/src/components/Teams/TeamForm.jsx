import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Switch, Button, Space, Avatar, Row, Col, Tag, message } from 'antd';
import { UserOutlined, ProjectOutlined, LoadingOutlined } from '@ant-design/icons';
import userService from '../../services/userService';

const { Option } = Select;
const { TextArea } = Input;

const TeamForm = ({ 
  visible, 
  onCancel, 
  onFinish, 
  initialValues, 
  loading, 
  projects = [],
  editingTeam 
}) => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [projectUsers, setProjectUsers] = useState([]);

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        // Khi chỉnh sửa team
        form.setFieldsValue({
          name: initialValues.name,
          description: initialValues.description,
          isActive: initialValues.isActive,
          listUser: initialValues.listUser || []
        });
        
        // Load users từ project nếu có project_id
        if (initialValues.project_id) {
          loadProjectUsers(initialValues.project_id);
        }
      } else {
        // Khi tạo mới
        form.resetFields();
        setProjectUsers([]);
      }
      
      // Load danh sách user
      loadUsers();
    }
  }, [visible, initialValues, form]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await userService.getUsers({
        page: 1,
        limit: 100
      });
      
      if (response.success) {
        const formattedUsers = response.data.map(user => ({
          id: user._id,
          name: user.fullName,
          email: user.email,
          avatar: user.avatar
        }));
        setUsers(formattedUsers);
      } else {
        message.error(response.message || 'Lỗi khi tải danh sách user');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      message.error('Lỗi khi tải danh sách user');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadProjectUsers = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    if (project) {
      // Kết hợp listUser từ project với manager
      const usersFromProject = [
        ...(project.listUser || []),
        project.manager,
        project.createdBy
      ].filter(Boolean);
      
      setProjectUsers(usersFromProject);
    }
  };

  const handleProjectChange = (projectId) => {
    loadProjectUsers(projectId);
    form.setFieldsValue({ listUser: [] }); // Reset selected users
  };

  const handleFinish = (values) => {
    // Nếu là tạo mới, cần có project_id
    if (!editingTeam && !values.project_id) {
      message.error('Vui lòng chọn dự án');
      return;
    }
    
    // Format lại listUser thành mảng ObjectId
    const formattedValues = {
      ...values,
      listUser: values.listUser || []
    };
    
    onFinish(formattedValues);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      disabled={loading}
    >
      {!editingTeam && (
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="project_id"
              label="Chọn dự án"
              rules={[{ required: true, message: 'Vui lòng chọn dự án!' }]}
            >
              <Select
                placeholder="Chọn dự án để tạo nhóm"
                onChange={handleProjectChange}
                optionFilterProp="children"
                showSearch
                loading={loading}
              >
                {projects.map(project => (
                  <Option key={project._id} value={project._id}>
                    <Space>
                      <ProjectOutlined />
                      <span>{project.title}</span>
                      <Tag color="blue" style={{ fontSize: '10px' }}>{project.status}</Tag>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      )}

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="name"
            label="Tên nhóm"
            rules={[
              { required: true, message: 'Vui lòng nhập tên nhóm!' },
              { max: 100, message: 'Tên nhóm không được vượt quá 100 ký tự' }
            ]}
          >
            <Input 
              placeholder="Nhập tên nhóm" 
              prefix={<UserOutlined />}
              maxLength={100}
              showCount
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="description"
            label="Mô tả nhóm"
            rules={[{ max: 500, message: 'Mô tả không được vượt quá 500 ký tự' }]}
          >
            <TextArea 
              rows={3} 
              placeholder="Mô tả về mục đích và hoạt động của nhóm..." 
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="isActive"
            label="Trạng thái hoạt động"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '-8px', marginBottom: '16px' }}>
            {form.getFieldValue('isActive') !== false ? 'Nhóm đang hoạt động' : 'Nhóm đã ngừng hoạt động'}
          </div>
        </Col>
      </Row>

      <Form.Item
        name="listUser"
        label="Thành viên nhóm"
        rules={[{ required: !editingTeam, message: 'Vui lòng chọn ít nhất một thành viên!' }]}
      >
        <Select
          mode="multiple"
          placeholder={loadingUsers ? "Đang tải danh sách user..." : "Chọn thành viên tham gia nhóm"}
          optionFilterProp="children"
          showSearch
          style={{ width: '100%' }}
          disabled={loadingUsers}
          loading={loadingUsers}
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {users.map(user => (
            <Option key={user.id} value={user.id}>
              <Space>
                <Avatar size="small" src={user.avatar} icon={<UserOutlined />} />
                <span>{user.name}</span>
                <Tag color="blue" style={{ fontSize: '10px' }}>{user.email}</Tag>
              </Space>
            </Option>
          ))}
        </Select>
      </Form.Item>

      {!editingTeam && projectUsers.length > 0 && (
        <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f6ffed', borderRadius: 4 }}>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <strong>Gợi ý:</strong> Nhóm sẽ tự động bao gồm các thành viên từ dự án đã chọn.
          </div>
        </div>
      )}

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel} disabled={loading}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {editingTeam ? 'Cập nhật' : 'Tạo nhóm'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default TeamForm;