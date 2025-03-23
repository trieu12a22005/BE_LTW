const News = require("../models/news");

// Lấy danh sách news
exports.getNews = async (req, res) => {
  try {
    const news = await News.find().populate("author");
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách news" });
  }
};

// Tạo news mới
exports.createNews = async (req, res) => {
  const { title, content, author, tags } = req.body;
  try {
    const newNews = new News({ title, content, author, tags });
    await newNews.save();
    res.json(newNews);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo news" });
  }
};
