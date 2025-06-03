const express = require('express');
const router = express.Router();  // Use `router` instead of `app`
const ProviderProfile = require("../models/providersignup.js");
const Provider = require('../models/providersignup.js'); // Ensure this model exists

//  Fetch Provider Profile
router.get("/", async (req, res) => {
    try {
        const providers = await Provider.find();  // Fetch all providers
        res.json(providers);
    } catch (error) {
        console.error("Error fetching provider profile:", error);
        res.status(500).json({ message: "Server error" });
    }
});


router.put("/:id", async (req, res) => {
  console.log(" PUT Request Received for ID:", req.params.id);
  console.log(" Received Data:", req.body);

  try {
    const updatedProfile = await ProviderProfile.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedProfile) {
      console.log(" Profile Not Found");
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    console.log("Profile Updated Successfully:", updatedProfile);
    res.json({ success: true, updatedProfile });

  } catch (error) {
    console.error(" Backend Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});





module.exports = router;
