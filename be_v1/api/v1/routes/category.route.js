const express = require("express")
const controllers = require("../controllers/category.controller")
const middlewareLogin = require("../../../validate/middlewareLogin")
const verifyToken = require("../../../validate/verifyToken")
const router =  express.Router()

router.get("/getAll", controllers.getCategories);
router.post("/create", verifyToken, controllers.createCategory);

module.exports = router;