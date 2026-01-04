const express = require("express");
const route = express.Router();
const controller = require("../../controllers/Manager/teams.controller");

route.get("/", controller.index);

module.exports = route;
