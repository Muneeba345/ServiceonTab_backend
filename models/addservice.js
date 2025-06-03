const mongoose = require('mongoose');

const addServiceSchema = new mongoose.Schema({
    name: String, 
    estimatedCharges: Number, 
    type: String, 
    picture: String,
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "ProviderSignup", required: true }

});

module.exports = mongoose.models.AddService || mongoose.model('AddService', addServiceSchema);
