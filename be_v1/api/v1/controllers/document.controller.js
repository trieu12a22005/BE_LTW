const Document = require("../models/document.model");
const express = require("express");
const User = require("../models/user.model");
const Category = require("../models/category.model");
const Comment = require("../models/comment.model");
const Report = require("../models/report.model");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const {
  createClient
} = require("@supabase/supabase-js");
const axios = require("axios");


const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const BUCKET_NAME = process.env.BUCKET_NAME;

const storage = multer.memoryStorage();
const upload = multer({
  storage
});
exports.uploadMiddleware = upload.single("file");

const allowedMIMETypes = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp"
];

exports.uploadFile = async (req, res) => {
  try {

    const {
      title,
      description,
      type,
      category
    } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(403).json({
      error: "Người dùng không tồn tại"
    });
    if (!req.file) return res.status(400).json({
      error: "Vui lòng chọn file để upload!"
    });
    if (!allowedMIMETypes.includes(req.file.mimetype))
      return res.status(400).json({
        error: "File không hợp lệ"
      });

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
        error: "categoryId không tồn tại, vui lòng kiểm tra lại."
      });
    }

    const fileName = `uploads/${Date.now()}-${req.file.originalname}`;
    const {
      error
    } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });
    if (error) return res.status(500).json({
      error: "Lỗi upload Supabase"
    });

    const {
      data: publicUrlData
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    const fileUrl = publicUrlData.publicUrl;
    // them dinh tuyen url:
    const slugify = (str) =>
      str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const createdAt = new Date(); // thời điểm tạo
    const dateStr = createdAt.toISOString().split("T")[0]; // yyyy-mm-dd
    const slug = `${slugify(title)}-${dateStr}`;

    const document = new Document({
      title,
      description,
      type,
      //Subject,  // Thêm nếu schema yêu cầu
      category: categoryArr,
      fileUrl,
      uploadedBy: user._id,
      slug,
      createdAt
    });
    await document.save();

    res.status(200).json({
      message: "Upload thành công!",
      document
    });
  } catch (error) {
    console.error("Lỗi upload:", error);
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports.listDocs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      Document.find({
        check: "accept"
      }).skip(skip).limit(limit),
      Document.countDocuments({
        check: "accept"
      })
    ]);

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      count: documents.length,
      documents
    });
  } catch (error) {
    res.status(500).json({
      error: "Lỗi server"
    });
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

    const document = await Document.findById(doc_id);
    if (!document) {
      return res.status(404).json({
        message: "Không tìm thấy tài liệu"
      });
    }

    // Mặc định: chỉ cho xem tài liệu đã duyệt (check === "accept")
    let isAdmin = false;
    let isOwner = false;

    if (req.user && req.user.userId) {
      const user = await User.findById(req.user.userId);
      if (user) {
        isAdmin = user.role === "admin";
        isOwner = user._id.toString() === document.uploadedBy.toString();
      }
    }

    // Nếu không phải admin và tài liệu chưa được duyệt → chặn
    if (!isAdmin && document.check !== "accept") {
      return res.status(403).json({
        message: "Bạn không có quyền xem tài liệu này"
      });
    }

    // Tăng lượt xem nếu không phải admin và không phải chính chủ
    if (!isAdmin && !isOwner) {
      document.views += 1;
      await document.save();
    }

    res.status(200).json({
      document
    });

  } catch (error) {
    console.error("Lỗi khi lấy chi tiết tài liệu:", error);
    res.status(500).json({
      error: "Lỗi server"
    });
  }
};

module.exports.editDoc = async (req, res) => {
  try {
    const doc_id = req.params.id;
    const user_id = req.user.userId;
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

    // Chỉ admin mới được phép chỉnh sửa trạng thái "check"
    if (updateData.check && user.role !== "admin") {
      return res.status(403).json({
        message: "Bạn không có quyền thay đổi trạng thái tài liệu (check)."
      });
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
    if (updateData.title) {
      const slugify = (str) =>
        str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const createdAt = new Date(updatedDoc.createdAt);
      const dateStr = createdAt.toISOString().split("T")[0]; // yyyy-mm-dd
      updatedDoc.slug = `${slugify(updateData.title)}-${dateStr}`;
      await updatedDoc.save();
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

    // Xóa các bìnhh luận liên quan đến documentdocument
    await Comment.deleteMany({
      toDocOrPost: doc_id
    });

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

function normalizeText(text) {
  return text.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase();
}

exports.findDoc = async (req, res) => {
  try {
    const {
      query
    } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({
        message: "Vui lòng nhập từ khóa tìm kiếm."
      });
    }

    // const regex = new RegExp(query, 'i'); // Regex tìm kiếm không phân biệt hoa thường

    // // Xây dựng filter
    // const orConditions = [{
    //     title: {
    //       $regex: regex
    //     }
    //   },
    //   {
    //     description: {
    //       $regex: regex
    //     }
    //   }
    // ];

    // // Nếu query là ObjectId hợp lệ, thêm điều kiện categoryId
    // if (mongoose.Types.ObjectId.isValid(query)) {
    //   orConditions.push({
    //     "category.categoryId": mongoose.Types.ObjectId(query)
    //   });
    // }

    // const filter = {
    //   $or: orConditions
    // };

    // // Truy vấn dữ liệu
    // const [documents, total] = await Promise.all([
    //   Document.find(filter).skip(skip).limit(limit),
    //   Document.countDocuments(filter)
    // ]);

    // res.status(200).json({
    //   total, // Tổng số tài liệu
    //   page, // Trang hiện tại
    //   pages: Math.ceil(total / limit), // Tổng số trang
    //   count: documents.length, // Số tài liệu trong trang hiện tại
    //   documents // Danh sách tài liệu
    // });

    const normalizedQuery = normalizeText(query);

    // Lấy toàn bộ documents có thể tìm kiếm (nếu cần, có thể thêm filter check)
    let documents = await Document.find();

    // Lọc thủ công các document có title hoặc description đã normalize chứa normalizedQuery
    const filteredDocs = documents.filter(doc => {
      const titleNorm = normalizeText(doc.title || "");
      const descNorm = normalizeText(doc.description || "");
      return titleNorm.includes(normalizedQuery) || descNorm.includes(normalizedQuery);
    });

    // Phân trang thủ công
    const startIndex = (page - 1) * limit;
    const pagedDocs = filteredDocs.slice(startIndex, startIndex + limit);

    res.status(200).json({
      total: filteredDocs.length,
      page,
      pages: Math.ceil(filteredDocs.length / limit),
      count: pagedDocs.length,
      documents: pagedDocs
    });

  } catch (error) {
    console.error("Lỗi trong findDoc:", error);
    res.status(500).json({
      message: "Lỗi server",
      error
    });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const {
      category
    } = req.body;

    if (!category || (Array.isArray(category) && category.length === 0)) {
      return res.status(400).json({
        message: "Vui lòng cung cấp category hoặc danh sách category."
      });
    }

    const categoryIds = Array.isArray(category) ? category : [category];
    const categoryIdArray = categoryIds.map(id => new mongoose.Types.ObjectId(id.trim()));

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    // Sử dụng $all để yêu cầu chứa tất cả categoryId
    const query = {
      category: {
        $all: categoryIdArray.map(id => ({
          $elemMatch: {
            categoryId: id
          }
        }))
      }
    };

    const user = await User.findById(req.user.userId);
    if (user.role !== "admin") {
      query.check = "accept";
    }

    const [documents, total] = await Promise.all([
      Document.find(query).sort({
        createdAt: -1
      }).skip(skip).limit(limit),
      Document.countDocuments(query)
    ]);

    if (total === 0) {
      return res.status(200).json({
        message: "Không tìm thấy tài liệu chứa tất cả danh mục đã cung cấp.",
        total,
      });
    }

    res.status(200).json({
      message: "Lấy tài liệu theo danh mục thành công",
      total,
      page,
      pages: Math.ceil(total / limit),
      count: documents.length,
      documents
    });

  } catch (error) {
    console.error("Lỗi khi tìm tài liệu theo category:", error);
    res.status(500).json({
      message: "Lỗi server khi tìm tài liệu theo danh mục",
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
}

function removeVietnameseTones(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

exports.downloadDoc = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({
        message: "Không tìm thấy tài liệu"
      });
    }

    // Tăng lượt tải
    doc.downloadCount += 1;
    await doc.save();

    // Lấy nội dung file từ Supabase
    const response = await axios.get(doc.fileUrl, {
      responseType: "stream",
    });

    // // Lấy đuôi file từ URL
    // const urlPathEncoded = new URL(doc.fileUrl).pathname;
    // const urlPath = decodeURIComponent(urlPathEncoded);
    // const ext = path.extname(urlPath);

    // Lấy đuôi file từ URL gốc (không decode)
    const ext = path.extname(doc.fileUrl);

    // Xử lý title: chuyển về thường, bỏ dấu, thay khoảng trắng và ký tự đặc biệt
    let title = doc.title || 'file';
    title = title.toLowerCase();
    title = removeVietnameseTones(title);
    title = title.replace(/\s+/g, '-'); // khoảng trắng -> "-"
    title = title.replace(/[^a-z0-9_.-]/g, '_'); // ký tự đặc biệt -> "_"

    // Thêm đuôi file
    const safeFileName = title + ext;

    res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}"`);
    res.setHeader("Content-Type", response.headers["content-type"]);
    response.data.pipe(res);

  } catch (error) {
    console.error("Lỗi khi tải tài liệu:", error);
    res.status(500).json({
      message: "Không thể tải file",
      error: error.message,
    });
  }
};

exports.rateDocument = async (req, res) => {
  try {
    const {
      idDocument
    } = req.params; // ID tài liệu
    const {
      score
    } = req.body; // điểm đánh giá
    const userId = req.user.userId;

    // Kiểm tra điểm hợp lệ (số nguyên 1–5)
    if (!score || score < 1 || score > 5 || !Number.isInteger(score)) {
      return res.status(400).json({
        message: "Điểm đánh giá phải là số nguyên từ 1 đến 5"
      });
    }

    const document = await Document.findById(idDocument);
    if (!document) {
      return res.status(404).json({
        message: "Không tìm thấy tài liệu"
      });
    }

    // Kiểm tra đã đánh giá chưa
    const alreadyRated = document.ratings.some(r => r.idUser === userId);
    if (alreadyRated) {
      return res.status(403).json({
        message: "Bạn đã đánh giá tài liệu này rồi"
      });
    }

    // Chưa đánh giá => thêm vào
    document.ratings.push({
      idUser: userId,
      score
    });

    // Cập nhật điểm trung bình
    document.updateAverageRating();

    await document.save();

    res.status(200).json({
      message: "Đánh giá thành công",
      avgRating: document.avgRating,
      ratings: document.ratings
    });

  } catch (error) {
    console.error("Lỗi khi đánh giá tài liệu:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
};

exports.getReportsForDocument = async (req, res) => {
  try {
    const {
      idDocument
    } = req.params;
    const user = await User.findById(req.user.userId);
    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Bạn không có quyền."
      });
    }

    const reports = await Report.find({
      idDocument
    }).sort({
      createdAt: -1
    });
    res.status(200).json({
      total: reports.length,
      reports
    });
  } catch (error) {
    console.error("Lỗi lấy báo cáo:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy báo cáo cho document."
    });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const {
      idDocument
    } = req.params;
    const document = await Document.findById(idDocument);

    if (!document) {
      return res.status(404).json({
        message: "Không tìm thấy document."
      });
    }

    // Lấy danh sách categoryId từ document
    const categoryIds = document.category.map(cat => cat.categoryId);

    // Lấy chi tiết các category từ collection Category
    const categories = await Category.find({
      _id: {
        $in: categoryIds
      }
    }).sort({
      name: 1
    });

    res.status(200).json({
      total: categories.length,
      categories
    });
  } catch (error) {
    console.error("Lỗi lấy category của document:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy category của document."
    });
  }
};

exports.getDocBySlug = async (req, res) => {
  try {
    const {
      slug
    } = req.params;
    const document = await Document.findOne({
      slug
    });

    if (!document) return res.status(404).json({
      message: "Không tìm thấy tài liệu"
    });

    let isAdmin = false;
    let isOwner = false;

    // if (req.user ? .userId) {
    //   const user = await User.findById(req.user.userId);
    //   if (user) {
    //     isAdmin = user.role === "admin";
    //     isOwner = user._id.toString() === document.uploadedBy.toString();
    //   }
    // }
    if (req.user && req.user.userId) {
      const user = await User.findById(req.user.userId);
      if (user) {
        isAdmin = user.role === "admin";
        isOwner = user._id.toString() === document.uploadedBy.toString();
      }
    }

    if (!isAdmin && document.check !== "accept") {
      return res.status(403).json({
        message: "Bạn không có quyền xem tài liệu này"
      });
    }

    if (!isAdmin && !isOwner) {
      document.views += 1;
      await document.save();
    }

    res.status(200).json({
      document
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
};

module.exports.detailDocI = async (req, res) => {
  try {
    const doc_id = req.params.id;

    const document = await Document.findById(doc_id);
    if (!document || !document.slug) {
      return res.status(404).json({
        message: "Không tìm thấy tài liệu hoặc slug"
      });
    }

    // Nếu người dùng đang truy cập bằng ID → redirect về slug
    return res.redirect(`/api/v1/documents/${document.slug}`);
  } catch (error) {
    console.error("Lỗi khi redirect từ ID sang slug:", error);
    res.status(500).json({
      message: "Lỗi server khi redirect"
    });
  }
};
