const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedback');
const Users = require('../models/Users');
const ProviderSignup = require('../models/providersignup');
const Booking = require('../models/booking');

//  GET user by email (to fetch consumer name)
router.get("/email/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, consumer: user });
  } catch (error) {
    console.error("Error fetching user by email:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Updated GET provider's name by provider email
router.get('/api/provider', async (req, res) => {
  const { email } = req.query;
  try {
    const provider = await ProviderSignup.findOne({ email });
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }
    res.json({ name: provider.name });
  } catch (err) {
    console.error("Error fetching provider by email:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST route for feedback submission
// POST route for feedback submission
router.post("/", async (req, res) => {
  try {
    const { consumerEmail, providerEmail, rating, comment } = req.body;

    // Validate input fields
    if (!consumerEmail || !providerEmail || !rating || !comment) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Find provider by email
    const provider = await ProviderSignup.findOne({ email: providerEmail });
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    // Find consumer (user) by email
    const user = await Users.findOne({ email: consumerEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Create and save feedback
    const newFeedback = new Feedback({
      consumerName: user.name,
      consumerEmail,
      providerName: provider.name,
      providerEmail,
      providerId: provider._id, // Add providerId here
      rating,
      comment,
    });

    // Save the feedback to the database
    await newFeedback.save();

    res.status(201).json({ success: true, message: "Feedback submitted successfully!" });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
});


module.exports = router;
