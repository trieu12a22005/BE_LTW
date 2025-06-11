const mongoose = require("mongoose");

const SkyCoinPackageSchema = new mongoose.Schema({
    name: String,
    price: Number
});

module.exports = mongoose.models.SkyCoinPackages ||
    mongoose.model("SkyCoinPackages", SkyCoinPackageSchema);
