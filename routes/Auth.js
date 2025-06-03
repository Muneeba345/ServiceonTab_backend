const express = require('express');
const cors = require('cors');
const ConsumerSignup = require('../models/User'); 
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config(); 

const router = express.Router();
router.use(cors()); 

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[A-Za-z]{3,15}$/;
const passwordRegex = /^(?=.[A-Z])(?=.[!@#$%^&])[A-Za-z\d!@#$%^&]{8,15}$/;
const phoneRegex = /^\+92\d{10}$/; 


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


router.post('/createuser', async (req, res) => {
  const { name, email, password, confirmpassword, phonenumber, address } = req.body;


  if (!name || !email || !password || !confirmpassword || !phonenumber || !address) {
    return res.status(400).json({ success: false, message: "All fields are required!" });
  }
  if (!nameRegex.test(name)) {
    return res.status(400).json({ success: false, message: "Name should contain only letters and be 3-15 characters long." });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Invalid email format." });
  }
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ success: false, message: "Password must include one uppercase letter and one special character." });
  }
  if (password !== confirmpassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match." });
  }
  if (!phoneRegex.test(phonenumber)) {
    return res.status(400).json({ success: false, message: "Phone number must be in the format +921234567890." });
  }

  const existingUser = await ConsumerSignup.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: "User with this email already exists!" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const consumer = new ConsumerSignup({
      name,
      email,
      phonenumber,
      address,
      password: hashedPassword,
      isVerified: false 
    });

    const savedConsumer = await consumer.save();

    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification',
      text: `Hello ${name},\n\nPlease verify your email by clicking the link: \nhttp://localhost:5000/api/Auth/verify/${savedConsumer._id}\n\nThank you!`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ success: false, message: "Error sending email." });
      }
      res.status(201).json({ success: true, message: "Signup successful! Please verify your email." });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error saving user. Please try again." });
  }
});


router.get('/verify/:id', async (req, res) => {
  const consumerId = req.params.id;

  try {
    const consumer = await ConsumerSignup.findById(consumerId);
    if (!consumer) {
      return res.status(404).json({ success: false, message: "Consumer not found." });
    }
    
    consumer.isVerified = true; 
    await consumer.save();
    
    res.status(200).json({ success: true, message: "Email verified successfully! You can now log in." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;

