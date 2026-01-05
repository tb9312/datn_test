const ragService = require('../services/rag.service');

module.exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    // req.user được set bởi middleware auth
    if (!req.user) {
      console.log('[RAG] No user found in request');
      return res.json({
        code: 401,
        message: 'Vui lòng đăng nhập để sử dụng AI Assistant',
        data: null
      });
    }

    const userId = req.user._id;
    const userRole = req.user.role; // 'USER' hoặc 'MANAGER'

    if (!message || !message.trim()) {
      return res.json({
        code: 400,
        message: 'Message không được để trống',
      });
    }

    console.log('[RAG Chat] User:', userId, 'Role:', userRole, 'Query:', message.substring(0, 50));

    // Generate response với RAG - truyền thêm userRole để phân quyền
    const response = await ragService.generateResponse(message, history, userId, userRole);

    res.json({
      code: 200,
      message: 'Success',
      data: {
        answer: response.answer,
        sources: response.sources || [],
        timestamp: new Date().toISOString(),
        isTaskSuggestion: response.isTaskSuggestion || false,
        suggestionData: response.suggestionData || null,
      },
    });
  } catch (error) {
    console.error('[RAG Chat] Error:', error.message);
    res.json({
      code: 500,
      message: 'Lỗi khi xử lý câu hỏi. Vui lòng thử lại sau.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * [POST] /api/v1/rag/search
 * Search codebase
 */
module.exports.search = async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query || !query.trim()) {
      return res.json({
        code: 400,
        message: 'Query không được để trống',
      });
    }

    const results = await ragService.search(query, limit);

    res.json({
      code: 200,
      message: 'Success',
      data: {
        results: results.map(r => ({
          path: r.path,
          type: r.type,
          name: r.name,
          content: r.content.substring(0, 500),
          score: r.score,
        })),
        count: results.length,
      },
    });
  } catch (error) {
    console.error('RAG Search Error:', error);
    res.json({
      code: 500,
      message: 'Lỗi khi tìm kiếm: ' + error.message,
    });
  }
};

/**
 * [GET] /api/v1/rag/status
 * Check RAG system status
 */
module.exports.status = async (req, res) => {
  try {
    // Initialize nếu chưa
    if (!ragService.initialized) {
      await ragService.initialize();
    }

    res.json({
      code: 200,
      message: 'RAG system is ready',
      data: {
        initialized: ragService.initialized,
        indexedChunks: ragService.codebaseIndex.size,
      },
    });
  } catch (error) {
    console.error('RAG Status Error:', error);
    res.json({
      code: 500,
      message: 'Lỗi khi kiểm tra status: ' + error.message,
    });
  }
};

/**
 * [GET] /api/v1/rag/me
 * Kiểm tra thông tin user hiện tại (dùng để debug authentication)
 * Endpoint này yêu cầu auth để verify token của user
 */
module.exports.getCurrentUser = async (req, res) => {
  try {
    // req.user được set bởi middleware auth
    if (!req.user) {
      return res.json({
        code: 401,
        message: 'Không có user được xác thực',
        data: null
      });
    }

    res.json({
      code: 200,
      message: 'Success',
      data: {
        user: {
          _id: req.user._id,
          email: req.user.email || 'N/A',
          username: req.user.username || 'N/A',
          fullName: req.user.fullName || 'N/A',
        },
        authenticated: true,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('RAG Get User Error:', error);
    res.json({
      code: 500,
      message: 'Lỗi khi lấy thông tin user: ' + error.message,
    });
  }
};





