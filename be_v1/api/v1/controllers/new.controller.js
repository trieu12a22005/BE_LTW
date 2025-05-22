const News = require("../models/new.model");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

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
  try {
    const userId=req.user.userId;
    let newsData = req.body;

    if (Array.isArray(newsData)) {
      const newNews = await News.insertMany(newsData);
      return res.status(201).json(newNews);
    }
    const newNewsItem = new News(newsData);
    await newNewsItem.save();
    res.status(201).json(newNewsItem);
  } catch (error) {
    console.error("Lỗi khi tạo tin tức:", error);
    res.status(500).json({ message: "Lỗi khi tạo tin tức", error: error.message });
  }
};

// Xóa

// Lọc

//