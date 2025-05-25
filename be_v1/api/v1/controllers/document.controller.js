const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const User = require("../models/user.model");
const Document = require("../models/document.model");

// Supabase config
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const BUCKET_NAME = process.env.BUCKET_NAME;

// Multer memoryStorage (upload lên RAM)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Danh sách loại file hợp lệ
const allowedMIMETypes = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg", "image/png", "image/gif", "image/webp"
];

exports.uploadMiddleware = upload.single("file");

exports.uploadFile = async (req, res) => {
  try {
    const { title, description, type, category } = req.body;
    const user = await User.findOne({ _id: req.user.userId, deleted: false });
    if (!user) return res.status(403).json({ error: "Người dùng không tồn tại hoặc đã bị xóa." });

    if (!req.file) return res.status(400).json({ error: "Vui lòng chọn file để upload!" });
    if (!allowedMIMETypes.includes(req.file.mimetype))
      return res.status(400).json({ error: "Chỉ cho phép upload PDF, PPT, PPTX, JPG, PNG, GIF, WEBP." });

    // Xử lý category
    let categoryArr = [];
    if (category) {
      if (typeof category === "string") {
        try { categoryArr = JSON.parse(category); }
        catch { categoryArr = [{ categoryId: category }]; }
      } else if (Array.isArray(category)) {
        categoryArr = category.map(id => ({ categoryId: id }));
      }
    }

    const fileName = `uploads/${Date.now()}-${req.file.originalname}`;
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
    if (error) return res.status(500).json({ error: "Lỗi upload lên Supabase." });

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    const fileUrl = publicUrlData.publicUrl;

    const document = new Document({ title, description, type, category: categoryArr, fileUrl, uploadedBy: user.userId });
    await document.save();
    res.status(200).json({ message: "Upload thành công!", document });

  } catch (error) {
    console.error("Lỗi upload:", error);
    res.status(500).json({ error: "Lỗi server khi upload file." });
  }
};

// 📚 Các API khác: listDocs, detailDoc, editDoc, deleteDoc, filterDocuments, getDocByIdUser, findDoc
// Giữ nguyên logic bạn viết, chỉ xóa các import thừa và thêm bảo vệ
exports.listDocs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1, limit = 9, skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      Document.find({ check: "accept" }).skip(skip).limit(limit),
      Document.countDocuments({ check: "accept" })
    ]);
    res.json({ total, page, pages: Math.ceil(total / limit), count: documents.length, documents });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

exports.detailDoc = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Không tìm thấy tài liệu" });
    res.json({ document: doc });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

exports.editDoc = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    const user = await User.findById(req.body.userId);
    if (!doc) return res.status(404).json({ message: "Không tìm thấy tài liệu" });
    if (user.userId !== doc.uploadedBy && user.role !== "admin")
      return res.status(403).json({ message: "Không có quyền chỉnh sửa" });

    if (req.body.category) {
      let categoryArr = [];
      if (typeof req.body.category === "string") {
        try { categoryArr = JSON.parse(req.body.category); }
        catch { categoryArr = [{ categoryId: req.body.category }]; }
      } else if (Array.isArray(req.body.category)) {
        categoryArr = req.body.category.map(id => ({ categoryId: id }));
      }
      req.body.category = categoryArr;
    }

    const updatedDoc = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ message: "Cập nhật thành công", updatedDoc });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

exports.deleteDoc = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    const user = await User.findById(req.body.userId);
    if (!doc) return res.status(404).json({ message: "Không tìm thấy tài liệu" });
    if (user.userId !== doc.uploadedBy && user.role !== "admin")
      return res.status(403).json({ message: "Không có quyền xóa" });

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: "Xóa tài liệu thành công" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

exports.filterDocuments = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== "admin") return res.status(403).json({ message: "Không có quyền này" });

    const { check } = req.params;
    const filter = check && ["waiting", "reject", "accept"].includes(check) ? { check } : {};
    const documents = await Document.find(filter);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi lọc tài liệu" });
  }
};

exports.getDocByIdUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.idUser);
    if (!targetUser || targetUser.deleted) return res.status(404).json({ message: "Không tìm thấy người dùng." });
    const currentUser = await User.findById(req.user.userId);
    const query = { uploadedBy: targetUser._id };
    if (currentUser.role !== "admin" && currentUser._id.toString() !== req.params.idUser) query.check = "accept";
    const documents = await Document.find(query);
    res.json({ message: "Lấy tài liệu thành công", count: documents.length, documents });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

exports.findDoc = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Vui lòng nhập từ khóa." });
    const regex = new RegExp(query, "i");
    const filter = { $or: [{ title: regex }, { description: regex }, { "category.categoryId": query }] };
    const page = parseInt(req.query.page) || 1, limit = 9, skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      Document.find(filter).skip(skip).limit(limit),
      Document.countDocuments(filter)
    ]);
    res.json({ total, page, pages: Math.ceil(total / limit), count: documents.length, documents });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};
