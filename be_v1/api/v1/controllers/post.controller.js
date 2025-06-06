const Post = require("../models/post.model");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Comment = require("../models/comment.model");
const mongoose = require("mongoose");
const Category = require("../models/category.model");
const {
  findById
} = require("../models/document.model");

const multer = require("multer");
const {
  createClient
} = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const BUCKET_NAME = process.env.BUCKET_NAME;

const storage = multer.memoryStorage();
const upload = multer({
  storage
});

exports.uploadMiddleware = upload.array("mediaFiles", 10); // max 10 files

const allowedMIMETypes = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "video/mp4", "video/mpeg", "video/quicktime"
];

// Lấy danh sách posts 
exports.getPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    let query = {};

    if (!user || user.role !== "admin") {
      query.check = "accept";
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find(query).sort({
        createdAt: -1
      }).skip(skip).limit(limit),
      Post.countDocuments(query)
    ]);

    if (total === 0) {
      return res.status(404).json({
        message: "Không tìm thấy bài viết nào trong hệ thống.",
        total: 0,
        posts: []
      });
    }

    // Tăng views cho các post trong trang này (nếu user không phải admin hoặc chính chủ)
    const updateViewsPromises = posts.map(async (post) => {
      if (user.role !== "admin" && user.userId !== post.author) {
        post.views += 1;
        return post.save();
      }
    });
    await Promise.all(updateViewsPromises);

    const postsWithAuthorNames = await Promise.all(
      posts.map(async (post) => {
        const author = await User.findById(post.author);
        return {
          ...post.toObject(),
          userNameAuthor: author ? author.username : "Không rõ",
          fullNameAuthor: author ? author.fullName : "Không rõ"
        };
      })
    );

    res.status(200).json({
      message: `Lấy danh sách bài viết thành công. Tổng số bài viết: ${total}.`,
      total,
      page,
      pages: Math.ceil(total / limit),
      //count: posts.length,
      count: postsWithAuthorNames.length,
      //posts
      posts: postsWithAuthorNames
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài viết:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách bài viết",
      error: error.message
    });
  }
};

// Lọc post theo trạng thái check
exports.getPostByCheck = async (req, res) => {
  try {
    const {
      status
    } = req.params; // "waiting", "accept", "delete"
    const posts = await Post.find({
      check: status
    }).populate("author");
    res.json(posts);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lọc bài viết",
      error: error.message
    });
  }
};

function sanitizeFileName(name) {
  return name
    .normalize('NFD') // tách dấu
    .replace(/[\u0300-\u036f]/g, '') // loại bỏ dấu
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_'); // thay ký tự đặc biệt bằng _
}

// Tạo post mới
exports.createPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    let {
      title,
      content,
      category
    } = req.body;

    // Nếu category là chuỗi JSON, parse nó thành mảng
    if (typeof category === "string") {
      try {
        category = JSON.parse(category);
      } catch (err) {
        return res.status(400).json({
          message: "Danh mục không hợp lệ (không parse được JSON)"
        });
      }
    }

    if (!Array.isArray(category) || category.length === 0) {
      return res.status(400).json({
        message: "Danh mục không hợp lệ"
      });
    }

    const formattedCategory = category.map(id => ({
      categoryId: id
    }));

    // Xử lý upload file media (nếu có)
    let media = [];
    if (req.files && req.files.length > 0) {
      // Kiểm tra mime types
      for (const file of req.files) {
        if (!allowedMIMETypes.includes(file.mimetype)) {
          return res.status(400).json({
            message: "File không hợp lệ. Chỉ hỗ trợ hình ảnh hoặc video."
          });
        }
      }
      // Upload từng file lên Supabase
      for (const file of req.files) {
        const fileExt = file.originalname.split('.').pop();
        const safeOriginalName = sanitizeFileName(file.originalname);
        const fileName = `posts/${Date.now()}-${safeOriginalName}`;
        //const fileName = `posts/${Date.now()}-${file.originalname}`;

        const {
          error
        } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });
        if (error) {
          return res.status(500).json({
            message: "Lỗi upload file lên Supabase",
            error: error.message
          });
        }

        const {
          data: publicUrlData
        } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        const fileUrl = publicUrlData.publicUrl;

        // Xác định loại media: image hoặc video
        let mediaType = file.mimetype.startsWith("image/") ? "image" : "video";

        media.push({
          url: fileUrl,
          type: mediaType
        });
      }
    }

    const newPost = new Post({
      title,
      content,
      category: formattedCategory,
      author: userId,
      media
    });

    await newPost.save();
    res.status(201).json({
      message: "Tạo bài viết thành công",
      post: newPost
    });
  } catch (error) {
    console.error("Lỗi khi tạo bài viết:", error);
    res.status(500).json({
      message: "Lỗi khi tạo bài viết",
      error: error.message
    });
  }
};


// Sửa bài viết (title, content, category) -- chính chủ
exports.updatePost = async (req, res) => {
  try {
    const {
      idPost
    } = req.params;
    const {
      title,
      content,
      category
    } = req.body;
    const userId = req.user.userId;

    const post = await Post.findById(idPost);
    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài viết"
      });
    }

    if (post.author !== userId) {
      return res.status(403).json({
        message: "Bạn không có quyền sửa bài viết này"
      });
    }

    if (!Array.isArray(category) || category.length === 0) {
      return res.status(400).json({
        message: "Danh mục không hợp lệ"
      });
    }

    const formattedCategory = category.map(id => ({
      categoryId: id
    }));

    post.title = title;
    post.content = content;
    post.category = formattedCategory;

    await post.save();

    res.json({
      message: "Cập nhật bài viết thành công",
      post
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi cập nhật bài viết",
      error: error.message
    });
  }
};


//thay đổi chế độ check (chỉ admin)
exports.updatePostCheck = async (req, res) => {
  try {
    const {
      idPost
    } = req.params;
    const {
      check
    } = req.body;

    const validChecks = ["waiting", "accept", "delete"];
    if (!validChecks.includes(check)) {
      return res.status(400).json({
        message: "Trạng thái không hợp lệ"
      });
    }

    const post = await Post.findById(idPost);
    if (!post) return res.status(404).json({
      message: "Không tìm thấy bài viết"
    });

    post.check = check;
    await post.save();

    res.json({
      message: "Cập nhật trạng thái thành công",
      post
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi cập nhật trạng thái",
      error: error.message
    });
  }
};


// Xoá bài viết (admin hoặc chính chủ)
exports.deletePost = async (req, res) => {
  try {
    const {
      idPost
    } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const post = await Post.findById(idPost);
    if (!post) return res.status(404).json({
      message: "Không tìm thấy bài viết"
    });

    if (post.author !== userId && userRole !== "admin") {
      return res.status(403).json({
        message: "Bạn không có quyền xoá bài viết này"
      });
    }

    post.check = "delete";
    await post.save();

    //Xóa các bình luận liên quan
    await Comment.deleteMany({
      toDocOrPost: idPost
    });

    res.json({
      message: "Bài viết đã bị đánh dấu xoá",
      post
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi xoá bài viết",
      error: error.message
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    const {
      postId
    } = req.params;
    const {
      commentId
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) {
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

    if (comment.toDocOrPost !== postId) {
      return res.status(400).json({
        message: "Comment không thuộc post này"
      });
    }

    if (comment.toReply) {
      return res.status(400).json({
        message: "Không thể thêm reply vào post"
      });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId, {
        $push: {
          comments: {
            commentsId: commentId
          }
        }
      }, {
        new: true
      }
    );

    if (!updatedPost) {
      return res.status(404).json({
        message: "Không tìm thấy bài viết"
      });
    }

    res.status(200).json({
      message: "Đã thêm comment vào post",
      post: updatedPost
    });
  } catch (error) {
    console.error("Lỗi addComment:", error);
    res.status(500).json({
      message: "Lỗi khi thêm comment",
      error: error.message
    });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const {
      idPost
    } = req.params;
    const user = await User.findById(req.user.userId)

    const post = await Post.findById(idPost);
    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài viết"
      });
    }

    // Nếu không phải admin hoặc chính chủ → tăng views
    if (user.role !== "admin" && user.userId !== post.author) {
      post.views += 1;
      await post.save();
    }

    const UserAuthor = await User.findById(post.author);
    const userNameAuthor = UserAuthor ? UserAuthor.username : "Không rõ";
    const fullNameAuthor = UserAuthor ? UserAuthor.fullName : "Không rõ";

    // Nếu không phải admin và bài đã bị xoá → ẩn nội dung
    if (post.check === "delete" && user.role !== "admin") {
      return res.status(200).json({
        post: {
          _id: post._id,
          title: "Bài viết đã bị xoá",
          content: "",
          category: post.category,
          author: post.author,
          userNameAuthor,
          fullNameAuthor,
          check: post.check,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt
        }
      });
    }

    // Nếu là admin hoặc bài chưa bị xoá → trả về đầy đủ
    res.status(200).json({
      post: {
        ...post.toObject(),
        userNameAuthor,
        fullNameAuthor,
      }
    });

  } catch (error) {
    console.error("Lỗi khi lấy bài viết theo ID:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy bài viết",
      error: error.message
    });
  }
};

exports.toggleLikePost = async (req, res) => {
  try {
    const {
      idPost
    } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(idPost);
    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài viết"
      });
    }

    const index = post.likes.findIndex(like => like.idUser === userId);

    if (index !== -1) {
      // Đã like → unlike
      post.likes.splice(index, 1);
      post.likesCount = post.likes.length;

      await post.save();
      return res.status(200).json({
        message: "Đã bỏ like bài viết",
        liked: false,
        likesCount: post.likesCount
      });
    } else {
      // Chưa like → thêm like
      post.likes.push({
        idUser: userId
      });
      post.likesCount = post.likes.length;

      await post.save();
      return res.status(200).json({
        message: "Đã like bài viết",
        liked: true,
        likesCount: post.likesCount
      });
    }

  } catch (error) {
    console.error("Lỗi toggle like:", error);
    res.status(500).json({
      message: "Lỗi server khi toggle like",
      error: error.message
    });
  }
};

exports.getAllCategoriesForPost = async (req, res) => {
  try {
    const {
      idPost
    } = req.params;

    const post = await Post.findById(idPost);
    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài viết."
      });
    }

    const categoryIds = post.category.map(cat => cat.categoryId);

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
    console.error("Lỗi lấy category của bài viết:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy category của bài viết.",
      error: error.message
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
    if (!user || user.role !== "admin") {
      query.check = "accept";
    }

    const [posts, total] = await Promise.all([
      Post.find(query).sort({
        createdAt: -1
      }).skip(skip).limit(limit),
      Post.countDocuments(query)
    ]);

    if (total === 0) {
      return res.status(404).json({
        message: "Không tìm thấy bài viết chứa tất cả danh mục đã cung cấp."
      });
    }

    res.status(200).json({
      message: "Lấy bài viết theo danh mục thành công",
      total,
      page,
      pages: Math.ceil(total / limit),
      count: posts.length,
      posts
    });

  } catch (error) {
    console.error("Lỗi khi tìm bài viết theo category:", error);
    res.status(500).json({
      message: "Lỗi server khi tìm bài viết theo danh mục",
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

exports.searchPostsByTitleOrContent = async (req, res) => {
  try {
    const {
      q,
      page = 1,
      limit = 9
    } = req.query;
    if (!q) {
      return res.status(400).json({
        message: "Vui lòng cung cấp từ khóa tìm kiếm (q)."
      });
    }

    const user = await User.findById(req.user.userId);

    const regex = new RegExp(normalizeText(q), 'i');

    // Lấy tất cả bài viết (đã duyệt nếu không phải admin)
    const allPosts = await Post.find(user && user.role === 'admin' ? {} : {
      check: "accept"
    });

    // Lọc thủ công theo normalized title hoặc content
    const filteredPosts = allPosts.filter(post => {
      const normalizedTitle = normalizeText(post.title || "");
      const normalizedContent = normalizeText(post.content || "");
      return regex.test(normalizedTitle) || regex.test(normalizedContent);
    });

    // Phân trang thủ công
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 9;
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const pagedPosts = filteredPosts.slice(startIndex, endIndex);

    res.status(200).json({
      total: filteredPosts.length,
      page: pageNum,
      pages: Math.ceil(filteredPosts.length / limitNum),
      count: pagedPosts.length,
      posts: pagedPosts
    });
  } catch (error) {
    console.error("Lỗi tìm kiếm bài viết theo title và content:", error);
    res.status(500).json({
      message: "Lỗi server khi tìm kiếm bài viết",
      error: error.message
    });
  }
};