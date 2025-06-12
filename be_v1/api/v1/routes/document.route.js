const express = require("express");
const controllers = require("../controllers/document.controller");
const verifyToken = require("../../../validate/verifyToken");
const router = express.Router();

router.post("/upload", verifyToken, controllers.uploadMiddleware, controllers.uploadFile);
//public
router.get("", /*verifyToken,*/ controllers.listDocs);
//public
router.get("/detail/:id", /*verifyToken,*/ controllers.detailDoc);

router.patch("/update/:id", verifyToken, controllers.editDoc);
router.delete("/delete/:id", verifyToken, controllers.deleteDoc);

router.get("/admin/:check", verifyToken, controllers.filterDocuments);
router.get("/getByIdUser/:idUser", /*verifyToken,*/ controllers.getDocByIdUser);

router.get("/find", /*verifyToken,*/ controllers.findDoc);
router.post("/byCategory", /*verifyToken,*/ controllers.getByCategory);

router.patch("/addComment/:docId", verifyToken, controllers.addComment);

router.get("/download/:id", /*verifyToken,*/ controllers.downloadDoc);

router.post("/rate/:idDocument", verifyToken, controllers.rateDocument);
router.get("/reports/:idDocument", /*verifyToken,*/ controllers.getReportsForDocument);

router.get("/categories/:idDocument", /*verifyToken,*/ controllers.getAllCategories);

module.exports = router;
