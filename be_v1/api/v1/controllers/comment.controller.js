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

    // Nếu reply khác "null", kiểm tra comment cha
    if (reply !== "null") {
      const parentComment = await Comment.findById(reply);
      if (!parentComment) {
        return res.status(404).json({
          message: "Không tìm thấy comment cha để reply"
        });
      }

      if (parentComment.isDelete) {
        return res.status(400).json({
          message: "Không thể reply vào comment đã bị xóa"
        });
      }
    }

    const newComment = new Comment({
      toDocOrPost: toId,
      idUser: req.user.userId,
      content,
      toReply: reply !== "null" ? reply : null
    });

    await newComment.save();

    if (type === "post") {
      const updateFields = {
        $inc: {
          commentsCount: 1
        }
      };
      if (reply === "null") {
        updateFields.$push = {
          comments: {
            commentsId: newComment._id
          }
        };
      }
      await Post.findByIdAndUpdate(toId, updateFields, {
        new: true
      });
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
      idComment,
      type
    } = req.params;

    const comment = await Comment.findById(idComment);
    if (!comment) {
      return res.status(404).json({
        message: "Không tìm thấy bình luận"
      });
    }

    if (comment.idUser !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Không có quyền xóa bình luận này"
      });
    }

    // ===== ĐỆ QUY: Đánh dấu tất cả bình luận con =====
    const markRecursive = async (parentId) => {
      const children = await Comment.find({
        toReply: parentId
      });
      for (const child of children) {
        child.isDelete = true;
        child.content = "Bình luận này đã bị xóa";
        await child.save();
        await markRecursive(child._id); // đệ quy tiếp
      }
    };

    // Đánh dấu comment cha
    comment.isDelete = true;
    comment.content = "Bình luận này đã bị xóa";
    await comment.save();

    // Đánh dấu tất cả con, cháu...
    await markRecursive(comment._id);

    // ===== XÓA THẬT: toàn bộ comment isDelete = true =====
    const result = await Comment.deleteMany({
      isDelete: true
    });

    // ===== Giảm chính xác commentsCount nếu là POST =====
    if (type === "post") {
      await Post.findByIdAndUpdate(comment.toDocOrPost, {
        $inc: {
          commentsCount: -result.deletedCount
        }
      });
    }

    res.json({
      message: `Đã xóa bình luận và ${result.deletedCount - 1} bình luận con`
    });

  } catch (error) {
    console.error("Lỗi khi xóa bình luận:", error);
    res.status(500).json({
      message: "Lỗi server khi xóa bình luận",
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