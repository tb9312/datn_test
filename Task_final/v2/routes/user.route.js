const express = require("express");
const router = express.Router();

const controller = require("../controllers/user_controller");
router.get("/", controller.index);
router.patch("/change-status/:status/:id", controller.changeStatus);
router.patch("/change-role_user/:role/:id", controller.changeRole);
router.delete("/delete/:id", controller.deleteItem);
router.get("/detail/:id", controller.detail);
module.exports = router;
