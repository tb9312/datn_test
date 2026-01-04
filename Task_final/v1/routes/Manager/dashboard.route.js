const express = require("express");
const route = express.Router();
const controller = require("../../controllers/Manager/dashboard.controller");

route.get("/", controller.getDashboard);

module.exports = route;
