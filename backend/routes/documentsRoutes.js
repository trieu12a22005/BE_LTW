const express = require("express");
const { getDocuments, createDocument } = require("../controllers/documentsController");
const router = express.Router();

router.get("/", getDocuments);
router.post("/", createDocument);

module.exports = router;
