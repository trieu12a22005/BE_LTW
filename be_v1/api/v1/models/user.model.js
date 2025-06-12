const mongoose = require("mongoose")
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: false
  },
  birthday: {
    type: Date,
    required: false
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["student", "admin"],
    default: "student"
  },
  fullName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: false
  },
  university: {
    type: String,
    required: false
  },
  major: {
    type: String,
    required: false
  },
  avatar: {
    type: String,
    default: "https://jcrxndjvwrxpuntjwkze.supabase.co/storage/v1/object/public/uitstudyshare/avatars/67ee352847e5f5a27ad52e23-1749221165683.png"
  },
  deleted: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});
const User = mongoose.model("User", userSchema, "users");
module.exports = User