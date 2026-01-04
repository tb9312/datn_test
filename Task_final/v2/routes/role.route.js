const express = require("express");
const router = express.Router();
const controller = require("../controllers/role_controller");
const validates = require("../validate/role.validate");

router.get("/", controller.index);

router.get("/create", controller.create);

router.get("/detail/:id", controller.detail);

router.post("/create", validates.createPost, controller.createPost);

router.get("/edit/:id", controller.edit);

router.patch("/edit/:id", validates.createPost, controller.editPatch);

router.delete("/delete/:id", controller.deleteItem);

router.patch("/edit/:id", validates.createPost, controller.editPatch);

router.get("/permissions", controller.permissions);

router.patch("/permissions", controller.permissionsPatch);

module.exports = router;
