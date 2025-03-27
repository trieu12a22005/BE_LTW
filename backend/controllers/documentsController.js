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
