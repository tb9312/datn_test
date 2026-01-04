const express = require("express");
const router = express.Router();
const controller = require("../controllers/auth_controller");
const validates = require("../validate/auth.validate");

router.get("/login", controller.login);

router.post("/login", validates.loginPost, controller.loginPost);

router.get("/logout", controller.logout);

module.exports = router;
