const express = require('express');
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const database = require("../config/database");
const route = require("../api/v1/routes/index.route");

const app = express();

// Kết nối DB
database.connect();

// CORS
app.use(cors({
    origin: ["http://localhost:5173", "https://u-it-study-share.vercel.app"],
    credentials: true
}));

// Middleware
app.use(cookieParser());
app.use(bodyParser.json());

// Routes
route(app);

// ✅ Không dùng app.listen()
// ✅ Thay bằng export
module.exports = app;
