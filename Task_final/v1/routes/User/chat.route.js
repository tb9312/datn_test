const express = require("express");
const router = express.Router();

const chatController = require("../../controllers/User/chat.controller");
const authMiddleware = require("../../middlewares/User/auth.middlewares");

router.get("/history", authMiddleware.requireAuth, chatController.history);

module.exports = router;
