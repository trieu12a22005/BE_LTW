const userRoutes = require("./user.route")
const documentRoutes = require("./document.route")
const postRouters = require("./post.route")
const notificationRouters = require("./notification.route")
const commentRouters =require("./comment.route")
const categoryRouters =require("./category.route")
const reportRoute = require("./report.route");
const systemConfig = require("../../../config/system")

module.exports = (app) =>{
    const PATH_TASK = systemConfig.prefixTask
    app.use(PATH_TASK+"/users", userRoutes)
    app.use(PATH_TASK+"/documents", documentRoutes)
    app.use(PATH_TASK+"/posts", postRouters)
    app.use(PATH_TASK+"/notifications", notificationRouters)
    app.use(PATH_TASK+"/comments", commentRouters)
    app.use(PATH_TASK+"/categories", categoryRouters)
    app.use(PATH_TASK+"/reports", reportRoute);
}