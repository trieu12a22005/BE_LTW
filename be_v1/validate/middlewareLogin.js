const { body, validationResult } = require("express-validator");

const middlewareLogin = [
    body("email").isEmail().withMessage("Email không hợp lệ!"),
    body("password").notEmpty().withMessage("Mật khẩu không được để trống!"),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next(); // ✅ Tiếp tục xử lý request
    }
];

module.exports = middlewareLogin; // ✅ Xuất middleware dưới dạng một mảng
