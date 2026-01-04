const express = require("express");
const route = express.Router();
const controller = require("../../controllers/User/diary.controller");

// route.get("/", controller.index);

route.get("/detail/:id", controller.detail);

route.post("/create", controller.create);

route.patch("/edit/:id", controller.edit);

route.patch("/delete/:id", controller.delete);
module.exports = route;
