const userRoutes = require("./user.route")
const systemConfig = require("../../../config/system")
const documentRoute = require("./document.route")
module.exports = (app) =>{
    const PATH_TASK = systemConfig.prefixTask
    app.use(PATH_TASK+"/users", userRoutes)
    app.use(PATH_TASK+"/document", documentRoute)
}