const express = require('express');
const multer = require('multer');
const Booking = require('../models/booking');
const User = require('../models/Users');
const Provider = require('../models/providersignup');
const AddService = require('../models/addservice');
const path = require('path');
const moment = require('moment');
const nodemailer = require('nodemailer');
const Feedback = require('../models/feedback');
const router = express.Router();

// Multer storage setup
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
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpg|jpeg|png/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb('Error: Only .jpg and .png images are allowed!');
    }
});

// Create Booking
router.post('/create', upload.single('image'), async (req, res) => {
    console.log('Request Body:', req.body);
    const { serviceName, problemDescription, estimatedCharges, date, time, serviceLevel, email } = req.body;
    const image = req.file ? `uploads/${req.file.filename}` : null;

    try {
        const service = await AddService.findOne({ name: serviceName });

        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }

        const provider = await Provider.findById(service.providerId);

        if (!provider) {
            return res.status(404).json({ success: false, message: "Provider not found" });
        }

        const newBooking = new Booking({
            serviceName,
            problemDescription,
            estimatedCharges,
            date,
            time,
            serviceLevel,
            image,
            email,
            provider: provider._id,
            invoice: {
                invoiceNumber: `INV-${Date.now()}`,
                amount: estimatedCharges,
                paymentStatus: 'Pending'
            }
        });

        await newBooking.save();

        res.status(201).json({
            success: true,
            message: 'Booking created successfully!',
            booking: newBooking,
            providerDetails: {
                name: provider.name,
                companyCode: provider.companyCode,
                phone: provider.phone
            }
        });

    } catch (error) {
        console.error('Error creating booking:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create booking.' });
    }
});

// Get All Bookings
router.get('/details', async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('provider')
            .sort({ updatedAt: -1 });

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Booking + User Details
router.get('/details/:bookingId', async (req, res) => {
    const { bookingId } = req.params;

    try {
        console.log("Received Booking ID:", bookingId);

        const booking = await Booking.findById(bookingId).populate('provider');

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const user = await User.findOne({ email: booking.email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            success: true,
            bookingDetails: {
                ...booking.toObject(),
                image: booking.image ? booking.image : null
            },
            userDetails: {
                name: user.name,
                phoneNumber: user.phoneNumber,
                address: user.address
            }
        });

    } catch (error) {
        console.error("Error fetching booking details:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get('/detail/:bookingId', async (req, res) => {
    const { bookingId } = req.params;

    try {
        console.log("Received Booking ID:", bookingId);

        if (!bookingId || bookingId === "undefined") {
            return res.status(400).json({ message: "Invalid Booking ID" });
        }

        const booking = await Booking.findById(bookingId)
            .populate('provider')
            .populate('user'); // Make sure Booking schema has a 'user' field

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.json({
            success: true,
            bookingDetails: {
                ...booking.toObject(),
                providerName: booking.provider ? booking.provider.name : "N/A",
                providerPhone: booking.provider ? `${booking.provider.companyCode}-${booking.provider.phone}` : "N/A"
            },
            userDetails: booking.user ? {
                name: booking.user.name,
                phoneNumber: booking.user.phoneNumber,
                address: booking.user.address
            } : {
                name: "N/A",
                phoneNumber: "N/A",
                address: "N/A"
            }
        });

    } catch (error) {
        console.error("Error fetching booking details:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get Accepted Requests
router.get('/accepted-requests', async (req, res) => {
    try {
        const acceptedRequests = await Booking.find({ status: 'accepted' }).sort({ createdAt: -1 });
        res.json(acceptedRequests);
    } catch (error) {
        res.status(500).json({ message: "Error fetching accepted requests" });
    }
});

// Cancel Booking Route
router.post('/cancel/:bookingId', async (req, res) => {
    const { bookingId } = req.params;

    try {
        const booking = await Booking.findById(bookingId).populate('provider');

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status === 'accepted' && booking.trackingStatus === 'Accepted') {
            return res.status(400).json({ message: "Booking request is already accepted." });
        }

        // Step 1: Check if the service has started
        const invalidTrackingStatuses = ['Arrived', 'Task Completed', 'Payment Received'];
        if (invalidTrackingStatuses.includes(booking.trackingStatus)) {
            return res.status(400).json({ message: "Service provider has already started the service. Cannot cancel now." });
        }

        // Step 2: Check time limit if booking is pending
        if (booking.status === 'pending') {
            const createdAt = moment(booking.createdAt);
            const now = moment();
            const minutesPassed = now.diff(createdAt, 'minutes');

            if (minutesPassed >= 15) {
                return res.status(400).json({ message: "Cancellation time expired. You cannot cancel after 15 minutes of booking." });
            }

            // Step 3: Proceed with cancellation
            booking.status = 'accepted'; // Status remains accepted, but marking cancelled under tracking
            booking.trackingStatus = 'Cancelled';
            await booking.save();

            // Step 4: Send notifications
            if (booking.email) {
                sendNotificationEmail(
                    booking.email,
                    'Booking Cancelled - Service on Tab',
                    `Hello,\n\nYour booking for '${booking.serviceName}' has been successfully cancelled.\n\nThank you!`
                );
            }

            if (booking.provider && booking.provider.email) {
                sendNotificationEmail(
                    booking.provider.email,
                    'Booking Cancelled - Service on Tab',
                    `Hello,\n\nThe consumer has cancelled the '${booking.serviceName}' booking.\n\nThank you!`
                );
            }

            return res.status(200).json({ message: 'Booking successfully canceled' });
        }

        return res.status(400).json({ message: 'This booking cannot be canceled.' });

    } catch (error) {
        console.error('Error during cancellation:', error.message);
        return res.status(500).json({ message: 'Failed to cancel the booking' });
    }
});

// Helper function to send email notifications
const sendNotificationEmail = (recipientEmail, subject, message) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: subject,
        text: message,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};


// Route to get invoice details for a booking
router.get('/invoice/:bookingId', async (req, res) => {
    const { bookingId } = req.params;

    try {
        const booking = await Booking.findById(bookingId).populate('provider');

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        res.json({
            success: true,
            invoice: booking.invoice || {},
            booking: {
                serviceName: booking.serviceName,
                problemDescription: booking.problemDescription,
                estimatedCharges: booking.estimatedCharges,
                date: booking.date,
                time: booking.time,
                email: booking.email,
                provider: booking.provider ? {
                    name: booking.provider.name,
                    phone: booking.provider.phone,
                    companyCode: booking.provider.companyCode,
                } : {},
            }
        });
    } catch (error) {
        console.error("Error fetching invoice:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch invoice" });
    }
});

// Update invoice details for a booking
router.put('/update-invoice/:bookingId', async (req, res) => {
    const { bookingId } = req.params;
    const { description, otherCharges } = req.body;

    try {
        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            {
                'invoice.description': description,
                'invoice.otherCharges': otherCharges
            },
            { new: true }
        );

        res.json({ success: true, invoice: updatedBooking.invoice });
    } catch (error) {
        console.error("Update invoice error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Fetch booking history
router.get('/history/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const bookings = await Booking.find({ email: new RegExp(`^${email}$`, 'i') })
            .sort({ createdAt: -1 })
            .populate('provider');

        // Make sure you return the image URL along with other booking details
        res.status(200).json({
            success: true,
            message: "Booking history fetched successfully",
            bookings
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching booking history" });
    }
});

router.get('/consumer-bookings/:email', async (req, res) => {
    const { email } = req.params; // Extract the email from the route parameter
    console.log("Received email: ", email); // Add a console log here to check the email

    try {
        // Fetch all bookings related to the provided email
        const bookings = await Booking.find({ email })
            .populate('provider')
            .sort({ updatedAt: -1 });

        if (!bookings || bookings.length === 0) {
            return res.status(404).json({ success: false, message: "No bookings found." });
        }

        res.status(200).json({ success: true, bookings });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching booking history." });
    }
});





router.get('/booking-history/:providerId', async (req, res) => {
    try {
        // Get the provider ID from URL parameters
        const providerId = req.params.providerId;

        // Fetch bookings for this provider
        const bookings = await Booking.find({ provider: providerId })
            .populate('provider', 'name');  // Populate provider details like name

        // If no bookings found for the provider
        if (!bookings.length) {
            return res.status(404).json({ message: 'No bookings found for this provider' });
        }

        // Fetch consumer details based on email in Booking model
        const bookingDetails = await Promise.all(bookings.map(async (booking) => {
            // Find consumer by email in the User model
            const consumer = await User.findOne({ email: booking.email });

            return {
                serviceName: booking.serviceName,
                date: booking.date,
                time: booking.time,
                serviceLevel: booking.serviceLevel,
                status: booking.status,
                trackingStatus: booking.trackingStatus,
                image:booking.image,
               invoice:booking.invoice,
            
                consumerName: consumer ? consumer.name : 'Not Found',  // Fetch consumer name
                consumerPhone: consumer ? consumer.phoneNumber : 'Not Found',  // Fetch consumer phone
            };
        }));

        res.status(200).json(bookingDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
});
module.exports = router;
