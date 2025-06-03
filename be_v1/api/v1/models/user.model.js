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
  phone: {
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
    default: null
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