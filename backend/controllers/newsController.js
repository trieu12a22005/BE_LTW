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
  try {
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
