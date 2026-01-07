import React, { useContext } from "react";
import { Layout, Row, Col, Typography, Space, Divider } from "antd";
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  GithubOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";
import { SettingContext } from "../../contexts/SettingContext";

const { Footer: AntFooter } = Layout;
const { Text, Title, Link } = Typography;

const Footer = () => {
  const setting = useContext(SettingContext);
  if (!setting) return null;

  return (
    <AntFooter className="app-footer-light">
      <Row gutter={[24, 24]}>
        {/* BRAND */}
        <Col xs={24} md={8}>
          <Title level={5} className="footer-brand">
            {setting.websiteName}
          </Title>
          <Text className="footer-desc">
            Nền tảng học tập & quản lý công việc giúp nâng cao hiệu suất và phát
            triển kỹ năng.
          </Text>
        </Col>

        {/* CONTACT */}
        <Col xs={24} md={8}>
          <Title level={5} className="footer-title">
            Thông tin liên hệ
          </Title>

          <Space direction="vertical">
            {setting.phone && (
              <Text className="footer-text">
                <PhoneOutlined className="footer-icon" /> {setting.phone}
              </Text>
            )}

            {setting.email && (
              <Text className="footer-text">
                <MailOutlined className="footer-icon" /> {setting.email}
              </Text>
            )}

            {setting.address && (
              <Text className="footer-text">
                <EnvironmentOutlined className="footer-icon" />{" "}
                {setting.address}
              </Text>
            )}
          </Space>
        </Col>

        {/* SOCIAL */}
        <Col xs={24} md={8}>
          <Title level={5} className="footer-title">
            Kết nối
          </Title>

          <Space size="large">
            <Link
              href="https://github.com/"
              target="_blank"
              className="footer-link"
            >
              <GithubOutlined />
            </Link>

            <Link
              href="https://linkedin.com/"
              target="_blank"
              className="footer-link"
            >
              <LinkedinOutlined />
            </Link>
          </Space>
        </Col>
      </Row>

      <Divider />

      <Text className="footer-copy">
        © {new Date().getFullYear()} {setting.websiteName}. {setting.copyright}
      </Text>
    </AntFooter>
  );
};

export default Footer;