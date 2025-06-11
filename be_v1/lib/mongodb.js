// lib/mongodb.js
const mongoose = require("mongoose");

const connectMongoDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error("❌ MONGODB_URI chưa được cấu hình trong biến môi trường.");
        }

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(uri);
            console.log("✅ MongoDB connected");
        }
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        throw error;
    }
};

module.exports = connectMongoDB;
