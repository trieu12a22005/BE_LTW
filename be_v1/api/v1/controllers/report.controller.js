const Report = require("../models/report.model");
const User = require("../models/user.model");

// Người dùng gửi báo cáo
exports.reportDocument = async (req, res) => {
    try {
        const {
            idPostOrDoc,
            type
        } = req.params;
        const {
            reason,
            description
        } = req.body;
        const userId = req.user.userId;

        if (!idPostOrDoc || !reason || !description || !type) {
            return res.status(400).json({
                message: "Thiếu idPostOrDoc, type, reason hoặc description."
            });
        }

        if (!["doc", "post"].includes(type)) {
            return res.status(400).json({
                message: `Loại báo cáo '${type}' không hợp lệ. Chỉ cho phép 'doc' hoặc 'post'.`
            });
        }

        const report = new Report({
            idPostOrDoc,
            type,
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
        const {
            type
        } = req.params;
        const user = await User.findById(req.user.userId);
        if (user.role !== "admin") {
            return res.status(403).json({
                message: "Bạn không có quyền xem báo cáo."
            });
        }

        if (!["doc", "post"].includes(type)) {
            return res.status(400).json({
                message: `Loại báo cáo '${type}' không hợp lệ. Chỉ cho phép 'doc' hoặc 'post'.`
            });
        }

        const reports = await Report.find({
            type
        }).sort({
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
            id,
            type
        } = req.params;
        const user = await User.findById(req.user.userId);

        if (!["doc", "post"].includes(type)) {
            return res.status(400).json({
                message: `Loại báo cáo '${type}' không hợp lệ. Chỉ cho phép 'doc' hoặc 'post'.`
            });
        }

        const report = await Report.findOne({
            _id: id,
            type
        });
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
            id,
            type
        } = req.params;
        const user = await User.findById(req.user.userId);
        if (user.role !== "admin") {
            return res.status(403).json({
                message: "Không có quyền xóa báo cáo."
            });
        }

        if (!["doc", "post"].includes(type)) {
            return res.status(400).json({
                message: `Loại báo cáo '${type}' không hợp lệ. Chỉ cho phép 'doc' hoặc 'post'.`
            });
        }

        const deleted = await Report.findOneAndDelete({
            _id: id,
            type
        });
        if (!deleted) {
            return res.status(404).json({
                message: `Không tìm thấy báo cáo với id '${id}' và type '${type}'.`
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
        const {
            type
        } = req.params;

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

        if (!["doc", "post"].includes(type)) {
            return res.status(400).json({
                message: `Loại báo cáo '${type}' không hợp lệ. Chỉ cho phép 'doc' hoặc 'post'.`
            });
        }

        const regex = new RegExp(normalizeText(reason), 'i');
        const reports = await Report.find({
            type,
            reason: {
                $regex: regex
            }
        }).sort({
            createdAt: -1
        });

        res.status(200).json({
            total: reports.length,
            reports
        });
    } catch (error) {
        console.error("Lỗi tìm kiếm báo cáo:", error);
        res.status(500).json({
            message: "Lỗi server khi tìm kiếm báo cáo."
        });
    }
};

exports.updateReportStatus = async (req, res) => {
    try {
        const {
            id,
            type
        } = req.params;
        const {
            status
        } = req.body;

        const validStatuses = ["pending", "in_progress", "resolved"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Trạng thái '${status}' không hợp lệ. Chỉ cho phép: ${validStatuses.join(", ")}`
            });
        }

        const user = await User.findById(req.user.userId);
        if (user.role !== "admin") {
            return res.status(403).json({
                message: "Không có quyền cập nhật báo cáo."
            });
        }

        const report = await Report.findOneAndUpdate({
            _id: id,
            type
        }, {
            status
        }, {
            new: true
        });

        if (!report) {
            return res.status(404).json({
                message: `Không tìm thấy báo cáo với id '${id}' và type '${type}'.`
            });
        }

        res.status(200).json({
            message: "Cập nhật trạng thái báo cáo thành công.",
            report
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái báo cáo:", error);
        res.status(500).json({
            message: "Lỗi server khi cập nhật trạng thái báo cáo.",
            error: error.message
        });
    }
};