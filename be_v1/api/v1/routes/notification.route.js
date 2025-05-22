const express = require("express")
const controllers = require("../controllers/notification.controller")
const middlewareLogin = require("../../../validate/middlewareLogin")
const verifyToken = require("../../../validate/verifyToken")
const router =  express.Router()

router.get("", controllers.getNotifications);
router.post("/create", verifyToken, controllers.createNotification);

module.exports = router;