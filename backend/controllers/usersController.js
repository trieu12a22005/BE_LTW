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
  try {
    let usersData = req.body;

    // Kiểm tra nếu req.body là một mảng (đang gửi nhiều user)
    if (Array.isArray(usersData)) {
      const newUsers = await User.insertMany(usersData);
      return res.status(201).json(newUsers);
    }

    // Nếu chỉ là một object (tạo một user duy nhất)
    const newUser = new User(usersData);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Lỗi khi tạo user:", error);
    res.status(500).json({ message: "Lỗi khi tạo user", error: error.message });
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
