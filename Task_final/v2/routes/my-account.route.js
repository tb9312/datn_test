const express = require("express");
const multer = require("multer");
const router = express.Router();

const upload = multer();

const controller = require("../controllers/my-account.controller");

const uploadCloud = require("../middlewares/uploadClould.middlewares");

router.get("/", controller.index);

router.get("/edit", controller.edit);

router.patch(
  "/edit",
  upload.single("avatar"),
  uploadCloud.upload,
  controller.editPatch
);

module.exports = router;
