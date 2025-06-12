const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
    console.log("Đã vào verifyToken");

    console.log("Cookies received:", req.cookies); 
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: "Không có token, vui lòng đăng nhập!" });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();

    } catch (error) {
        return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
    }
};

module.exports = verifyToken; // ✅ Xuất ra dạng function, import không cần `{}`.
