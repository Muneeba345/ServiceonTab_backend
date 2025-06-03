const Users = require("../models/Users");

// GET user profile
const getUserProfile = async (req, res) => {
  try {
    // Middleware se token decode ho chuka hoga
    const userId = req.user.userId; 

    // Database se user ka data lein
    const user = await Users.findById(userId).select("-password"); // Password remove

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });

  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT update user profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email, phone, address } = req.body;

    // Find user by ID and update the fields
    const updatedUser = await Users.findByIdAndUpdate(
      userId,
      { name, email, phone, address },
      { new: true } // This ensures that the updated document is returned
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getUserProfile, updateUserProfile };
