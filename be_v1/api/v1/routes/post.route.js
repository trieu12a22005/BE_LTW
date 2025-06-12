const express = require("express")
const controllers = require("../controllers/post.controller")
const middlewareLogin = require("../../../validate/middlewareLogin")
const verifyToken = require("../../../validate/verifyToken")
const checkAdmin = require("../../../validate/checkAdmin")
const router = express.Router()

//public
router.get("", /*verifyToken,*/ controllers.getPosts);
router.post("/create", verifyToken, controllers.uploadMiddleware, controllers.createPost);
router.get("/getByCheck/:status", checkAdmin, controllers.getPostByCheck);
router.patch("/update/:idPost/check", checkAdmin, controllers.updatePostCheck);
router.patch("/update/:idPost/info", verifyToken, controllers.updatePost);
router.delete("/delete/:idPost", verifyToken, controllers.deletePost);
router.patch("/addComment/:postId", verifyToken, controllers.addComment);

router.get("/getById/:idPost", /*verifyToken,*/ controllers.getPostById);
router.post("/byCategory", /*verifyToken,*/ controllers.getByCategory);
router.get("/search", /*verifyToken,*/ controllers.searchPostsByTitleOrContent);

router.patch("/like/:idPost", verifyToken, controllers.toggleLikePost);
router.get("/categories/:idPost", /*verifyToken,*/ controllers.getAllCategoriesForPost);

router.get("/like/:idPost/allUser", verifyToken, controllers.getUsersLikePost);
router.get("/like/:idPost/:idUser", verifyToken, controllers.checkLikePost);

//router.patch

module.exports = router;