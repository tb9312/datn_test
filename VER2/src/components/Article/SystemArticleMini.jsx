import React, { useEffect, useState } from "react";
import { Badge, Drawer, Spin, Typography } from "antd";
import { NotificationOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import posterService from "../../services/posterService";

const PosterBell = () => {
  const [poster, setPoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isRead, setIsRead] = useState(false);

  const READ_KEY = "POSTER_READ_ID";

  useEffect(() => {
    fetchPoster();
  }, []);

  useEffect(() => {
    if (poster?._id) {
      const readId = localStorage.getItem(READ_KEY);
      setIsRead(readId === poster._id);
    }
  }, [poster]);

  const fetchPoster = async () => {
    setLoading(true);
    const res = await posterService.getPoster();
    if (res?.success) {
      setPoster(res.data);
    }
    setLoading(false);
  };

  const openDrawer = () => {
    if (poster?._id) {
      localStorage.setItem(READ_KEY, poster._id);
      setIsRead(true);
    }
    setOpen(true);
  };

  if (loading) {
    return (
      <div style={wrapperStyle}>
        <Spin />
      </div>
    );
  }

  if (!poster) return null;

  return (
    <>
      {/* 🔔 BUTTON THÔNG BÁO */}
      <div style={wrapperStyle} onClick={openDrawer}>
        <Badge dot={!isRead} offset={[-2, 2]}>
          <div style={bellButtonStyle}>
            <NotificationOutlined style={iconStyle} />
            <span style={textStyle}>Hệ thống</span>
          </div>
        </Badge>
      </div>

      {/* 📄 DRAWER CHI TIẾT */}
      <Drawer
        title={poster.title}
        placement="right"
        width={520}
        open={open}
        onClose={() => setOpen(false)}
      >
        <Typography.Text type="secondary">
          {dayjs(poster.createdAt).format("DD/MM/YYYY HH:mm")}
        </Typography.Text>

        <div
          style={{ marginTop: 16, lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{ __html: poster.content }}
        />
      </Drawer>
    </>
  );
};

/* ================= STYLES ================= */

const wrapperStyle = {
  position: "fixed",
  top: 200, // 👈 dưới Header
  right: 24,
  zIndex: 999999,
  cursor: "pointer",
};

const bellButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 16px",
  borderRadius: 999,
  background: "linear-gradient(135deg, #ff4d4f, #ff7875)",
  color: "#fff",
  boxShadow: "0 8px 20px rgba(255,77,79,0.35)",
  transition: "all .25s ease",
};

const iconStyle = {
  fontSize: 18,
};

const textStyle = {
  fontSize: 14,
  fontWeight: 600,
  whiteSpace: "nowrap",
};

export default PosterBell;