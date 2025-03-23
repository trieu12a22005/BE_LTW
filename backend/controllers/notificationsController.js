const Notification = require("../models/notifications");

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
  const { userId, content, type } = req.body;
  try {
    const newNotification = new Notification({ userId, content, type });
    await newNotification.save();
    res.json(newNotification);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo notification" });
  }
};
