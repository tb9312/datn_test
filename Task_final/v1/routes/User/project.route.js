const express = require("express");
const route = express.Router();
const controller = require("../../controllers/User/project.controller");
const multer = require("multer");
const uploadCloudinary = require("../../middlewares/User/uploadClould.middlewares");
const upload = multer();

route.get("/", controller.index);

route.get("/:parentId/tasks", controller.getTasksByParent);

route.get("/detail/:id", controller.detail);

route.patch("/change-status/:id", controller.changeStatus);

route.patch("/change-multi", controller.changeMulti);

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

route.post("/comment/:id", controller.comment);

route.patch("/comment/edit/:id", controller.editComment);

route.patch("/comment/delete/:id", controller.deleteComment);

route.patch("/priority/:id", controller.changePriority);

module.exports = route;
