const Comment = require("../models/comment.model");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Document = require("../models/document.model");
const Post = require("../models/post.model");

exports.getCommentById = async (req, res) => {
  try {
    const {
      toId
    } = req.params;
    const comment = await Comment.find({
      toDocOrPost: toId
    });
    res.json(comment);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách bình luận",
      error: error.message
    });
  }
};

exports.createComment = async (req, res) => {
  try {
    const {
      toId,
      type,
      reply
    } = req.params;
    const {
      content
    } = req.body;

    if (!["post", "doc"].includes(type)) {
      return res.status(400).json({
        message: "Type phải là 'post' hoặc 'doc'"
      });
    }

    if (!content || content.trim() === "") {
      return res.status(400).json({
        message: "Nội dung bình luận không được để trống"
      });
    }

    const newComment = new Comment({
      toDocOrPost: toId,
      idUser: req.user.userId,
      content,
      toReply: reply !== "null" ? reply : null
    });

    await newComment.save();

    if (type === "post") {
      await Post.findByIdAndUpdate(
        toId, {
          $inc: {
            commentsCount: 1
          }
        }, {
          new: true
        }
      );
    } else if (type === "doc" && reply === "null") {
      await Document.findByIdAndUpdate(
        toId, {
          $push: {
            comments: {
              commentsId: newComment._id
            }
          }
        }, {
          new: true
        }
      );
    }

    res.status(201).json({
      message: "Bình luận đã được tạo",
      comment: newComment
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi tạo bình luận",
      error: error.message
    });
  }
};


//xóa
exports.deleteComment = async (req, res) => {
  try {
    const {
      idComment
    } = req.params;

    const comment = await Comment.findById(idComment);

    if (!comment) {
      return res.status(404).json({
        message: "Không tìm thấy bình luận"
      });
    }

    // Chỉ cho xóa nếu là chủ comment hoặc admin
    if (comment.idUser !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Không có quyền xóa bình luận này"
      });
    }

    await Comment.findByIdAndDelete(idComment);
    if (comment && comment.toDocOrPost && req.params.type === "post") {
      await Post.findByIdAndUpdate(
        comment.toDocOrPost, {
          $inc: {
            commentsCount: -1
          }
        }, {
          new: true
        }
      );
    }

    res.json({
      message: "Xóa bình luận thành công"
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi xóa bình luận",
      error: error.message
    });
  }
};

//update comment
exports.updateComment = async (req, res) => {
  try {
    const {
      idComment
    } = req.params;
    const {
      content
    } = req.body;

    const comment = await Comment.findById(idComment);

    if (!comment) {
      return res.status(404).json({
        message: "Không tìm thấy bình luận"
      });
    }

    if (comment.idUser !== req.user.userId) {
      return res.status(403).json({
        message: "Không có quyền sửa bình luận này"
      });
    }

    comment.content = content;
    await comment.save();

    res.json({
      message: "Cập nhật bình luận thành công",
      comment
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi cập nhật bình luận",
      error: error.message
    });
  }
};