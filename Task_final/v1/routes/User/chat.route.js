const express = require("express");
const route = express.Router();
const controller = require("../../controllers/User/chat.controller");
route.get("/", controller.index);

module.exports = route;
