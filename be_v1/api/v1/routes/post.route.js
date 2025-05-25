const express = require("express")
const controllers = require("../controllers/post.controller")
const middlewareLogin = require("../../../validate/middlewareLogin")
const verifyToken = require("../../../validate/verifyToken")
const checkAdmin = require("../../../validate/checkAdmin")
const router = express.Router()

router.get("/Student", verifyToken, controllers.getPost);
router.get("/Admin", checkAdmin, controllers.getPostAdmin);
router.post("/create", verifyToken, controllers.createPost);
router.get("/Admin/getByCheck/:status", checkAdmin, controllers.getPostByCheck);
router.patch("/Admin/update/:idPost/check", checkAdmin, controllers.updatePostCheck);
router.patch("/update/:idPost/info", verifyToken, controllers.updatePost);
router.delete("/delete/:idPost", verifyToken, controllers.deletePost);
router.patch("/addComment/:postId", verifyToken, controllers.addComment);
//router.patch

module.exports = router;