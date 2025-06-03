const Users = require("../models/Users");
const jwt = require("jsonwebtoken");

const verifyEmailController = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required." });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await Users.findById(decoded.userId); 

      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid or expired token." });
      }

   
      user.verified = true;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Email verified successfully. You can now log in.",
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification token." });
    }
  } catch (error) {
    console.error("Error during email verification:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = verifyEmailController;
