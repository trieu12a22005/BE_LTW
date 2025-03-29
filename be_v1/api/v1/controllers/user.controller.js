const bcrypt = require("bcrypt"); // ✅ Import bcrypt
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const generateHelper = require("../../../helpers/generate");
const ForgotPassword = require("../models/forgot-pasword.model");
const sendMailHelper = require("../../../helpers/sendMail");

module.exports.register = async (req, res) => {
  try {
    const { username, fullName, email, password, role } = req.body;

    console.log("Dữ liệu nhận được:", req.body); // ✅ Log kiểm tra dữ liệu

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
    });

    await user.save();
    console.log("User đã tạo:", user);

    // ✅ Tạo JWT token
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: "7d" });

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
    console.log(user.password)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ code: 400, message: "Sai mật khẩu" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: "7d" });

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
      return res.json({ code: 400, message: "Mật khẩu mới không được trùng mật khẩu cũ" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); 
    await User.updateOne({ _id: userId }, { password: hashedPassword });

    res.json({ code: 200, message: "Cập nhật mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
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
    const forgotPassword = new ForgotPassword({ email, otp, expireAt: Date.now() });

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
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: "10m" });

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
      birth: user.birth,
      role: user.role,
    });
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