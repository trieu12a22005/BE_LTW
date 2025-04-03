const mongoose = require("mongoose");

const PostsSchema = new mongoose.Schema(
  {
    title: { type: String, require: true },
    content: { type: String, require: true },
    author: { type: String},
    subject: { type: String, required: true },
    views: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    check: {type: String, enum: ["waiting", "delete", "accept"], default: "waiting"}
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", PostsSchema, "posts");