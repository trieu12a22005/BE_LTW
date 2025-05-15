const mongoose = require("mongoose");

const PostsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String},
    category:[
      {
        categoryId: { type: String, required: true },
        _id: false
      }
    ],
    views: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    check: {type: String, enum: ["waiting", "delete", "accept"], default: "waiting"},
    comments: [
      {
        commentsId: {type: String, required:true },
        _id: false
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", PostsSchema, "posts");