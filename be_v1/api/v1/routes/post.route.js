const express = require("express")
const controllers = require("../controllers/post.controller")
const middlewareLogin = require("../../../validate/middlewareLogin")
const verifyToken = require("../../../validate/verifyToken")
const router =  express.Router()

router.get("/getAll", controllers.getPost);
router.post("/create", verifyToken, controllers.createPost);

module.exports = router;