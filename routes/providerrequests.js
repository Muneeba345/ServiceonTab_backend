const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const ProviderSignup = require('../models/providersignup'); // Adjust path as needed

const jwt = require('jsonwebtoken');


const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  service: 'gmail',  
  auth: {
    user: process.env.EMAIL_USER,  
    pass: process.env.EMAIL_PASS,  
  },
});


//  Fetch pending provider requests
router.get('/pending-requests', async (req, res) => {
  try {
    const pendingProviders = await ProviderSignup.find({ status: 'pending' });
    res.json(pendingProviders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending requests' });
  }
});

//  Fetch accepted provider requests
router.get('/accepted-request', async (req, res) => {
  try {
    const acceptedProviders = await ProviderSignup.find({ status: 'accepted' });
    res.json(acceptedProviders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching accepted requests' });
  }
});

//  Accept or Reject provider
router.post('/accept/:id', async (req, res) => {
  const { id } = req.params;
  const { isAccepted } = req.body;

  try {
    const provider = await ProviderSignup.findByIdAndUpdate(
      id,
      { status: isAccepted ? 'accepted' : 'rejected' },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    if (isAccepted) {
        await sendConfirmationEmail(provider.email, provider.name, provider._id);
      } else {
        await sendRejectionEmail(provider.email, provider.name);
      }
    res.json({ message: `Provider ${isAccepted ? 'accepted' : 'rejected'} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error updating provider status' });
  }
});

router.get('/download/cnicFront/:id', async (req, res) => {
    try {
      const provider = await ProviderSignup.findById(req.params.id);
      const filePath = path.resolve(__dirname, '..', provider.cnicFront);
  
      console.log('CNIC Front File Path:', filePath);
      res.download(filePath);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error downloading CNIC Front' });
    }
  });
  
  
  router.get('/download/cnicBack/:id', async (req, res) => {
    try {
      const provider = await ProviderSignup.findById(req.params.id);
      const filePath = path.resolve(__dirname, '..', provider.cnicBack);
  
      console.log('CNIC Back File Path:', filePath);
      res.download(filePath);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error downloading CNIC Back' });
    }
  });
 
 
  router.get('/download/policeCertificate/:id', async (req, res) => {
    try {
      const provider = await ProviderSignup.findById(req.params.id);
      const filePath = path.resolve(__dirname, '..', provider.policeCertificate);
  
      console.log('Police Certificate File Path:', filePath);
      res.download(filePath);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error downloading Police Certificate' });
    }
  });
    
  

const sendConfirmationEmail = async (email, providerName, providerId) => {
  const token = jwt.sign({ providerId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const verificationLink = `http://localhost:3000/Providerlogin?token=${token}`;
  


  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Account Created - Service on Tab',
    text: `Hello ${providerName},\n\nYour account has been successfully created. Please click the link below to verify your email and log in:\n\n${verificationLink}\n\nThank you!`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendRejectionEmail = async (email, providerName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Account Creation Request Rejected',
    text: `Hello ${providerName},\n\nWe regret to inform you that your account creation request has been rejected.\n\nThank you for your understanding.`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};


router.post('/verify-email', async (req, res) => {
  const { token } = req.body;

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const provider = await ProviderSignup.findById(decoded.providerId);

      if (!provider) {
          return res.status(404).json({ success: false, message: 'Provider not found' });
      }

      provider.isVerified = true;
      await provider.save();
      
      res.json({ success: true, message: 'Email successfully verified' });
  } catch (error) {
      res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
});




module.exports = router;
