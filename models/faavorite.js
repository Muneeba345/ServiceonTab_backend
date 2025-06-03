const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    userEmail: { type: String, required: true }, 
    addservice: { type: mongoose.Schema.Types.ObjectId, ref: 'AddService' }
});

module.exports = mongoose.model('Favorite', favoriteSchema);

