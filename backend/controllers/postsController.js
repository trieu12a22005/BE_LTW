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
  try {
      let postsData = req.body;

      if (Array.isArray(postsData)) {
        const newPosts = await Post.insertMany(postsData);
        return res.status(201).json(newPosts);
      }

      const newPost = new Post(postsData);
      await newPost.save();
      res.status(201).json(newPost);
    } catch (error) {
      console.error("Lỗi khi tạo bài viết:", error);
      res.status(500).json({ message: "Lỗi khi tạo bài viết", error: error.message });
    }
};
