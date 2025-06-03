const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { // người nhận thông báo
    type: String,
    required: true,
    ref: "User"
  },
  title: { // tiêu đề thông báo
    type: String,
    required: true
  },
  message: { // nội dung thông báo
    type: String,
    required: true
  },
  isRead: { // trạng thái đã đọc hay chưa
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Notification = mongoose.model("Notification", notificationSchema, "notifications");

module.exports = Notification;
