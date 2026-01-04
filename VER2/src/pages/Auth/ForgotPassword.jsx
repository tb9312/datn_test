import React, { useState } from 'react';
import { Form, Input, Button, Card, message, App, Steps, Divider } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPasswordContent = () => {
  const navigate = useNavigate();
  const { message: msg } = App.useApp();
  const { forgotPassword, verifyOTP, resetPassword } = useAuth();
  const [step, setStep] = useState(0); // 0: Email, 1: OTP, 2: New Password
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // STEP 0: Nhập email
  const handleForgotPassword = async (values) => {
    setLoading(true);
    const result = await forgotPassword(values.email);
    
    if (result.success) {
      setEmail(values.email);
      msg.success(result.message);
      setStep(1);
    } else {
      msg.error(result.message || 'Lỗi gửi OTP!');
    }
    setLoading(false);
  };

  // STEP 1: Xác thực OTP
  const handleVerifyOTP = async (values) => {
    setLoading(true);
    const result = await verifyOTP(email, values.otp);
    
    if (result.success) {
      msg.success(result.message);
      setStep(2);
    } else {
      msg.error(result.message || 'OTP không hợp lệ!');
    }
    setLoading(false);
  };

  // STEP 2: Đặt mật khẩu mới
  const handleResetPassword = async (values) => {
    if (values.password !== values.confirmPassword) {
      msg.error('Mật khẩu không trùng khớp!');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email, values.password, values.confirmPassword);
    
    if (result.success) {
      msg.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
      form.resetFields();
      setStep(0);
      navigate('/login');
    } else {
      msg.error(result.message || 'Lỗi đặt lại mật khẩu!');
    }
    setLoading(false);
  };

  const handleGoBack = () => {
    if (step === 0) {
      navigate('/login');
    } else {
      setStep(step - 1);
      form.resetFields();
    }
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
        style={{
          width: '100%',
          maxWidth: 450,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        {/* Progress Steps */}
        <Steps
          current={step}
          items={[
            { title: 'Email' },
            { title: 'OTP' },
            { title: 'Mật khẩu mới' }
          ]}
          style={{ marginBottom: 32 }}
        />

        {/* STEP 0: Nhập Email */}
        {step === 0 && (
          <>
            <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Quên Mật Khẩu</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: 16 }}>
              Nhập email của bạn để nhận mã OTP
            </p>
            <Form
              form={form}
              onFinish={handleForgotPassword}
              layout="vertical"
              size="large"
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Nhập email của bạn" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ width: '100%' }}
                  loading={loading}
                >
                  Gửi Mã OTP
                </Button>
              </Form.Item>
            </Form>
          </>
        )}

        {/* STEP 1: Xác thực OTP */}
        {step === 1 && (
          <>
            <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Xác Thực OTP</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: 16 }}>
              Mã OTP đã được gửi đến <strong>{email}</strong>
            </p>
            <Form
              form={form}
              onFinish={handleVerifyOTP}
              layout="vertical"
              size="large"
            >
              <Form.Item
                label="Mã OTP"
                name="otp"
                rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
              >
                <Input
                  placeholder="Nhập 8 chữ số OTP"
                  maxLength={8}
                  style={{ letterSpacing: '4px', fontSize: 16 }}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ width: '100%' }}
                  loading={loading}
                >
                  Xác Thực
                </Button>
              </Form.Item>
            </Form>
          </>
        )}

        {/* STEP 2: Đặt Mật Khẩu Mới */}
        {step === 2 && (
          <>
            <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Đặt Lại Mật Khẩu</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: 16 }}>
              Nhập mật khẩu mới của bạn
            </p>
            <Form
              form={form}
              onFinish={handleResetPassword}
              layout="vertical"
              size="large"
            >
              <Form.Item
                label="Mật Khẩu Mới"
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu mới"
                />
              </Form.Item>

              <Form.Item
                label="Xác Nhận Mật Khẩu"
                name="confirmPassword"
                rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Xác nhận mật khẩu mới"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ width: '100%' }}
                  loading={loading}
                >
                  Đặt Lại Mật Khẩu
                </Button>
              </Form.Item>
            </Form>
          </>
        )}

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <Button
            type="link"
            onClick={handleGoBack}
          >
            {step === 0 ? 'Quay lại đăng nhập' : 'Quay lại'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const ForgotPassword = () => {
  return (
    <App>
      <ForgotPasswordContent />
    </App>
  );
};

export default ForgotPassword;