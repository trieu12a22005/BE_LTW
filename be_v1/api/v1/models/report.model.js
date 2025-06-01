const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
    idDocument: {
        type: String,
        required: true,
        ref: "Document"
    },
    content: {
        type: String,
        required: true
    }, // Nội dung báo cáo
    reportedBy: {
        type: String,
        required: true,
        ref: "User"
    }, // Ai gửi report
},{
    timestamps: true
}
);

const Report = mongoose.model("Report", reportSchema, "reports");
module.exports = Report;
