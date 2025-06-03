const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    companyCode: { type: String, required: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    cnicFront: { type: String, required: true },
    cnicBack: { type: String, required: true },
    policeCertificate: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    status: { 
        type: String, 
        enum: ['pending', 'active', 'blocked'],  // Ensure only these values are allowed
        default: 'pending'   // Default to 'pending' when a new provider is created
    },
});

module.exports = mongoose.model('ProviderSignup', providerSchema);
