const express = require('express');
const Booking = require('../models/booking.js');
const router = express.Router();
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.EMAIL_USER,  
      pass: process.env.EMAIL_PASS, 
    },
  });


router.get('/pending-requests', async (req, res) => {
    try {
        const pendingRequests = await Booking.find({ status: 'pending' });
        res.json(pendingRequests);
    } catch (error) {
        res.status(500).json({ message: "Error fetching requests" });
    }
  });


  const sendConfirmationEmail = async (email, serviceName) => {
    console.log(`Sending email to: ${email}`); 

    const verificationLink = `http://localhost:3000/displaybooking`; 
    
    
  
  
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Booking Request Accepted - Service on Tab',
      text: `Hello,\n\nYour ${serviceName} service is successfully booked. 
      Please click the link below to see details:${verificationLink}\nThank you!`,
   };
  
    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };



  const sendRejectionEmail = async (email, serviceName) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Service Booking Request Rejected',
      text: "Hello,\n\n ${serviceName} service booking request has been rejected.Thank you for your understanding.",
    };
  
    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };
  

  router.post('/accept/:serviceId', async (req, res) => {
    const { serviceId } = req.params;
    const { isAccepted } = req.body;
  
    try {
        const book = await Booking.findById(serviceId);
        if (!book) {
            return res.status(404).json({ success: false, message: 'Service not found.' });
        }
  
      
        book.status = isAccepted ? 'accepted' : 'rejected';
  

        if (!book.email) {
          return res.status(400).json({ success: false, message: 'No email associated with booking.' });
      }
      
      
        if (isAccepted) {
          await sendConfirmationEmail(book.email, book.serviceName);
        }else {
          await sendRejectionEmail(book.email, book.serviceName);
        }
  
        await book.save();
  
        res.status(200).json({
            success: true,
            message: isAccepted ? 'Booking request accepted.' : 'Booking Request rejected.',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
  });

  module.exports = router;  