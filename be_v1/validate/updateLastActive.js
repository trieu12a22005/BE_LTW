const User = require("../api/v1/models/user.model");

const updateLastActive = async (req, res, next) => {
    try {
        if (req.user && req.user.userId) {
            await User.findByIdAndUpdate(req.user.userId, {
                lastActive: new Date()
            });
        }
    } catch (err) {
        console.error("Lỗi khi cập nhật lastActive:", err.message);
    }
    next();
};

module.exports = updateLastActive;
