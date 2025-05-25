const Document = require("../models/document.model");
const express = require("express");
const fs = require("fs");
const User = require("../models/user.model");
const path = require("path");
const multer = require("multer");
const {
  createClient
} = require("@supabase/supabase-js");
// Cấu hình Supabase
const SUPABASE_URL = "https://jcrxndjvwrxpuntjwkze.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjcnhuZGp2d3J4cHVudGp3a3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyODI5MTEsImV4cCI6MjA1ODg1ODkxMX0.3ld5pFFuF0FqWf5jR1Qe4hWOHLtBEYRx4udi1RHSF5c";
const BUCKET_NAME = "uitstudyshare"; // ✅ Đảm bảo tên bucket đúng
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Cấu hình Multer để lưu file tạm thời
const upload = multer({
  dest: "uploads/"
});

// Danh sách MIME types hợp lệ
const allowedMIMETypes = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
module.exports.upload = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      category
    } = req.body;
    const user = await User.findOne({
      _id: req.user.userId,
      deleted: false
    });
    if (!req.file) {
      return res.status(400).json({
        error: "Vui lòng chọn file để upload!"
      });
    }
    let categoryArr = [];
    if (category) {
      if (typeof category === "string") {
        try {
          categoryArr = JSON.parse(category);
        } catch {
          categoryArr = [{
            categoryId: category
          }];
        }
      } else if (Array.isArray(category)) {
        categoryArr = category.map(id => ({
          categoryId: id
        }));
      }
    }

    // Kiểm tra loại file có hợp lệ không
    if (!allowedMIMETypes.includes(req.file.mimetype)) {
      return res
        .status(400)
        .json({
          error: "Chỉ cho phép upload file PDF, PPT, PPTX, JPG, PNG, GIF, WEBP.",
        });
    }

    const filePath = req.file.path;
    const fileName = `uploads/${Date.now()}-${req.file.originalname}`;
    const fileStream = fs.createReadStream(filePath); // Dùng file stream thay vì buffer

    // Upload file lên Supabase Storage
    const {
      data,
      error
    } = await supabase.storage
      .from(BUCKET_NAME) // ✅ Sử dụng đúng bucket
      .upload(fileName, fileStream, {
        contentType: req.file.mimetype,
        duplex: "half",
      });

    if (error) {
      console.error("Lỗi upload:", error);
      return res
        .status(500)
        .json({
          error: "Lỗi khi upload file lên Supabase."
        });
    }
    // Lấy URL file từ Supabase
    const {
      data: publicUrlData
    } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);
    const fileUrl = publicUrlData.publicUrl;
    const document = new Document({
      title,
      description,
      type,
      category: categoryArr,
      fileUrl,
      uploadedBy:user.username,
    });

    await document.save();
    console.log("User đã tạo:", user);
    // Chỉ xóa file tạm sau khi upload thành công
    fs.unlinkSync(filePath);

    res.status(200).json({
      message: "Upload thành công!",
      document,
    });
  } catch (error) {
    console.error("Lỗi upload file:", error);
    res.status(500).json({
      error: "Lỗi khi upload file"
    });
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