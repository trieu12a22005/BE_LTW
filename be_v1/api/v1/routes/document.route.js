const express = require("express");
const controllers = require("../controllers/document.controller");
const verifyToken = require("../../../validate/verifyToken");
const router = express.Router();

// Dùng uploadMiddleware từ controller (đã cấu hình memoryStorage)
router.post("/upload", verifyToken, controllers.uploadMiddleware, controllers.uploadFile);

// Các route khác
router.get("", verifyToken, controllers.listDocs);
router.get("/detail/:id", verifyToken, controllers.detailDoc);
router.patch("/update/:id", verifyToken, controllers.editDoc);
router.delete("/delete/:id", verifyToken, controllers.deleteDoc);
router.get("/admin/:check", verifyToken, controllers.filterDocuments);
router.get("/getByIdUser/:idUser", verifyToken, controllers.getDocByIdUser);
router.get("/find", verifyToken, controllers.findDoc);

module.exports = router;
