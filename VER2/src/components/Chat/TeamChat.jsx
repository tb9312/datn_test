import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Avatar, List, Space, Typography, Divider, Tooltip } from 'antd';
import { SendOutlined, UserOutlined, PaperClipOutlined, SmileOutlined } from '@ant-design/icons';
import io from 'socket.io-client';

const { TextArea } = Input;
const { Text } = Typography;

const TeamChat = ({ team, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);

  // Kết nối Socket.IO khi component mount
  useEffect(() => {
    // Khởi tạo kết nối Socket.IO
    const newSocket = io('http://localhost:3000', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: {
        token: localStorage.getItem('access_token') // Nếu dùng JWT
      }
    });

    setSocket(newSocket);

    // Lắng nghe tin nhắn mới từ server
    newSocket.on('SERVER_RETURN_MESSAGE', (data) => {
      const newMsg = {
        id: messages.length + 1,
        content: data.content,
        sender: {
          id: data.userId,
          name: data.fullName,
          avatar: null
        },
        timestamp: new Date().toISOString(),
        type: 'text',
        images: data.images || []
      };
      
      setMessages(prev => [...prev, newMsg]);
    });

    // Lắng nghe sự kiện typing
    newSocket.on('SERVER_RETURN_TYPING', (data) => {
      if (data.type === 'typing' && data.userId !== currentUser.id) {
        setTypingUsers(prev => {
          const userExists = prev.find(user => user.userId === data.userId);
          if (!userExists) {
            return [...prev, { userId: data.userId, fullName: data.fullName }];
          }
          return prev;
        });

        // Tự động xóa sau 3 giây
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
        }, 3000);
      }
    });

    // Load tin nhắn cũ từ API khi vào chat
    fetchMessages();

    // Cleanup khi component unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch tin nhắn từ API
  const fetchMessages = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Transform data từ backend sang định dạng frontend
        const formattedMessages = data.chats?.map((chat, index) => ({
          id: chat._id || index,
          content: chat.content,
          sender: {
            id: chat.user_id,
            name: chat.infoUser?.fullName || 'Unknown',
            avatar: null
          },
          timestamp: chat.createdAt || new Date().toISOString(),
          type: 'text',
          images: chat.images || []
        })) || [];
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === '' || !socket) return;

    // Gửi tin nhắn qua Socket.IO
    socket.emit('CLIENT_SEND_MESSAGE', {
      content: newMessage.trim(),
      images: [], // Mảng buffer nếu có ảnh
      room_chat_id: team.id // ID phòng chat (nếu có)
    });

    // Thêm tin nhắn vào state ngay lập tức
    const message = {
      id: Date.now(), // Tạm thời dùng timestamp
      content: newMessage.trim(),
      sender: currentUser,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Xử lý typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (socket) {
      socket.emit('CLIENT_SEND_TYPING', {
        type: e.target.value ? 'typing' : 'stop',
        room_chat_id: team.id
      });
    }
  };

  // Xử lý đính kèm file
  const handleAttachment = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target.result;
        
        // Gửi file qua Socket.IO
        if (socket) {
          socket.emit('CLIENT_SEND_MESSAGE', {
            content: '',
            images: [buffer],
            room_chat_id: team.id
          });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Hiển thị hình ảnh trong tin nhắn
  const renderMessageContent = (message) => {
    return (
      <div>
        {message.content && (
          <div style={{ marginBottom: message.images?.length > 0 ? '8px' : 0 }}>
            {message.content}
          </div>
        )}
        {message.images && message.images.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {message.images.map((img, index) => (
              <img 
                key={index}
                src={img} 
                alt={`attachment-${index}`}
                style={{ 
                  maxWidth: '200px', 
                  maxHeight: '200px',
                  borderRadius: '8px'
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card
      title={
        <Space>
          <Avatar size="small" src={team.avatar} icon={<UserOutlined />} />
          <span>{team.name} - Team Chat</span>
          {typingUsers.length > 0 && (
            <Text type="secondary" style={{ fontSize: '12px', marginLeft: '10px' }}>
              {typingUsers.map(user => user.fullName).join(', ')} đang nhập...
            </Text>
          )}
        </Space>
      }
      extra={
        <Button type="text" onClick={onClose}>
          Đóng
        </Button>
      }
      style={{ height: '600px', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
    >
      {/* Messages List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <List
          dataSource={messages}
          renderItem={(message) => (
            <List.Item style={{ border: 'none', padding: '8px 0' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                flexDirection: message.sender.id === currentUser.id ? 'row-reverse' : 'row',
                width: '100%'
              }}>
                <Avatar 
                  size="small" 
                  src={message.sender.avatar} 
                  icon={<UserOutlined />}
                  style={{ margin: message.sender.id === currentUser.id ? '0 0 0 8px' : '0 8px 0 0' }}
                />
                <div style={{ 
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: message.sender.id === currentUser.id ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{ 
                    background: message.sender.id === currentUser.id ? '#1890ff' : '#f0f0f0',
                    color: message.sender.id === currentUser.id ? 'white' : 'black',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    wordWrap: 'break-word'
                  }}>
                    {renderMessageContent(message)}
                  </div>
                  <Text type="secondary" style={{ fontSize: '11px', marginTop: '4px' }}>
                    {message.sender.name} • {formatTime(message.timestamp)}
                  </Text>
                </div>
              </div>
            </List.Item>
          )}
        />
        <div ref={messagesEndRef} />
      </div>

      <Divider style={{ margin: 0 }} />

      {/* Message Input */}
      <div style={{ padding: '16px' }}>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ resize: 'none' }}
          />
          <Tooltip title="Gửi tin nhắn">
            <Button 
              type="primary" 
              icon={<SendOutlined />} 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            />
          </Tooltip>
        </Space.Compact>
        
        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <Space size="small">
            <input
              type="file"
              id="file-upload"
              multiple
              style={{ display: 'none' }}
              onChange={handleAttachment}
            />
            <Button 
              type="text" 
              icon={<PaperClipOutlined />} 
              size="small"
              onClick={() => document.getElementById('file-upload').click()}
            >
              Đính kèm
            </Button>
            <Button type="text" icon={<SmileOutlined />} size="small">
              Emoji
            </Button>
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Enter để gửi, Shift + Enter để xuống dòng
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default TeamChat;