const Post = require("../models/post.model");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Comment = require("../models/comment.model");
const mongoose = require("mongoose");
const Category = require("../models/category.model");
const { findById } = require("../models/document.model");

// Lấy danh sách posts 
exports.getPosts = async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    if (user.role !== "admin") {
      query.check = "accept";
    }

    const posts = await Post.find(query);
    res.json(posts);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách bài viết",
      error: error.message
    });
  }
};


// Lọc post theo trạng thái check
exports.getPostByCheck = async (req, res) => {
  try {
    const { status } = req.params; // "waiting", "accept", "delete"
    const posts = await Post.find({ check: status }).populate("author");
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lọc bài viết", error: error.message });
  }
};

// Tạo post mới
exports.createPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    let { title, content, category } = req.body;

    if (!Array.isArray(category) || category.length === 0) {
      return res.status(400).json({ message: "Danh mục không hợp lệ" });
    }

    // Đảm bảo category có dạng [{ categoryId: "id1" }, { categoryId: "id2" }]
    const formattedCategory = category.map(id => ({ categoryId: id }));

    const newPost = new Post({
      title,
      content,
      category: formattedCategory,
      author: userId
    });

    await newPost.save();
    res.status(201).json({ message: "Tạo bài viết thành công", post: newPost });
  } catch (error) {
    console.error("Lỗi khi tạo bài viết:", error);
    res.status(500).json({ message: "Lỗi khi tạo bài viết", error: error.message });
  }
};


// Sửa bài viết (title, content, category) -- chính chủ
exports.updatePost = async (req, res) => {
  try {
    const { idPost } = req.params;
    const { title, content, category } = req.body;
    const userId = req.user.userId;

    const post = await Post.findById(idPost);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    if (post.author !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền sửa bài viết này" });
    }

    if (!Array.isArray(category) || category.length === 0) {
      return res.status(400).json({ message: "Danh mục không hợp lệ" });
    }

    const formattedCategory = category.map(id => ({ categoryId: id }));

    post.title = title;
    post.content = content;
    post.category = formattedCategory;

    await post.save();

    res.json({ message: "Cập nhật bài viết thành công", post });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật bài viết", error: error.message });
  }
};


//thay đổi chế độ check (chỉ admin)
exports.updatePostCheck = async (req, res) => {
  try {
    const { idPost } = req.params;
    const { check } = req.body;

    const validChecks = ["waiting", "accept", "delete"];
    if (!validChecks.includes(check)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const post = await Post.findById(idPost);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    post.check = check;
    await post.save();

    res.json({ message: "Cập nhật trạng thái thành công", post });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái", error: error.message });
  }
};


// Xoá bài viết (admin hoặc chính chủ)
exports.deletePost = async (req, res) => {
  try {
    const { idPost } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const post = await Post.findById(idPost);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    if (post.author !== userId && userRole !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền xoá bài viết này" });
    }

    post.check = "delete";
    await post.save();

    //Xóa các bình luận liên quan
    await Comment.deleteMany({
      toDocOrPost: idPost
    });

    res.json({ message: "Bài viết đã bị đánh dấu xoá", post });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xoá bài viết", error: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const {
      postId
    } = req.params;
    const {
      commentId
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        message: "ID không hợp lệ"
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        message: "Không tìm thấy comment"
      });
    }

    if (comment.toDocOrPost !== postId) {
      return res.status(400).json({
        message: "Comment không thuộc post này"
      });
    }

    if (comment.toReply) {
      return res.status(400).json({
        message: "Không thể thêm reply vào post"
      });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId, {
        $push: {
          comments: {
            commentsId: commentId
          }
        }
      }, {
        new: true
      }
    );

    if (!updatedPost) {
      return res.status(404).json({
        message: "Không tìm thấy bài viết"
      });
    }

    res.status(200).json({
      message: "Đã thêm comment vào post",
      post: updatedPost
    });
  } catch (error) {
    console.error("Lỗi addComment:", error);
    res.status(500).json({
      message: "Lỗi khi thêm comment",
      error: error.message
    });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const {
      idPost
    } = req.params;
    const user = await User.findById( req.user.userId)

    const post = await Post.findById(idPost);
    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài viết"
      });
    }

    // Nếu không phải admin và bài đã bị xoá → ẩn nội dung
    if (post.check === "delete" && user.role !== "admin") {
      return res.status(200).json({
        post: {
          _id: post._id,
          title: "Bài viết đã bị xoá",
          content: "",
          category: post.category,
          author: post.author,
          check: post.check,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt
        }
      });
    }

    // Nếu là admin hoặc bài chưa bị xoá → trả về đầy đủ
    res.status(200).json({
      post
    });

  } catch (error) {
    console.error("Lỗi khi lấy bài viết theo ID:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy bài viết",
      error: error.message
    });
  }
};

exports.toggleLikePost = async (req, res) => {
  try {
    const {
      idPost
    } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(idPost);
    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài viết"
      });
    }

    const index = post.likes.findIndex(like => like.idUser === userId);

    if (index !== -1) {
      // Đã like → unlike
      post.likes.splice(index, 1);
      post.likesCount = post.likes.length;

      await post.save();
      return res.status(200).json({
        message: "Đã bỏ like bài viết",
        liked: false,
        likesCount: post.likesCount
      });
    } else {
      // Chưa like → thêm like
      post.likes.push({
        idUser: userId
      });
      post.likesCount = post.likes.length;

      await post.save();
      return res.status(200).json({
        message: "Đã like bài viết",
        liked: true,
        likesCount: post.likesCount
      });
    }

  } catch (error) {
    console.error("Lỗi toggle like:", error);
    res.status(500).json({
      message: "Lỗi server khi toggle like",
      error: error.message
    });
  }
};
