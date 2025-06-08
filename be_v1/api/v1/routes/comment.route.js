const express = require("express")
const controllers = require("../controllers/comment.controller")
const middlewareLogin = require("../../../validate/middlewareLogin")
const verifyToken = require("../../../validate/verifyToken")
const checkAdmin = require("../../../validate/checkAdmin")
const router =  express.Router()

router.get("/:toId/", verifyToken, controllers.getCommentById);
router.post("/:toId/:type/create/:reply/", verifyToken, controllers.createComment);
router.delete("/:toId/:type/delete/:idComment/", verifyToken, controllers.deleteComment);
router.patch("/:toId/:type/update/:idComment/", verifyToken, controllers.updateComment);
router.get("/reply/:parentId", verifyToken, controllers.getRepliesByCommentId); //tim binh luan con

module.exports = router;