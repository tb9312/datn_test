import React, { useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Space, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const TaskForm = ({ 
  visible, 
  onCancel, 
  onFinish, 
  initialValues, 
  loading, 
  users = [],
  showAssignee = true 
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        // Map dữ liệu từ backend sang form fields
        const formValues = {
          title: initialValues.title,
          content: initialValues.content,
          status: initialValues.status,
          timeStart: initialValues.timeStart ? dayjs(initialValues.timeStart) : null,
          timeFinish: initialValues.timeFinish ? dayjs(initialValues.timeFinish) : null,
          priority: initialValues.priority || 'medium',
          tags: initialValues.tags || []
        };

        if (showAssignee && initialValues.assigneeId) {
          formValues.assigneeId = initialValues.assigneeId;
        } else if (showAssignee && initialValues.assignee) {
          formValues.assigneeId = initialValues.assignee.id;
        }

        form.setFieldsValue(formValues);
      } else {
        form.resetFields();
        // Set default values for new task
        form.setFieldsValue({
          status: 'todo',
          priority: 'medium'
        });
      }
    }
  }, [visible, initialValues, form, showAssignee]);

  const handleFinish = (values) => {
    // Format data for backend API
    const submitData = {
      title: values.title,
      content: values.content,
      status: values.status,
      timeStart: values.timeStart ? values.timeStart.format('YYYY-MM-DD') : null,
      timeFinish: values.timeFinish ? values.timeFinish.format('YYYY-MM-DD') : null,
    };

    // Add optional fields
    if (values.priority) {
      submitData.priority = values.priority;
    }
    if (values.tags) {
      submitData.tags = values.tags;
    }
    if (showAssignee && values.assigneeId) {
      submitData.assigneeId = values.assigneeId;
    }
    onFinish(submitData);
  };
  const filterUserOption = (input, option) => {
    const userText = option.children[1].props.children.toLowerCase();
    return userText.includes(input.toLowerCase());
  };
  // Validation cho timeFinish không được trước timeStart
  const validateDates = (_, value) => {
    const timeStart = form.getFieldValue('timeStart');
    
    if (timeStart && value) {
      if (value.isBefore(timeStart, 'day')) {
        return Promise.reject(new Error('Hạn hoàn thành không được trước ngày bắt đầu!'));
      }
    }
    return Promise.resolve();
  };
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      disabled={loading}
    >
      <Form.Item
        name="title"
        label="Tiêu đề công việc"
        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề công việc!' },
        { max: 255, message: 'Tiêu đề không được vượt quá 255 ký tự!' }
        ]}
      >
        <Input placeholder="Nhập tiêu đề công việc" />
      </Form.Item>

      <Form.Item
        name="content"
        label="Mô tả"
        rules={[
          { required: true, message: 'Vui lòng nhập mô tả công việc!' }
        ]}
      >
        <TextArea 
          rows={4} 
          placeholder="Nhập mô tả chi tiết cho công việc..." 
          showCount
          maxLength={1000}
        />
      </Form.Item>

      <Form.Item
        name="priority"
        label="Độ ưu tiên"
        rules={[{ required: true, message: 'Vui lòng chọn độ ưu tiên!' }]}
      >
        <Select placeholder="Chọn độ ưu tiên">
          <Option value="low">Thấp</Option>
          <Option value="medium">Trung bình</Option>
          <Option value="high">Cao</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="status"
        label="Trạng thái"
        rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
      >
        <Select placeholder="Chọn trạng thái">
          <Option value="backlog">Tồn đọng</Option>
          <Option value="todo">Chưa bắt đầu</Option>
          <Option value="in-progress">Đang thực hiện</Option>
          <Option value="done">Hoàn thành</Option>
        </Select>
      </Form.Item>

    {showAssignee && (
      <Form.Item
        name="assigneeId"
        label="Người phụ trách"
      >
        <Select 
          placeholder="Chọn người phụ trách"
          allowClear
          showSearch
          optionFilterProp="children"
          filterOption={filterUserOption}
          notFoundContent={users.length === 0 ? "Đang tải..." : "Không tìm thấy người dùng"}
        >
          {users.map(user => (
            <Option key={user.id} value={user.id}>
              <Space>
                <Avatar size="small" src={user.avatar} icon={<UserOutlined />} />
                <span>{user.name}</span>
                {user.email && (
                    <span style={{ color: '#999', fontSize: '12px' }}>
                      ({user.email})
                    </span>
                  )}
              </Space>
            </Option>
          ))}
        </Select>
      </Form.Item>
      )}
      <Form.Item
        name="timeStart"
        label="Thời gian bắt đầu"
        rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu!' }]}
      >
        <DatePicker 
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          placeholder="Chọn ngày bắt đầu"
        />
      </Form.Item>

      <Form.Item
        name="timeFinish"
        label="Thời gian kết thúc"
        rules={[{required: true, validator: validateDates }]}
      >
        <DatePicker 
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          placeholder="Chọn ngày kết thúc"
        />
      </Form.Item>

      {/* <Form.Item
        name="tags"
        label="Thẻ"
      >
        <Select
          mode="tags"
          placeholder="Thêm thẻ"
          style={{ width: '100%' }}
          tokenSeparators={[',','']}
        />
      </Form.Item> */}

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default TaskForm;