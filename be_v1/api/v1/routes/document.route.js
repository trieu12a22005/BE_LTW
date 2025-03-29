const express = require("express")
const controllers = require("../controllers/document.controller")
const middlewareLogin = require("../../../validate/middlewareLogin")
const verifyToken = require("../../../validate/verifyToken")
const router =  express.Router()

router.get("/getAll", controllers.getDocuments);
router.post("/create", verifyToken, controllers.createDocument);
router.get("/getFilter", controllers.getDocumentsByFilter);
module.exports = router;