const Notification = require("../models/notification.model");
const jwt = require("jsonwebtoken");

// Lấy danh sách notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().populate("userId");
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách notifications" });
  }
};

// Tạo notification mới
exports.createNotification = async (req, res) => {
 try {
    let notificationsData = req.body;

    if (Array.isArray(notificationsData)) {
      const newNotifications = await Notification.insertMany(notificationsData);
      return res.status(201).json(newNotifications);
    }

    const newNotification = new Notification(notificationsData);
    await newNotification.save();
    res.status(201).json(newNotification);
  } catch (error) {
    console.error("Lỗi khi tạo thông báo:", error);
    res.status(500).json({ message: "Lỗi khi tạo thông báo", error: error.message });
  }
};
