const express = require("express");
const route = express.Router();
const controller = require("../../controllers/User/settingGeneral.controller");

route.get("/", controller.getGeneralSetting);

module.exports = route;