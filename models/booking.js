// models/Booking.js
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  problemDescription: { type: String, required: true },
  estimatedCharges: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  serviceLevel: { type: String, required: true },
  image: { type: String, required: false },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  email: { type: String, required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderSignup' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' }, // 👈 user reference
  trackingStatus: {
    type: String,
    enum: ['Accepted', 'Arrived', 'Task Completed', 'Payment Received', 'Cancelled'],
    default: 'Accepted'
  },
  invoice: {
    invoiceNumber: { type: String, required: false },
    generatedAt: { type: Date, default: Date.now },
    amount: { type: String, required: false },
    description: { type: String },  // Store the description here
    otherCharges: { type: Number }  // Store the other charges here
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
