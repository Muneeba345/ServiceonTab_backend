const express = require('express');
const Provider = require('../models/providersignup'); // Adjust path if necessary
const router = express.Router();

// Route to get all blocked providers
router.get('/blocked', async (req, res) => {
  try {
    const blockedProviders = await Provider.find({ status: 'blocked' });
    res.status(200).json(blockedProviders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blocked providers', error });
  }
});

module.exports = router;
