const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Users = require("../models/Users");
const nodemailer = require("nodemailer");
require("dotenv").config();  // Load environment variables from .env file

//  GET Emergency Message and Consumer Email
router.get("/send/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate("provider");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const consumer = await Users.findOne({ email: booking.email });
    const provider = booking.provider;

    const message = `
🚨 Emergency Alert

📦 Booking:
Service: ${booking.serviceName}
Problem: ${booking.problemDescription}
Charges: ${booking.estimatedCharges}
Date: ${booking.date}
Time: ${booking.time}
Status: ${booking.trackingStatus}

👤 Consumer:
Name: ${consumer?.name}
Email: ${consumer?.email}
Phone: ${consumer?.phoneNumber}
Address: ${consumer?.address}

🧑‍🔧 Provider:
Name: ${provider?.name}
Email: ${provider?.email}
Phone: ${provider?.phone}
Address: ${provider?.address}
`;

    res.status(200).json({ message, phone: "03335071044", consumerEmail: consumer?.email });

  } catch (error) {
    console.error("Emergency Route Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// SEND Email with replyTo set to consumer's email
router.post("/email", async (req, res) => {
  const { subject, message, consumerEmail } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    await transporter.sendMail({
      from: `"Emergency Alert" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECIPIENT,
      subject,
      text: message,
      replyTo: consumerEmail,
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
});

module.exports = router;
