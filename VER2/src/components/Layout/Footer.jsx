import React from 'react';
import { Layout, Typography, Space } from 'antd';
import { GithubOutlined, LinkedinOutlined, MailOutlined } from '@ant-design/icons';

const { Footer: AntFooter } = Layout;
const { Text, Link } = Typography;

const Footer = () => {
  return (
    <AntFooter
      style={{
        textAlign: 'center',
        background: '#fff',
        padding: '12px 24px',
        borderTop: '1px solid #f0f0f0',
        position: 'relative', // ✅ không sticky, cố định ở cuối layout
      }}
    >
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Text type="secondary" style={{ fontSize: 14 }}>
          © {new Date().getFullYear()} <strong>MyWork Manager</strong> — Hệ thống quản lý công việc & nhóm.
        </Text>

        <Space size="middle">
          <Link href="mailto:support@mywork.vn" target="_blank">
            <MailOutlined /> Liên hệ
          </Link>
          <Link href="https://github.com/" target="_blank">
            <GithubOutlined /> GitHub
          </Link>
          <Link href="https://linkedin.com/" target="_blank">
            <LinkedinOutlined /> LinkedIn
          </Link>
        </Space>

        {/* <Text type="secondary" style={{ fontSize: 12 }}>
          Thiết kế & phát triển bởi <strong>Nguyễn Thu Huyền</strong> — Lớp D21CQCN01-B, PTIT.
        </Text> */}
      </Space>
    </AntFooter>
  );
};

export default Footer;
