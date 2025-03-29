//const bcrypt = require("bcrypt"); // ✅ Import bcrypt
const Document = require("../models/document.model");
const Category = require("../models/category.model");
const jwt = require("jsonwebtoken");

// Lấy danh sách documents
exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find().populate("uploadedBy");
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách documents" });
  }
};
/* Lay danh sach theo bo loc   /documents?<collection>=<value>&<>=<>....
                               /documents?sortBy=<thuoctinh cua documents> "de sap xep theo tung tieu chi"
*/                                  
exports.getDocumentsByFilter = async (req, res) => {
try {
    let filter = {};

    if (req.query.category) filter.category = req.query.category; // Lọc theo danh mục
    if (req.query.type) filter.type = req.query.type; // Lọc theo loại tài liệu
    

    // Sắp xếp theo tiêu chí (lượt tải, lượt tương tác, ngày đăng)
    let sortOption = {};
    if (req.query.sortBy === "downloads") sortOption.downloadCount = -1;
    if (req.query.sortBy === "interactions") sortOption.interactionCount = -1;
    if (req.query.sortBy === "date") sortOption.createdAt = -1;

    // Lấy danh sách tài liệu với thông tin người đăng và danh mục
    const documents = await Document.find(filter)
      .populate("category", "name") // Lấy tên danh mục
      .populate("uploadedBy", "fullName") // Lấy tên người đăng
      .sort(sortOption)
      .limit(20); // Giới hạn 20 tài liệu mỗi lần gọi API

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách tài liệu", error });
  }
}

// Tạo document mới (can dang nhap)
exports.createDocument = async (req, res) => {
  console.log(req.cookies.token);
  try {
    let documentsData = req.body;

    if (Array.isArray(documentsData)) {
      const newDocuments = await Document.insertMany(documentsData);
      return res.status(201).json(newDocuments);
    }

    const newDocument = new Document(documentsData);
    await newDocument.save();
    res.status(201).json(newDocument);
  } catch (error) {
    console.error("Lỗi khi tạo tài liệu:", error);
    res.status(500).json({ message: "Lỗi khi tạo tài liệu", error: error.message });
  }
};

