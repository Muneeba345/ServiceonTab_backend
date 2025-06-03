const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedback');

// GET route to fetch provider name, rating, and comment for a specific provider
router.get("/feedbacks/:providerId", async (req, res) => {
    const { providerId } = req.params;  // Get providerId from the URL parameter
    
    try {
        // Fetch feedbacks for the specific provider
        const feedbacks = await Feedback.find({ providerId })  // Filter by providerId
            .select('providerName rating comment');  // Select only providerName, rating, and comment
    
        if (!feedbacks || feedbacks.length === 0) {
            return res.status(404).json({ success: false, message: "No feedbacks found for this provider" });
        }

        res.status(200).json({ success: true, feedbacks });
    } catch (error) {
        console.error("Error fetching feedbacks:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
