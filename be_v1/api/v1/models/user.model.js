const mongoose = require("mongoose")
const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: false },
        birthday: { type: Date, required: false },
        password: { type: String, required: true },
        role: { type: String, enum: ["student", "admin"], default: "student"},
        fullName: { type: String, required: true },
        deleted: {
         type: Boolean,
         default: false 
        }
      },
    {timestamps: true}
);
const User = mongoose.model("User", userSchema, "users");
module.exports= User