const Category = require("../models/category.model");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Document = require("../models/document.model");
const Post = require("../models/post.model");
const mongoose = require("mongoose");

// Lấy tất cả category
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({
            createdAt: -1
        });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({
            message: "Lỗi khi lấy danh sách danh mục",
            error: error.message
        });
    }
};

// Tạo danh mục mới
exports.createCategory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            name,
            description
        } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({
                message: "Tên danh mục không được để trống"
            });
        }

        const existing = await Category.findOne({
            name: name.trim()
        });
        if (existing) {
            return res.status(400).json({
                message: "Tên danh mục đã tồn tại"
            });
        }

        const category = new Category({
            name: name.trim(),
            description: description?.trim() || "",
            createBy: userId
        });

        await category.save();

        res.status(201).json({
            message: "Tạo danh mục thành công",
            category
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi khi tạo danh mục",
            error: error.message
        });
    }
};

// Cập nhật danh mục (người dùng tự cập nhật danh mục của mình)
exports.updateCategory = async (req, res) => {
    try {
        const categoryId = req.params.idCategory;
        const userId = req.user.userId;
        const {
            name,
            description
        } = req.body;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                message: "Không tìm thấy danh mục"
            });
        }

        if (category.createBy !== userId) {
            return res.status(403).json({
                message: "Bạn không có quyền sửa danh mục này"
            });
        }

        if (name && name.trim() !== "") {
            const nameExists = await Category.findOne({
                name: name.trim(),
                _id: {
                    $ne: categoryId
                }
            });
            if (nameExists) {
                return res.status(400).json({
                    message: "Tên danh mục đã tồn tại"
                });
            }
            category.name = name.trim();
        }

        if (description !== undefined) {
            category.description = description.trim();
        }

        await category.save();

        res.status(200).json({
            message: "Cập nhật danh mục thành công",
            category
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi khi cập nhật danh mục",
            error: error.message
        });
    }
};

// Xóa danh mục (người tạo mới được xóa)
exports.deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.idCategory;
        const userId = req.user.userId;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                message: "Không tìm thấy danh mục"
            });
        }

        if (category.createBy !== userId) {
            return res.status(403).json({
                message: "Bạn không có quyền xóa danh mục này"
            });
        }

        await Category.findByIdAndDelete(categoryId);

        res.status(200).json({
            message: "Xóa danh mục thành công"
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi khi xóa danh mục",
            error: error.message
        });
    }
};

// ADMIN cập nhật danh mục
exports.updateCategoryByAmdin = async (req, res) => {
    try {
        const categoryId = req.params.idCategory;
        const {
            name,
            description
        } = req.body;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                message: "Không tìm thấy danh mục"
            });
        }

        if (name && name.trim() !== "") {
            const nameExists = await Category.findOne({
                name: name.trim(),
                _id: {
                    $ne: categoryId
                }
            });
            if (nameExists) {
                return res.status(400).json({
                    message: "Tên danh mục đã tồn tại"
                });
            }
            category.name = name.trim();
        }

        if (description !== undefined) {
            category.description = description.trim();
        }

        await category.save();

        res.status(200).json({
            message: "ADMIN cập nhật danh mục thành công",
            category
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi ADMIN khi cập nhật danh mục",
            error: error.message
        });
    }
};

// ADMIN xóa danh mục
exports.deleteCategoryByAdmin = async (req, res) => {
    try {
        const categoryId = req.params.idCategory;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                message: "Không tìm thấy danh mục"
            });
        }

        await Category.findByIdAndDelete(categoryId);

        res.status(200).json({
            message: "ADMIN đã xóa danh mục thành công"
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi ADMIN khi xóa danh mục",
            error: error.message
        });
    }
};

// Lấy thông tin category theo id
exports.getCategoryById = async (req, res) => {
    try {
        const categoryId = req.params.idCategory;
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                message: "idCategory không hợp lệ."
            });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                message: "Không tìm thấy danh mục."
            });
        }

        res.status(200).json({
            message: "Lấy danh mục thành công",
            category
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi khi lấy danh mục",
            error: error.message
        });
    }
};

// Hàm xóa dấu và chuyển về lower-case
function normalizeText(text) {
    return text.normalize('NFD') // tách dấu
        .replace(/[\u0300-\u036f]/g, '') // xóa dấu
        .replace(/đ/g, 'd').replace(/Đ/g, 'D') // thay đ và Đ
        .toLowerCase(); // về chữ thường
}

// Tìm category theo name hoặc description (query param: q)
exports.findCategory = async (req, res) => {
    try {
        const {
            q
        } = req.query;
        if (!q || q.trim() === "") {
            return res.status(400).json({
                message: "Vui lòng cung cấp từ khóa tìm kiếm (q)."
            });
        }

        const normalizedQ = normalizeText(q);

        // Lấy tất cả category
        const categories = await Category.find();

        // Lọc thủ công các category có name hoặc description chứa từ khóa đã normalize
        const filtered = categories.filter(cat => {
            const nameNorm = normalizeText(cat.name || "");
            const descNorm = normalizeText(cat.description || "");
            return nameNorm.includes(normalizedQ) || descNorm.includes(normalizedQ);
        });

        if (filtered.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy danh mục phù hợp."
            });
        }

        res.status(200).json({
            total: filtered.length,
            categories: filtered
        });

    } catch (error) {
        res.status(500).json({
            message: "Lỗi khi tìm danh mục",
            error: error.message
        });
    }
};