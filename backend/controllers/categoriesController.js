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
 try {
    let categoriesData = req.body;

    if (Array.isArray(categoriesData)) {
      const newCategories = await Category.insertMany(categoriesData);
      return res.status(201).json(newCategories);
    }

    const newCategory = new Category(categoriesData);
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Lỗi khi tạo danh mục:", error);
    res.status(500).json({ message: "Lỗi khi tạo danh mục", error: error.message });
  }
};
