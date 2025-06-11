// config/database.js
const mongoose = require("mongoose");

const connect = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("⚠️ MONGODB_URI chưa được khai báo");

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(uri);
            console.log("✅ MongoDB connected");
        }
    } catch (err) {
        console.error("❌ MongoDB connection error:", err);
        throw err;
    }
};

module.exports = { connect };
