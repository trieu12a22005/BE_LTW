const bcrypt = require("bcryptjs"); // ✅ Import bcrypt
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const generateHelper = require("../../../helpers/generate");
const ForgotPassword = require("../models/forgot-pasword.model");
const sendMailHelper = require("../../../helpers/sendMail");
const multer = require("multer");
const {
  createClient
} = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const BUCKET_NAME = process.env.BUCKET_NAME || "avatars";

const storage = multer.memoryStorage();
const upload = multer({
  storage
});

exports.uploadAvatarMiddleware = upload.single("avatar"); // file field tên "avatar"

// Giới hạn mime type cho ảnh avatar
const allowedAvatarTypes = [
  "image/jpeg", "image/png", "image/gif", "image/webp"
];

module.exports.register = async (req, res) => {
  try {
    const {
      username,
      fullName,
      email,
      password,
      birthday,
      phone,
      role,
      address,
      university,
      major
    } =
    req.body;

    console.log("Dữ liệu nhận được:", req.body); // ✅ Log kiểm tra dữ liệu

    // Kiểm tra xem email đã tồn tại chưa
    const existEmail = await User.findOne({
      email,
      deleted: false
    });
    if (existEmail) {
      return res.status(400).json({
        message: "Email đã tồn tại!"
      });
    }

    // ✅ Mã hóa mật khẩu trước khi lưu
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Tạo user mới
    const user = new User({
      username,
      fullName,
      email,
      role,
      password: hashedPassword, // ✅ Lưu mật khẩu đã mã hóa
      birthday,
      phone,
      address,
      university,
      major
    });

    await user.save();
    console.log("User đã tạo:", user);

    // ✅ Tạo JWT token
    const token = jwt.sign({
      userId: user._id
    }, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });

    // ✅ Lưu token vào cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      code: 200,
      message: "Tạo tài khoản thành công!",
      token
    });
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error); // ✅ In log lỗi để kiểm tra
    res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
};
module.exports.login = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;
    console.log(email);
    const user = await User.findOne({
      email,
      deleted: false
    });
    if (!user) {
      return res.status(400).json({
        message: "Email không tồn tại!"
      });
    }
    console.log(user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        code: 400,
        message: "Sai mật khẩu"
      });
    }

    const token = jwt.sign({
      userId: user._id
    }, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      code: 200,
      message: "Đăng nhập thành công!"
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
};

module.exports.resetPassword = async (req, res) => {
  try {
    const token = req.cookies.token;
    const password = req.body.password;

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decoded.userId;
    const user = await User.findOne({
      _id: userId
    });

    if (!user) {
      return res.json({
        code: 400,
        message: "User không tồn tại"
      });
    }

    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res.json({
        code: 400,
        message: "Mật khẩu mới không được trùng mật khẩu cũ",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.updateOne({
      _id: userId
    }, {
      password: hashedPassword
    });

    res.json({
      code: 200,
      message: "Cập nhật mật khẩu thành công"
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
};
module.exports.changePassword = async (req, res) => {
  //try {
  //   if (!req.file) {
  //     return res.status(400).json({ error: "Vui lòng chọn file để upload!" });
  //   }

  //   // Kiểm tra loại file có hợp lệ không
  //   if (!allowedMIMETypes.includes(req.file.mimetype)) {
  //     return res.status(400).json({
  //       error: "Chỉ cho phép upload file PDF, PPT, PPTX, JPG, PNG, GIF, WEBP.",
  //     });
  //   }

  //   const filePath = req.file.path;
  //   const fileName = `uploads/${Date.now()}-${req.file.originalname}`;
  //   const fileBuffer = fs.readFileSync(filePath);

  //   // Upload file lên Supabase Storage
  //   const { data, error } = await supabase.storage
  //     .from("uploads") // Thay "uploads" bằng tên bucket của bạn trên Supabase
  //     .upload(fileName, fileBuffer, {
  //       contentType: req.file.mimetype,
  //     });

  //   if (error) {
  //     console.error("Lỗi upload:", error);
  //     return res
  //       .status(500)
  //       .json({ error: "Lỗi khi upload file lên Supabase." });
  //   }

  //   // Xóa file tạm sau khi upload
  //   fs.unlinkSync(filePath);

  //   // Lấy URL file từ Supabase
  //   const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/uploads/${fileName}`;

  //   res.status(200).json({
  //     message: "Upload thành công!",
  //     fileName,
  //     downloadURL: fileUrl,
  //   });
  // } catch (error) {
  //   console.error("Lỗi upload file:", error);
  //   res.status(500).json({ error: "Lỗi khi upload file" });
  // }
  try {
    const userId = req.user.userId;
    const {
      oldPassword,
      newPassword
    } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Vui lòng cung cấp đầy đủ mật khẩu cũ và mới.",
      });
    }

    const user = await User.findById(userId);
    if (!user || user.deleted) {
      return res.status(404).json({
        message: "Người dùng không tồn tại.",
      });
    }

    // So sánh mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Mật khẩu cũ không đúng.",
      });
    }

    // Kiểm tra trùng mật khẩu
    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      return res.status(400).json({
        message: "Mật khẩu mới không được trùng với mật khẩu cũ.",
      });
    }

    // Băm mật khẩu mới và cập nhật
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: "Đổi mật khẩu thành công.",
    });
  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};
module.exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({
      email,
      deleted: false
    });

    if (!user) {
      return res.json({
        code: 400,
        message: "Email không tồn tại"
      });
    }

    const otp = generateHelper.generateRandomNumber(6);
    const forgotPassword = new ForgotPassword({
      email,
      otp,
      expireAt: Date.now(),
    });

    await forgotPassword.save();

    const subject = "MÃ OTP xác minh lấy lại mật khẩu";
    const html = `Mã OTP của bạn là <b>${otp}</b> (Sử dụng trong 3 phút). Vui lòng không chia sẻ mã này.`;
    sendMailHelper.sendMail(email, subject, html);

    res.json({
      code: 200,
      message: "Đã gửi mã OTP qua email!"
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
};

module.exports.otpPassword = async (req, res) => {
  try {
    const {
      email,
      otp
    } = req.body;
    const result = await ForgotPassword.findOne({
      email,
      otp
    });

    if (!result) {
      return res.json({
        code: 400,
        message: "Mã OTP không hợp lệ"
      });
    }

    const user = await User.findOne({
      email
    });
    const token = jwt.sign({
      userId: user._id
    }, process.env.SECRET_KEY, {
      expiresIn: "10m",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      code: 200,
      message: "Xác thực thành công"
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
};

module.exports.detailUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.user.userId,
      deleted: false
    });
    return res.json({
      idUser: req.user.userId,
      fullName: user.fullName,
      avatar: user.avatar,
      email: user.email,
      birthday: user.birthday,
      role: user.role,
      phone: user.phone,
      university: user.university,
      major: user.major,
      //password: user.password,
      username: user.username,
      createdAt: user.createdAt,
      lastActive: user.lastActive
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
};
module.exports.upDateInfo = async (req, res) => {
  //console.log(req.user.userId);
  try {
    const userId = req.user.userId;
    const updateData = req.body;
    // Không cho phép chỉnh sửa email hoặc role
    if (updateData.email !== undefined || updateData.role !== undefined || updateData.username !== undefined) {
      return res.status(403).json({
        warning: "Không được chỉnh sửa Email hoặc Role hoặc username"
      });
    }
    // Tìm user hiện tại
    const user = await User.findById(userId);
    if (!user || user.deleted) {
      return res.status(404).json({
        message: "User không tồn tại"
      });
    }

    // Cập nhật avatar nếu có file upload
    if (req.file) {
      const allowedAvatarTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedAvatarTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          message: "Chỉ cho phép upload file ảnh JPG, PNG, GIF, WEBP."
        });
      }

      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `avatars/${userId}-${Date.now()}.${fileExt}`;
      const {
        error
      } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
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
      user.avatar = publicUrlData.publicUrl;
    }

    // Cập nhật các trường khac [cac truong được phép]
    const allowedFields = ["fullName", "phone", "birthday", "address", "university", "major"];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });

    await user.save();

    res.status(200).json({
      message: "Cập nhật thông tin thành công!",
      user: {
        fullName: user.fullName,
        username: user.username,
        phone: user.phone,
        birthday: user.birthday,
        address: user.address,
        university: user.university,
        major: user.major,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin người dùng:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
};
module.exports.logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "Strict",
    expires: new Date(0),
    path: "/",
  });

  res.json({
    code: 200,
    message: "Đã logout và cookie đã bị xóa!"
  });
};
module.exports.getUserById = async (req, res) => {
  try {
    const {
      idUser
    } = req.params;

    const userFind = await User.findOne({
      _id: idUser,
      deleted: false
    });

    if (!userFind) {
      return req.status(404).json({
        message: "User Id không tồn tại!",
      });
    }

    res.json({
      fullName: userFind.fullName,
      email: userFind.email,
      birthday: userFind.birthday,
      avatar: userFind.avatar,
      role: userFind.role,
      phone: userFind.phone,
      username: userFind.username,
      university: userFind.university,
      major: userFind.major
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
}

exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        message: "Vui lòng chọn file ảnh để upload!"
      });
    }

    if (!allowedAvatarTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: "Chỉ cho phép upload file ảnh JPG, PNG, GIF, WEBP."
      });
    }

    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `avatars/${userId}-${Date.now()}.${fileExt}`;

    const {
      error
    } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
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
    const avatarUrl = publicUrlData.publicUrl;

    // Cập nhật URL avatar cho user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "Người dùng không tồn tại"
      });
    }

    user.avatar = avatarUrl;
    await user.save();

    res.status(200).json({
      message: "Cập nhật avatar thành công",
      avatarUrl
    });

  } catch (error) {
    console.error("Lỗi khi upload avatar:", error);
    res.status(500).json({
      message: "Lỗi server khi upload avatar",
      error: error.message
    });
  }
};
