const Document = require("../models/documents");

// Lấy danh sách documents
exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find().populate("uploadedBy");
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách documents" });
  }
};

// Tạo document mới
exports.createDocument = async (req, res) => {
  const { title, description, fileUrl, uploadedBy, type, category } = req.body;
  try {
    const newDocument = new Document({ title, description, fileUrl, uploadedBy, type, category });
    await newDocument.save();
    res.json(newDocument);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo document" });
  }
};
