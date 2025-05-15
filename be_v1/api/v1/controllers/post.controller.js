const Post = require("../models/post.model");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Comment = require("../models/comment.model");
const Category = require("../models/category.model");

// Lấy danh sách posts 
exports.getPost = async (req, res) => {
  try {
    const posts = await Post.find({check: "accept"});
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách bài viết", error: error.message });
  }
};

exports.getPostAdmin = async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách bài viết", error: error.message });
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

    res.json({ message: "Bài viết đã bị đánh dấu xoá", post });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xoá bài viết", error: error.message });
  }
};
