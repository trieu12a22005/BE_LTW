const express = require('express');
require("dotenv").config()
const cors = require("cors");
const bodyParser = require("body-parser")
const database = require("./config/database")
const cookiesParser = require("cookie-parser")
database.connect();
const route = require("./api/v1/routes/index.route")
const app = express();
const port = process.env.PORT;
const cors = require('cors');

app.use(cors({
    origin: ["http://localhost:5173", "https://u-it-study-share.vercel.app"],
    credentials: true
}));

app.use(cookiesParser());
//parse application/json
app.use(bodyParser.json())
route(app)
app.listen(port, () => {
    console.log(`listen on port ${port}`);
});
