const jwt = require("jsonwebtoken");
const User = require("../../../models/user.model");

/**
 * Middleware xác thực riêng cho RAG/Chatbot
 * Không ảnh hưởng đến các middleware khác của dự án
 */
module.exports.requireAuthForRAG = async (req, res, next) => {
  try {
    let token = null;

    // 1. Log tất cả headers để debug
    console.log('[RAG Auth] Headers:', {
      authorization: req.headers.authorization ? req.headers.authorization.substring(0, 30) : 'not found',
      userAgent: req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 50) : 'unknown',
    });

    // 2. Cố gắng lấy token từ Authorization header
    const authHeader = req.headers.authorization;
    console.log('[RAG Auth] Full Authorization header:', authHeader);
    
    if (authHeader) {
      const tokenParts = authHeader.split(" ");
      if (tokenParts.length === 2 && tokenParts[0] === "Bearer") {
        const extractedToken = tokenParts[1].trim();
        // Kiểm tra nếu token là string "undefined" hoặc rỗng
        if (extractedToken && extractedToken !== "undefined" && extractedToken !== "null") {
          token = extractedToken;
          console.log('[RAG Auth] ✅ Token extracted from Bearer header');
        } else {
          console.log('[RAG Auth] ⚠️  Token value is invalid string:', extractedToken);
        }
      } else {
        console.log('[RAG Auth] ⚠️  Invalid Bearer format. Parts:', tokenParts);
      }
    }

    // 3. Nếu không có, cố gắng lấy từ cookies
    if (!token && req.cookies) {
      const cookieToken = req.cookies.token || req.cookies.tokenLogin || req.cookies.authToken;
      if (cookieToken) {
        token = cookieToken;
        console.log('[RAG Auth] ✅ Token extracted from cookies');
      }
    }

    // 4. Nếu vẫn không có, cố gắng lấy từ query parameter (cho test)
    if (!token && req.query && req.query.token) {
      token = req.query.token;
      console.log('[RAG Auth] ✅ Token extracted from query param');
    }

    // Debug
    console.log('[RAG Auth] Final token status:', token ? '✅ Found' : '❌ Not found');

    if (!token) {
      console.log('[RAG Auth] ⚠️  No token found. User needs to login and ensure token is sent in Authorization header.');
      return res.json({
        code: 401,
        message: "Token không được tìm thấy. Vui lòng đảm bảo gửi token trong header Authorization: 'Bearer YOUR_TOKEN'",
      });
    }

    // Ưu tiên xác thực JWT (phù hợp logic đăng nhập hiện tại)
    let user = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findOne({ _id: decoded.id, deleted: false }).select("-password");
      if (user) {
        console.log('[RAG Auth] ✅ JWT verified for user:', user._id);
      }
    } catch (err) {
      console.log('[RAG Auth] ⚠️  JWT verify failed:', err.message);
    }

    // Fallback: tìm theo trường token trong DB (token legacy)
    if (!user) {
      console.log('[RAG Auth] Looking up user by stored token:', token.substring(0, 20) + '...');
      user = await User.findOne({ token: token, deleted: false }).select("-password -token");
    }

    if (!user) {
      console.log('[RAG Auth] User not found for token (jwt or stored):', token.substring(0, 20));
      return res.json({
        code: 401,
        message: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
      });
    }

    // Attach user vào request
    req.user = user;
    console.log('[RAG Auth] ✅ User authenticated:', user._id);
    
    next();
  } catch (error) {
    console.error('[RAG Auth] Middleware error:', error.message);
    return res.json({
      code: 500,
      message: "Lỗi xác thực. Vui lòng thử lại sau.",
    });
  }
};
