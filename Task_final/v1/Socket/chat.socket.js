const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const uploadToCloudinary = require('../../helpers/uploadToCloudinary');
const Chat = require('../../models/chat.model');
const User = require('../../models/user.model');

module.exports = (io) => {
  // ✅ 1. Middleware xác thực: Giải mã JWT để lấy User
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        console.error('❌ Socket Auth: No token provided');
        return next(new Error('Authentication required'));
      }

      // Kiểm tra Database có sẵn sàng không
      if (mongoose.connection.readyState !== 1) {
        return next(new Error('Database connection is not ready'));
      }

      let user = null;

      // Cách A: Thử giải mã nếu là JWT Token
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(decoded.id).select('-password');
      } catch (jwtErr) {
        // Cách B: Nếu không phải JWT, thử tìm theo tokenUser (chuỗi random trong DB)
        user = await User.findOne({ tokenUser: token }).select('-password');
      }

      if (user) {
        socket.user = user; // Lưu thông tin user vào socket instance
        return next();
      } else {
        console.error('❌ Socket Auth: Invalid token');
        return next(new Error('Invalid or expired token'));
      }
    } catch (e) {
      console.error('❌ Socket Auth Server Error:', e);
      next(new Error('Server error'));
    }
  });

  // ✅ 2. Xử lý các sự kiện sau khi kết nối thành công
  io.on('connection', (socket) => {
    console.log(
      "✅ Socket connected:",
      socket.id,
      " - User:",
      socket.user?.fullName
    );

    // Tham gia phòng chat của team
    socket.on('JOIN_ROOM', ({ roomId }) => {
      if (!roomId) return;
      socket.join(roomId);
      console.log(`🏠 User ${socket.user?.fullName} joined room: ${roomId}`);
    });

    // Rời phòng chat
    socket.on('LEAVE_ROOM', ({ roomId }) => {
      if (!roomId) return;
      socket.leave(roomId);
    });

    // Lắng nghe tin nhắn từ Client
    socket.on('CLIENT_SEND_MESSAGE', async (data) => {
      try {
        // Kiểm tra an toàn để tránh lỗi undefined '_id'
        if (!socket.user) {
          console.error('❌ CLIENT_SEND_MESSAGE: socket.user is undefined');
          return;
        }

        const userId = socket.user._id;
        const fullName = socket.user.fullName;

        // Xử lý đính kèm ảnh (nếu có)
        let images = [];
        if (Array.isArray(data.images) && data.images.length > 0) {
          for (const imageBuffer of data.images) {
            const link = await uploadToCloudinary.uploadToCloudinary(
              imageBuffer
            );
            images.push(link);
          }
        }

        // Lấy teamId (chính là room_key trong DB của bạn)
        const teamId = data.teamId || data.room_chat_id;
        if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
          console.error('❌ CLIENT_SEND_MESSAGE: Invalid teamId');
          return;
        }

        // ✅ LƯU VÀO DATABASE
        const doc = new Chat({
          user_id: userId,
          room_key: teamId,
          content: data.content || '',
          images: images,
          deleted: false,
        });
        await doc.save();

        // Xác định room để phát lại tin nhắn
        const room = data.roomId || `team_${teamId}`;

        // ✅ GỬI TRẢ TIN NHẮN CHO MỌI NGƯỜI TRONG TEAM
        io.to(room).emit('SERVER_RETURN_MESSAGE', {
          _id: doc._id,
          userId: userId,
          fullName: fullName,
          content: doc.content,
          images: doc.images,
          createdAt: doc.createdAt,
          tempId: data.tempId, // Gửi lại tempId để Client xóa tin nhắn chờ
          teamId: teamId,
        });

        console.log(`💾 Saved & Emitted message from ${fullName} to ${room}`);
      } catch (err) {
        console.error('❌ Error handling CLIENT_SEND_MESSAGE:', err);
      }
    });

    // Xử lý trạng thái đang nhập (typing)
    socket.on('CLIENT_SEND_TYPING', (type) => {
      // Broadcast cho những người khác trong cùng team (cần roomId ở đây nếu muốn tối ưu)
      socket.broadcast.emit('SERVER_RETURN_TYPING', {
        userId: socket.user?._id,
        fullName: socket.user?.fullName,
        type: type, // "typing" hoặc "stop"
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', socket.id, 'Reason:', reason);
    });
  });
};