const express = require("express");
const route = express.Router();
const multer = require("multer");
const uploadCloudinary = require("../../middlewares/Manager/uploadClould.middlewares");
const upload = multer();
const controller = require("../../controllers/Manager/project.controller");

route.get("/", controller.index);
// Them chi tiet SubProject
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
// route.get("/add-member/:id", controller.ListUser);
// route.patch("/add-member/:id", controller.addMember);

// route.patch("/remote-member/:id", controller.remoteMember);

route.patch(
  "/edit/:id",
  upload.single("thumbnail"),
  uploadCloudinary.upload,
  controller.edit
);

route.patch("/delete/:id", controller.delete);

route.post("/comment/:id", controller.comment);

route.patch("/comment/edit/:id", controller.editComment);

route.patch("/priority/:id", controller.changePriority);

module.exports = route;
