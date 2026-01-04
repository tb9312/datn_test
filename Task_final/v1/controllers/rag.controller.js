const ragService = require('../services/rag.service');

/**
 * [POST] /api/v1/rag/chat
 * Chat với RAG system
 */
module.exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const userId = req.user?.id || null;

    if (!message || !message.trim()) {
      return res.json({
        code: 400,
        message: 'Message không được để trống',
      });
    }

    // Generate response với RAG (truyền userId để hỗ trợ task suggestions)
    const response = await ragService.generateResponse(message, history, userId);

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
    console.error('RAG Chat Error:', error);
    res.json({
      code: 500,
      message: 'Lỗi khi xử lý câu hỏi: ' + error.message,
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





