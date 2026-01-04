import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.listeners = {
      newMessage: [],
      userOnline: [],
      typing: [],
      connected: []
    };
  }

  connect(userId) {
    if (this.socket) {
      this.disconnect();
    }

    this.userId = userId;
    this.socket = io('http://localhost:3000', {
      auth: {
        token: localStorage.getItem('access_token')
      },
      transports: ['websocket', 'polling'],
      query: {
        userId: userId
      }
    });

    this.setupListeners();
  }

  setupListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.listeners.connected.forEach(callback => callback());
    });

    this.socket.on('SERVER_RETURN_MESSAGE', (data) => {
      this.listeners.newMessage.forEach(callback => callback(data));
    });

    this.socket.on('SERVER_RETURN_TYPING', (data) => {
      this.listeners.typing.forEach(callback => callback(data));
    });

    this.socket.on('USER_ONLINE', (users) => {
      this.listeners.userOnline.forEach(callback => callback(users));
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  joinRoom(roomId) {
    if (this.socket) {
      this.socket.emit('JOIN_ROOM', { roomId });
    }
  }

  leaveRoom(roomId) {
    if (this.socket) {
      this.socket.emit('LEAVE_ROOM', { roomId });
    }
  }

  sendMessage(data) {
    if (this.socket) {
      this.socket.emit('CLIENT_SEND_MESSAGE', data);
    }
  }

  sendTyping(data) {
    if (this.socket) {
      this.socket.emit('CLIENT_SEND_TYPING', data);
    }
  }

  onNewMessage(callback) {
    this.listeners.newMessage.push(callback);
  }

  onUserOnline(callback) {
    this.listeners.userOnline.push(callback);
  }

  onTyping(callback) {
    this.listeners.typing.push(callback);
  }

  onConnected(callback) {
    this.listeners.connected.push(callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }
}

export default new SocketService();