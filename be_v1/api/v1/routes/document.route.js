const express = require("express")
const controllers = require("../controllers/document.controller")
const verifyToken = require("../../../validate/verifyToken")
const router = express.Router()
const multer = require("multer");
// Cấu hình multer
const upload = multer({
    dest: "uploads/"
});
// Route upload file
router.post("/upload", verifyToken, upload.single("file"), controllers.upload);
router.get("", verifyToken, controllers.listDocs);
router.get("/detail/:id", verifyToken, controllers.detailDoc);
router.patch("/update/:id", verifyToken, controllers.editDoc);
router.delete("/delete/:id", verifyToken, controllers.deleteDoc);
router.get("/admin/:check", verifyToken, controllers.filterDocuments)
router.get("/getByIdUser/:idUser", verifyToken, controllers.getDocByIdUser);

module.exports = router;