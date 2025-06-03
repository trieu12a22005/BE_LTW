const express = require("express")
const controllers = require("../controllers/category.controller")
const middlewareLogin = require("../../../validate/middlewareLogin")
const verifyToken = require("../../../validate/verifyToken")
const checkAdmin = require("../../../validate/checkAdmin")
const router =  express.Router()

router.get("", verifyToken, controllers.getAllCategories);
router.post("/create", verifyToken, controllers.createCategory);
router.patch("/update/:idCategory", verifyToken, controllers.updateCategory);
router.delete("/delete/:idCategory", verifyToken, controllers.deleteCategory);
router.patch("/updateByAdmin/:idCategory", checkAdmin, controllers.updateCategoryByAmdin);
router.delete("/deleteByAdmin/:idCategory", checkAdmin, controllers.deleteCategoryByAdmin);

router.get("/search", verifyToken, controllers.findCategory);
router.get("/:idCategory", verifyToken, controllers.getCategoryById);

module.exports = router;