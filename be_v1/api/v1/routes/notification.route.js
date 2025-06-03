const express = require("express");
const verifyToken = require("../../../validate/verifyToken");
const controllers = require("../controllers/notification.controller");
const router = express.Router();

router.post("/create", verifyToken, controllers.createNotification);
router.get("/", verifyToken, controllers.getNotificationsByUser);
router.patch("/read/:id", verifyToken, controllers.markAsRead);

module.exports = router;