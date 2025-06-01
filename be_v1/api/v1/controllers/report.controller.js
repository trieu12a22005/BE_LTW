const Report = require("../models/report.model");
const User = require("../models/user.model");

// Người dùng gửi báo cáo
exports.reportDocument = async (req, res) => {
    try {
        const {
            idDocument
        } = req.params;
        const {
            reason,
            description
        } = req.body;
        const userId = req.user.userId;

        if (!idDocument || !reason || !description) {
            return res.status(400).json({
                message: "Thiếu idDocument, reason hoặc description."
            });
        }

        const report = new Report({
            idDocument,
            reason,
            description,
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

// Admin hoặc người gửi xem báo cáo theo id
exports.getReportById = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const user = await User.findById(req.user.userId);

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({
                message: "Không tìm thấy báo cáo."
            });
        }

        if (user.role !== "admin" && report.reportedBy !== user._id.toString()) {
            return res.status(403).json({
                message: "Bạn không có quyền xem báo cáo này."
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

// Admin xóa báo cáo
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

// Hàm xóa dấu và chuyển về lower-case
function normalizeText(text) {
    return text.normalize('NFD') // tách dấu
        .replace(/[\u0300-\u036f]/g, '') // xóa dấu
        .replace(/đ/g, 'd').replace(/Đ/g, 'D') // thay đ và Đ
        .toLowerCase(); // về chữ thường
}

// Tìm kiếm báo cáo theo reason
exports.searchReportsByReason = async (req, res) => {
    try {
        const {
            reason
        } = req.query;
        const user = await User.findById(req.user.userId);

        if (user.role !== "admin") {
            return res.status(403).json({
                message: "Bạn không có quyền tìm kiếm báo cáo."
            });
        }

        if (!reason) {
            return res.status(400).json({
                message: "Vui lòng cung cấp từ khóa tìm kiếm (reason)."
            });
        }

        // Lấy toàn bộ reports
        const allReports = await Report.find().sort({
            createdAt: -1
        });

        // Lọc dữ liệu theo normalized reason
        const normalizedQuery = normalizeText(reason);
        const filteredReports = allReports.filter(report =>
            normalizeText(report.reason).includes(normalizedQuery)
        );

        res.status(200).json({
            total: filteredReports.length,
            reports: filteredReports
        });
    } catch (error) {
        console.error("Lỗi tìm kiếm báo cáo:", error);
        res.status(500).json({
            message: "Lỗi server khi tìm kiếm báo cáo."
        });
    }
};