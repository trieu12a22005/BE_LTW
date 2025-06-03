const Notification = require("../models/notification.model");

exports.createNotification = async (req, res) => {
  try {
    const {
      userId,
      title,
      message
    } = req.body;
    const notification = new Notification({
      userId,
      title,
      message
    });
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi tạo thông báo",
      error
    });
  }
};

exports.getNotificationsByUser = async (req, res) => {
  try {
    const userId = req.user.userId; // lấy từ verifyToken
    const notifications = await Notification.find({
      userId
    }).sort({
      createdAt: -1
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy thông báo",
      error
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const {
      id
    } = req.params; // id thông báo
    const notification = await Notification.findByIdAndUpdate(id, {
      isRead: true
    }, {
      new: true
    });
    if (!notification) return res.status(404).json({
      message: "Không tìm thấy thông báo"
    });
    res.json(notification);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi cập nhật trạng thái",
      error
    });
  }
};
