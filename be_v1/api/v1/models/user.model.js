const mongoose = require("mongoose")
const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: false },
        address: { type: String, required: false },
        birthday: { type: Date, required: false },
        password: { type: String, required: true },
        role: { type: String, enum: ["student", "teacher", "admin"], required: true },
        fullName: { type: String, required: true },
        avatarUrl: { type: String, required: false },
    },
    {timestamps: true}
);
const User = mongoose.model("User", userSchema, "users");
module.exports= User