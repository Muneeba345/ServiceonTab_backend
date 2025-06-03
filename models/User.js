// User.js
const mongoose = require('mongoose');

// Define the consumer schema
const ConsumerSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    phonenumber: { 
        type: String, 
        required: true 
    },
    address: { 
        type: String, 
        required: true 
    },
    isVerified: { 
        type: Boolean, 
        default: false 
    }
});

const ConsumerSignup = mongoose.model('ConsumerSignup', ConsumerSchema);


module.exports = ConsumerSignup;
