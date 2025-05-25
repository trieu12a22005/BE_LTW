const mongoose = require("mongoose")

module.exports.connect = async () => {
    try {
        console.log("====MONGO_URL====", process.env.MONGO_URL); // <-- Thêm dòng này!
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connect Success");
    } catch (error) {
        console.log("Connect Error", error);
    }
}
