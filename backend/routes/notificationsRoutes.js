const express = require("express");
const { getNotifications, createNotification } = require("../controllers/notificationsController");
const router = express.Router();

router.get("/", getNotifications);
router.post("/", createNotification);

module.exports = router;
