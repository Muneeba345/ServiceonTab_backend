const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
    consumerName: { type: String, required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "ProviderSignup", required: true },
    serviceName: { type: String, required: true }, 
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Review", ReviewSchema);
