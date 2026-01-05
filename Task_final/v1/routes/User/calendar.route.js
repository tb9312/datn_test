const express = require("express");
const route = express.Router();
const controller = require("../../controllers/User/calendar.controller");
const { validateCalendar } = require("../../../validates/calendar.validate");

route.get("/", controller.index);

route.get("/detail/:id", controller.detail);

route.post("/create", validateCalendar, controller.create);

route.patch("/edit/:id", validateCalendar, controller.edit);

route.patch("/delete/:id", controller.delete);
module.exports = route;