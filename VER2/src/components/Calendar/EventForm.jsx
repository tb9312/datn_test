import React, { useEffect, useState } from 'react';
import { Form, Input, Select, DatePicker, Button, Space, Avatar, Row, Col, Switch } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const EventForm = ({ 
  visible, 
  onCancel, 
  onFinish, 
  initialValues, 
  loading, 
  users = [],
  isViewMode = false // Thêm prop mới
}) => {
  const [form] = Form.useForm();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      
      if (initialValues) {
        console.log('📅 Initial values for form:', initialValues);
        
        let start = null;
        let end = null;
        
        if (initialValues.start && initialValues.end) {
          try {
            start = dayjs(initialValues.start);
            end = dayjs(initialValues.end);
            
            if (!start.isValid() || !end.isValid()) {
              console.warn('⚠️ Invalid dates, using defaults');
              start = dayjs();
              end = dayjs().add(1, 'hour');
            }
          } catch (error) {
            console.error('❌ Error parsing dates:', error);
            start = dayjs();
            end = dayjs().add(1, 'hour');
          }
        } else {
          start = dayjs();
          end = dayjs().add(1, 'hour');
        }

        console.log('📅 Parsed dates:', { start, end });

        setStartDate(start);
        setEndDate(end);

        const participantIds = initialValues.participants?.map(p => p.id) || 
                             initialValues.participantIds || [];

        form.setFieldsValue({
          title: initialValues.title || '',
          description: initialValues.description || '',
          type: initialValues.type || 'meeting',
          startDate: start,
          endDate: end,
          participants: participantIds,
          location: initialValues.location || '',
          isAllDay: initialValues.isAllDay || false,
          isRecurring: initialValues.isRecurring || false
        });
      } else {
        const now = dayjs();
        const later = dayjs().add(1, 'hour');
        
        console.log('📅 Default dates:', { now, later });
        
        setStartDate(now);
        setEndDate(later);
        
        form.setFieldsValue({
          type: 'meeting',
          startDate: now,
          endDate: later,
          isAllDay: false,
          isRecurring: false
        });
      }
    }
  }, [visible, initialValues, form]);

  const handleFinish = (values) => {
    if (isViewMode) {
      onCancel(); // Nếu đang ở chế độ xem, chỉ đóng form
      return;
    }
    
    console.log('✅ Form values:', values);
    
    const eventData = {
      title: values.title,
      description: values.description || '',
      type: values.type,
      participants: values.participants || [],
      start: values.startDate.toISOString(),
      end: values.endDate.toISOString(),
      location: values.location || '',
      isAllDay: values.isAllDay || false,
      isRecurring: values.isRecurring || false
    };
    
    console.log('📤 Submitting event data:', eventData);
    onFinish(eventData);
  };

  const eventTypes = [
    { value: 'meeting', label: 'Cuộc họp', color: '#1890ff' },
    { value: 'deadline', label: 'Hạn chót', color: '#ff4d4f' },
    { value: 'task', label: 'Công việc', color: '#52c41a' },
    { value: 'event', label: 'Sự kiện', color: '#722ed1' },
    { value: 'reminder', label: 'Nhắc nhở', color: '#faad14' }
  ];

  // Hàm xử lý khi thay đổi ngày bắt đầu
  const handleStartDateChange = (date) => {
    if (isViewMode) return; // Không cho phép thay đổi khi ở chế độ xem
    
    setStartDate(date);
    
    if (date && endDate && date.isAfter(endDate)) {
      const newEndDate = date.add(1, 'hour');
      setEndDate(newEndDate);
      form.setFieldsValue({
        endDate: newEndDate
      });
    }
  };

  // Hàm xử lý khi thay đổi ngày kết thúc
  const handleEndDateChange = (date) => {
    if (isViewMode) return; // Không cho phép thay đổi khi ở chế độ xem
    setEndDate(date);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      disabled={loading || isViewMode} // Disable form khi ở chế độ xem
    >
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="title"
            label="Tiêu đề sự kiện"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề sự kiện!' }]}
          >
            <Input 
              placeholder="Nhập tiêu đề sự kiện" 
              readOnly={isViewMode} // Chỉ đọc khi ở chế độ xem
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="description"
            label="Mô tả"
            rules ={[{ required: true }]}
          >
            <TextArea 
              rows={3} 
              placeholder="Mô tả chi tiết về sự kiện..." 
              readOnly={isViewMode} // Chỉ đọc khi ở chế độ xem
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="type"
            label="Loại sự kiện"
            rules={[{ required: true, message: 'Vui lòng chọn loại sự kiện!' }]}
          >
            <Select 
              placeholder="Chọn loại sự kiện"
              disabled={isViewMode} // Disable khi ở chế độ xem
            >
              {eventTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  <Space>
                    <div 
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: type.color
                      }}
                    />
                    {type.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="startDate"
            label="Thời gian bắt đầu"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu!' }]}
          >
            <DatePicker
              showTime={{ 
                format: 'HH:mm',
                minuteStep: 15,
                hideDisabledOptions: true
              }}
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
              placeholder="Chọn ngày và giờ bắt đầu"
              onChange={handleStartDateChange}
              allowClear={false}
              defaultOpenValue={dayjs()}
              disabled={isViewMode} // Disable khi ở chế độ xem
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="endDate"
            label="Thời gian kết thúc"
            rules={[{ 
              required: true, 
              message: 'Vui lòng chọn thời gian kết thúc!',
            }, 
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || !getFieldValue('startDate')) {
                  return Promise.resolve();
                }
                if (value.isBefore(getFieldValue('startDate'))) {
                  return Promise.reject(new Error('Thời gian kết thúc phải sau thời gian bắt đầu!'));
                }
                return Promise.resolve();
              },
            })]}
          >
            <DatePicker
              showTime={{ 
                format: 'HH:mm',
                minuteStep: 15,
                hideDisabledOptions: true
              }}
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
              placeholder="Chọn ngày và giờ kết thúc"
              onChange={handleEndDateChange}
              allowClear={false}
              defaultOpenValue={dayjs().add(1, 'hour')}
              disabled={isViewMode} // Disable khi ở chế độ xem
              disabledDate={(current) => {
                if (isViewMode) return false; // Không disable khi ở chế độ xem
                return startDate && current && current.isBefore(startDate.startOf('day'));
              }}
              disabledTime={(current) => {
                if (isViewMode) return {}; // Không disable khi ở chế độ xem
                if (!startDate || !current) return {};
                
                if (current.isSame(startDate, 'day')) {
                  return {
                    disabledHours: () => {
                      const hours = [];
                      for (let i = 0; i < startDate.hour(); i++) {
                        hours.push(i);
                      }
                      return hours;
                    },
                    disabledMinutes: (selectedHour) => {
                      if (selectedHour === startDate.hour()) {
                        const minutes = [];
                        for (let i = 0; i < startDate.minute(); i++) {
                          minutes.push(i);
                        }
                        return minutes;
                      }
                      return [];
                    }
                  };
                }
                return {};
              }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="participants"
        label="Thành viên tham gia"
        rules ={[{ required: true }]}
      >
        <Select
          mode="multiple"
          placeholder="Chọn thành viên tham gia"
          optionFilterProp="children"
          showSearch
          allowClear
          disabled={isViewMode} // Disable khi ở chế độ xem
        >
          {users.map(user => (
            <Option key={user.id} value={user.id}>
              <Space>
                <Avatar size="small" src={user.avatar} icon={<UserOutlined />} />
                <span>{user.name}</span>
              </Space>
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="isAllDay"
            label="Cả ngày"
            valuePropName="checked"
          >
            <Switch disabled={isViewMode} /> {/* Disable khi ở chế độ xem */}
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="isRecurring"
            label="Lặp lại"
            valuePropName="checked"
          >
            <Switch disabled={isViewMode} /> {/* Disable khi ở chế độ xem */}
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="location"
        label="Địa điểm"
        rules ={[{ required: true }]}
      >
        <Input 
          placeholder="Nhập địa điểm..." 
          readOnly={isViewMode} // Chỉ đọc khi ở chế độ xem
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          {isViewMode ? (
            // Chỉ hiển thị nút Đóng khi ở chế độ xem
            <Button type="default" onClick={onCancel}>
              Đóng
            </Button>
          ) : (
            // Hiển thị nút Hủy và Cập nhật/Tạo khi ở chế độ chỉnh sửa/tạo mới
            <>
              <Button onClick={onCancel}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {initialValues ? 'Cập nhật' : 'Tạo sự kiện'}
              </Button>
            </>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
};

export default EventForm;