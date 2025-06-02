const express = require("express");
const controllers = require("../controllers/report.controller");
const verifyToken = require("../../../validate/verifyToken");
const router = express.Router();

router.post("/create/:idPostOrDoc/:type", verifyToken, controllers.reportDocument);
router.get("/:type", verifyToken, controllers.getReports);
router.get("/detail/:id/:type", verifyToken, controllers.getReportById);
router.delete("/delete/:id/:type", verifyToken, controllers.deleteReport);
router.get("/search/:type", verifyToken, controllers.searchReportsByReason);

module.exports = router;
