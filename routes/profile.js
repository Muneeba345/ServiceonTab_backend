const express = require("express");
const { getUserProfile, updateUserProfile } = require("../controllers/ProfileController"); // Import both functions
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Route to get the user profile
router.get("/", authMiddleware, getUserProfile);

// Route to update the user profile
router.put("/", authMiddleware, updateUserProfile);  // `/api/profile` call hoga

module.exports = router;
