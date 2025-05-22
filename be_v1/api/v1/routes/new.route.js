const express = require("express")
const controllers = require("../controllers/new.controller")
const middlewareLogin = require("../../../validate/middlewareLogin")
const verifyToken = require("../../../validate/verifyToken")
const router =  express.Router()

router.get("", controllers.getNews);
router.post("/create", verifyToken, controllers.createNews);

module.exports = router;