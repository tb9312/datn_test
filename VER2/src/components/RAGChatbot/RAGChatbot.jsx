import React, { useState, useRef, useEffect } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  List, 
  Avatar, 
  Spin, 
  Typography, 
  Space,
  Tag,
  Tooltip
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  CloseOutlined,
  CodeOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { ragService } from '../../services/ragService';
import './RAGChatbot.css';

const { Text, Paragraph } = Typography;

const RAGChatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Xin chào! 👋 Tôi là AI Assistant của hệ thống. Tôi có thể giúp bạn:\n\n📖 **Hướng dẫn sử dụng hệ thống**\n• Cách sử dụng các tính năng\n• Giải đáp thắc mắc về hệ thống\n\n💡 **Ví dụ câu hỏi:**\n• "Làm sao để tạo task mới?"\n• "Tính năng nào có trong hệ thống?"\n• "Cách sử dụng calendar?"\n\nHãy hỏi tôi bất cứ điều gì!',
      timestamp: new Date(),
      sources: [],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input khi component mount
    if (inputRef.current && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // Lấy conversation history
      const history = messages
        .filter(m => m.type === 'user' || m.type === 'bot')
        .slice(-5)
        .map(m => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));

      const response = await ragService.chat(inputValue, history);

      if (response.code === 200) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: response.data.answer,
          timestamp: new Date(),
          sources: response.data.sources || [],
          isTaskSuggestion: response.data.isTaskSuggestion || false,
          suggestionData: response.data.suggestionData || null,
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(response.message || 'Lỗi không xác định');
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `❌ Lỗi: ${error.message}\n\nVui lòng thử lại hoặc kiểm tra kết nối đến server.`,
        timestamp: new Date(),
        isError: true,
        sources: [],
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessage = (content) => {
    // Format markdown-like content
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Code blocks
      if (line.startsWith('```')) {
        return <div key={idx} className="code-block-start">{line}</div>;
      }
      if (line.includes('```')) {
        return <div key={idx} className="code-block-end">{line}</div>;
      }
      
      // Bold text
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <div key={idx}>
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </div>
        );
      }
      
      // Emojis and icons
      if (line.trim().startsWith('📁') || line.trim().startsWith('🔧') || 
          line.trim().startsWith('📦') || line.trim().startsWith('📄') ||
          line.trim().startsWith('💡')) {
        return <div key={idx} className="message-icon-line">{line}</div>;
      }
      
      return <div key={idx}>{line || '\u00A0'}</div>;
    });
  };

  const renderTaskSuggestions = (suggestionData) => {
    if (!suggestionData || !suggestionData.suggestions || suggestionData.suggestions.length === 0) {
      return null;
    }

    const getTypeColor = (type) => {
      switch (type) {
        case 'warning': return '#ff4d4f';
        case 'info': return '#1890ff';
        case 'reminder': return '#faad14';
        case 'priority': return '#eb2f96';
        default: return '#52c41a';
      }
    };

    const getTypeIcon = (type) => {
      switch (type) {
        case 'warning': return '⚠️';
        case 'info': return '📅';
        case 'reminder': return '⏰';
        case 'priority': return '🔥';
        default: return '📋';
      }
    };

    return (
      <div className="task-suggestions-container">
        {suggestionData.suggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className="task-suggestion-card"
            style={{
              borderLeft: `4px solid ${getTypeColor(suggestion.type)}`,
              marginTop: idx > 0 ? '12px' : '0',
            }}
          >
            <div className="task-suggestion-header">
              <span style={{ fontSize: '18px', marginRight: '8px' }}>
                {getTypeIcon(suggestion.type)}
              </span>
              <Text strong style={{ fontSize: '14px' }}>
                {suggestion.title}
              </Text>
            </div>
            {suggestion.tasks && suggestion.tasks.length > 0 && (
              <div className="task-suggestion-tasks">
                {suggestion.tasks.map((task, taskIdx) => (
                  <div key={taskIdx} className="task-item">
                    <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                      {taskIdx + 1}. {task.title}
                    </Text>
                    <Space size="small" style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      <Tag size="small" color={task.status === 'Hoàn thành' ? 'green' : 'default'}>
                        {task.status}
                      </Tag>
                      <Tag size="small" color={task.priority === 'Cao' ? 'red' : task.priority === 'Trung bình' ? 'orange' : 'default'}>
                        {task.priority}
                      </Tag>
                      <Text type="secondary">Deadline: {task.deadline}</Text>
                    </Space>
                  </div>
                ))}
              </div>
            )}
            <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
              {suggestion.message}
            </Text>
          </div>
        ))}
        {suggestionData.summary && (
          <div className="task-summary" style={{ marginTop: '16px', padding: '12px', background: '#f0f2f5', borderRadius: '6px' }}>
            <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>
              📊 Tổng quan
            </Text>
            <Space size="middle" wrap>
              <Text>Total: <strong>{suggestionData.summary.total}</strong></Text>
              {suggestionData.summary.completed !== undefined && (
                <Text>Hoàn thành: <strong style={{ color: '#52c41a' }}>{suggestionData.summary.completed}</strong></Text>
              )}
              {suggestionData.summary.overdue !== undefined && suggestionData.summary.overdue > 0 && (
                <Text>Quá hạn: <strong style={{ color: '#ff4d4f' }}>{suggestionData.summary.overdue}</strong></Text>
              )}
              {suggestionData.summary.today !== undefined && (
                <Text>Hôm nay: <strong style={{ color: '#1890ff' }}>{suggestionData.summary.today}</strong></Text>
              )}
            </Space>
          </div>
        )}
      </div>
    );
  };

  const renderSources = (sources) => {
    if (!sources || sources.length === 0) return null;

    return (
      <div className="message-sources">
        <Text type="secondary" style={{ fontSize: '12px' }}>
          📚 Nguồn tham khảo:
        </Text>
        <Space size={[4, 4]} wrap style={{ marginTop: 4 }}>
          {sources.map((source, idx) => (
            <Tooltip
              key={idx}
              title={
                <div>
                  <div><strong>File:</strong> {source.path}</div>
                  <div><strong>Type:</strong> {source.type}</div>
                  <div><strong>Name:</strong> {source.name}</div>
                </div>
              }
            >
              <Tag color="blue" style={{ cursor: 'pointer', fontSize: '11px' }}>
                <CodeOutlined /> {source.path.split('/').pop()}
              </Tag>
            </Tooltip>
          ))}
        </Space>
      </div>
    );
  };

  if (isMinimized) {
    return (
      <div className="rag-chatbot-minimized">
        <Button
          type="primary"
          icon={<RobotOutlined />}
          onClick={() => setIsMinimized(false)}
          className="rag-chatbot-minimize-button"
          title="Mở AI Assistant"
        />
      </div>
    );
  }

  return (
    <Card
      className="rag-chatbot-card"
      title={
        <Space>
          <RobotOutlined style={{ color: '#1890ff' }} />
          <span>AI Assistant</span>
        </Space>
      }
      extra={
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title="Thu nhỏ">
            <Button
              type="text"
              icon={<MinusOutlined />}
              onClick={() => setIsMinimized(true)}
              style={{ color: 'white', minWidth: '32px', height: '32px' }}
            />
          </Tooltip>
        </div>
      }
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 450,
        height: 600,
        zIndex: 1000,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
      }}
      bodyStyle={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: 0,
      }}
    >
      <div className="rag-chatbot-messages">
        <List
          dataSource={messages}
          renderItem={(message) => (
            <List.Item
              style={{
                border: 'none',
                padding: '12px 16px',
                backgroundColor: message.type === 'user' ? '#f0f0f0' : 'transparent',
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    style={{
                      backgroundColor: message.type === 'user' ? '#1890ff' : '#52c41a',
                    }}
                  />
                }
                title={
                  <Space>
                    <Text strong>
                      {message.type === 'user' ? 'Bạn' : 'AI Assistant'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Text>
                  </Space>
                }
                description={
                  <div>
                    <Paragraph
                      style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: message.isError ? '#ff4d4f' : 'inherit',
                        marginBottom: message.isTaskSuggestion && message.suggestionData ? '12px' : '0',
                      }}
                    >
                      {formatMessage(message.content)}
                    </Paragraph>
                    {message.isTaskSuggestion && message.suggestionData && (
                      renderTaskSuggestions(message.suggestionData)
                    )}
                    {renderSources(message.sources)}
                  </div>
                }
              />
            </List.Item>
          )}
        />
        {loading && (
          <div style={{ padding: '12px 16px', textAlign: 'center' }}>
            <Spin size="small" />
            <Text type="secondary" style={{ marginLeft: 8 }}>
              AI đang suy nghĩ...
            </Text>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="rag-chatbot-input">
        <Input.TextArea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Hỏi về cách sử dụng hệ thống, tính năng,..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={loading}
          style={{ marginBottom: 8 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
          disabled={!inputValue.trim()}
          block
        >
          Gửi
        </Button>
      </div>
    </Card>
  );
};

export default RAGChatbot;

