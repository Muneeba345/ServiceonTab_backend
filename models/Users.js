const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false, // Set to false initially until the user verifies their email
  },

  favorites: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AddService' // Reference to the AddService model
  }],
  
});

const Users = mongoose.model("Users", UserSchema);

module.exports = Users;