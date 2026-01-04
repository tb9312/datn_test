const express = require('express');
const router = express.Router();
const ragController = require('../controllers/rag.controller');
const authMiddleware = require('../middlewares/User/auth.middlewares');

// Tất cả routes đều cần authentication
router.use(authMiddleware.requireAuth);

// Chat với RAG
router.post('/chat', ragController.chat);

// Search codebase
router.post('/search', ragController.search);

// Check status
router.get('/status', ragController.status);

module.exports = router;





