import io from "socket.io-client";

const SOCKET_URL = "http://localhost:3370";
const STORAGE_TOKEN_KEY = "tokenLogin";

class SocketService {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.listeners = {
      newMessage: [],
      typing: [],
      connected: [],
      disconnected: [],
      error: [],
    };
  }

  connect(userId) {
    if (this.socket) this.disconnect();

    this.userId = userId;

    const token =
      localStorage.getItem(STORAGE_TOKEN_KEY) ||
      sessionStorage.getItem(STORAGE_TOKEN_KEY);

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token },          // ✅ server đọc socket.handshake.auth.token
      query: { userId },        // optional
      withCredentials: true,
    });

    this.setupListeners();
    return this.socket;
  }

  setupListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket.id);
      this.listeners.connected.forEach((cb) => cb());
    });

    this.socket.on("connect_error", (err) => {
      console.error("❌ connect_error:", err.message);
      this.listeners.error.forEach((cb) => cb(err));
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      this.listeners.disconnected.forEach((cb) => cb(reason));
    });

    this.socket.on("SERVER_RETURN_MESSAGE", (data) => {
      this.listeners.newMessage.forEach((cb) => cb(data));
    });

    this.socket.on("SERVER_RETURN_TYPING", (data) => {
      this.listeners.typing.forEach((cb) => cb(data));
    });
  }

  joinTeam(teamId) {
    if (!this.socket) return;
    this.socket.emit("JOIN_ROOM", { teamId });     // ✅ match backend mới
  }

  leaveTeam(teamId) {
    if (!this.socket) return;
    this.socket.emit("LEAVE_ROOM", { teamId });    // ✅ match backend mới
  }

  sendMessage({ teamId, content, images = [], tempId }) {
    if (!this.socket) return;
    this.socket.emit("CLIENT_SEND_MESSAGE", { teamId, content, images, tempId });
  }

  sendTyping({ teamId, type }) {
    if (!this.socket) return;
    this.socket.emit("CLIENT_SEND_TYPING", { teamId, type });
  }

  onNewMessage(cb) { this.listeners.newMessage.push(cb); }
  onTyping(cb) { this.listeners.typing.push(cb); }
  onConnected(cb) { this.listeners.connected.push(cb); }
  onDisconnected(cb) { this.listeners.disconnected.push(cb); }
  onError(cb) { this.listeners.error.push(cb); }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return !!this.socket?.connected;
  }
}

export default new SocketService();