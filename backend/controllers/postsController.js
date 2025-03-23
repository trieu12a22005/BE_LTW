const Post = require("../models/posts");

// Lấy danh sách posts
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("author");
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách posts" });
  }
};

// Tạo post mới
exports.createPost = async (req, res) => {
  const { title, content, author, category } = req.body;
  try {
    const newPost = new Post({ title, content, author, category });
    await newPost.save();
    res.json(newPost);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo post" });
  }
};
