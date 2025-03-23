const mongoose = require("mongoose");

const PostsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    comments: { type: [mongoose.Schema.Types.ObjectId], ref: "Comment", default: [] },
    category: { type: String, required: true },
    views: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", PostsSchema);
