const userRoutes = require("./user.route")
const documentRoutes = require("./document.route")
const postRouters = require("./post.route")
const systemConfig = require("../../../config/system")
module.exports = (app) =>{
    const PATH_TASK = systemConfig.prefixTask
    app.use(PATH_TASK+"/users", userRoutes)
    app.use(PATH_TASK+"/documents", documentRoutes)
    app.use(PATH_TASK+"/posts", postRouters)
}