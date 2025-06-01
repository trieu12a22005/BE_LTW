const express = require("express")
const controllers = require("../controllers/post.controller")
const middlewareLogin = require("../../../validate/middlewareLogin")
const verifyToken = require("../../../validate/verifyToken")
const checkAdmin = require("../../../validate/checkAdmin")
const router = express.Router()

router.get("/", verifyToken, controllers.getPosts);
router.post("/create", verifyToken, controllers.createPost);
router.get("/Admin/getByCheck/:status", checkAdmin, controllers.getPostByCheck);
router.patch("/Admin/update/:idPost/check", checkAdmin, controllers.updatePostCheck);
router.patch("/update/:idPost/info", verifyToken, controllers.updatePost);
router.delete("/delete/:idPost", verifyToken, controllers.deletePost);
router.patch("/addComment/:postId", verifyToken, controllers.addComment);

router.get("/getById/:idPost", verifyToken, controllers.getPostById);

router.patch("/like/:idPost", verifyToken, controllers.toggleLikePost);
//router.patch

module.exports = router;