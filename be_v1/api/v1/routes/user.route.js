const express = require("express")
const controllers = require("../controllers/user.controller")
const middlewareLogin = require("../../../validate/middlewareLogin")
const verifyToken = require("../../../validate/verifyToken")
const updateLastActive = require("../../../validate/updateLastActive")

const router =  express.Router()


router.post("/register", controllers.register);
router.post("/login",middlewareLogin, controllers.login);
router.post("/password/forgot",controllers.forgotPassword);
router.post("/password/otp",controllers.otpPassword);
router.patch("/password/reset",controllers.resetPassword);

router.use(verifyToken, updateLastActive);

router.get("/detail",verifyToken, controllers.detailUser);
router.post("/logout",verifyToken,controllers.logout)
router.patch("/password/change", verifyToken, controllers.changePassword)
router.patch("/update", controllers.uploadAvatarMiddleware, verifyToken, controllers.upDateInfo);
router.get("/getUser/:idUser", verifyToken, controllers.getUserById);
router.patch("/avatar", verifyToken, controllers.uploadAvatarMiddleware, controllers.uploadAvatar);

module.exports = router;

module.exports = router;

