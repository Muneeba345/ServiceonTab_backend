const express = require('express');
const ProviderSignup = require('../models/providersignup');
const path = require('path');
const router = express.Router();
const fs = require('fs');
const jwt = require('jsonwebtoken');


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
      const pendingRequests = await ProviderSignup.find({ status: 'pending' });
      res.json(pendingRequests);
  } catch (error) {
      res.status(500).json({ message: "Error fetching requests" });
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


router.post('/accept/:providerId', async (req, res) => {
  const { providerId } = req.params;
  const { isAccepted } = req.body;

  try {
      const provider = await ProviderSignup.findById(providerId);
      if (!provider) {
          return res.status(404).json({ success: false, message: 'Provider not found.' });
      }

      provider.isVerified = isAccepted;
      provider.status = isAccepted ? 'approved' : 'rejected';


      if (isAccepted) {
        await sendConfirmationEmail(provider.email, provider.name, provider._id);
      }else {
        await sendRejectionEmail(provider.email, provider.name);
      }

      await provider.save();

      res.status(200).json({
          success: true,
          message: isAccepted ? 'Provider accepted.' : 'Provider rejected.',
      });
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
});
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





router.post('/download/:type/:providerId', async (req, res) => {
  const { type, providerId } = req.params;

  try {
    // Fetch provider's file details from the database
    const provider = await Provider.findById(providerId);
    if (!provider) {
      console.error(`Provider with ID ${providerId} not found.`);
      return res.status(404).send('Provider not found');
    }

    // Determine file path based on type
    let filePath;
    switch (type) {
      case 'cnicFront':
        filePath = path.join(__dirname, '../uploads/cnicFront', provider.cnicFront);
        break;
      case 'cnicBack':
        filePath = path.join(__dirname, '../uploads/cnicBack', provider.cnicBack);
        break;
      case 'policeCertificate':
        filePath = path.join(__dirname, '../uploads/policeCertificate', provider.policeCertificate);
        break;
      default:
        console.error(`Invalid file type: ${type}`);
        return res.status(400).send('Invalid file type');
    }

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found at path: ${filePath}`);
      return res.status(404).send('File not found');
    }

    // Send the file for download
    res.download(filePath, (err) => {
      if (err) {
        console.error('Error in file download:', err);
        res.status(500).send('Error downloading file');
      }
    });

  } catch (error) {
    console.error('Error fetching provider data:', error);
    res.status(500).send('Internal server error');
  }
});

  // Backend route (in routes/Feedback.js or similar)
  // Adjust with your actual model name

// Route to get feedback for a specific provider
router.get('/provider/:providerId/feedback', async (req, res) => {
    const { providerId } = req.params;

    try {
        const feedback = await Feedback.find({ providerId });  // Assuming 'Feedback' has a providerId field
        if (!feedback) {
            return res.status(404).json({ message: 'No feedback found for this provider.' });
        }
        res.json(feedback);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ message: 'Server error' });
    }
});




module.exports = router;
