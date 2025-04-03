const mongoose = require("mongoose");

const DocumentsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: false },
    fileUrl: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    type: { type: String, enum: ["exam", "document"], required: true },
    Subject: { type: String, required: true },
    downloadCount: { type: Number, default: 0 },
    check: {type: String, enum: ["waiting", "delete", "accept"], default: "waiting"}
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", DocumentsSchema, "documents");
