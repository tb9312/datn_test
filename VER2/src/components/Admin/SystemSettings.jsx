import React, { useState } from "react";
import { Card, Switch, Input, Select, Button, message, Divider } from "antd";
import { SettingOutlined, SaveOutlined } from "@ant-design/icons";

const { Option } = Select;

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    systemName: "MyWork Manager",
    theme: "dark",
    notifications: true,
    autoBackup: false,
    language: "en",
  });

  const handleSave = () => {
    message.success("Đã lưu thay đổi (dữ liệu giả lập)");
    console.log("Cài đặt hệ thống:", settings);
  };

  return (
    <div
      style={{
        padding: "24px 40px",
        backgroundColor: "#f9fafb",
        minHeight: "100vh",
      }}
    >
      

      {/* Thông tin chung */}
      <Card
        title={<span style={{ fontWeight: 600 }}>Thông tin chung</span>}
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontWeight: 500 }}>Tên hệ thống</label>
            <Input
              value={settings.systemName}
              onChange={(e) =>
                setSettings({ ...settings, systemName: e.target.value })
              }
              placeholder="Nhập tên hệ thống"
              style={{ marginTop: 6, width: 350 }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 500 }}>Ngôn ngữ</label>
            <div style={{ marginTop: 6 }}>
              <Select
                value={settings.language}
                onChange={(value) => setSettings({ ...settings, language: value })}
                style={{ width: 200 }}
              >
                <Option value="vi">Tiếng Việt</Option>
                <Option value="en">English</Option>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Giao diện & Chủ đề */}
      <Card
        title={<span style={{ fontWeight: 600 }}>Giao diện & Chủ đề</span>}
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          marginBottom: 20,
        }}
      >
        <div>
          <label style={{ fontWeight: 500 }}>Chủ đề hiển thị</label>
          <div style={{ marginTop: 6 }}>
            <Select
              value={settings.theme}
              onChange={(value) => setSettings({ ...settings, theme: value })}
              style={{ width: 200 }}
            >
              <Option value="light">Sáng</Option>
              <Option value="dark">Tối</Option>
              <Option value="auto">Tự động</Option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Cấu hình hệ thống */}
      <Card
        title={<span style={{ fontWeight: 600 }}>Cấu hình hệ thống</span>}
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          marginBottom: 30,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "50%",
            }}
          >
            <span style={{ fontWeight: 500 }}>Thông báo hệ thống</span>
            <Switch
              checked={settings.notifications}
              onChange={(checked) =>
                setSettings({ ...settings, notifications: checked })
              }
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "50%",
            }}
          >
            <span style={{ fontWeight: 500 }}>Sao lưu tự động</span>
            <Switch
              checked={settings.autoBackup}
              onChange={(checked) =>
                setSettings({ ...settings, autoBackup: checked })
              }
            />
          </div>
        </div>
      </Card>

      {/* Nút lưu */}
      <Divider />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          onClick={handleSave}
          style={{ borderRadius: 8, padding: "0 32px" }}
        >
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
};

export default SystemSettings;
