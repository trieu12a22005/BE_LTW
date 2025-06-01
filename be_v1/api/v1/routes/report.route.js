const express = require("express");
const controllers = require("../controllers/report.controller");
const verifyToken = require("../../../validate/verifyToken");
const router = express.Router();

router.post("/create/:idDocument", verifyToken, controllers.reportDocument);
router.get("/", verifyToken, controllers.getReports);
router.get("/detail/:id", verifyToken, controllers.getReportById);
router.delete("/delete/:id", verifyToken, controllers.deleteReport);

module.exports = router;
