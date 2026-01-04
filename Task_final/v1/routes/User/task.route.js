const express = require("express");
const route = express.Router();
const controller = require("../../controllers/User/task.controller");

const multer = require("multer");
const uploadCloudinary = require("../../middlewares/User/uploadClould.middlewares");
const upload = multer();

route.get("/", controller.index);

route.get("/detail/:id", controller.detail);

route.patch("/change-multi", controller.changeMulti);

route.patch("/change-status/:id", controller.changeStatus);

route.post(
  "/create",
  upload.single("thumbnail"),
  uploadCloudinary.upload,
  controller.create
);

route.patch(
  "/edit/:id",
  upload.single("thumbnail"),
  uploadCloudinary.upload,
  controller.edit
);

route.patch("/delete/:id", controller.delete);

route.get("/suggest-schedule", controller.suggestSchedule);

route.patch("/priority/:id", controller.changePriority);

module.exports = route;
