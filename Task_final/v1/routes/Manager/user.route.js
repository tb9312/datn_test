const express = require("express");
const route = express.Router();
const controller = require("../../controllers/Manager/user.controller");

const authMiddleware = require("../../middlewares/Manager/auth.middlewares");

route.post("/login", controller.login);

route.get("/logout", controller.logout);

route.get("/detail", authMiddleware.requireAuth, controller.detail);

route.get("/listuser", authMiddleware.requireAuth, controller.listuser);

module.exports = route;
