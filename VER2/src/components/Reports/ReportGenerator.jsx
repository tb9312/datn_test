import React, { useState } from 'react';
import { Modal, Form, Select, DatePicker, Button, Space, Row, Col, Card } from 'antd';
import { DownloadOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;

const ReportGenerator = ({ visible, onCancel, onGenerate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: 'performance', label: 'Báo cáo hiệu suất' },
    { value: 'tasks', label: 'Báo cáo công việc' },
    { value: 'projects', label: 'Báo cáo dự án' },
    { value: 'teams', label: 'Báo cáo nhóm' },
    { value: 'users', label: 'Báo cáo người dùng' },
    { value: 'financial', label: 'Báo cáo tài chính' }
  ];

  const formats = [
    { value: 'pdf', label: 'PDF', icon: <FilePdfOutlined /> },
    { value: 'excel', label: 'Excel', icon: <FileExcelOutlined /> },
    { value: 'csv', label: 'CSV', icon: <DownloadOutlined /> }
  ];

  const handleGenerate = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onGenerate) {
        onGenerate(values);
      }
      
      Modal.success({
        title: 'Thành công',
        content: `Báo cáo ${values.reportType} đã được tạo thành công!`,
      });
      
      onCancel();
    } catch (error) {
      Modal.error({
        title: 'Lỗi',
        content: 'Không thể tạo báo cáo. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Tạo Báo Cáo"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleGenerate}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="reportType"
              label="Loại báo cáo"
              rules={[{ required: true, message: 'Vui lòng chọn loại báo cáo!' }]}
            >
              <Select placeholder="Chọn loại báo cáo">
                {reportTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="dateRange"
              label="Khoảng thời gian"
              rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian!' }]}
            >
              <RangePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder={['Từ ngày', 'Đến ngày']}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="format"
              label="Định dạng"
              initialValue="pdf"
            >
              <Select placeholder="Chọn định dạng">
                {formats.map(format => (
                  <Option key={format.value} value={format.value}>
                    <Space>
                      {format.icon}
                      {format.label}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="detailLevel"
              label="Mức độ chi tiết"
              initialValue="summary"
            >
              <Select placeholder="Chọn mức độ chi tiết">
                <Option value="summary">Tổng quan</Option>
                <Option value="detailed">Chi tiết</Option>
                <Option value="comprehensive">Toàn diện</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Card title="Tùy chọn bổ sung" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="includeCharts"
                valuePropName="checked"
                initialValue={true}
              >
                <Select>
                  <Option value={true}>Bao gồm biểu đồ</Option>
                  <Option value={false}>Không bao gồm biểu đồ</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="includeRawData"
                valuePropName="checked"
                initialValue={false}
              >
                <Select>
                  <Option value={true}>Bao gồm dữ liệu thô</Option>
                  <Option value={false}>Không bao gồm dữ liệu thô</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>
              Hủy
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<DownloadOutlined />}
            >
              Tạo Báo Cáo
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReportGenerator;