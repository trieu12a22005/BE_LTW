const Document = require("../models/document.model");
const express = require("express");
const fs = require("fs");
const User = require("../models/user.model");
const path = require("path");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const BUCKET_NAME = process.env.BUCKET_NAME;

const storage = multer.memoryStorage();
const upload = multer({ storage });
exports.uploadMiddleware = upload.single("file");

const allowedMIMETypes = [
  "application/pdf", "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg", "image/png", "image/gif", "image/webp"
];

exports.uploadFile = async (req, res) => {
  try {
    const { title, description, type, category, Subject } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(403).json({ error: "Người dùng không tồn tại" });
    if (!req.file) return res.status(400).json({ error: "Vui lòng chọn file để upload!" });
    if (!allowedMIMETypes.includes(req.file.mimetype))
      return res.status(400).json({ error: "File không hợp lệ" });

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
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });
    if (error) return res.status(500).json({ error: "Lỗi upload Supabase" });

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    const fileUrl = publicUrlData.publicUrl;

    const document = new Document({
      title,
      description,
      type,
      Subject,  // ✅ Nếu schema yêu cầu
      category: categoryArr,
      fileUrl,
      uploadedBy: user._id  // ✅ ObjectId
    });
    await document.save();

    res.status(200).json({ message: "Upload thành công!", document });
  } catch (error) {
    console.error("Lỗi upload:", error);
    res.status(500).json({ error: error.message });
  }
};
module.exports.listDocs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      Document.find({ check: "accept" }).skip(skip).limit(limit),
      Document.countDocuments({ check: "accept" })
    ]);

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      count: documents.length,
      documents
    });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};
module.exports.detailDoc = async (req, res) => {
  try {
    const doc_id = req.params.id;
    if (!doc_id) {
      return res.status(400).json({
        message: "Không có id tài liệu"
      });
    }
    const document = await Document.findById(
      doc_id
    )
    if (!document) {
      return res.status(404).json({
        message: "Không tìm thấy tài liệu"
      });
    }
    res.status(200).json({
      document
    })
  } catch (error) {
    console.error("Lỗi upload file:", error);
    res.status(500).json({
      error: "Lỗi"
    });
  }
}
module.exports.editDoc = async (req, res) => {
  try {
    const doc_id = req.params.id;
    const user_id = req.body.userId;
    const updateData = req.body;
    const user = await User.findById(
      user_id
    )
    if (!doc_id) {
      return res.status(400).json({
        message: "Không có id tài liệu"
      })
    }
    const document = await Document.findById(
      doc_id
    )
    if (!document) {
      return res.status(404).json({
        message: "Không tìm thấy tài liệu"
      });
    }
    if (user.userId !== document.uploadedBy && user.role !== "admin") {
      return res.status(403).json({
        message: "Bạn không có quyền chỉnh sửa tài liệu này"
      })
    }
    const updatedDoc = await Document.findByIdAndUpdate(doc_id, updateData, {
      new: true, // Trả về dữ liệu sau khi cập nhật
      runValidators: true, // Kiểm tra validation của schema
    });
    if (!updatedDoc) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy tài liệu để cập nhật",
      });
    }
    if (updateData.category) {
      let categoryArr = [];
      if (typeof updateData.category === "string") {
        try {
          categoryArr = JSON.parse(updateData.category);
        } catch {
          categoryArr = [{
            categoryId: updateData.category
          }];
        }
      } else if (Array.isArray(updateData.category)) {
        categoryArr = updateData.category.map(id => ({
          categoryId: id
        }));
      }
      updateData.category = categoryArr;
    }
    res.json({
      code: 200,
      message: "Cập nhật thành công",
      updatedDoc,
    });

  } catch (error) {
    console.error("Lỗi cập nhật file:", error);
    res.status(500).json({
      error: "Lỗi"
    });
  }
}
module.exports.deleteDoc = async (req, res) => {
  try {
    const doc_id = req.params.id;
    const user_id = req.body.userId;
    const user = await User.findById(
      user_id
    )
    if (!doc_id) {
      return res.status(400).json({
        message: "Không có id tài liệu"
      })
    }
    const document = await Document.findById(
      doc_id
    )
    if (!document) {
      return res.status(404).json({
        message: "Không tìm thấy tài liệu"
      });
    }
    if (user.userId !== document.uploadedBy && user.role != "admin") {
      return res.status(403).json({
        message: "Bạn không có quyền xóa tài liệu này"
      })
    }
    const DeleteDoc = await Document.findByIdAndDelete(doc_id);
    if (!DeleteDoc) {
      return res.status(400).json({
        message: "Không tìm thấy tài liệu đã xóa"
      })
    }
    res.status(200).json({
      code: 200,
      message: "xóa tài liệu thành công"
    })
  } catch (error) {
    console.error("Lỗi xóa file:", error);
    res.status(500).json({
      error: "Lỗi"
    });
  }
}
exports.filterDocuments = async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (user.role !== "admin") {
    return res.status(403).json({
      message: "Bạn không có quyền này"
    })
  }
  try {
    const {
      check
    } = req.params;
    const filter = {};
    if (check && ["waiting", "reject", "accept"].includes(check)) {
      filter.check = check;
    }

    const documents = await Document.find(filter);
    res.json(documents);
  } catch (err) {
    console.error("Lỗi lọc tài liệu:", err);
    res.status(500).json({
      message: "Lỗi server khi lọc tài liệu"
    });
  }
};

exports.getDocByIdUser = async (req, res) => {
  try {
    const {
      idUser
    } = req.params;
    // Tìm thông tin người dùng cần xem các danh sách tài liệu của họhọ
    const targetUser = await User.findById(idUser);
    if (!targetUser || targetUser.deleted) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng."
      });
    }

    // Người đang đăng nhập (từ token middleware)
    const currentUser = await User.findById(req.user.userId);

    let query = {
      uploadedBy: targetUser._id
    };

    if (currentUser.role !== "admin" && currentUser._id.toString() !== idUser){
      query.check = "accept";
    }

    const documents = await Document.find(query);

    res.status(200).json({
      message: "Lấy danh sách tài liệu thành công",
      count: documents.length,
      documents
    });

  } catch (error) {
    console.error("Lỗi khi lấy tài liệu theo người dùng:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
}
exports.findDoc = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Vui lòng nhập từ khóa tìm kiếm." });
    }

    const regex = new RegExp(query, "i");
    const filter = {
      $or: [
        { title: { $regex: regex } },
        { description: { $regex: regex } },
        { "category.categoryId": query }
      ]
    };

    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      Document.find(filter).skip(skip).limit(limit),
      Document.countDocuments(filter)
    ]);

    res.status(200).json({
      total,
      page,
      pages: Math.ceil(total / limit),
      count: documents.length,
      documents
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};