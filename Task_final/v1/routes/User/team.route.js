const express = require("express");
const route = express.Router();
const controller = require("../../controllers/User/teams.controller");

route.get("/", controller.index);

route.get("/detail/:id", controller.detail);

route.post("/create", controller.create);

route.patch("/edit", controller.edit);

route.patch("/delete/:id", controller.delete);

// Tắt hoạt động
route.patch("/isActive/:id", controller.isActive);

module.exports = route;
