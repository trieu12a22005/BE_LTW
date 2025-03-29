const mongoose = require("mongoose");

const CategoriresSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    type: { type: String, enum: ["document", "news", "posts"], required: true },
    description: { type: String, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", CategoriresSchema, "categorys");
