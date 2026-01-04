import React from 'react';
import { Form, Input, Button, Card, message, App, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RegisterContent = () => {
  const navigate = useNavigate();
  const { message: msg } = App.useApp();
  const { register } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      msg.error('Mật khẩu không trùng khớp!');
      return;
    }

    setLoading(true);
    const result = await register(values.fullName, values.email, values.password);
    
    if (result.success) {
      msg.success('Tạo tài khoản thành công! Vui lòng đăng nhập.');
      form.resetFields();
      navigate('/login');
    } else {
      msg.error(result.message || 'Đăng ký thất bại!');
    }
    setLoading(false);
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #e34a70ff 0%, #b8085df6 100%)',
      padding: '20px'
    }}>
      <Card
        title="Đăng Ký Tài Khoản"
        style={{
          width: '100%',
          maxWidth: 450,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <Form
          form={form}
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            label="Họ Tên"
            name="fullName"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Nhập họ tên của bạn" 
            />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Nhập email" 
            />
          </Form.Item>

          <Form.Item
            label="Mật Khẩu"
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Nhập mật khẩu"
            />
          </Form.Item>

          <Form.Item
            label="Xác Nhận Mật Khẩu"
            name="confirmPassword"
            rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Xác nhận mật khẩu"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              style={{ width: '100%' }}
              loading={loading}
            >
              Đăng Ký
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#666' }}>Đã có tài khoản? </span>
          <Button 
            type="link" 
            onClick={() => navigate('/login')}
            style={{ padding: 0 }}
          >
            Đăng nhập tại đây
          </Button>
        </div>
      </Card>
    </div>
  );
};

const Register = () => {
  return (
    <App>
      <RegisterContent />
    </App>
  );
};


export default Register;