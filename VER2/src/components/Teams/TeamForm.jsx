import React, { useEffect } from 'react';
import { Form, Input, Select, Switch, Button, Space, Avatar, Row, Col, Tag } from 'antd';
import { UserOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const TeamForm = ({ visible, onCancel, onFinish, initialValues, loading, users = [] }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue({
          ...initialValues,
          members: initialValues.members?.map(m => m.id) || []
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, initialValues, form]);

  const handleFinish = (values) => {
    onFinish({
      ...values,
      members: values.members ? users.filter(user => values.members.includes(user.id)) : []
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      disabled={loading}
    >
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="name"
            label="Tên nhóm"
            rules={[{ required: true, message: 'Vui lòng nhập tên nhóm!' }]}
          >
            <Input 
              placeholder="Nhập tên nhóm" 
              prefix={<UserOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="description"
            label="Mô tả nhóm"
          >
            <TextArea 
              rows={3} 
              placeholder="Mô tả về mục đích và hoạt động của nhóm..." 
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="isPrivate"
            label="Quyền riêng tư"
            valuePropName="checked"
          >
            <Switch
              checkedChildren={<LockOutlined />}
              unCheckedChildren={<GlobalOutlined />}
            />
          </Form.Item>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '-8px', marginBottom: '16px' }}>
            {form.getFieldValue('isPrivate') ? 'Chỉ thành viên mới có thể xem' : 'Mọi người đều có thể xem'}
          </div>
        </Col>
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
        name="members"
        label="Thành viên nhóm"
        rules={[{ required: true, message: 'Vui lòng chọn ít nhất một thành viên!' }]}
      >
        <Select
          mode="multiple"
          placeholder="Chọn thành viên tham gia nhóm"
          optionFilterProp="children"
          showSearch
          style={{ width: '100%' }}
        >
          {users.map(user => (
            <Option key={user.id} value={user.id}>
              <Space>
                <Avatar size="small" src={user.avatar} icon={<UserOutlined />} />
                <span>{user.name}</span>
                {user.isOnline && <Tag color="green" style={{ fontSize: '10px' }}>Online</Tag>}
              </Space>
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="tags"
        label="Thẻ nhóm"
      >
        <Select
          mode="tags"
          placeholder="Thêm thẻ cho nhóm (ví dụ: frontend, backend, design...)"
          style={{ width: '100%' }}
          tokenSeparators={[',']}
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues ? 'Cập nhật' : 'Tạo nhóm'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default TeamForm;