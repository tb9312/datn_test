import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, theme } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer'; // 👈 import Footer
import RAGChatbot from '../RAGChatbot/RAGChatbot';

const { Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar trái */}
      <Sidebar collapsed={collapsed} />

      {/* Phần nội dung chính */}
      <Layout
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {/* Header cố định */}
        <Header
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />

        {/* Nội dung cuộn được, nằm giữa Header và Footer */}
        <Content
          style={{
            flex: 1,
            margin: '24px 16px',
            // marginTop: 88, // chừa khoảng cho header sticky
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>

        {/* Footer luôn ở dưới, không cuộn theo */}
        <Footer />
      </Layout>

      {/* RAG Chatbot */}
      {showChatbot && (
        <RAGChatbot onClose={() => setShowChatbot(false)} />
      )}
      {!showChatbot && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
          }}
        >
          <button
            onClick={() => setShowChatbot(true)}
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              color: 'white',
              fontSize: 24,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title="Mở AI Assistant"
          >
            🤖
          </button>
        </div>
      )}
    </Layout>
  );
};

export default MainLayout;
