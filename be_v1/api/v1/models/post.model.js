const mongoose = require("mongoose");

const PostsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String
  },
  category: [{
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    _id: false
  }],
  media: [{ // Mảng đính kèm (ảnh/video)
    url: {
      type: String
    },
    type: {
      type: String, // image, video
      enum: ["image", "video"],
    },
    _id: false
  }],
  views: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  check: {
    type: String,
    enum: ["waiting", "delete", "accept"],
    default: "waiting"
  },
  comments: [{
    commentsId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    _id: false
  }],
  likes: [{
    idUser: {
      type: String,
      required: true
    }
  }],
  likesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

PostsSchema.methods.updateLikesCount = function () {
  this.likesCount = this.likes.length;
};

module.exports = mongoose.model("Post", PostsSchema, "posts");