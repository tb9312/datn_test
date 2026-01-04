const express = require("express");
const router = express.Router();
const controller = require("../controllers/article_controller");

router.get("/", controller.index);

router.get("/create", controller.create);

router.post("/create", controller.createPost);

router.delete("/delete/:id", controller.delete);

router.get("/edit/:id", controller.edit);

router.patch("/edit/:id", controller.editPost);

module.exports = router;
