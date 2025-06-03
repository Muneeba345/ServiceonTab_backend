const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
    name: String,
    category: String,
    description: String,
    price: Number,
    picture: String
});

module.exports = mongoose.model("Service", serviceSchema);
