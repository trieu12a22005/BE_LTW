const bcrypt = require("bcrypt"); // ✅ Import bcrypt
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const generateHelper = require("../../../helpers/generate");
const ForgotPassword = require("../models/forgot-pasword.model");
const sendMailHelper = require("../../../helpers/sendMail");
module.exports.register = async (req, res) => {
  try {
    const { username, fullName, email, password, birthday, phone, role } =
      req.body;
    // Kiểm tra xem email đã tồn tại chưa
    const existEmail = await User.findOne({ email, deleted: false });
    if (existEmail) {
      return res.status(400).json({ message: "Email đã tồn tại!" });
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
    });

    await user.save();
    // ✅ Tạo JWT token
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });

    // ✅ Lưu token vào cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ code: 200, message: "Tạo tài khoản thành công!", token });
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error); // ✅ In log lỗi để kiểm tra
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, deleted: false });
    if (!user) {
      return res.status(400).json({ message: "Email không tồn tại!" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ code: 400, message: "Sai mật khẩu" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ code: 200, message: "Đăng nhập thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports.resetPassword = async (req, res) => {
  try {
    const token = req.cookies.token;
    const password = req.body.password;

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decoded.userId;
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.json({ code: 400, message: "User không tồn tại" });
    }

    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res.json({
        code: 400,
        message: "Mật khẩu mới không được trùng mật khẩu cũ",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.updateOne({ _id: userId }, { password: hashedPassword });

    res.json({ code: 200, message: "Cập nhật mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
module.exports.changePassword = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Vui lòng chọn file để upload!" });
    }

    // Kiểm tra loại file có hợp lệ không
    if (!allowedMIMETypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: "Chỉ cho phép upload file PDF, PPT, PPTX, JPG, PNG, GIF, WEBP.",
      });
    }

    const filePath = req.file.path;
    const fileName = `uploads/${Date.now()}-${req.file.originalname}`;
    const fileBuffer = fs.readFileSync(filePath);

    // Upload file lên Supabase Storage
    const { data, error } = await supabase.storage
      .from("uploads") // Thay "uploads" bằng tên bucket của bạn trên Supabase
      .upload(fileName, fileBuffer, {
        contentType: req.file.mimetype,
      });

    if (error) {
      console.error("Lỗi upload:", error);
      return res
        .status(500)
        .json({ error: "Lỗi khi upload file lên Supabase." });
    }

    // Xóa file tạm sau khi upload
    fs.unlinkSync(filePath);

    // Lấy URL file từ Supabase
    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/uploads/${fileName}`;

    res.status(200).json({
      message: "Upload thành công!",
      fileName,
      downloadURL: fileUrl,
    });
  } catch (error) {
    console.error("Lỗi upload file:", error);
    res.status(500).json({ error: "Lỗi khi upload file" });
  }
};
module.exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email, deleted: false });

    if (!user) {
      return res.json({ code: 400, message: "Email không tồn tại" });
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

    res.json({ code: 200, message: "Đã gửi mã OTP qua email!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports.otpPassword = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await ForgotPassword.findOne({ email, otp });

    if (!result) {
      return res.json({ code: 400, message: "Mã OTP không hợp lệ" });
    }

    const user = await User.findOne({ email });
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "10m",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ code: 200, message: "Xác thực thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports.detailUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.userId, deleted: false });

    res.json({
      fullName: user.fullName,
      email: user.email,
      birthday: user.birthday,
      role: user.role,
      phone: user.phone,
      password: user.password,
      username: user.username,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
module.exports.upDateInfo = async (req, res) => {
  delete updateData.password;
  delete updateData.email;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true } // new: true -> trả về dữ liệu mới sau khi update
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "User không tồn tại" });
    }

    res
      .status(200)
      .json({ message: "Cập nhật thành công!", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
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

  res.json({ code: 200, message: "Đã logout và cookie đã bị xóa!" });
};
