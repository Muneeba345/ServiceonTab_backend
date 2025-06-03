const express = require("express");
const router = express.Router();
const Booking = require('../models/booking');


router.post("/updateStatus", async (req, res) => {
  try {
      const { bookingId, status } = req.body;
      console.log("Received request:", req.body);

      if (!bookingId || !status) {
          return res.status(400).json({ error: "Booking ID and status are required." });
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          { trackingStatus: status },
          { new: true }
      );

      if (!updatedBooking) {
          return res.status(404).json({ error: "Booking not found." });
      }

      console.log("Booking updated successfully:", updatedBooking);
      res.status(200).json({ message: "Tracking status updated successfully", updatedBooking });
  } catch (error) {
      console.error("Backend Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});
router.get("/getStatus/:bookingId", async (req, res) => {
  try {
      const { bookingId } = req.params;

      //  Ensure bookingId is valid
      if (!bookingId) {
          return res.status(400).json({ error: "Booking ID is required" });
      }

      //  Debugging log
      console.log("Fetching tracking status for bookingId:", bookingId);

      //  Query the Booking collection instead of Tracking
      const booking = await Booking.findById(bookingId);

      if (!booking) {
          return res.status(404).json({ error: "Booking not found" });
      }

      // Return the tracking status from Booking
      res.json({ status: booking.trackingStatus });
  } catch (error) {
      console.error("Error fetching tracking status:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});



module.exports = router;
