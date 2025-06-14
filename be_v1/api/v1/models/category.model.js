const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    createBy: {type: String, required: true}
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema, "categories");
