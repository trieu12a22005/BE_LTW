const Report = require("../models/report.model");
const User = require("../models/user.model");

// Người dùng gửi báo cáo
exports.reportDocument = async (req, res) => {
    try {
        const {
            idDocument
        } = req.params;
        const {
            content
        } = req.body;
        const userId = req.user.userId;

        if (!idDocument || !content) {
            return res.status(400).json({
                message: "Thiếu idDocument hoặc nội dung báo cáo."
            });
        }

        const report = new Report({
            idDocument,
            content,
            reportedBy: userId
        });

        await report.save();
        res.status(200).json({
            message: "Gửi báo cáo thành công.",
            report
        });
    } catch (error) {
        console.error("Lỗi gửi báo cáo:", error);
        res.status(500).json({
            message: "Lỗi server khi gửi báo cáo."
        });
    }
};

// Admin lấy danh sách báo cáo
exports.getReports = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user.role !== "admin") {
            return res.status(403).json({
                message: "Bạn không có quyền xem báo cáo."
            });
        }

        const reports = await Report.find().sort({
            createdAt: -1
        });
        res.status(200).json({
            total: reports.length,
            reports
        });
    } catch (error) {
        console.error("Lỗi lấy báo cáo:", error);
        res.status(500).json({
            message: "Lỗi server khi lấy báo cáo."
        });
    }
};

// Admin xử lý (xóa) báo cáo
exports.deleteReport = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const user = await User.findById(req.user.userId);
        if (user.role !== "admin") {
            return res.status(403).json({
                message: "Không có quyền xóa báo cáo."
            });
        }

        const deleted = await Report.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({
                message: "Không tìm thấy báo cáo."
            });
        }

        res.status(200).json({
            message: "Đã xóa báo cáo thành công."
        });
    } catch (error) {
        console.error("Lỗi xóa báo cáo:", error);
        res.status(500).json({
            message: "Lỗi server khi xóa báo cáo."
        });
    }
};

// Lấy báo cáo theo id
exports.getReportById = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const user = await User.findById(req.user.userId);

        if (user.role !== "admin" && user.role !== "reportedBy") {
            return res.status(403).json({
                message: "Bạn không có quyền xem báo cáo."
            });
        }

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({
                message: "Không tìm thấy báo cáo."
            });
        }

        res.status(200).json({
            report
        });
    } catch (error) {
        console.error("Lỗi lấy báo cáo theo id:", error);
        res.status(500).json({
            message: "Lỗi server khi lấy báo cáo theo id."
        });
    }
};