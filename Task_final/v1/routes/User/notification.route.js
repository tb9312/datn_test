const express = require("express");
const route = express.Router();
const controller = require("../../controllers/User/notification.controller");

route.get("/", controller.index);

route.patch("/isReaded/:id", controller.isreaded);

route.patch("/delete/:id", controller.delete);
module.exports = route;
