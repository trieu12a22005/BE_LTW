const mongoose = require("mongoose");

const NotificationsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    type: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationsSchema);
