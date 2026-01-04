import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Avatar, 
  Form, 
  Input, 
  Button, 
  Upload, 
  Space, 
  message,
  Divider,
  Spin
} from 'antd';
import { UploadOutlined, LoadingOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const navigate = useNavigate();

  // Load user data khi component mount - CHỈ MỘT LẦN
  useEffect(() => {
    const loadUserData = () => {
      setInitializing(true);
      
      try {
        // Lấy user từ context hoặc localStorage
        const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
        
        console.log('👤 Current user data:', currentUser);
        console.log('📸 Avatar URL:', currentUser.avatar);
        
        if (currentUser && currentUser.email) {
          // Đặt avatar nếu có
          if (currentUser.avatar) {
            setAvatarUrl(currentUser.avatar);
          }
          
          // Đặt giá trị form - CHỈ những field có dữ liệu thực
          form.setFieldsValue({
            fullName: currentUser.fullName || '',
            email: currentUser.email || '',
            phone: currentUser.phone || '', // Để trống nếu không có
            position_job: currentUser.position_job || '', // Để trống nếu không có
            role: currentUser.role || 'USER'
          });
          
          console.log('✅ Form values set:', {
            fullName: currentUser.fullName,
            email: currentUser.email,
            phone: currentUser.phone,
            position_job: currentUser.position_job
          });
        } else {
          message.error('Không tìm thấy thông tin người dùng');
          navigate('/login');
        }
      } catch (error) {
        console.error('❌ Error loading user data:', error);
        message.error('Lỗi tải thông tin người dùng');
      } finally {
        setInitializing(false);
      }
    };

    // Thêm delay nhỏ để đảm bảo user đã được set trong context
    setTimeout(() => {
      loadUserData();
    }, 100);
  }, [user, form, navigate]);

  // Xử lý chọn avatar
  const handleAvatarUpload = async (file) => {
    setAvatarLoading(true);
    try {
      // Preview ảnh
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarUrl(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Lưu file để upload sau
      setAvatarFile(file);
      
      message.success('Đã chọn ảnh đại diện');
    } catch (error) {
      message.error('Lỗi khi chọn ảnh');
    } finally {
      setAvatarLoading(false);
    }
    return false; // Ngăn auto upload
  };

  // Xử lý submit form
  const onFinish = async (values) => {
    setLoading(true);
    try {
      console.log('📤 Form values:', values);
      
      const updateData = {
        fullName: values.fullName,
        email: values.email,
      };

      // Chỉ thêm phone nếu có giá trị
      if (values.phone && values.phone.trim() !== '') {
        updateData.phone = values.phone.trim();
      }

      // Chỉ thêm position_job nếu có giá trị
      if (values.position_job && values.position_job.trim() !== '') {
        updateData.position_job = values.position_job.trim();
      }

      // Nếu có mật khẩu mới VÀ không rỗng
      if (values.password && values.password.trim() !== '') {
        updateData.password = values.password;
      }

      // Nếu có avatar mới
      if (avatarFile) {
        updateData.avatarFile = avatarFile;
      }

      console.log('📤 Update data to send:', updateData);

      // Gọi API update
      const result = await updateUser(updateData);
      
      if (result.success) {
        message.success(result.message || 'Cập nhật thành công');
        setAvatarFile(null);
        
        // Reset form với giá trị mới
        const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
        form.setFieldsValue({
          fullName: updatedUser.fullName || '',
          email: updatedUser.email || '',
          phone: updatedUser.phone || '',
          position_job: updatedUser.position_job || '',
          role: updatedUser.role || 'USER'
        });
        
        // Cập nhật avatar nếu có
        if (updatedUser.avatar) {
          setAvatarUrl(updatedUser.avatar);
        }
      } else {
        message.error(result.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      console.error('Update error:', err);
      message.error('Có lỗi xảy ra khi cập nhật: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    message.success('Đã đăng xuất');
    navigate('/login');
  };

  // Avatar upload component
  const uploadButton = (
    <div>
      {avatarLoading ? <LoadingOutlined /> : <UploadOutlined />}
      <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
    </div>
  );

  if (initializing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" tip="Đang tải thông tin..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '24px auto' }}>
      <Card 
        title="Thông tin cá nhân"
        extra={
          <Button type="link" onClick={() => navigate('/dashboard')}>
            ← Quay lại Dashboard
          </Button>
        }
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          // KHÔNG dùng initialValues ở đây nữa
        >
          {/* Avatar Section */}
          <Form.Item label="Ảnh đại diện">
            <Space align="center">
              <Upload
                name="avatar"
                listType="picture-circle"
                showUploadList={false}
                beforeUpload={handleAvatarUpload}
                accept="image/*"
                disabled={avatarLoading}
              >
                {avatarUrl ? (
                  <Avatar 
                    size={80} 
                    src={avatarUrl} 
                    style={{ 
                      backgroundColor: '#87d068',
                      border: '2px solid #f0f0f0'
                    }}
                    onError={(e) => {
                      console.error('Avatar load error, falling back to default');
                      e.target.style.display = 'none';
                      setAvatarUrl(''); // Reset nếu lỗi
                    }}
                  />
                ) : (
                  <Avatar 
                    size={80} 
                    icon={<UserOutlined />}
                    style={{ 
                      backgroundColor: '#f0f0f0',
                      border: '2px dashed #d9d9d9'
                    }}
                  />
                )}
              </Upload>
              <div style={{ marginLeft: 16 }}>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  {avatarUrl ? 'Nhấp để thay đổi ảnh' : 'Thêm ảnh đại diện'}
                </div>
                <div style={{ color: '#999', fontSize: '12px', marginTop: 4 }}>
                  Hỗ trợ: JPG, PNG, GIF (max 5MB)
                </div>
              </div>
            </Space>
          </Form.Item>

          <Divider />

          {/* Basic Info */}
          <Form.Item 
            name="fullName" 
            label="Họ và tên" 
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nhập họ và tên" />
          </Form.Item>

          <Form.Item 
            name="email" 
            label="Email" 
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input placeholder="Nhập email" disabled />
          </Form.Item>

          <Form.Item 
            name="phone" 
            label="Số điện thoại"
            // KHÔNG có rules required
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item 
            name="position_job" 
            label="Vị trí công việc"
            // KHÔNG có rules required
          >
            <Input placeholder="Nhập vị trí công việc" />
          </Form.Item>

          <Form.Item name="role" label="Vai trò">
            <Input disabled />
          </Form.Item>

          <Divider>Đổi mật khẩu (không bắt buộc)</Divider>

          {/* Password Section - KHÔNG tự động điền */}
          <Form.Item 
            name="password" 
            label="Mật khẩu mới"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  // Chỉ validate nếu có nhập password
                  if (!value || value.length === 0) {
                    return Promise.resolve(); // Không nhập gì cũng OK
                  }
                  if (value.length >= 6) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu phải có ít nhất 6 ký tự!'));
                },
              }),
            ]}
          >
            <Input.Password 
              placeholder="Nhập mật khẩu mới (nếu muốn đổi)" 
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item 
            name="confirmPassword" 
            label="Xác nhận mật khẩu mới"
            dependencies={['password']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  // Chỉ validate nếu có nhập password
                  const password = getFieldValue('password');
                  if (!password || password.length === 0) {
                    return Promise.resolve(); // Không có password thì không cần confirm
                  }
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password 
              placeholder="Nhập lại mật khẩu mới" 
              autoComplete="new-password"
            />
          </Form.Item>

          {/* Action Buttons */}
          <Form.Item style={{ textAlign: 'right', marginTop: 32 }}>
            <Space>
              <Button onClick={handleLogout} danger>
                Đăng xuất
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                style={{ minWidth: 120 }}
              >
                Cập nhật thông tin
              </Button>
            </Space>
          </Form.Item>
        </Form>

        
      </Card>
    </div>
  );
};

export default Profile;