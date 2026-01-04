// pages/TestAuth.jsx
import React from 'react';
import { Card, Button, Space, Typography, Alert } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const TestAuth = () => {
  const { user, isAuthenticated, login, logout, register } = useAuth();
  const navigate = useNavigate();

  const handleTestLogin = async (type) => {
    const accounts = {
      user: { email: 'test@example.com', password: '1234', role: 'USER' },
      manager: { email: 'manager@test.com', password: '1234', role: 'MANAGER' },
      admin: { email: 'admin@test.com', password: '1234', role: 'ADMIN' }
    };
    
    const account = accounts[type];
    const result = await login(account.email, account.password, account.role);
    
    if (result.success) {
      console.log('✅ Login successful:', result.user);
      // Tự động chuyển đến dashboard
      setTimeout(() => {
        if (account.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 500);
    }
  };

  const handleTestRegister = async () => {
    const userData = {
      fullName: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: '1234'
    };
    
    const result = await register(userData);
    if (result.success) {
      console.log('✅ Register successful');
      navigate('/dashboard');
    }
  };

  const checkStorage = () => {
    console.log('📦 LocalStorage:');
    console.log('Token:', localStorage.getItem('token'));
    console.log('User:', localStorage.getItem('user'));
    console.log('API Version:', localStorage.getItem('apiVersion'));
    
    alert(`Token: ${localStorage.getItem('token') ? '✓' : '✗'}\nUser: ${localStorage.getItem('user') ? '✓' : '✗'}\nAPI: ${localStorage.getItem('apiVersion') || 'none'}`);
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Alert
        message="🔧 Auth Testing Page"
        description="This page is for testing authentication while backend is not connected"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Card title="Current Auth State">
        <Title level={4}>Authentication Status</Title>
        <Text type={isAuthenticated ? "success" : "danger"}>
          {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
        </Text>
        
        <Title level={4} style={{ marginTop: 16 }}>User Data</Title>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: 16, 
          borderRadius: 4,
          maxHeight: 300,
          overflow: 'auto'
        }}>
          {JSON.stringify(user || 'No user data', null, 2)}
        </pre>
      </Card>

      <Card title="Test Actions" style={{ marginTop: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            block 
            size="large"
            onClick={() => handleTestLogin('user')}
          >
            Mock Login as USER (v1)
          </Button>
          
          <Button 
            type="primary" 
            block 
            size="large"
            onClick={() => handleTestLogin('manager')}
          >
            Mock Login as MANAGER (v3)
          </Button>
          
          <Button 
            type="primary" 
            block 
            size="large"
            onClick={() => handleTestLogin('admin')}
          >
            Mock Login as ADMIN (v2)
          </Button>
          
          <Button 
            block 
            size="large"
            onClick={handleTestRegister}
          >
            Mock Register New User
          </Button>
          
          <Button 
            block 
            size="large"
            onClick={checkStorage}
          >
            Check LocalStorage
          </Button>
          
          <Button 
            danger 
            block 
            size="large"
            onClick={logout}
          >
            Logout
          </Button>
        </Space>
      </Card>

      <Card title="Quick Navigation" style={{ marginTop: 24 }}>
        <Space wrap>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          <Button onClick={() => navigate('/login')}>Go to Login Page</Button>
          <Button onClick={() => navigate('/register')}>Go to Register Page</Button>
          <Button onClick={() => navigate('/admin/dashboard')}>Go to Admin Dashboard</Button>
          <Button onClick={() => navigate('/profile')}>Go to Profile</Button>
        </Space>
      </Card>
    </div>
  );
};

export default TestAuth;