const jwt = require("jsonwebtoken");
const User = require("../api/v1/models/user.model"); // Import model User

module.exports = async (req, res, next) => {
    try {
        // 📌 1️⃣ Lấy token từ httpOnly Cookie
        const token = req.cookies.token; // Nếu cookie có tên khác, đổi `token` thành tên đó

        if (!token) {
            return res.status(401).json({ message: "Không có token, từ chối truy cập!" });
        }

        // 📌 2️⃣ Giải mã token
        const decoded = jwt.verify(token, process.env.SECRET_KEY); // Dùng secret key từ .env
        req.userId = decoded.userId; // Lưu userId vào request để sử dụng sau

        // 📌 3️⃣ Truy vấn User từ Database
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(401).json({ message: "Người dùng không tồn tại!" });
        }

        // 📌 4️⃣ Kiểm tra role của user
        if (user.role.toLowerCase() !== "admin") {
            console.log(user.role);
            return res.status(403).json({ message: "Bạn không có quyền truy cập!" });
        }

        // 📌 5️⃣ Nếu là Admin, tiếp tục xử lý request
        next();
    } catch (error) {
        console.error("❌ Lỗi xác thực:", error);
        return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
    }
};
