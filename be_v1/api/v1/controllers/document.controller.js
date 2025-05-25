const Document = require("../models/document.model");
const express = require("express");
const fs = require("fs");
const User = require("../models/user.model");
const Category = require("../models/category.model");
const path = require("path");
const mongoose = require("mongoose");
const Comment = require("../models/comment.model");
const multer = require("multer");
const {
  createClient
} = require("@supabase/supabase-js");
const {
  query
} = require("express-validator");
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
    const user = req.user;
    if (!req.file) {
      return res.status(400).json({
        error: "Vui lòng chọn file để upload!"
      });
    }
    let categoryArr = [];
    if (category) {
      if (typeof category === "string") {
        try {
          const parsed = JSON.parse(category);
          categoryArr = parsed.map(item => ({
            categoryId: new mongoose.Types.ObjectId(item.categoryId || item)
          }));
        } catch {
          categoryArr = [{
            categoryId: new mongoose.Types.ObjectId(category)
          }];
        }
      } else if (Array.isArray(category)) {
        categoryArr = category.map(id => ({
          categoryId: new mongoose.Types.ObjectId(id)
        }));
      }
    }

    // kiem tra category co hop le khong
    const categoryIds = categoryArr.map(c => c.categoryId);
    const foundCategories = await Category.find({
      _id: {
        $in: categoryIds
      }
    });
    if (foundCategories.length !== categoryIds.length) {
      return res.status(400).json({
        error: "categoryId không tồn tại, vui lòng kiểm tra lạilại."
      });
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
      //Subject,
      category: categoryArr,
      fileUrl,
      uploadedBy: user.userId,
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
    const documents = await Document.find({
      check: "accept"
    });
    res.json(documents);
  } catch (error) {
    console.error("Lỗi upload file:", error);
    res.status(500).json({
      error: "Lỗi khi upload file"
    });
  }
}
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
          const parsed = JSON.parse(updateData.category);
          categoryArr = parsed.map(item => ({
            categoryId: new mongoose.Types.ObjectId(item.categoryId || item)
          }));
        } catch {
          categoryArr = [{
            categoryId: new mongoose.Types.ObjectId(updateData.category)
          }];
        }
      } else if (Array.isArray(updateData.category)) {
        categoryArr = updateData.category.map(id => ({
          categoryId: new mongoose.Types.ObjectId(id)
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
    const user_id = req.user.userId
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

    if (currentUser.role !== "admin" && currentUser._id.toString() !== idUser) {
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

exports.getByCategory = async (req, res) => {
  try {
    const {
      categoryId
    } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        message: "categoryId không hợp lệ."
      });
    }

    const query = {
      category: {
        $elemMatch: {
          categoryId: new mongoose.Types.ObjectId(categoryId)
        }
      }
    };
    const user = await User.findById(req.user.userId);

    if (user.role !== "admin") {
      query.check = "accept";
    }

    const documents = await Document.find(query).sort({
      createdAt: -1 //sap tai lieu moi len dau
    });;

    if (documents.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy tài liệu thuộc category này."
      });
    }

    res.status(200).json({
      user: req.user,
      message: "Lấy tài liệu theo danh mục thành công.",
      count: documents.length,
      documents
    });

  } catch (error) {
    console.error("Lỗi khi tìm tài liệu theo category:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    const {
      docId
    } = req.params;
    const {
      commentId
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(docId) || !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        message: "ID không hợp lệ"
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        message: "Không tìm thấy comment"
      });
    }

    if (comment.toDocOrPost !== docId) {
      return res.status(400).json({
        message: "Comment không thuộc document này"
      });
    }

    if (comment.toReply) {
      return res.status(400).json({
        message: "Không thể thêm reply vào document"
      });
    }

    const updatedDoc = await Document.findByIdAndUpdate(
      docId, {
        $push: {
          comments: {
            commentsId: commentId
          }
        }
      }, {
        new: true
      }
    );

    if (!updatedDoc) {
      return res.status(404).json({
        message: "Không tìm thấy document"
      });
    }

    res.status(200).json({
      message: "Đã thêm comment vào document",
      document: updatedDoc,
    });
  } catch (error) {
    console.error("Lỗi addComment:", error);
    res.status(500).json({
      message: "Lỗi khi thêm comment",
      error: error.message
    });
  }
};