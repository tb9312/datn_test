const express = require('express');
const router = express.Router();
const ragController = require('../controllers/rag.controller');
const ragAuthMiddleware = require('../middlewares/User/rag.auth.middleware');

// Sử dụng middleware auth riêng cho RAG (không ảnh hưởng phần còn lại)
router.use(ragAuthMiddleware.requireAuthForRAG);

// Chat với RAG
router.post('/chat', ragController.chat);

// Search codebase
router.post('/search', ragController.search);

// Check status
router.get('/status', ragController.status);

// Kiểm tra user hiện tại (debug authentication)
router.get('/me', ragController.getCurrentUser);

module.exports = router;





