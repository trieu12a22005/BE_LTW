const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// Import tất cả Routes
const userRoutes = require("./routes/usersRoutes");
const postRoutes = require("./routes/postsRoutes");
const documentRoutes = require("./routes/documentsRoutes");
const newsRoutes = require("./routes/newsRoutes");
const categoryRoutes = require("./routes/categoriesRoutes");
const notificationRoutes = require("./routes/notificationsRoutes");

// Sử dụng tất cả các routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/notifications", notificationRoutes);

// Lắng nghe server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
