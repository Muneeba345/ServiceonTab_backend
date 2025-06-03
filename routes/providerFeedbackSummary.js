const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Provider = require('../models/providersignup');  // adjust path
// ... any auth middleware etc.

router.get('/summary-list', async (req, res) => {
    try {
      const providers = await Provider.aggregate([
        {
          $lookup: {
            from: 'feedbacks',
            localField: '_id',
            foreignField: 'providerId',
            as: 'feedbacks'
          }
        },
        {
          $project: {
            name: 1,
            icon: 1,
            feedbackCount: { $size: '$feedbacks' },
            negativeCount: {
              $size: {
                $filter: {
                  input: '$feedbacks',
                  as: 'f',
                  cond: { $eq: ['$$f.rating', 1] }
                }
              }
            },
            status: 1 // Include the status in the response
          }
        }
      ]);
  
      console.log(providers);  // Debugging line to inspect response
      res.json(providers);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching summary' });
    }
  });
  

router.put('/block-provider/:id', async (req, res) => {
    const providerId = req.params.id;
  
    try {
      const updatedProvider = await Provider.findByIdAndUpdate(providerId, { status: 'blocked' }, { new: true });
  
      if (!updatedProvider) {
        return res.status(404).json({ message: 'Provider not found' });
      }
  
      // Send email notification
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,  
            pass: process.env.EMAIL_PASS,  
        }
      });
  
      const mailOptions = {
            from: process.env.EMAIL_USER,
            to: updatedProvider.email,
            subject: 'Service on Tab - Account Block Notification',
            text: `Dear ${updatedProvider.name},
          
          We regret to inform you that your account has been blocked due to consistent low performance ratings received from users.
          
          We value quality service and trust on our platform, and multiple negative reviews have prompted this action.
          
          Thank you for your time and efforts so far.
          
          Sincerely,
          Service on Tab`
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({ message: 'Error sending email notification' });
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
  
      // Invalidate provider's session (JWT or session-based)
      res.status(200).json({ 
        success: true, 
        message: 'Provider blocked successfully', 
        provider: updatedProvider,
        logout: true // send a flag indicating that the provider should log out on the frontend
      });
    } catch (err) {
      console.error('Error blocking provider:', err);
      res.status(500).json({ message: 'Error blocking provider', error: err });
    }
  });

// Fetch all provider names for listing
router.get('/providers-list', async (req, res) => {
  try {
    const providers = await Provider.find({}, 'name email phone address status'); // Only needed fields
    res.json(providers);
  } catch (err) {
    console.error('Error fetching providers list:', err);
    res.status(500).json({ message: 'Error fetching providers list' });
  }
});

// Fetch a single provider by ID
router.get('/providers-list/:id', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id, 'name email phone address status companyCode'); // Make sure companyCode is included
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Combine companyCode and phone number into fullPhoneNumber
    if (provider.companyCode && provider.phone) {
      provider.fullPhoneNumber = `${provider.companyCode}${provider.phone}`;
    } else {
      provider.fullPhoneNumber = provider.phone; // If companyCode is not available, use phone alone
    }

    // Send back the provider details including fullPhoneNumber
    res.json(provider);
  } catch (err) {
    console.error('Error fetching provider details:', err);
    res.status(500).json({ message: 'Error fetching provider details' });
  }
});


module.exports = router;
