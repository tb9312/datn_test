import React from 'react';
import { Form, Input, Button, Card, message, Tabs, App, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { TabPane } = Tabs;

const LoginContent = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { message: msg } = App.useApp();
  const [loading, setLoading] = React.useState(false);
  const [form] = Form.useForm();

  // pages/Auth/Login.jsx - Sửa phần onFinish
const onFinish = async (values) => {
  setLoading(true);
  
  
  console.log('🔐 Login attempt:', {
    email: values.email,
    role: values.role
  });
  
  const result = await login(values.email, values.password, values.role);
  
  console.log('📋 Login result:', result);
  
  if (result.success) {
    msg.success('Đăng nhập thành công!');
    
    // Lưu user vào state nếu có
    if (result.user) {
      console.log('✅ User logged in:', result.user);
    }
    
    navigate('/dashboard');
  } else {
    msg.error(result.message || 'Đăng nhập thất bại!');
  }
  setLoading(false);
};

  // const handleTabChange = (key) => {
  //   setActiveTab(key);
  //   form.resetFields();
  // };

  // const demoAccounts = {
  //   user: { 
  //     email: 'user@example.com', 
  //     password: 'password', 
  //     role: 'Người dùng thông thường' 
  //   },
  //   manager: { 
  //     email: 'manager@example.com', 
  //     password: 'manager123', 
  //     role: 'Quản lý hệ thống' 
  //   },
  //   admin: { 
  //     email: 'admin@example.com', 
  //     password: 'admin123', 
  //     role: 'Quản trị viên' 
  //   }
  // };

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
        title="Đăng Nhập Hệ Thống"
        style={{
          width: '100%',
          maxWidth: 450,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <LoginForm 
          loading={loading} 
          onFinish={onFinish}
          form={form}
        />

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
            <strong>Chưa có tài khoản?</strong>
          </div>
          <Button 
            type="link" 
            onClick={() => navigate('/register')}
            style={{ padding: 0 }}
          >
            Đăng ký tại đây
          </Button>
          <br />
          <Button 
            type="link" 
            onClick={() => navigate('/forgot-password')}
            style={{ padding: 0, marginTop: 8 }}
          >
            Quên mật khẩu?
          </Button>
        </div>

        {/* <div style={{ 
          textAlign: 'center', 
          marginTop: 16, 
          padding: 12, 
          background: '#f5f5f5', 
          borderRadius: 6,
          fontSize: 12 
        }}>
          <div style={{ color: '#666', marginBottom: 8 }}>
            <strong>Thông tin đăng nhập:</strong>
          </div>
          <div style={{ color: '#888', textAlign: 'left' }}>
            <strong>Tab Người dùng:</strong><br />
            • Email: {demoAccounts.user.email}<br />
            • Mật khẩu: {demoAccounts.user.password}<br />
            <br />
            <strong>Tab Quản lý:</strong><br />
            • Email: {demoAccounts.manager.email}<br />
            • Mật khẩu: {demoAccounts.manager.password}
          </div>
        </div> */}
      </Card>
    </div>
  );
};

const LoginForm = ({ loading, onFinish, form }) => {
  return (
    <Form
      form={form}
      onFinish={onFinish}
      autoComplete="off"
      size="large"
      layout="vertical"
    >
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
          placeholder="Nhập email của bạn"
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

      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          style={{ width: '100%' }}
          loading={loading}
        >
          Đăng Nhập
        </Button>
      </Form.Item>
    </Form>
  );
};

const Login = () => {
  return (
    <App>
      <LoginContent />
    </App>
  );
};

export default Login;