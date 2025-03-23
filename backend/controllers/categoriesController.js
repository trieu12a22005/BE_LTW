const Category = require("../models/categories");

// Lấy danh sách categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách categories" });
  }
};

// Tạo category mới
exports.createCategory = async (req, res) => {
  const { name, type, description } = req.body;
  try {
    const newCategory = new Category({ name, type, description });
    await newCategory.save();
    res.json(newCategory);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo category" });
  }
};
