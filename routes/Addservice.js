const express = require('express');
const multer = require('multer');
const path = require('path');
const AddService = require('../models/addservice');
const ProviderSignup = require("../models/providersignup");
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
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
        const fileTypes = /jpg|jpeg|png/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only .jpg, .jpeg, .png images are allowed!'));
    }
});

router.post("/add", upload.single("picture"), async (req, res) => {
    try {
        const { providerEmail, name, estimatedCharges, type } = req.body;

        // Find provider by email to get providerId
        const provider = await ProviderSignup.findOne({ email: providerEmail });

        if (!provider) {
            return res.status(404).json({ success: false, message: "Provider not found" });
        }

        // If file uploaded, save its path
        const picture = req.file ? `uploads/${req.file.filename}` : null; 

        // Create new service
        const newService = new AddService({
            name,
            estimatedCharges,
            type,
            picture,
            providerId: provider._id // Assign provider's ObjectId
        });

        await newService.save();

        res.status(201).json({ success: true, message: "Service added successfully!", service: newService });

    } catch (error) {
        console.error("Error adding service:", error.message);
        res.status(500).json({ success: false, message: "Failed to add service." });
    }
});


router.get("/all", async (req, res) => {
    try {
        const services = await AddService.find().populate("providerId", "name"); 
        res.status(200).json({ success: true, services });
    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({ success: false, message: "Failed to fetch services." });
    }
});


router.delete('/:id', async (req, res) => {
    const { id } = req.params; 

    try {
        const deletedService = await AddService.findByIdAndDelete(id);

        if (!deletedService) {
            return res.status(404).json({ success: false, message: 'Service not found.' });
        }

        res.status(200).json({ success: true, message: 'Service deleted successfully.' });
    } catch (error) {
        console.error('Error deleting service:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete service.' });
    }
});


module.exports = router;
