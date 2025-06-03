const express = require('express');
const multer = require('multer');
const ProviderSignup = require('../models/providersignup');
const path = require('path');
const jwt = require('jsonwebtoken'); 
require('dotenv').config();
const bcrypt = require('bcrypt');
const fs = require('fs');
const mime = require('mime');
const router = express.Router();



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
 
      cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
  });
  
  const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
      const fileTypes = /jpg|jpeg|png|pdf/;
      const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = fileTypes.test(file.mimetype);
  
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb('Error: Only .jpg, .jpeg, .png images and .pdf files are allowed!');
    }
  });
  
 
  router.post('/signup', upload.fields([
    { name: 'cnicFront', maxCount: 1 },
    { name: 'cnicBack', maxCount: 1 },
    { name: 'policeCertificate', maxCount: 1 }
]), async (req, res) => {
    const { name, phone, companyCode, email, password, address } = req.body;
    const cnicFront = req.files ? `uploads/${req.files['cnicFront'][0].filename}` : null;
const cnicBack = req.files ? `uploads/${req.files['cnicBack'][0].filename}` : null;
const policeCertificate = req.files ? `uploads/${req.files['policeCertificate'][0].filename}` : null;

  

    try {
  
        const existingProvider = await ProviderSignup.findOne({ email });
        if (existingProvider) {
            return res.status(400).json({ success: false, message: "Email is already registered." });
        }

  
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newProvider = new ProviderSignup({
            name,
            phone,
            companyCode,
            email,
            password: hashedPassword, 
            address,
            cnicFront,
            cnicBack,
            policeCertificate
        });

        await newProvider.save();
        res.status(201).json({ success: true, message: "Provider signup successful!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error signing up provider." });
    }
});
  


router.post('/Providerlogin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  try {
    const provider = await ProviderSignup.findOne({ email });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found"
      });
    }

    // Check if provider is blocked
    if (provider.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: "You are blocked. You cannot login."
      });
    }

    // Check if provider is pending (optional, if you want to block login for pending accounts)
    if (provider.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: "Your account is under review. Please wait for approval."
      });
    }

    const isMatch = await bcrypt.compare(password, provider.password);
    if (!isMatch) {
      return res.status(403).json({
        success: false,
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      { providerId: provider._id, email: provider.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      message: "Provider logged in successfully",
      data: {
        provider: {
          id: provider._id,
          name: provider.name,
          email: provider.email,
          phone: provider.phone,
          companyCode: provider.companyCode,
          address: provider.address,
          role: provider.role
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});


router.get('/download/:type/:providerId', async (req, res) => {
    const { type, providerId } = req.params;

    try {
        const provider = await ProviderSignup.findById(providerId);
        if (!provider) {
            return res.status(404).json({ success: false, message: 'Provider not found.' });
        }

        let filePath;
        let mimeType;
        let fileExtension;

        if (type === 'cnicFront') {
          filePath = provider.cnicFront;
      } else if (type === 'cnicBack') {
          filePath = provider.cnicBack;
      } else if (type === 'policeCertificate') {
          filePath = provider.policeCertificate;
      }
      else {
            return res.status(400).json({ success: false, message: 'Invalid file type.' });
        }


        fileExtension = path.extname(filePath).toLowerCase();

        switch (fileExtension) {
            case '.jpg':
            case '.jpeg':
                mimeType = 'image/jpeg';
                break;
            case '.png':
                mimeType = 'image/png';
                break;
            case '.pdf':
                mimeType = 'application/pdf';
                break;
            default:
                return res.status(400).json({ success: false, message: 'Unsupported file type.' });
        }

  
        const absolutePath = path.join(__dirname, '..', filePath);
        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ success: false, message: 'File not found.' });
        }


        res.setHeader('Content-Type', mimeType);
        res.download(absolutePath, path.basename(absolutePath), (err) => {
            if (err) {
                res.status(500).json({ success: false, message: 'Error downloading file.' });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error downloading file.' });
    }
});
router.get('/', async (req, res) => {
  const { email } = req.query; // Get email from query parameter

  if (!email) {
      return res.status(400).json({ message: "Email is required" });
  }

  try {
      const provider = await ProviderSignup.findOne({ email });

      if (!provider) {
          return res.status(404).json({ message: "Provider not found" });
      }

      // Send provider name back in the response
      res.json({ name: provider.name });
  } catch (error) {
      console.error("Error fetching provider:", error);
      res.status(500).json({ message: "Server error" });
  }
});

module.exports= router;

