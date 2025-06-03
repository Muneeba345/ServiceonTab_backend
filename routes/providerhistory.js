const express = require('express');
const router = express.Router();
const Booking = require('../models/booking'); // Assuming Booking model is defined here
const Users = require('../models/Users'); // Assuming User model is defined here

// Fetch booking history along with consumer details
router.get('/history/:email', async (req, res) => {
  const { email } = req.params;
  try {
    // Fetch bookings that match the consumer's email
    const bookings = await Booking.find({ email: new RegExp(`^${email}$`, 'i') })
      .sort({ createdAt: -1 })
      .populate('provider'); // Assuming provider is populated

    // Fetch the consumer's details from the Users model
    const consumer = await Users.findOne({ email: new RegExp(`^${email}$`, 'i') });

    if (!consumer) {
      return res.status(404).json({ success: false, message: 'Consumer not found' });
    }

    // Add consumer details to each booking
    const enhancedBookings = bookings.map(booking => ({
      ...booking.toObject(),
      consumerName: consumer.name,   // Ensure the correct field for consumer's name
      consumerPhone: consumer.phoneNumber, // Ensure the correct field for phone number
    }));

    res.status(200).json({
      success: true,
      message: bookings.length > 0 ? 'Booking history retrieved successfully' : 'No booking history found',
      history: enhancedBookings,
    });
  } catch (error) {
    console.error('Error fetching booking history:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


module.exports = router;
