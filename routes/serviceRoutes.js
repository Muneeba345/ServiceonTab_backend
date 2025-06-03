
const express = require("express");
const router = express.Router();

router.post("/complete-service", async (req, res) => {
  try {
    const { serviceId } = req.body;
    if (!serviceId) {
      return res.status(400).json({ error: "Service ID is required" });
    }

    // Fake Provider ID (Replace with actual logic)
    const providerId = "65a9876543efg21";

    // Generate review link
    const reviewLink = `http://localhost:3000/feedback?providerId=${providerId}`;

    res.json({ message: "Service completed successfully", reviewLink });
  } catch (error) {
    console.error("Error completing service:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
