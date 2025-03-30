const mongoose = require("mongoose")
const docSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: false },
    fileUrl: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    type: { type: String, enum: ["exam", "document"], required: true },
    Subject: { type: String , required: true },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
  );
const Document  = mongoose.model("Document", docSchema, "documents");
module.exports= Document