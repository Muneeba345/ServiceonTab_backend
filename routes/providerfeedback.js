const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedback'); // Feedback model ko import karo

// GET feedbacks
router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    res.json({ feedback: feedbacks });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedbacks', error });
  }
});

module.exports = router;

