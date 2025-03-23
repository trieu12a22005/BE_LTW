const User = require("../models/users");

// Lấy danh sách users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách users" });
  }
};

// Tạo user mới
exports.createUser = async (req, res) => {
  const { username, email, password, role, fullName } = req.body;
  try {
    const newUser = new User({ username, email, password, role, fullName });
    await newUser.save();
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo user" });
  }
};

// Xóa user
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User đã bị xóa" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa user" });
  }
};
