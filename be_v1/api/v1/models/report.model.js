const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
    idPostOrDoc: {
        type: String,
        required: true
    },
    type: {
        type: String, 
        enum: ["doc", "post"],
        default: "doc",
        require: true
    },
    reason:{
        type: String,
        require: true,
    }, // tieu de
    description: {
        type: String,
        required: true
    }, // Nội dung báo cáo
    reportedBy: {
        type: String,
        required: true,
        ref: "User"
    }, // Ai gửi report
    status: {
        type: String,
        enum: ["pending", "in_progress", "resolved"],
        default: "pending"
    }      
},{
    timestamps: true
}
);

const Report = mongoose.model("Report", reportSchema, "reports");
module.exports = Report;
